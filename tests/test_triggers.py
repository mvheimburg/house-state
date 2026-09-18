from datetime import timedelta

from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from .conftest import call, setup


async def advance(hass, freezer, seconds):
    # Let pending state changes schedule their timers before time moves.
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


async def test_door_and_known_gate_edges(hass, entry, scenes, freezer):
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options)
        | {"door_entities": ["lock.door"], "gate_entities": ["cover.gate"]},
    )
    await setup(hass, entry)
    await call(hass, state="out")
    hass.states.async_set("cover.gate", "open")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "out"
    hass.states.async_set("cover.gate", "closed")
    hass.states.async_set("cover.gate", "opening")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "out"
    await advance(hass, freezer, 4)
    assert hass.states.get("sensor.house_state").state == "quiet"
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "gate"
    await call(hass, state="trip")
    hass.states.async_set("lock.door", "locked")
    hass.states.async_set("lock.door", "unlocked")
    await advance(hass, freezer, 4)
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "door"
    assert hass.states.get("sensor.house_state").state == "quiet"


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
    assert hass.states.get("sensor.house_state").state == "quiet"
    hass.states.async_set("person.b", "not_home")
    await hass.async_block_till_done()
    await advance(hass, freezer, 20)
    hass.states.async_set("person.a", "home")
    await hass.async_block_till_done()
    await advance(hass, freezer, 20)
    assert hass.states.get("sensor.house_state").state == "quiet"
    hass.states.async_set("person.a", "work")
    await hass.async_block_till_done()
    await advance(hass, freezer, 31)
    assert hass.states.get("sensor.house_state").state == "out"
    hass.states.async_set("person.a", "home")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.house_state").state == "quiet"
    hass.states.async_set("person.a", "not_home")
    await hass.async_block_till_done()
    coordinator = entry.runtime_data
    assert await hass.config_entries.async_unload(entry.entry_id)
    await advance(hass, freezer, 31)
    assert coordinator.state == "quiet"


async def test_fixed_schedule_home_day_only(hass, entry, scenes, freezer):
    freezer.move_to("2026-09-17 21:59:50+00:00")
    await hass.config.async_set_time_zone("UTC")
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options) | {"night_schedule": {"type": "fixed", "time": "22:00:00"}},
    )
    await setup(hass, entry)
    await advance(hass, freezer, 11)
    assert hass.states.get("sensor.house_state").state == "sleep"
    assert hass.states.get("sensor.house_state").attributes["last_changed_by"] == "schedule"
    await call(hass, state="out")
    await advance(hass, freezer, 86400)
    assert hass.states.get("sensor.house_state").state == "out"


async def test_sun_schedule_offset_and_disabled_role(hass, entry, scenes, freezer):
    from homeassistant.helpers.sun import get_astral_event_next

    freezer.move_to("2026-09-17 08:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config.latitude, hass.config.longitude = 59.91, 10.75
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options)
        | {"night_schedule": {"type": "sun", "event": "sunset", "offset": -1800}},
    )
    fire_at = get_astral_event_next(hass, "sunset", offset=timedelta(seconds=-1800))
    await setup(hass, entry)
    await advance(hass, freezer, (fire_at - dt_util.utcnow()).total_seconds() + 1)
    assert hass.states.get("sensor.house_state").state == "sleep"
    await call(hass, state="house")
    await call(hass, "set_config", roles={})
    await advance(hass, freezer, 86400)
    assert hass.states.get("sensor.house_state").state == "quiet"


async def test_fixed_schedule_uses_ha_timezone(hass, entry, scenes, freezer):
    freezer.move_to("2026-09-17 19:59:50+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options) | {"night_schedule": {"type": "fixed", "time": "22:00:00"}},
    )
    await setup(hass, entry)
    await advance(hass, freezer, 11)
    assert hass.states.get("sensor.house_state").state == "sleep"
