import pytest
from homeassistant import data_entry_flow
from homeassistant.exceptions import HomeAssistantError

from .conftest import call, setup


async def test_user_flow_and_scene_validation(hass, scenes):
    flow = await hass.config_entries.flow.async_init("house_state", context={"source": "user"})
    assert flow["type"] == data_entry_flow.FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        flow["flow_id"], {"name": "House", "scene_map": {"home": "scene.missing"}}
    )
    assert result["errors"] == {"base": "invalid_config"}
    result = await hass.config_entries.flow.async_configure(
        flow["flow_id"], {"name": "House", "scene_map": {"home": "scene.home"}}
    )
    assert result["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()


async def test_scene_member_warning_and_options(hass, entry, scenes):
    await setup(hass, entry)
    hass.states.async_set("scene.night", "unknown", {"entity_id": ["lock.missing"]})
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        flow["flow_id"], {"scene_map": {"night": "scene.night"}}
    )
    assert result["step_id"] == "warnings"
    assert "lock.missing" in result["description_placeholders"]["warnings"]
    result = await hass.config_entries.options.async_configure(flow["flow_id"], {})
    assert result["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.options["scene_map"] == {"night": "scene.night"}


async def test_service_config_validated_and_persisted(hass, entry, scenes):
    await setup(hass, entry)
    for changes in [
        {"night_schedule": {"type": "fixed", "time": "bad"}},
        {"door_entities": ["light.valid"]},
        {"scene_map": {"bogus": "scene.day"}},
    ]:
        with pytest.raises(HomeAssistantError):
            await call(hass, "set_config", **changes)
    await call(hass, "set_config", auto_away=True, auto_away_grace=20)
    assert entry.options["auto_away"] is True
    assert hass.states.get("sensor.house_state").attributes["config"]["auto_away_grace"] == 20
