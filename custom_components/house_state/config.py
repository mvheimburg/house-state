"""Shared configuration validation and scene diagnostics."""

from copy import deepcopy

import voluptuous as vol
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import DEFAULTS, SCENE_KEYS


def validate_config(hass, values):
    """Reject malformed options before persisting any change."""
    config = deepcopy(DEFAULTS) | values
    try:
        if set(config) - set(DEFAULTS):
            raise vol.Invalid("Unknown configuration field")
        for key, domain in (
            ("door_entities", "lock"),
            ("gate_entities", "cover"),
            ("person_entities", "person"),
        ):
            config[key] = cv.entity_ids(config[key])
            if any(not entity.startswith(domain + ".") for entity in config[key]):
                raise vol.Invalid(f"{key} requires {domain} entities")
        for key in ("auto_return", "auto_away"):
            config[key] = cv.boolean(config[key])
        config["auto_away_grace"] = vol.All(vol.Coerce(int), vol.Range(min=0))(
            config["auto_away_grace"]
        )
        scene_map = vol.Schema({vol.Optional(key): str for key in SCENE_KEYS})(config["scene_map"])
        for scene in scene_map.values():
            if scene and (not scene.startswith("scene.") or hass.states.get(scene) is None):
                raise vol.Invalid(f"Scene does not exist: {scene}")
        schedule = config["night_schedule"]
        kind = schedule.get("type", "off")
        if kind == "off":
            config["night_schedule"] = {"type": "off"}
        elif kind == "fixed":
            config["night_schedule"] = {"type": kind, "time": cv.time(schedule["time"]).isoformat()}
        elif kind == "sun":
            config["night_schedule"] = {
                "type": kind,
                "event": vol.In(["sunset", "sunrise"])(schedule["event"]),
                "offset": int(schedule.get("offset", 0)),
            }
        else:
            raise vol.Invalid("Invalid night schedule type")
        config["legacy_mirror"] = vol.Schema(
            {vol.Optional(key): cv.entity_id for key in ("presence", "mode", "overlay")}
        )(config["legacy_mirror"])
        if any(
            not entity.startswith("input_select.") for entity in config["legacy_mirror"].values()
        ):
            raise vol.Invalid("Legacy mirrors must be input_select entities")
    except (vol.Invalid, KeyError, TypeError, ValueError, AttributeError) as err:
        raise ServiceValidationError(str(err)) from err
    return config


def scene_warnings(hass, config):
    """Report missing scene members without prohibiting otherwise valid scenes."""
    warnings = []
    for scene in config["scene_map"].values():
        state = hass.states.get(scene) if scene else None
        if state:
            members = state.attributes.get("entity_id", [])
            if isinstance(members, str):
                members = [members]
            for member in members:
                if hass.states.get(member) is None:
                    warnings.append(f"{scene}: {member}")
    return sorted(set(warnings))
