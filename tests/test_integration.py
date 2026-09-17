import pytest
from homeassistant.exceptions import HomeAssistantError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import call, setup


async def test_atomic_hierarchy_and_availability(hass, entry, scenes):
    await setup(hass, entry)
    await call(hass, presence="away")
    assert hass.states.get("select.house_mode").state == "unavailable"
    with pytest.raises(HomeAssistantError):
        await call(hass, mode="day", overlay="christmas")
    assert hass.states.get("sensor.house_state").attributes["overlay"] == "none"
    scenes.clear()
    await call(hass, presence="home", mode="night")
    assert [c.data["entity_id"] for c in scenes] == ["scene.night"]
    assert hass.states.get("select.house_activity").state == "unavailable"


async def test_scene_pair_dedupe_overlay_force_and_fallback(hass, entry, scenes):
    await setup(hass, entry)
    await call(hass, activity="tv", overlay="christmas")
    assert [c.data["entity_id"] for c in scenes] == ["scene.tv", "scene.christmas"]
    scenes.clear()
    await call(hass, activity="tv")
    assert not scenes
    await call(hass, activity="eating")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day", "scene.christmas"]
    scenes.clear()
    await call(hass, overlay="party")
    assert [c.data["entity_id"] for c in scenes][-1] == "scene.party"
    scenes.clear()
    await call(hass, "apply_scene")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day", "scene.party"]


async def test_restore_state_since_and_pending_retry(hass, entry, scenes):
    await setup(hass, entry)

    async def fail(call):
        raise HomeAssistantError("scene offline")

    hass.services.async_register("scene", "turn_on", fail)
    with pytest.raises(HomeAssistantError):
        await call(hass, mode="night")
    since = hass.states.get("sensor.house_state").attributes["since"]
    assert await hass.config_entries.async_unload(entry.entry_id)
    from pytest_homeassistant_custom_component.common import async_mock_service

    calls = async_mock_service(hass, "scene", "turn_on")
    await setup(hass, entry)
    assert hass.states.get("sensor.house_state").attributes["mode"] == "night"
    assert hass.states.get("sensor.house_state").attributes["since"] == since
    assert [c.data["entity_id"] for c in calls] == ["scene.night"]


async def test_multiple_entries_target_only_hub(hass, entry, scenes):
    await setup(hass, entry)
    other = MockConfigEntry(domain="house_state", title="Cabin", data={})
    other.add_to_hass(hass)
    await setup(hass, other)
    await call(hass, presence="away")
    assert hass.states.get("sensor.cabin_state").state == "home"
    await call(hass, entity="select.house_presence", presence="home")
    assert hass.states.get("sensor.house_state").state == "away"
