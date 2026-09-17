"""Durability, events and configuration boundary regressions."""

from copy import deepcopy
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.exceptions import HomeAssistantError
from pytest_homeassistant_custom_component.common import async_mock_service

from .conftest import TREE, call, setup


async def test_config_reload_never_replays_pending_scene(hass, entry, scenes):
    await setup(hass, entry)

    async def fail(call):
        raise HomeAssistantError("offline")

    hass.services.async_register("scene", "turn_on", fail)
    with pytest.raises(HomeAssistantError):
        await call(hass, state="sleep")
    calls = async_mock_service(hass, "scene", "turn_on")
    await call(hass, "set_config", auto_return=False)
    assert not calls
    assert hass.states.get("sensor.house_state").attributes["application_pending"] is True
    await call(hass, "apply_scene")
    assert [call.data["entity_id"] for call in calls] == ["scene.night"]


async def test_renaming_nodes_preserves_genuine_pending(hass, entry, scenes):
    await setup(hass, entry)

    async def fail(call):
        raise HomeAssistantError("offline")

    hass.services.async_register("scene", "turn_on", fail)
    with pytest.raises(HomeAssistantError):
        await call(hass, state="sleep")
    calls = async_mock_service(hass, "scene", "turn_on")
    tree = deepcopy(TREE)
    tree[5]["name"] = "Sleeping"
    await call(hass, "set_config", state_tree=tree)
    assert not calls
    assert hass.states.get("sensor.house_state").attributes["application_pending"] is True


async def test_failed_storage_does_not_publish_uncommitted_selection(hass, entry, scenes):
    await setup(hass, entry)
    coordinator = entry.runtime_data
    with patch.object(
        coordinator.store, "async_save", new=AsyncMock(side_effect=HomeAssistantError("disk full"))
    ):
        with pytest.raises(HomeAssistantError):
            await call(hass, state="out")
    assert coordinator.state == "quiet"
    assert hass.states.get("sensor.house_state").state == "quiet"
    assert not scenes


async def test_events_and_legacy_names(hass, entry, scenes):
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    hass.states.async_set("input_select.legacy", "Quiet", {"options": ["Quiet", "Out"]})
    hass.config_entries.async_update_entry(
        entry, options=dict(entry.options) | {"legacy_mirror": {"state": "input_select.legacy"}}
    )
    mirrors = async_mock_service(hass, "input_select", "select_option")
    await setup(hass, entry)
    await call(hass, state="out", overlay="festive", reason="user")
    assert mirrors[-1].data["option"] == "Out"
    assert {event["type"] for event in events} == {
        "changed",
        "departed",
        "overlay_changed",
        "scene_applied",
    }
    assert all(event["entity_id"] == "sensor.house_state" for event in events)
    assert (
        next(event for event in events if event["type"] == "scene_applied")["resolved_from"]
        == "out"
    )
    with pytest.raises(HomeAssistantError):
        await call(hass, overlay="missing")
    await hass.async_block_till_done()
    assert events[-1]["type"] == "rejected"


async def test_queued_schedule_rechecks_occupancy_inside_lock(hass, entry, scenes):
    import asyncio

    await setup(hass, entry)
    coordinator = entry.runtime_data
    await coordinator.lock.acquire()
    depart = hass.async_create_task(coordinator.transition({"state": "out"}))
    night = hass.async_create_task(coordinator.triggers.night())
    await asyncio.sleep(0)
    coordinator.lock.release()
    await depart
    await night
    assert coordinator.state == "out"


async def test_queued_branch_selection_rechecks_parent(hass, entry, scenes):
    import asyncio

    await setup(hass, entry)
    coordinator = entry.runtime_data
    await coordinator.lock.acquire()
    depart = hass.async_create_task(coordinator.transition({"state": "out"}))
    selection = hass.async_create_task(
        hass.services.async_call(
            "select",
            "select_option",
            {"entity_id": "select.house_awake", "option": "cinema"},
            blocking=True,
        )
    )
    await asyncio.sleep(0)
    coordinator.lock.release()
    await depart
    with pytest.raises(HomeAssistantError):
        await selection
    assert coordinator.state == "out"


async def test_queued_trigger_does_not_run_after_stop(hass, entry, scenes):
    import asyncio

    await setup(hass, entry)
    coordinator = entry.runtime_data
    await coordinator.lock.acquire()
    night = hass.async_create_task(coordinator.triggers.night())
    await asyncio.sleep(0)
    coordinator.triggers.stop()
    coordinator.lock.release()
    await night
    assert coordinator.state == "quiet"


async def test_deleted_scene_keeps_application_pending(hass, entry, scenes):
    await setup(hass, entry)
    hass.states.async_remove("scene.night")
    with pytest.raises(HomeAssistantError, match="scene.night"):
        await call(hass, state="sleep")
    assert hass.states.get("sensor.house_state").attributes["application_pending"] is True


async def test_back_to_back_config_edits_preserve_both(hass, entry, scenes):
    await setup(hass, entry)
    coordinator = entry.runtime_data
    await coordinator.set_config({"auto_return": False})
    await coordinator.set_config({"auto_away_grace": 60})
    await hass.async_block_till_done()
    assert entry.options["auto_return"] is False
    assert entry.options["auto_away_grace"] == 60


async def test_initial_selection_since_survives_restart(hass, entry, scenes, freezer):
    from datetime import timedelta

    await setup(hass, entry)
    since = hass.states.get("sensor.house_state").attributes["since"]
    assert await hass.config_entries.async_unload(entry.entry_id)
    freezer.tick(timedelta(hours=1))
    await setup(hass, entry)
    assert hass.states.get("sensor.house_state").attributes["since"] == since
