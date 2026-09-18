"""Atomic configuration validation and scene diagnostics."""

import re
from copy import deepcopy

import voluptuous as vol
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import DEFAULTS, MAX_DURATION, MIN_DURATION, RESERVED_OVERLAYS, ROLE_KEYS
from .model import StateTree
from .rules import WEEKDAYS, valid_mmdd

_ID = vol.All(str, vol.Length(min=1, max=64), vol.Match(r"^[a-z][a-z0-9_]*$"))


def _nonempty_name(value):
    if not value.strip():
        raise vol.Invalid("Empty name")
    return value


_NAME = vol.All(str, vol.Length(min=1, max=100), _nonempty_name)
_MMDD = vol.All(str, vol.Match(r"^\d{2}-\d{2}$"))
_OFFSET = vol.All(vol.Coerce(int), vol.Range(min=-180, max=180))
_NODE = vol.Schema(
    {
        vol.Required("id"): _ID,
        vol.Required("name"): _NAME,
        vol.Optional("parent", default=None): vol.Any(None, _ID),
        vol.Optional("scene", default=""): str,
        vol.Optional("default_child", default=None): vol.Any(None, _ID),
        vol.Optional("occupied", default=None): vol.Any(None, bool),
    }
)
_OVERLAY = vol.Schema(
    {
        vol.Required("id"): _ID,
        vol.Required("name"): _NAME,
        vol.Optional("scene", default=""): str,
        vol.Optional("calendar"): cv.entity_id,
        vol.Optional("match"): str,
        vol.Optional("dates"): dict,
        vol.Optional("when_occupied"): vol.Any(None, bool),
        vol.Optional("when_state"): [_ID],
        vol.Optional("priority"): vol.All(vol.Coerce(int), vol.Range(min=-100, max=100)),
    }
)


def _dates(value):
    """Normalize one date rule the way night_schedule normalizes a schedule."""
    allowed = {
        "fixed": {"type", "from", "to"},
        "easter": {"type", "from", "to"},
        "nth_weekday": {"type", "weekday", "nth", "month", "anchor", "days"},
    }
    kind = value.get("type")
    if kind not in allowed or set(value) - allowed[kind]:
        raise vol.Invalid("Invalid date rule fields")
    if kind == "fixed":
        rule = {"type": kind, "from": _MMDD(value["from"]), "to": _MMDD(value["to"])}
        for bound in ("from", "to"):
            if not valid_mmdd(rule[bound]):
                raise vol.Invalid(f"Date rule has no such day: {rule[bound]}")
        return rule
    if kind == "easter":
        rule = {
            "type": kind,
            "from": _OFFSET(value.get("from", 0)),
            "to": _OFFSET(value.get("to", 0)),
        }
        if rule["from"] > rule["to"]:
            raise vol.Invalid("Easter window starts after it ends")
        return rule
    rule = {
        "type": kind,
        "weekday": vol.In(list(WEEKDAYS))(value["weekday"]),
        "nth": vol.All(vol.Coerce(int), vol.Range(min=-5, max=5))(value["nth"]),
        "days": vol.All(vol.Coerce(int), vol.Range(min=1, max=366))(value.get("days", 1)),
    }
    if rule["nth"] == 0:
        raise vol.Invalid("Date rule nth must not be zero")
    if ("month" in value) == ("anchor" in value):
        raise vol.Invalid("Date rule takes either a month or an anchor")
    if "month" in value:
        rule["month"] = vol.All(vol.Coerce(int), vol.Range(min=1, max=12))(value["month"])
    else:
        rule["anchor"] = _MMDD(value["anchor"])
        if not valid_mmdd(rule["anchor"]):
            raise vol.Invalid(f"Date rule has no such anchor: {rule['anchor']}")
    return rule


def _overlay_rule(overlay, nodes):
    """Validate the optional activation rule attached to one overlay."""
    if "calendar" in overlay and "dates" in overlay:
        raise vol.Invalid("An overlay takes a calendar or dates, not both")
    if "calendar" in overlay and not overlay["calendar"].startswith("calendar."):
        raise vol.Invalid("Overlay calendar requires a calendar entity")
    if "match" in overlay:
        if "calendar" not in overlay:
            raise vol.Invalid("Overlay match requires a calendar")
        try:
            re.compile(overlay["match"])
        except re.error as err:
            raise vol.Invalid(f"Invalid overlay match expression: {err}") from err
    for state in overlay.get("when_state", []):
        if state not in nodes:
            raise vol.Invalid(f"Unknown when_state target: {state}")
    if "dates" in overlay:
        overlay["dates"] = _dates(overlay["dates"])


