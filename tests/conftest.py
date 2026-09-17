"""Fixtures running against real Home Assistant."""

from copy import deepcopy

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.house_state.const import DOMAIN  # noqa: F401

TREE = [
    {
        "id": "house",
        "name": "Our home",
        "parent": None,
        "scene": "scene.home",
        "default_child": "awake",
        "occupied": True,
    },
    {
        "id": "awake",
        "name": "Awake",
        "parent": "house",
        "scene": "scene.day",
        "default_child": "quiet",
        "occupied": None,
    },
    {
        "id": "quiet",
        "name": "Quiet",
        "parent": "awake",
        "scene": "",
        "default_child": None,
        "occupied": None,
    },
    {
        "id": "cinema",
        "name": "Cinema",
        "parent": "awake",
        "scene": "scene.tv",
        "default_child": "film",
        "occupied": None,
    },
    {
        "id": "film",
        "name": "Film",
        "parent": "cinema",
        "scene": "",
        "default_child": None,
        "occupied": None,
    },
    {
        "id": "sleep",
        "name": "Sleep",
        "parent": "house",
        "scene": "scene.night",
        "default_child": None,
        "occupied": None,
    },
    {
        "id": "out",
        "name": "Out",
        "parent": None,
        "scene": "scene.away",
        "default_child": None,
        "occupied": False,
    },
    {
        "id": "trip",
        "name": "Trip",
        "parent": None,
        "scene": "",
        "default_child": None,
        "occupied": False,
    },
]
OPTIONS = {
    "state_tree": TREE,
    "initial_state": "house",
    "overlays": [
        {"id": "festive", "name": "Festive", "scene": "scene.christmas"},
        {"id": "guests", "name": "Guests", "scene": "scene.party"},
    ],
    "roles": {"arrival": "house", "departure": "out", "vacation": "trip", "night": "sleep"},
}


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
    entry = MockConfigEntry(domain="house_state", title="House", data={}, options=deepcopy(OPTIONS))
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
