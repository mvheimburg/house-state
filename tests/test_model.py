"""The graph has no reserved state IDs or fixed depth."""

from copy import deepcopy

import pytest
from homeassistant.exceptions import HomeAssistantError

from custom_components.house_state.config import validate_config
from custom_components.house_state.model import StateTree

from .conftest import OPTIONS


def test_occupancy_override_default_descent_and_parent_selection(hass, scenes):
    options = deepcopy(OPTIONS)
    options["state_tree"][3]["occupied"] = False
    options["state_tree"][4]["occupied"] = True
    options["state_tree"][1]["default_child"] = None
    tree = StateTree(validate_config(hass, options))
    assert tree.descend("house") == "awake"
    assert tree.occupied("cinema") is False
    assert tree.occupied("film") is True
    assert tree.resolve("film", "none") == ("scene.tv", "cinema", None)


@pytest.mark.parametrize("invalid_id", ["Bad", "x-y", "a" * 65, ""])
def test_invalid_ids(hass, scenes, invalid_id):
    options = deepcopy(OPTIONS)
    options["state_tree"][-1]["id"] = invalid_id
    with pytest.raises(HomeAssistantError):
        validate_config(hass, options)


def test_role_occupancy_checks_default_descendants(hass, scenes):
    options = deepcopy(OPTIONS)
    options["state_tree"][2]["occupied"] = False
    with pytest.raises(HomeAssistantError, match="occupancy"):
        validate_config(hass, options)
