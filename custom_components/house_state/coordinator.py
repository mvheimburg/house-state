"""Serialized tree selection and durable scene application."""

import asyncio
import logging
import re
from copy import deepcopy
from datetime import timedelta

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import rules
from .config import scene_warnings, validate_config
from .const import DOMAIN, RESERVED_OVERLAYS
from .model import Rejected, StateTree
from .visits import Visits

_LOGGER = logging.getLogger(__name__)


class HouseCoordinator:
    def __init__(self, hass, entry):
        self.hass, self.entry = hass, entry
        self.config = validate_config(hass, dict(entry.options), check_scenes=False)
        self.tree = StateTree(self.config)
        self.state = self.tree.descend(self.tree.initial)
        self.overlay = "none"
        self.overlay_choice = "auto" if self.tree.has_rules else "none"
        self.hold_until = None
        self.evaluated = "none"
        self.calendar_active = set()
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
        self.visits = Visits(self)
        self.start_unsub = None
        self.reconciled_previous = None
        self.skip_start_retry = hass.data.pop((DOMAIN, entry.entry_id, "options_reload"), False)

    async def load(self):
        if not (data := await self.store.async_load()):
            await self.save()
            return
        old_state, old_overlay = data["state"], data["overlay"]
        # Installs predating the overlay rules stored an effective overlay only; it
        # was always a manual choice, so it restores as one.
        old_choice = data.get("overlay_choice", old_overlay)
        self.state = (
            old_state if old_state in self.tree.nodes else self.tree.descend(self.tree.initial)
        )
        self.overlay_choice = (
            old_choice
            if old_choice in RESERVED_OVERLAYS or old_choice in self.tree.overlays
            else "none"
        )
        if self.overlay_choice == "auto" and not self.tree.has_rules:
            self.overlay_choice = "none"
        self.hold_until = data.get("hold_until")
        self.evaluated = data.get("evaluated", "none")
        if self.evaluated not in self.tree.overlays:
            self.evaluated = "none"
        normalized = (old_state, old_choice) != (self.state, self.overlay_choice)
        # Under rules every deliberate choice arms a hold, so a bare none is the
        # resting default rather than a suppression: let the rules have the axis.
        if self.tree.has_rules and self.overlay_choice == "none" and not self.hold_until:
            self.overlay_choice = "auto"
        self.overlay = self.tree.effective(self.overlay_choice, self.evaluated)
        self.since = dt_util.utcnow().isoformat() if normalized else data["since"]
        self.previous_state = old_state if normalized else data.get("previous_state", self.state)
        self.reason = "service" if normalized else data.get("reason", "service")
        self.last_pair = data.get("last_pair")
        self.pending = data.get("pending", False)
        self.visits.load(data)
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
                "overlay_choice": self.overlay_choice,
                "hold_until": self.hold_until,
                "evaluated": self.evaluated,
                "since": self.since,
                "previous_state": self.previous_state,
                "reason": self.reason,
                "last_pair": self.last_pair,
                "pending": self.pending,
                "selection_config": self.selection_config,
                "desired_pair": [
                    self.tree.resolve(self.state, self.overlay)[index] for index in (0, 2)
                ],
                **self.visits.data(),
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

    async def transition(self, changes, reason="service", force=False, guard=None, quiet=False):
        """Select state and overlay. Quiet transitions defer scene application.

        A rule-driven change is quiet: it publishes the overlay a consumer reads
        but leaves last_pair stale, so the next ordinary transition applies the
        scenes rather than firing them unattended at a rule boundary.
        """
        async with self.lock:
            try:
                if guard is not None and not guard():
                    return
                state, choice = self.tree.select(self.state, self.overlay_choice, changes)
            except Rejected as err:
                self.event("rejected", **err.details)
                raise
            hold = self.hold_until
            if "overlay" in changes:
                # A hand-picked overlay holds; the rules reclaiming the axis clears it.
                manual = not quiet and choice != "auto" and self.tree.has_rules
                hold = self.hold_expiry() if manual else None
            # Rules can gate on the active node, so they resolve against the node
            # being selected here; gating never costs a second scene application.
            evaluated = self.rule_result(state)
            overlay = self.tree.effective(choice, evaluated)
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
                self.overlay_choice,
                self.hold_until,
                self.evaluated,
                self.since,
                self.previous_state,
                self.reason,
                self.pending,
            )
            visits = self.visits.snapshot()
            arrived = not occupied_before and self.tree.occupied(state)
            # Family arriving ends a visit in the same save; there is nothing to clean up.
            ended_visit = self.visits.arrived() if changed and arrived else None
            if changed:
                self.state, self.overlay = state, overlay
                self.since, self.reason = dt_util.utcnow().isoformat(), reason
                if state != previous["state"]:
                    self.previous_state = previous["state"]
            self.overlay_choice, self.hold_until, self.evaluated = choice, hold, evaluated
            base, source, overlay_scene = self.tree.resolve(self.state, self.overlay)
            needed = force or self.pending or [base, overlay_scene] != self.last_pair
            if needed and not quiet:
                self.pending = True
            try:
                await self.save()
            except Exception:
                (
                    self.state,
                    self.overlay,
                    self.overlay_choice,
                    self.hold_until,
                    self.evaluated,
                    self.since,
                    self.previous_state,
                    self.reason,
                    self.pending,
                ) = rollback
                self.visits.restore(visits)
                raise
            if ended_visit:
                self.visits.cancel_timer()
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
                if ended_visit:
                    self.event("visit_ended", **self.visits.summary(ended_visit))
                if previous["overlay"] != overlay:
                    self.event("overlay_changed", overlay=overlay, previous=previous["overlay"])
                if self.triggers:
                    self.triggers.reconcile_away()
            if needed and not quiet:
                await self.apply(base, source, overlay_scene)
            if changed:
                await self.mirror()

    def rule_result(self, state):
        """The overlay the configured rules pick for a node, today, right now."""
        if not self.tree.has_rules:
            return "none"
        return rules.evaluate(
            self.config["overlays"],
            dt_util.now().date(),
            self.calendar_active,
            self.tree.path(state),
            self.tree.occupied(state),
        )

    def hold_expiry(self):
        """A manual choice holds until the start of the next local day."""
        tomorrow = dt_util.start_of_local_day() + timedelta(days=1)
        return dt_util.as_utc(dt_util.start_of_local_day(tomorrow)).isoformat()

    async def query_calendars(self):
        """Overlay IDs whose calendar rule has a matching event running now."""
        entities = sorted(
            {overlay["calendar"] for overlay in self.config["overlays"] if "calendar" in overlay}
        )
        if not entities:
            return set()
        try:
            response = await self.hass.services.async_call(
                "calendar",
                "get_events",
                {"entity_id": entities, "duration": {"seconds": 1}},
                blocking=True,
                return_response=True,
            )
        except Exception:
            # Keep the previous answer rather than flapping an overlay off because
            # a calendar integration is reloading or briefly unavailable.
            _LOGGER.warning("Could not read overlay calendars; keeping last result", exc_info=True)
            return self.calendar_active
        active = set()
        for overlay in self.config["overlays"]:
            if "calendar" not in overlay:
                continue
            events = (response or {}).get(overlay["calendar"], {}).get("events", [])
            pattern = overlay.get("match")
            if any(
                pattern is None or re.search(pattern, event.get("summary") or "", re.IGNORECASE)
                for event in events
            ):
                active.add(overlay["id"])
        return active

    async def evaluate(self, refresh_calendars=False):
        """Re-apply the rules to the overlay axis without firing scenes."""
        if not self.tree.has_rules:
            return
        if refresh_calendars:
            self.calendar_active = await self.query_calendars()
        deadline = dt_util.parse_datetime(self.hold_until) if self.hold_until else None
        expired = self.hold_until is not None and (deadline is None or deadline <= dt_util.utcnow())
        await self.transition({"overlay": "auto"} if expired else {}, reason="schedule", quiet=True)

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
        if self.hass.is_running:
            await self.started()
        else:
            # Calendar entities may not exist yet during setup.
            self.start_unsub = self.hass.bus.async_listen_once(
                EVENT_HOMEASSISTANT_STARTED, self.started
            )

    async def started(self, event=None):
        self.start_unsub = None
        # Scenes and locks exist now; a visit that expired while stopped ends here.
        self.visits.schedule()
        try:
            await self.evaluate(refresh_calendars=True)
        except Exception:
            # A failed evaluation leaves the stored overlay in place; never block setup.
            _LOGGER.warning("Could not evaluate overlay rules at startup", exc_info=True)
        if self.pending and not self.skip_start_retry:
            await self.retry()

    async def retry(self, event=None):
        try:
            await self.transition({})
        except Exception:
            _LOGGER.warning(
                "Pending scene application will retry on next request/start", exc_info=True
            )

    def stop(self):
        self.visits.stop()
        if self.triggers:
            self.triggers.stop()
        if self.start_unsub:
            self.start_unsub()
            self.start_unsub = None

    @property
    def scene_stale(self):
        """A quiet transition left the resolved scenes unapplied on purpose."""
        if self.pending or self.last_pair is None:
            return False
        base, _, overlay_scene = self.tree.resolve(self.state, self.overlay)
        return [base, overlay_scene] != self.last_pair

    @property
    def attributes(self):
        return {
            "state": self.state,
            "active_path": self.tree.path(self.state),
            "state_tree": self.config["state_tree"],
            "overlays": self.config["overlays"],
            "overlay": self.overlay,
            "overlay_choice": self.overlay_choice,
            "overlay_rule": self.evaluated,
            "overlay_hold_until": self.hold_until,
            "scene_stale": self.scene_stale,
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
            "visit": deepcopy(self.visits.active),
            "last_visit": deepcopy(self.visits.last),
        }