def validate_config(hass, values, *, check_scenes=True):
    """Reject malformed graph and options before persisting any change."""
    config = deepcopy(DEFAULTS) | deepcopy(values)
    try:
        if set(config) - set(DEFAULTS):
            raise vol.Invalid("Unknown configuration field")
        config["state_tree"] = vol.All([_NODE], vol.Length(min=1))(config["state_tree"])
        nodes = {node["id"]: node for node in config["state_tree"]}
        if len(nodes) != len(config["state_tree"]):
            raise vol.Invalid("Duplicate state IDs")
        for id, node in nodes.items():
            if node["parent"] is not None and node["parent"] not in nodes:
                raise vol.Invalid(f"Missing parent for {id}")
            seen, cursor = set(), id
            while cursor:
                if cursor in seen:
                    raise vol.Invalid("State tree contains a cycle")
                seen.add(cursor)
                cursor = nodes[cursor]["parent"]
                if cursor and cursor not in nodes:
                    raise vol.Invalid("Missing parent")
            child = node["default_child"]
            if child and (child not in nodes or nodes[child]["parent"] != id):
                raise vol.Invalid("Default child must be a direct child")
        if config["initial_state"] not in nodes:
            raise vol.Invalid("Initial state does not exist")
        config["overlays"] = vol.Schema([_OVERLAY])(config["overlays"])
        overlay_ids = [item["id"] for item in config["overlays"]]
        if len(set(overlay_ids)) != len(overlay_ids) or RESERVED_OVERLAYS & set(overlay_ids):
            raise vol.Invalid("Duplicate or reserved overlay ID")
        for overlay in config["overlays"]:
            _overlay_rule(overlay, nodes)
        config["roles"] = vol.Schema(
            {vol.Optional(role, default=None): vol.Any(None, _ID) for role in ROLE_KEYS}
        )(config["roles"])
        tree = StateTree(config)
        for role, target in config["roles"].items():
            if target:
                if target not in nodes:
                    raise vol.Invalid(f"Missing {role} role target")
                if tree.occupied(tree.descend(target)) != (role in {"arrival", "night"}):
                    raise vol.Invalid(f"Incorrect occupancy for {role} role")
        for node in config["state_tree"] + config["overlays"]:
            scene = node["scene"]
            if scene:
                cv.entity_id(scene)
                if not scene.startswith("scene.") or (
                    check_scenes and hass.states.get(scene) is None
                ):
                    raise vol.Invalid(f"Scene does not exist: {scene}")
        for key, domain in (
            ("door_entities", "lock"),
            ("gate_entities", "cover"),
            ("person_entities", "person"),
            ("visit_lock_entities", "lock"),
        ):
            config[key] = cv.entity_ids(config[key])
            if any(not entity.startswith(domain + ".") for entity in config[key]):
                raise vol.Invalid(f"{key} requires {domain} entities")
        for key in ("auto_return", "auto_away", "visit_reapply_scene"):
            config[key] = cv.boolean(config[key])
        config["auto_away_grace"] = vol.All(vol.Coerce(int), vol.Range(min=0))(
            config["auto_away_grace"]
        )
        for key, low, high in (
            ("visit_duration", MIN_DURATION, MAX_DURATION),
            ("visit_max_duration", MIN_DURATION, MAX_DURATION),
            ("visit_exit_grace", 0, 3600),
            ("arrival_delay", 0, 60),
        ):
            config[key] = vol.All(vol.Coerce(int), vol.Range(min=low, max=high))(config[key])
        if config["visit_duration"] > config["visit_max_duration"]:
            raise vol.Invalid("Default visit duration exceeds the maximum")
        schedule = config["night_schedule"]
        kind = schedule.get("type", "off")
        allowed = {"off": {"type"}, "fixed": {"type", "time"}, "sun": {"type", "event", "offset"}}
        if kind not in allowed or set(schedule) - allowed[kind]:
            raise vol.Invalid("Invalid night schedule fields")
        if kind == "off":
            config["night_schedule"] = {"type": "off"}
        elif kind == "fixed":
            if not isinstance(schedule["time"], str) or not re.fullmatch(
                r"\d{2}:\d{2}:\d{2}", schedule["time"]
            ):
                raise vol.Invalid("Fixed time must be HH:MM:SS")
            config["night_schedule"] = {"type": kind, "time": cv.time(schedule["time"]).isoformat()}
        else:
            config["night_schedule"] = {
                "type": kind,
                "event": vol.In(["sunset", "sunrise"])(schedule["event"]),
                "offset": vol.All(vol.Coerce(int), vol.Range(min=-86400, max=86400))(
                    schedule.get("offset", 0)
                ),
            }
        config["legacy_mirror"] = vol.Schema(
            {vol.Optional(key): cv.entity_id for key in ("state", "overlay")}
        )(config["legacy_mirror"])
        if any(
            not entity.startswith("input_select.") for entity in config["legacy_mirror"].values()
        ):
            raise vol.Invalid("Legacy mirrors must be input_select entities")
    except (vol.Invalid, KeyError, TypeError, ValueError, AttributeError) as err:
        raise ServiceValidationError(str(err)) from err
    return config


def scene_warnings(hass, config):
    warnings = []
    for node in config["state_tree"] + config["overlays"]:
        scene = node["scene"]
        state = hass.states.get(scene) if scene else None
        if scene and state is None:
            warnings.append(f"{scene}: missing scene")
        if state:
            members = state.attributes.get("entity_id", [])
            if isinstance(members, str):
                members = [members]
            for member in members:
                if hass.states.get(member) is None:
                    warnings.append(f"{scene}: {member}")
    return sorted(set(warnings))
