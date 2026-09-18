"""Guest visits keep an empty house empty until the family itself arrives."""

from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant import data_entry_flow
from homeassistant.core import Context
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from .conftest import call, setup
from .test_options_flow import choose, submit


async def advance(hass, freezer, seconds):
    # Let pending state changes schedule their timers before time moves.
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


async def visit(hass, service="visit_start", context=None, **data):
    response = await hass.services.async_call(
        "house_state",
        service,
        {"entity_id": "sensor.house_state", **data},
        blocking=True,
        return_response=True,
        context=context,
    )
    await hass.async_block_till_done()
    return response["sensor.house_state"]


def locks(hass, outcome="locked"):
    """A lock service that locks, locks slowly, stays unlocked, jams or refuses."""
    calls = []

    async def lock(service_call):
        entity = service_call.data["entity_id"]
        calls.append(entity)
        if outcome == "refuse":
            raise HomeAssistantError("lock offline")
        if outcome in {"locked", "jammed"}:
            hass.states.async_set(entity, outcome)
        elif outcome == "slow":
            # Accepted now, confirmed by the device afterwards.
            hass.states.async_set(entity, "locking")
            hass.loop.call_later(0.01, hass.states.async_set, entity, "locked")

    hass.services.async_register("lock", "lock", lock)
    return calls


def unlock(hass, entity="lock.door"):
    hass.states.async_set(entity, "locked")
    hass.states.async_set(entity, "unlocked")


@pytest.fixture
def house(hass, entry):
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options)
        | {
            "door_entities": ["lock.door"],
            "gate_entities": ["cover.gate"],
            "person_entities": ["person.alex"],
            "visit_lock_entities": ["lock.door"],
            "visit_exit_grace": 60,
        },
    )
    hass.states.async_set("person.alex", "not_home")
    hass.states.async_set("lock.door", "locked")
    hass.states.async_set("cover.gate", "closed")
    return entry


def hub(hass):
    return hass.states.get("sensor.house_state")


async def test_visit_suppresses_door_and_gate_but_keeps_state_and_overlay(
    hass, house, scenes, freezer
):
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    await call(hass, state="trip", overlay="festive")
    scenes.clear()
    started = await visit(hass, visit_id="req-1", source="doormonitor", actor="Kari")
    assert started["status"] == "started"
    assert started["id"] == "req-1"
    assert dt_util.parse_datetime(started["expires"]) == dt_util.utcnow() + timedelta(hours=2)
    unlock(hass)
    await advance(hass, freezer, 4)
    hass.states.async_set("cover.gate", "opening")
    await advance(hass, freezer, 4)
    assert hub(hass).state == "trip"
    assert hub(hass).attributes["overlay"] == "festive"
    assert hub(hass).attributes["visit"]["actor"] == "Kari"
    assert not scenes
    sensor = hass.states.get("binary_sensor.house_visit")
    assert sensor.state == "on"
    assert sensor.attributes["visit_id"] == "req-1"
    assert sensor.attributes["source"] == "doormonitor"
    suppressed = [event for event in events if event["type"] == "arrival_suppressed"]
    assert [(event["reason"], event["source"]) for event in suppressed] == [
        ("door", "lock.door"),
        ("gate", "cover.gate"),
    ]
    assert all(event["visit_id"] == "req-1" for event in suppressed)


async def test_unlock_without_visit_still_arrives(hass, house, scenes, freezer):
    await setup(hass, house)
    await call(hass, state="out")
    unlock(hass)
    await hass.async_block_till_done()
    assert hub(hass).state == "out"
    await advance(hass, freezer, 4)
    assert hub(hass).state == "quiet"
    assert hub(hass).attributes["last_changed_by"] == "door"


async def test_visit_reported_during_arrival_delay_suppresses_the_unlock(
    hass, house, scenes, freezer
):
    """A KNX lock can report before the panel's MQTT event names the guest."""
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    await call(hass, state="out")
    unlock(hass)
    await advance(hass, freezer, 1)
    await visit(hass, visit_id="knx-guest")
    await advance(hass, freezer, 3)
    assert hub(hass).state == "out"
    suppressed = next(event for event in events if event["type"] == "arrival_suppressed")
    assert (suppressed["visit_id"], suppressed["source"]) == ("knx-guest", "lock.door")


async def test_zero_arrival_delay_arrives_at_once(hass, house, scenes):
    await setup(hass, house)
    await call(hass, "set_config", arrival_delay=0)
    await call(hass, state="out")
    unlock(hass)
    await hass.async_block_till_done()
    assert hub(hass).state == "quiet"


async def test_pending_arrival_is_cancelled_on_unload(hass, house, scenes, freezer):
    await setup(hass, house)
    await call(hass, state="out")
    coordinator = house.runtime_data
    unlock(hass)
    await hass.async_block_till_done()
    assert await hass.config_entries.async_unload(house.entry_id)
    await advance(hass, freezer, 5)
    assert coordinator.state == "out"


