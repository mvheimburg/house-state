"""Automation listeners and cancellable grace/schedule timers."""

import logging
from datetime import timedelta
from functools import partial

from homeassistant.core import callback
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
    async_track_sunrise,
    async_track_sunset,
    async_track_time_change,
)
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)
UNKNOWN = {"unknown", "unavailable"}


class Triggers:
    def __init__(self, coordinator):
        self.coordinator = coordinator
        self.hass = coordinator.hass
        self.config = coordinator.config
        self.unsubs = []
        self.away_cancel = None
        self.arrival_cancel = None
        self.stopped = False

    def start(self):
        entities = set(
            self.config["door_entities"]
            + self.config["gate_entities"]
            + self.config["person_entities"]
        )
        if entities:
            self.unsubs.append(async_track_state_change_event(self.hass, entities, self.on_change))
        schedule = self.config["night_schedule"]
        if schedule["type"] == "fixed":
            time = dt_util.parse_time(schedule["time"])
            self.unsubs.append(
                async_track_time_change(
                    self.hass, self.night, hour=time.hour, minute=time.minute, second=time.second
                )
            )
        elif schedule["type"] == "sun":
            track = async_track_sunset if schedule["event"] == "sunset" else async_track_sunrise
            self.unsubs.append(
                track(self.hass, self.night, timedelta(seconds=schedule.get("offset", 0)))
            )
        if self.coordinator.tree.has_rules:
            # Local midnight, so a season never turns over at 01:00 Norwegian time.
            self.unsubs.append(
                async_track_time_change(self.hass, self.daily, hour=0, minute=0, second=0)
            )
            calendars = sorted(
                {
                    overlay["calendar"]
                    for overlay in self.config["overlays"]
                    if "calendar" in overlay
                }
            )
            if calendars:
                self.unsubs.append(
                    async_track_state_change_event(self.hass, calendars, self.on_calendar)
                )
        self.reconcile_away()

    def stop(self):
        self.stopped = True
        for unsub in self.unsubs:
            unsub()
        self.unsubs.clear()
        self.cancel_away()
        if self.arrival_cancel:
            self.arrival_cancel()
            self.arrival_cancel = None

    def cancel_away(self):
        if self.away_cancel:
            self.away_cancel()
            self.away_cancel = None

    def all_away(self):
        persons = self.config["person_entities"]
        states = [self.hass.states.get(entity) for entity in persons]
        return bool(persons) and all(
            state and state.state not in UNKNOWN | {"home"} for state in states
        )

    @callback
    def reconcile_away(self):
        if self.stopped:
            return
        should_away = (
            self.config["auto_away"]
            and self.config["roles"].get("departure")
            and self.coordinator.tree.occupied(self.coordinator.state)
            and self.all_away()
        )
        if not should_away:
            self.cancel_away()
        elif self.away_cancel is None:
            self.away_cancel = async_call_later(
                self.hass, self.config["auto_away_grace"], self.depart
            )

    async def daily(self, now=None):
        await self.evaluate()

    async def on_calendar(self, event):
        await self.evaluate()

    async def evaluate(self):
        if self.stopped:
            return
        try:
            await self.coordinator.evaluate(refresh_calendars=True)
        except Exception:
            _LOGGER.warning("House State overlay rules failed to evaluate", exc_info=True)

    async def safe_transition(self, changes, reason, guard):
        if self.stopped:
            return
        try:
            await self.coordinator.transition(
                changes, reason, guard=lambda: not self.stopped and guard()
            )
        except Exception:
            _LOGGER.warning(
                "House State %s trigger failed; desired state remains pending",
                reason,
                exc_info=True,
            )

    async def on_change(self, event):
        old, new = event.data["old_state"], event.data["new_state"]
        entity = event.data["entity_id"]
        if new is None or self.stopped:
            self.reconcile_away()
            return
        reason = None
        if self.config["auto_return"] and not self.coordinator.tree.occupied(
            self.coordinator.state
        ):
            if (
                entity in self.config["door_entities"]
                and old
                and old.state in {"locked", "unlocking"}
                and new.state == "unlocked"
            ):
                reason = "door"
            elif (
                entity in self.config["gate_entities"]
                and old
                and old.state == "closed"
                and new.state in {"opening", "open"}
            ):
                reason = "gate"
            elif (
                entity in self.config["person_entities"]
                and old
                and old.state != "home"
                and new.state == "home"
            ):
                reason = "presence"
        if reason in {"door", "gate"} and (delay := self.config["arrival_delay"]):
            # Whoever unlocked may report it a moment later (a panel over MQTT while
            # the lock reports over KNX); give a guest visit the chance to start.
            if self.arrival_cancel is None:
                self.arrival_cancel = async_call_later(
                    self.hass, delay, partial(self.delayed_arrival, reason, entity)
                )
        elif reason:
            await self.arrive(reason, entity)
        self.reconcile_away()

    async def delayed_arrival(self, reason, entity, now):
        self.arrival_cancel = None
        await self.arrive(reason, entity)

    async def arrive(self, reason, entity):
        if self.stopped:
            return
        if reason in {"door", "gate"} and self.coordinator.visits.suppressing():
            # A guest opened it; only configured people count as the family.
            visit = self.coordinator.visits.active or self.coordinator.visits.last
            self.coordinator.event(
                "arrival_suppressed", reason=reason, source=entity, visit_id=visit["id"]
            )
            return
        if self.config["roles"].get("arrival"):
            await self.safe_transition(
                {"state": self.config["roles"]["arrival"]},
                reason,
                lambda: not self.coordinator.tree.occupied(self.coordinator.state),
            )

    async def depart(self, now):
        self.away_cancel = None
        if (
            self.config["auto_away"]
            and self.config["roles"].get("departure")
            and self.coordinator.tree.occupied(self.coordinator.state)
            and self.all_away()
        ):
            await self.safe_transition(
                {"state": self.config["roles"]["departure"]},
                "presence",
                lambda: self.coordinator.tree.occupied(self.coordinator.state) and self.all_away(),
            )

    async def night(self, now=None):
        target = self.config["roles"].get("night")
        if (
            target
            and self.coordinator.tree.occupied(self.coordinator.state)
            and target not in self.coordinator.tree.path(self.coordinator.state)
        ):
            await self.safe_transition(
                {"state": target},
                "schedule",
                lambda: (
                    self.coordinator.tree.occupied(self.coordinator.state)
                    and target not in self.coordinator.tree.path(self.coordinator.state)
                ),
            )
