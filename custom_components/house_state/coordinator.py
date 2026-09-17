"""Serialized tree selection and durable scene application."""

import asyncio
import logging
from copy import deepcopy

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .config import scene_warnings, validate_config
from .const import DOMAIN
from .model import Rejected, StateTree

_LOGGER = logging.getLogger(__name__)


class HouseCoordinator:
    def __init__(self, hass, entry):
        self.hass, self.entry = hass, entry
        self.config = validate_config(hass, dict(entry.options), check_scenes=False)
        self.tree = StateTree(self.config)
        self.state = self.tree.descend(self.tree.initial)
        self.overlay = "none"
        self.since = dt_util.utcnow().isoformat()
        self.previous_state = self.state
        self.reason = "service"
        self.last_pair = None
        self.pending = False
        self.entity_id = None
        self.listeners = set()
        self.lock = asyncio.Lock()
        self.store = Store(hass, 1, f"{DOMAIN}.{entry.entry_id}")
        self.triggers = None
        self.start_unsub = None
        self.reconciled_previous = None
        self.skip_start_retry = hass.data.pop((DOMAIN, entry.entry_id, "options_reload"), False)

    async def load(self):
        if not (data := await self.store.async_load()):
            await self.save()
            return
        old_state, old_overlay = data["state"], data["overlay"]
        self.state = (
            old_state if old_state in self.tree.nodes else self.tree.descend(self.tree.initial)
        )
        self.overlay = old_overlay if old_overlay in self.tree.overlays else "none"
        normalized = (old_state, old_overlay) != (self.state, self.overlay)
        self.since = dt_util.utcnow().isoformat() if normalized else data["since"]
        self.previous_state = old_state if normalized else data.get("previous_state", self.state)
        self.reason = "service" if normalized else data.get("reason", "service")
        self.last_pair = data.get("last_pair")
        self.pending = data.get("pending", False)
        # Persist the scene-defining configuration to distinguish startup replay
        # from a config edit, including edits made while HA was stopped.
        changed_config = data.get("selection_config") != self.selection_config
        if normalized or changed_config:
            self.last_pair = None
            base, _, overlay = self.tree.resolve(self.state, self.overlay)
            if normalized or data.get("desired_pair") != [base, overlay]:
                self.pending = False
            self.skip_start_retry = True
        if normalized:
            self.reconciled_previous = {"state": old_state, "overlay": old_overlay}
        await self.save()

    @property
    def selection_config(self):
        return {key: self.config[key] for key in ("state_tree", "overlays", "initial_state")}

    async def save(self):
        await self.store.async_save(
            {
                "state": self.state,
                "overlay": self.overlay,
                "since": self.since,
                "previous_state": self.previous_state,
                "reason": self.reason,
                "last_pair": self.last_pair,
                "pending": self.pending,
                "selection_config": self.selection_config,
                "desired_pair": [
                    self.tree.resolve(self.state, self.overlay)[index] for index in (0, 2)
                ],
            }
        )

    @callback
    def notify(self):
        for listener in tuple(self.listeners):
            listener()

    def event(self, kind, **data):
        self.hass.bus.async_fire(
            f"{DOMAIN}_event", {"entity_id": self.entity_id, "type": kind, **data}
        )

    async def transition(self, changes, reason="service", force=False, guard=None):
        async with self.lock:
            try:
                if guard is not None and not guard():
                    return
                state, overlay = self.tree.select(self.state, self.overlay, changes)
            except Rejected as err:
                self.event("rejected", **err.details)
                raise
            previous = {
                "state": self.state,
                "active_path": self.tree.path(self.state),
                "overlay": self.overlay,
            }
            occupied_before = self.tree.occupied(self.state)
            changed = (state, overlay) != (self.state, self.overlay)
            rollback = (
                self.state,
                self.overlay,
                self.since,
                self.previous_state,
                self.reason,
                self.pending,
            )
            if changed:
                self.state, self.overlay = state, overlay
                self.since, self.reason = dt_util.utcnow().isoformat(), reason
                if state != previous["state"]:
                    self.previous_state = previous["state"]
            base, source, overlay_scene = self.tree.resolve(self.state, self.overlay)
            needed = force or self.pending or [base, overlay_scene] != self.last_pair
            if needed:
                self.pending = True
            try:
                await self.save()
            except Exception:
                (
                    self.state,
                    self.overlay,
                    self.since,
                    self.previous_state,
                    self.reason,
                    self.pending,
                ) = rollback
                raise
            self.notify()
            if changed:
                self.event(
                    "changed",
                    state=state,
                    active_path=self.tree.path(state),
                    overlay=overlay,
                    previous=previous,
                    reason=reason,
                )
                if occupied_before != self.tree.occupied(state):
                    self.event(
                        "arrived" if self.tree.occupied(state) else "departed", reason=reason
                    )
                if previous["overlay"] != overlay:
                    self.event("overlay_changed", overlay=overlay, previous=previous["overlay"])
                if self.triggers:
                    self.triggers.reconcile_away()
            if needed:
                await self.apply(base, source, overlay_scene)
            if changed:
                await self.mirror()

    async def apply(self, base, source, overlay):
        for scene in (base, overlay):
            if scene:
                scene_state = self.hass.states.get(scene)
                if scene_state is None or scene_state.state == "unavailable":
                    raise HomeAssistantError(f"Scene is missing or unavailable: {scene}")
                await self.hass.services.async_call(
                    "scene", "turn_on", {"entity_id": scene}, blocking=True
                )
        previous_pair = self.last_pair
        self.last_pair, self.pending = [base, overlay], False
        try:
            await self.save()
        except Exception:
            self.last_pair, self.pending = previous_pair, True
            self.notify()
            raise
        self.notify()
        if base or overlay:
            self.event("scene_applied", scene=base, resolved_from=source, overlay_scene=overlay)

    async def mirror(self):
        for axis, entity in self.config["legacy_mirror"].items():
            id = self.state if axis == "state" else self.overlay
            name = (
                self.tree.nodes[id]["name"]
                if axis == "state"
                else self.tree.overlays[id]["name"]
                if id != "none"
                else "None"
            )
            helper = self.hass.states.get(entity)
            options = helper.attributes.get("options", []) if helper else []
            value = next((candidate for candidate in (id, name) if candidate in options), None)
            if value is None:
                _LOGGER.warning("No matching %s option in legacy mirror %s", id, entity)
                continue
            try:
                await self.hass.services.async_call(
                    "input_select",
                    "select_option",
                    {"entity_id": entity, "option": value},
                    blocking=True,
                )
            except Exception:
                _LOGGER.warning("Could not mirror %s to %s", axis, entity, exc_info=True)

    async def set_config(self, changes):
        async with self.lock:
            options = validate_config(self.hass, dict(self.entry.options) | changes)
            self.hass.config_entries.async_update_entry(self.entry, options=options)

    async def start(self):
        from .triggers import Triggers

        self.triggers = Triggers(self)
        self.triggers.start()
        if self.reconciled_previous:
            self.event(
                "changed",
                state=self.state,
                active_path=self.tree.path(self.state),
                overlay=self.overlay,
                previous=self.reconciled_previous,
                reason="service",
            )
        if self.pending and not self.skip_start_retry:
            if self.hass.is_running:
                await self.retry()
            else:
                self.start_unsub = self.hass.bus.async_listen_once(
                    EVENT_HOMEASSISTANT_STARTED, self.retry
                )

    async def retry(self, event=None):
        try:
            await self.transition({})
        except Exception:
            _LOGGER.warning(
                "Pending scene application will retry on next request/start", exc_info=True
            )

    def stop(self):
        if self.triggers:
            self.triggers.stop()
        if self.start_unsub:
            self.start_unsub()
            self.start_unsub = None

    @property
    def attributes(self):
        return {
            "state": self.state,
            "active_path": self.tree.path(self.state),
            "state_tree": self.config["state_tree"],
            "overlays": self.config["overlays"],
            "overlay": self.overlay,
            "occupied": self.tree.occupied(self.state),
            "last_scene": self.last_pair[0] if self.last_pair else None,
            "last_changed_by": self.reason,
            "since": self.since,
            "previous_state": self.previous_state,
            "application_pending": self.pending,
            "scene_warnings": scene_warnings(self.hass, self.config),
            "config": deepcopy(self.config),
            "auto_return_enabled": self.config["auto_return"],
            "night_schedule": self.config["night_schedule"],
            "available_overlays": ["none", *self.tree.overlays],
        }