async def test_family_arrival_ends_visit_without_cleanup(hass, house, scenes):
    lock_calls = locks(hass)
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass, visit_id="cat-sitter")
    hass.states.async_set("person.alex", "home")
    await hass.async_block_till_done()
    assert hub(hass).state == "quiet"
    assert hub(hass).attributes["last_changed_by"] == "presence"
    assert hub(hass).attributes["visit"] is None
    assert hub(hass).attributes["last_visit"]["outcome"] == "arrived"
    assert hub(hass).attributes["last_visit"]["cleanup"] == {"status": "skipped"}
    assert hass.states.get("binary_sensor.house_visit").state == "off"
    ended = next(event for event in events if event["type"] == "visit_ended")
    assert ended["visit_id"] == "cat-sitter"
    assert ended["outcome"] == "arrived"
    # The guest's late "I'm leaving" must not turn the family's lights off.
    scenes.clear()
    result = await visit(hass, "visit_end", visit_id="cat-sitter")
    assert result["status"] == "not_active"
    assert result["last"]["outcome"] == "arrived"
    assert not scenes
    assert not lock_calls


async def test_end_reapplies_unoccupied_scene_and_verifies_lock(hass, house, scenes, freezer):
    lock_calls = locks(hass)
    await setup(hass, house)
    await call(hass, state="out", overlay="festive")
    await visit(hass, visit_id="req-1")
    hass.states.async_set("lock.door", "unlocked")
    scenes.clear()
    result = await visit(hass, "visit_end", visit_id="req-1")
    assert result["status"] == "ended"
    assert result["outcome"] == "ended"
    assert result["cleanup"] == {
        "status": "ok",
        "scene": "applied",
        "locks": {"lock.door": "locked"},
    }
    assert [call.data["entity_id"] for call in scenes] == ["scene.away", "scene.christmas"]
    assert lock_calls == ["lock.door"]
    assert hub(hass).state == "out"
    assert hub(hass).attributes["last_visit"]["cleanup"]["status"] == "ok"
    # The guest unlocking to walk out is still not an arrival...
    unlock(hass)
    await advance(hass, freezer, 4)
    assert hub(hass).state == "out"
    # ...but after the exit window a door is a family arrival again.
    await advance(hass, freezer, 57)
    unlock(hass)
    await advance(hass, freezer, 4)
    assert hub(hass).state == "quiet"


@pytest.mark.parametrize(
    ("outcome", "reported"),
    [("refuse", "failed"), ("stuck", "unverified"), ("jammed", "jammed")],
)
async def test_lock_failures_are_reported_not_assumed(hass, house, scenes, outcome, reported):
    locks(hass, outcome)
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass)
    hass.states.async_set("lock.door", "unlocked")
    with patch("custom_components.house_state.devices.VERIFY_TIMEOUT", 0.01):
        result = await visit(hass, "visit_end")
    assert result["cleanup"]["status"] == "failed"
    assert result["cleanup"]["locks"] == {"lock.door": reported}
    ended = next(event for event in events if event["type"] == "visit_ended")
    assert ended["cleanup"]["locks"] == {"lock.door": reported}


async def test_lock_confirmed_after_locking_state(hass, house, scenes):
    locks(hass, "slow")
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass)
    hass.states.async_set("lock.door", "unlocked")
    result = await visit(hass, "visit_end")
    assert result["cleanup"]["locks"] == {"lock.door": "locked"}
    assert result["cleanup"]["status"] == "ok"


async def test_unavailable_lock_and_failed_scene_are_reported(hass, house, scenes):
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass)
    hass.states.async_set("lock.door", "unavailable")
    hass.states.async_set("scene.away", "unavailable")
    result = await visit(hass, "visit_end")
    assert result["cleanup"]["status"] == "failed"
    assert result["cleanup"]["scene"] == "failed"
    assert result["cleanup"]["locks"] == {"lock.door": "unavailable"}


async def test_end_while_occupied_skips_cleanup(hass, house, scenes):
    lock_calls = locks(hass)
    await setup(hass, house)
    await visit(hass)
    scenes.clear()
    result = await visit(hass, "visit_end")
    assert result["cleanup"] == {"status": "skipped", "because": "occupied"}
    assert not scenes
    assert not lock_calls


async def test_disabled_scene_reapplication_still_locks(hass, house, scenes):
    locks(hass)
    await setup(hass, house)
    await call(hass, "set_config", visit_reapply_scene=False)
    await call(hass, state="out")
    await visit(hass)
    scenes.clear()
    result = await visit(hass, "visit_end")
    assert result["cleanup"]["scene"] == "disabled"
    assert result["cleanup"]["locks"] == {"lock.door": "locked"}
    assert not scenes


async def test_duplicate_start_is_idempotent_and_ended_ids_stay_ended(hass, house, scenes, freezer):
    await setup(hass, house)
    await call(hass, state="out")
    first = await visit(hass, visit_id="req-1", duration={"minutes": 30})
    await advance(hass, freezer, 60)
    again = await visit(hass, visit_id="req-1", duration={"hours": 3})
    assert again["status"] == "active"
    assert again["expires"] == first["expires"]
    await visit(hass, "visit_end", visit_id="req-1")
    with pytest.raises(ServiceValidationError, match="already ended"):
        await visit(hass, visit_id="req-1")
    assert hub(hass).attributes["visit"] is None


