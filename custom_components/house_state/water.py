"""Water shut-off: valves close for vacation and open again for a guest or the return.

House State acts only when the water it wants changes, or to retry a failed
attempt. It never reopens valves because of a restart or a settings change, so
a valve something else closed stays closed until House State itself needs
it open. Leak protection is not House State's job.
"""

import asyncio
import logging

from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

from .devices import UNKNOWN, actuate

_LOGGER = logging.getLogger(__name__)
# Water wanted -> (service, reported state) per valve domain.
COMMANDS = {
    "valve": {"open": ("open_valve", "open"), "closed": ("close_valve", "closed")},
    "switch": {"open": ("turn_on", "on"), "closed": ("turn_off", "off")},
}


class Water:
    def __init__(self, coordinator):
        self.coordinator = coordinator
        self.hass = coordinator.hass
        # What House State last set the valves to, so a restart acts only on change.
        self.applied = None
        self.result = None
        self.lock = asyncio.Lock()
        self.unsub = None
        self.stopped = False

    @property
    def valves(self):
        return self.coordinator.config["water_valves"]

    def load(self, data):
        self.applied = data.get("water_applied")
        result = data.get("water")
        self.result = result if isinstance(result, dict) else None
        if self.result and self.result.get("status") == "running":
            # Home Assistant stopped mid-change; retry it.
            self.result["status"] = "failed"

    def data(self):
        return {"water_applied": self.applied, "water": self.result}

    def desired(self):
        coordinator = self.coordinator
        role = coordinator.config["roles"].get("vacation")
        vacation = bool(role) and role in coordinator.tree.path(coordinator.state)
        return "closed" if vacation and not coordinator.visits.active else "open"

    def needed(self):
        failed = (self.result or {}).get("status") == "failed"
        return bool(self.valves) and (self.desired() != self.applied or failed)

    def start(self):
        if self.applied is None:
            # A first start adopts the current situation instead of opening valves.
            self.applied = self.desired()
        if self.valves:
            self.unsub = async_track_state_change_event(self.hass, self.valves, self.on_valve)
        self.schedule()

    def stop(self):
        self.stopped = True
        if self.unsub:
            self.unsub()
            self.unsub = None

    @callback
    def on_valve(self, event):
        old, new = event.data["old_state"], event.data["new_state"]
        came_back = new is not None and new.state not in UNKNOWN
        if came_back and (old is None or old.state in UNKNOWN):
            # A valve that was offline for the last change gets it now.
            self.schedule()

    @callback
    def schedule(self):
        if not self.stopped and self.needed():
            self.hass.async_create_task(self.safe_reconcile())

    async def safe_reconcile(self):
        try:
            await self.reconcile()
        except Exception:
            _LOGGER.warning("House State could not operate the water valves", exc_info=True)

    async def reconcile(self):
        """Bring the valves to the wanted water; None when nothing was needed."""
        async with self.lock:
            if self.stopped or not self.needed():
                return None
            coordinator = self.coordinator
            desired = self.desired()
            self.result = {
                "desired": desired,
                "status": "running",
                "valves": {},
                "updated": dt_util.utcnow().isoformat(),
            }
            coordinator.notify()
            for entity in self.valves:
                service, target = COMMANDS[entity.split(".", 1)[0]][desired]
                reached = await actuate(self.hass, entity, service, target)
                self.result["valves"][entity] = desired if reached == target else reached
            failed = any(status != desired for status in self.result["valves"].values())
            self.result["status"] = "failed" if failed else "ok"
            self.result["updated"] = dt_util.utcnow().isoformat()
            self.applied = desired
            try:
                await coordinator.save()
            except Exception:
                _LOGGER.warning("Could not store the water valve result", exc_info=True)
            coordinator.notify()
            coordinator.event("water", **self.result)
            if failed:
                _LOGGER.warning("House State could not turn the water %s: %s", desired, self.result)
            result = dict(self.result, valves=dict(self.result["valves"]))
        if self.desired() != desired:
            # The house moved on while the valves were turning. A failure alone
            # waits for the next change, a restart or the valve coming back.
            self.schedule()
        return result
