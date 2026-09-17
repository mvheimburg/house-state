from copy import deepcopy

import pytest
from homeassistant.exceptions import HomeAssistantError
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from .conftest import TREE, call, setup


async def test_arbitrary_tree_default_descent_and_availability(hass, entry, scenes):
    await setup(hass, entry)
    assert hass.states.get("sensor.house_state").state == "quiet"
    await call(hass, state="out")
    assert hass.states.get("select.house_our_home").state == "unavailable"
    assert hass.states.get("select.house_awake").state == "unavailable"
    with pytest.raises(HomeAssistantError):
        await call(hass, state="missing", overlay="festive")
    assert hass.states.get("sensor.house_state").attributes["overlay"] == "none"
    scenes.clear()
    await call(hass, state="cinema")
    state = hass.states.get("sensor.house_state")
    assert state.state == "film"
    assert state.attributes["active_path"] == ["house", "awake", "cinema", "film"]
    assert state.attributes["occupied"] is True
    assert [c.data["entity_id"] for c in scenes] == ["scene.tv"]
    assert hass.states.get("select.house_cinema").state == "film"
    assert hass.states.get("binary_sensor.house_occupied").state == "on"


async def test_scene_pair_dedupe_overlay_force_and_fallback(hass, entry, scenes):
    await setup(hass, entry)
    await call(hass, state="cinema", overlay="festive")
    assert [c.data["entity_id"] for c in scenes] == ["scene.tv", "scene.christmas"]
    scenes.clear()
    await call(hass, state="film")
    assert not scenes
    await call(hass, state="quiet")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day", "scene.christmas"]
    scenes.clear()
    await call(hass, overlay="guests")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day", "scene.party"]
    scenes.clear()
    await call(hass, "apply_scene")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day", "scene.party"]


async def test_restore_state_since_and_pending_retry(hass, entry, scenes):
    await setup(hass, entry)

    async def fail(call):
        raise HomeAssistantError("scene offline")

    hass.services.async_register("scene", "turn_on", fail)
    with pytest.raises(HomeAssistantError):
        await call(hass, state="sleep")
    since = hass.states.get("sensor.house_state").attributes["since"]
    assert await hass.config_entries.async_unload(entry.entry_id)
    calls = async_mock_service(hass, "scene", "turn_on")
    await setup(hass, entry)
    state = hass.states.get("sensor.house_state")
    assert state.state == "sleep"
    assert state.attributes["since"] == since
    assert [c.data["entity_id"] for c in calls] == ["scene.night"]


async def test_multiple_entries_target_only_hub(hass, entry, scenes):
    await setup(hass, entry)
    other = MockConfigEntry(domain="house_state", title="Cabin", data={})
    other.add_to_hass(hass)
    await setup(hass, other)
    await call(hass, state="out")
    assert hass.states.get("sensor.cabin_state").state == "idle"
    await call(hass, entity="select.house_state", state="house")
    assert hass.states.get("sensor.house_state").state == "out"


async def test_config_reconciles_removed_state_and_entities_without_scenes(hass, entry, scenes):
    from homeassistant.helpers import entity_registry as er

    await setup(hass, entry)
    await call(hass, state="cinema", overlay="festive")
    scenes.clear()
    tree = [node for node in deepcopy(TREE) if node["id"] not in {"cinema", "film"}]
    tree.append(
        {
            "id": "reading",
            "name": "Reading",
            "parent": "quiet",
            "scene": "",
            "default_child": None,
            "occupied": None,
        }
    )
    await call(hass, "set_config", state_tree=tree, overlays=[])
    state = hass.states.get("sensor.house_state")
    assert state.state == "quiet"
    assert state.attributes["overlay"] == "none"
    assert state.attributes["application_pending"] is False
    assert not scenes
    assert hass.states.get("select.house_quiet") is not None
    assert er.async_get(hass).async_get("select.house_cinema") is None
    await call(hass, "apply_scene")
    assert [c.data["entity_id"] for c in scenes] == ["scene.day"]


async def test_roles_missing_and_renamed_state(hass, entry, scenes):
    await setup(hass, entry)
    await call(hass, "depart", vacation=True)
    assert hass.states.get("sensor.house_state").state == "trip"
    await call(hass, "arrive")
    assert hass.states.get("sensor.house_state").state == "quiet"
    since = hass.states.get("sensor.house_state").attributes["since"]
    tree = deepcopy(TREE)
    tree[2]["name"] = "Resting"
    await call(hass, "set_config", state_tree=tree, roles={})
    assert hass.states.get("sensor.house_state").attributes["since"] == since
    with pytest.raises(HomeAssistantError, match="role"):
        await call(hass, "depart")


async def test_entity_names_follow_home_assistant_language(hass, entry, scenes):
    hass.config.language = "nb"
    await setup(hass, entry)
    assert hass.states.get("sensor.house_state").attributes["friendly_name"] == "House Tilstand"