async def test_old_guest_and_old_timer_cannot_end_newer_visit(hass, house, scenes, freezer):
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass, visit_id="cleaner", duration={"minutes": 10})
    await visit(hass, visit_id="cat-sitter", duration={"hours": 1})
    superseded = next(event for event in events if event["type"] == "visit_ended")
    assert (superseded["visit_id"], superseded["outcome"]) == ("cleaner", "superseded")
    scenes.clear()
    stale = await visit(hass, "visit_end", visit_id="cleaner")
    assert stale["status"] == "not_active"
    await advance(hass, freezer, 11 * 60)
    assert hub(hass).attributes["visit"]["id"] == "cat-sitter"
    assert not scenes
    await advance(hass, freezer, 50 * 60)
    assert hub(hass).attributes["visit"] is None
    assert hub(hass).attributes["last_visit"]["id"] == "cat-sitter"
    assert hub(hass).attributes["last_visit"]["outcome"] == "expired"
    assert [call.data["entity_id"] for call in scenes] == ["scene.away"]


async def test_visit_survives_restart_and_expires_while_stopped(hass, house, scenes, freezer):
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass, visit_id="req-1", duration={"minutes": 30})
    assert await hass.config_entries.async_reload(house.entry_id)
    await hass.async_block_till_done()
    assert hub(hass).attributes["visit"]["id"] == "req-1"
    unlock(hass)
    await hass.async_block_till_done()
    assert hub(hass).state == "out"
    assert await hass.config_entries.async_unload(house.entry_id)
    await advance(hass, freezer, 31 * 60)
    scenes.clear()
    await setup(hass, house)
    assert hub(hass).attributes["visit"] is None
    assert hub(hass).attributes["last_visit"]["outcome"] == "expired"
    assert [call.data["entity_id"] for call in scenes] == ["scene.away"]


async def test_duration_bounds_and_settings_validation(hass, house, scenes):
    await setup(hass, house)
    with pytest.raises(ServiceValidationError, match="between 60 and 43200"):
        await visit(hass, duration={"hours": 13})
    with pytest.raises(ServiceValidationError, match="between"):
        await visit(hass, duration={"seconds": 30})
    with pytest.raises(ServiceValidationError, match="exceeds the maximum"):
        await call(hass, "set_config", visit_duration=7200, visit_max_duration=3600)
    with pytest.raises(ServiceValidationError, match="lock"):
        await call(hass, "set_config", visit_lock_entities=["cover.gate"])
    assert hub(hass).attributes["visit"] is None


async def test_failed_storage_does_not_register_visit(hass, house, scenes):
    await setup(hass, house)
    await call(hass, state="out")
    coordinator = house.runtime_data
    with patch.object(
        coordinator.store, "async_save", new=AsyncMock(side_effect=HomeAssistantError("disk"))
    ):
        with pytest.raises(HomeAssistantError):
            await visit(hass)
    assert coordinator.visits.active is None
    assert coordinator.visits.timer is None


async def test_ha_user_is_recorded_as_supporting_detail(hass, house, scenes, hass_admin_user):
    await setup(hass, house)
    started = await visit(
        hass,
        actor="Guest link: cat sitter",
        source="guest_dashboard",
        context=Context(user_id=hass_admin_user.id),
    )
    assert started["user_id"] == hass_admin_user.id
    assert started["user_name"] == hass_admin_user.name
    assert started["actor"] == "Guest link: cat sitter"


async def test_visit_settings_are_a_draft_until_saved(hass, house, scenes):
    await setup(hass, house)
    flow = await hass.config_entries.options.async_init(house.entry_id)
    assert "visits" in flow["menu_options"]
    flow = await choose(hass, flow, "visits")
    assert flow["step_id"] == "visits"
    flow = await submit(
        hass,
        flow,
        {
            "visit_duration": 90,
            "visit_max_duration": 240,
            "visit_exit_grace": 30,
            "visit_reapply_scene": False,
            "visit_lock_entities": ["lock.back"],
        },
    )
    assert "visit_duration" not in house.options
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert {key: house.options[key] for key in house.options if key.startswith("visit_")} == {
        "visit_duration": 5400,
        "visit_max_duration": 14400,
        "visit_exit_grace": 30,
        "visit_reapply_scene": False,
        "visit_lock_entities": ["lock.back"],
    }
    flow = await hass.config_entries.options.async_init(house.entry_id)
    flow = await choose(hass, flow, "visits")
    flow = await submit(
        hass,
        flow,
        {
            "visit_duration": 300,
            "visit_max_duration": 60,
            "visit_exit_grace": 30,
            "visit_reapply_scene": False,
            "visit_lock_entities": [],
        },
    )
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["errors"] == {"base": "invalid_config"}
    assert house.options["visit_duration"] == 5400
