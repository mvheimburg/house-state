import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.house_state.const import DOMAIN  # noqa: F401


@pytest.fixture(autouse=True)
def enable(enable_custom_integrations):
    yield


@pytest.fixture
def scenes(hass):
    for name in ["home", "day", "night", "away", "tv", "christmas", "party"]:
        hass.states.async_set("scene." + name, "unknown", {"entity_id": ["light.valid"]})
    hass.states.async_set("light.valid", "on")
    return async_mock_service(hass, "scene", "turn_on")


@pytest.fixture
def entry(hass):
    entry = MockConfigEntry(
        domain="house_state",
        title="House",
        data={},
        options={
            "scene_map": {
                name: "scene." + name
                for name in ["home", "day", "night", "away", "tv", "christmas", "party"]
            }
        },
    )
    entry.add_to_hass(hass)
    return entry


async def setup(hass, entry):
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def call(hass, service="set", entity="sensor.house_state", **data):
    await hass.services.async_call(
        "house_state", service, {"entity_id": entity, **data}, blocking=True
    )
    await hass.async_block_till_done()
