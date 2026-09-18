"""Public options and an editable starter tree."""

DOMAIN = "house_state"
PLATFORMS = ["sensor", "select", "binary_sensor"]
ROLE_KEYS = ["arrival", "departure", "vacation", "night"]
REASONS = ["user", "door", "gate", "presence", "schedule", "service"]
# Overlay axis sentinels: auto follows the configured rules, none suppresses them.
RESERVED_OVERLAYS = {"none", "auto"}
# Visit durations in seconds: at least a minute, at most a week.
MIN_DURATION, MAX_DURATION = 60, 604800


def _node(id, name, parent=None, default_child=None, occupied=None):
    return {
        "id": id,
        "name": name,
        "parent": parent,
        "scene": "",
        "default_child": default_child,
        "occupied": occupied,
    }


DEFAULTS = {
    "state_tree": [
        _node("home", "Home", default_child="day", occupied=True),
        _node("day", "Day", "home", "idle"),
        _node("idle", "None", "day"),
        _node("tv", "TV", "day"),
        _node("eating", "Eating", "day"),
        _node("night", "Night", "home"),
        _node("away", "Away", occupied=False),
        _node("vacation", "Vacation", occupied=False),
    ],
    "initial_state": "home",
    "overlays": [
        {"id": id, "name": name, "scene": ""}
        for id, name in [("christmas", "Christmas"), ("halloween", "Halloween"), ("party", "Party")]
    ],
    "roles": {"arrival": "home", "departure": "away", "vacation": "vacation", "night": "night"},
    "door_entities": [],
    "gate_entities": [],
    "person_entities": [],
    "auto_return": True,
    "auto_away": False,
    "auto_away_grace": 300,
    "night_schedule": {"type": "off"},
    "legacy_mirror": {},
    "visit_duration": 7200,
    "visit_max_duration": 43200,
    "visit_exit_grace": 120,
    "visit_reapply_scene": True,
    "visit_lock_entities": [],
}
