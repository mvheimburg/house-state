"""Serialized transitions and durable scene application."""

import asyncio
import logging

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import AXES, DEFAULTS, DOMAIN
from .model import HouseState, Rejected

_LOGGER = logging.getLogger(__name__)


class HouseCoordinator:
    """One independently persisted house."""

    def __init__(self, hass, entry):
        self.hass, self.entry = hass, entry
        self.config = DEFAULTS | dict(entry.options)
        self.state = HouseState()
        self.since = dt_util.utcnow().isoformat()
        self.previous_presence = "home"
        self.reason = "service"
        self.last_pair = None
        self.pending = False
        self.entity_id = None
        self.listeners = set()
        self.lock = asyncio.Lock()
        self.store = Store(hass, 1, f"{DOMAIN}.{entry.entry_id}")
        self.triggers = None
        self.start_unsub = None

    async def load(self):
        if data := await self.store.async_load():
            self.state = HouseState(**data["state"])
            self.since = data["since"]
            self.previous_presence = data.get("previous_presence", "home")
            self.reason = data.get("reason", "service")
            self.last_pair = data.get("last_pair")
            self.pending = data.get("pending", False)

    async def save(self):
        await self.store.async_save(
            {
                "state": self.state.as_dict(),
                "since": self.since,
                "previous_presence": self.previous_presence,
                "reason": self.reason,
                "last_pair": self.last_pair,
                "pending": self.pending,
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

    async def transition(self, changes, reason="service", force=False):
        async with self.lock:
            try:
                candidate = self.state.transition(changes)
            except Rejected as err:
                self.event("rejected", **err.details)
                raise
            previous = self.state
            changed = candidate != previous
            if changed:
                self.state = candidate
                self.since = dt_util.utcnow().isoformat()
                self.reason = reason
                if candidate.presence != previous.presence:
                    self.previous_presence = previous.presence
            base, source, overlay = self.state.resolve(self.config["scene_map"])
            needed = force or self.pending or [base, overlay] != self.last_pair
            if needed:
                self.pending = True
            await self.save()
            self.notify()
            if changed:
                self.event(
                    "changed", **candidate.as_dict(), previous=previous.as_dict(), reason=reason
                )
                if (previous.presence == "home") != (candidate.presence == "home"):
                    self.event(
                        "arrived" if candidate.presence == "home" else "departed", reason=reason
                    )
                if previous.overlay != candidate.overlay:
                    self.event(
                        "overlay_changed", overlay=candidate.overlay, previous=previous.overlay
                    )
                if self.triggers:
                    self.triggers.reconcile_away()
            if needed:
                await self.apply(base, source, overlay)
            if changed:
                await self.mirror()

    async def apply(self, base, source, overlay):
        for scene in (base, overlay):
            if scene:
                await self.hass.services.async_call(
                    "scene", "turn_on", {"entity_id": scene}, blocking=True
                )
        self.last_pair, self.pending = [base, overlay], False
        await self.save()
        self.notify()
        if base or overlay:
            self.event("scene_applied", scene=base, resolved_from=source, overlay_scene=overlay)

    async def mirror(self):
        for axis, entity in self.config["legacy_mirror"].items():
            try:
                await self.hass.services.async_call(
                    "input_select",
                    "select_option",
                    {
                        "entity_id": entity,
                        "option": getattr(self.state, axis),
                    },
                    blocking=True,
                )
            except Exception:  # A legacy helper must not break authoritative state.
                _LOGGER.warning("Could not mirror %s to %s", axis, entity, exc_info=True)

    async def start(self):
        from .triggers import Triggers

        self.triggers = Triggers(self)
        self.triggers.start()
        if self.pending:
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
                "Pending House State scene application will be retried on next request/start",
                exc_info=True,
            )

    def stop(self):
        if self.triggers:
            self.triggers.stop()
        if self.start_unsub:
            self.start_unsub()
            self.start_unsub = None

    @property
    def attributes(self):
        return self.state.as_dict() | {
            "last_scene": self.last_pair[0] if self.last_pair else None,
            "last_changed_by": self.reason,
            "since": self.since,
            "previous_presence": self.previous_presence,
            "mode_is_available": self.state.presence == "home",
            "activity_is_available": self.state.presence == "home" and self.state.mode == "day",
            "auto_return_enabled": self.config["auto_return"],
            "night_schedule": self.config["night_schedule"],
            "scene_map": self.config["scene_map"],
            "available_overlays": AXES["overlay"],
            "config": self.config,
            "application_pending": self.pending,
        }
