"""Guest visits: a bounded, persisted lifecycle beside the state tree.

A visit never changes the selected state or overlay. While one is active, and
for a short exit window after it ends, lock and cover edges do not count as an
arrival. Arrival into an occupied state ends the visit without cleanup; any
other end reapplies the unoccupied scene and locks configured doors, but only
while the house is still unoccupied.
"""

import logging
import uuid
from copy import deepcopy
from datetime import timedelta

from homeassistant.core import callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.util import dt as dt_util

from .const import MIN_DURATION
from .devices import actuate

_LOGGER = logging.getLogger(__name__)


def _valid(record):
    return (
        isinstance(record, dict)
        and isinstance(record.get("id"), str)
        and dt_util.parse_datetime(record.get("expires") or "") is not None
    )


class Visits:
    def __init__(self, coordinator):
        self.coordinator = coordinator
        self.hass = coordinator.hass
        self.active = None
        self.last = None
        self.timer = None
        self.stopped = False

    @property
    def config(self):
        return self.coordinator.config

    def load(self, data):
        active, last = data.get("visit"), data.get("last_visit")
        self.active = active if _valid(active) else None
        self.last = last if isinstance(last, dict) and isinstance(last.get("id"), str) else None
        if self.last and self.last.get("cleanup", {}).get("status") == "running":
            # Home Assistant stopped mid-cleanup; its outcome is unknown.
            self.last["cleanup"] = {"status": "interrupted"}

    def data(self):
        return {"visit": self.active, "last_visit": self.last}

    def snapshot(self):
        return deepcopy((self.active, self.last))

    def restore(self, snapshot):
        self.active, self.last = snapshot

    def suppressing(self):
        """Whether a lock or cover edge may be the guest rather than the family."""
        if self.active:
            return True
        until = dt_util.parse_datetime((self.last or {}).get("exit_until") or "")
        return until is not None and dt_util.utcnow() < until

    def close(self, outcome):
        """End the active visit in memory; the caller persists it."""
        now = dt_util.utcnow()
        # The guest walking out unlocks the door; that is not an arrival either.
        exit_until = now + timedelta(seconds=self.config["visit_exit_grace"])
        self.last = self.active | {
            "ended": now.isoformat(),
            "exit_until": exit_until.isoformat(),
            "outcome": outcome,
            "cleanup": {"status": "running" if outcome in {"ended", "expired"} else "skipped"},
        }
        self.active = None
        return self.last

    @callback
    def cancel_timer(self):
        if self.timer:
            self.timer()
            self.timer = None

    @callback
    def schedule(self):
        self.cancel_timer()
        if self.stopped or not self.active:
            return
        visit_id = self.active["id"]

        async def expire(now):
            self.timer = None
            try:
                # The ID guard keeps a stale timer from ending a newer visit.
                await self.end(visit_id, outcome="expired")
            except Exception:
                _LOGGER.warning("House State could not expire visit %s", visit_id, exc_info=True)

        expires = dt_util.parse_datetime(self.active["expires"])
        if expires <= dt_util.utcnow():
            # Expired while Home Assistant was stopped.
            self.hass.async_create_task(expire(expires))
            return
        self.timer = async_track_point_in_utc_time(self.hass, expire, expires)

    def stop(self):
        self.stopped = True
        self.cancel_timer()

    async def start(self, visit_id=None, duration=None, source="service", actor=None, user_id=None):
        coordinator = self.coordinator
        maximum = self.config["visit_max_duration"]
        seconds = self.config["visit_duration"] if duration is None else duration.total_seconds()
        if not MIN_DURATION <= seconds <= maximum:
            raise ServiceValidationError(
                f"Visit duration must be between {MIN_DURATION} and {maximum} seconds"
            )
        user_name = None
        if user_id and (user := await self.hass.auth.async_get_user(user_id)):
            user_name = user.name
        async with coordinator.lock:
            if self.active and visit_id and self.active["id"] == visit_id:
                # A retried request must not move the expiry or restart anything.
                return {"status": "active"} | deepcopy(self.active)
            if visit_id and self.last and self.last["id"] == visit_id:
                # A late retry must not reopen the visit its guest already ended.
                raise ServiceValidationError(f"Visit {visit_id} has already ended")
            snapshot = self.snapshot()
            replaced = self.close("superseded") if self.active else None
            now = dt_util.utcnow()
            self.active = {
                "id": visit_id or uuid.uuid4().hex,
                "started": now.isoformat(),
                "expires": (now + timedelta(seconds=seconds)).isoformat(),
                "source": source,
                "actor": actor,
                "user_id": user_id,
                "user_name": user_name,
            }
            try:
                await coordinator.save()
            except Exception:
                self.restore(snapshot)
                raise
            self.schedule()
        coordinator.notify()
        # A guest during vacation gets water for as long as they are here.
        coordinator.water.schedule()
        if replaced:
            coordinator.event("visit_ended", **self.summary(replaced))
        coordinator.event("visit_started", **self.summary(self.active))
        return {"status": "started"} | deepcopy(self.active)

    async def end(self, visit_id=None, outcome="ended"):
        coordinator = self.coordinator
        async with coordinator.lock:
            if not self.active or (visit_id and self.active["id"] != visit_id):
                last = self.last if self.last and self.last["id"] == visit_id else None
                return {"status": "not_active", "id": visit_id, "last": deepcopy(last)}
            snapshot = self.snapshot()
            record = self.close(outcome)
            try:
                await coordinator.save()
            except Exception:
                self.restore(snapshot)
                raise
            self.cancel_timer()
        coordinator.notify()
        record["cleanup"] = await self.cleanup()
        if (water := await self.water()) is not None:
            record["cleanup"]["water"] = water
            if water["status"] == "failed":
                record["cleanup"]["status"] = "failed"
        try:
            await coordinator.save()
        except Exception:
            _LOGGER.warning("Could not store the visit cleanup result", exc_info=True)
        coordinator.notify()
        coordinator.event("visit_ended", **self.summary(record))
        if record["cleanup"]["status"] == "failed":
            _LOGGER.warning(
                "House State visit %s cleanup failed: %s", record["id"], record["cleanup"]
            )
        return {"status": "ended"} | deepcopy(record)

    @callback
    def arrived(self):
        """Arrival into an occupied state ends the visit; the caller persists it."""
        return self.close("arrived") if self.active else None

    def summary(self, record):
        return {
            "visit_id": record["id"],
            "source": record.get("source"),
            "actor": record.get("actor"),
            "user_id": record.get("user_id"),
            "expires": record.get("expires"),
            **({"outcome": record["outcome"]} if "outcome" in record else {}),
            **({"cleanup": deepcopy(record["cleanup"])} if "cleanup" in record else {}),
        }

    def unoccupied(self):
        coordinator = self.coordinator
        return not coordinator.tree.occupied(coordinator.state)

    async def cleanup(self):
        """Restore the empty house, reporting what actually happened."""
        if not self.unoccupied():
            return {"status": "skipped", "because": "occupied"}
        result = {"status": "ok", "scene": "disabled", "locks": {}}
        if self.config["visit_reapply_scene"]:
            ran = False

            def guard():
                nonlocal ran
                ran = self.unoccupied()
                return ran

            try:
                await self.coordinator.transition({}, force=True, guard=guard)
            except Exception as err:
                result["scene"] = "failed"
                result["error"] = str(err)
            else:
                result["scene"] = "applied" if ran else "skipped"
        for entity in self.config["visit_lock_entities"]:
            # Family returning mid-cleanup must not be locked in behind it.
            result["locks"][entity] = await self.lock(entity) if self.unoccupied() else "skipped"
        if result["scene"] == "failed" or any(
            status not in {"locked", "skipped"} for status in result["locks"].values()
        ):
            result["status"] = "failed"
        return result

    async def water(self):
        """Shut the water again if the visit was during vacation."""
        water = self.coordinator.water
        result = await water.reconcile()
        if result is None and water.result and water.result["desired"] == water.desired():
            # Another trigger was already turning the valves; report its outcome.
            result = deepcopy(water.result)
        return result if water.valves else None

    async def lock(self, entity):
        return await actuate(self.hass, entity, "lock", "locked", failures=("jammed",))
