from datetime import timedelta

from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from .conftest import call, setup


async def advance(hass, freezer, seconds):
    freezer.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


async def test_door_and_known_gate_edges(hass, entry, scenes):
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options)
        | {"door_entities": ["lock.door"], "gate_entities": ["cover.gate"]},
    )
    await setup(hass, entry)
    await call(hass, presence="away")
    hass.states.async_set("cover.gate", "open")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "away"
    hass.states.async_set("cover.gate", "closed")
    hass.states.async_set("cover.gate", "opening")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "home"
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "gate"
    await call(hass, presence="vacation")
    hass.states.async_set("lock.door", "locked")
    hass.states.async_set("lock.door", "unlocked")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "door"
    assert hass.states.get("sensor.house_state").state == "home"


async def test_presence_grace_unknown_cancellation_and_unload(hass, entry, scenes, freezer):
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options)
        | {
            "person_entities": ["person.a", "person.b"],
            "auto_away": True,
            "auto_away_grace": 30,
        },
    )
    hass.states.async_set("person.a", "not_home")
    hass.states.async_set("person.b", "unknown")
    await setup(hass, entry)
    await advance(hass, freezer, 40)
    assert hass.states.get("sensor.house_state").state == "home"
    hass.states.async_set("person.b", "not_home")
    await hass.async_block_till_done()
    await advance(hass, freezer, 20)
    hass.states.async_set("person.a", "home")
    await hass.async_block_till_done()
    await advance(hass, freezer, 20)
    assert hass.states.get("sensor.house_state").state == "home"
    hass.states.async_set("person.a", "work")
    await hass.async_block_till_done()
    await advance(hass, freezer, 31)
    assert hass.states.get("sensor.house_state").state == "away"
    hass.states.async_set("person.a", "home")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "home"
    hass.states.async_set("person.a", "not_home")
    await hass.async_block_till_done()
    coordinator = entry.runtime_data
    assert await hass.config_entries.async_unload(entry.entry_id)
    await advance(hass, freezer, 31)
    assert coordinator.state.presence == "home"


async def test_fixed_schedule_home_day_only(hass, entry, scenes, freezer):
    freezer.move_to("2026-09-17 21:59:50+00:00")
    await hass.config.async_set_time_zone("UTC")
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options) | {"night_schedule": {"type": "fixed", "time": "22:00:00"}},
    )
    await setup(hass, entry)
    await advance(hass, freezer, 11)
    assert hass.states.get("sensor.house_state").attributes["mode"] == "night"
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "schedule"
    await call(hass, presence="away")
    await advance(hass, freezer, 86400)
    assert hass.states.get("sensor.house_state").attributes["mode"] == "day"
