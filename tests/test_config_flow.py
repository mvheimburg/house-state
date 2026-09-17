from copy import deepcopy

import pytest
from homeassistant import data_entry_flow
from homeassistant.exceptions import HomeAssistantError

from .conftest import TREE, call, setup


async def test_user_flow_and_scene_validation(hass, scenes):
    flow = await hass.config_entries.flow.async_init("house_state", context={"source": "user"})
    assert flow["type"] == data_entry_flow.FlowResultType.FORM
    tree = deepcopy(TREE)
    tree[0]["scene"] = "scene.missing"
    data = {"name": "House", "state_tree": tree, "initial_state": "house", "roles": {}}
    result = await hass.config_entries.flow.async_configure(flow["flow_id"], data)
    assert result["errors"] == {"base": "invalid_config"}
    data["state_tree"] = TREE
    result = await hass.config_entries.flow.async_configure(flow["flow_id"], data)
    assert result["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()


async def test_scene_member_warning_and_options(hass, entry, scenes):
    await setup(hass, entry)
    hass.states.async_set("scene.night", "unknown", {"entity_id": ["lock.missing"]})
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        flow["flow_id"], {"state_tree": TREE}
    )
    assert result["step_id"] == "warnings"
    assert "lock.missing" in result["description_placeholders"]["warnings"]
    result = await hass.config_entries.options.async_configure(flow["flow_id"], {})
    assert result["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert "lock.missing" in str(hass.states.get("sensor.house_state").attributes["scene_warnings"])


@pytest.mark.parametrize(
    "mutation",
    [
        "duplicate",
        "cycle",
        "parent",
        "default",
        "role",
        "initial",
        "unknown_field",
        "overlay",
        "schedule",
    ],
)
async def test_invalid_config_atomic(hass, entry, scenes, mutation):
    await setup(hass, entry)
    tree = deepcopy(TREE)
    changes = {"state_tree": tree}
    if mutation == "duplicate":
        tree.append(deepcopy(tree[0]))
    if mutation == "cycle":
        tree[0]["parent"] = "quiet"
    if mutation == "parent":
        tree[0]["parent"] = "missing"
    if mutation == "default":
        tree[0]["default_child"] = "film"
    if mutation == "role":
        changes["roles"] = {"arrival": "out"}
    if mutation == "initial":
        changes["initial_state"] = "missing"
    if mutation == "unknown_field":
        tree[0]["typo"] = 1
    if mutation == "overlay":
        changes["overlays"] = [{"id": "none", "name": "No", "scene": ""}]
    if mutation == "schedule":
        changes["night_schedule"] = {"type": "fixed", "time": "bad"}
    before = deepcopy(dict(entry.options))
    with pytest.raises(HomeAssistantError):
        await call(hass, "set_config", **changes)
    assert entry.options == before
    assert hass.states.get("sensor.house_state").state == "quiet"


async def test_service_metadata_loads_for_all_public_actions(hass, entry, scenes):
    from homeassistant.helpers.service import async_get_all_descriptions

    await setup(hass, entry)
    descriptions = await async_get_all_descriptions(hass)
    assert set(descriptions["house_state"]) == {
        "set",
        "arrive",
        "depart",
        "apply_scene",
        "set_config",
    }
    assert set(descriptions["house_state"]["set_config"]["fields"]) == set(
        hass.states.get("sensor.house_state").attributes["config"]
    )
