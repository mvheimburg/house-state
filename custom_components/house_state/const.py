"""House State's public contract."""

DOMAIN = "house_state"
PLATFORMS = ["sensor", "select", "binary_sensor"]
AXES = {
    "presence": ["home", "away", "vacation"],
    "mode": ["day", "night"],
    "activity": ["none", "tv", "eating"],
    "overlay": ["none", "christmas", "halloween", "party"],
}
SCENE_KEYS = [
    "home",
    "away",
    "vacation",
    "day",
    "night",
    "tv",
    "eating",
    "christmas",
    "halloween",
    "party",
]
DEFAULTS = {
    "door_entities": [],
    "gate_entities": [],
    "person_entities": [],
    "scene_map": {},
    "auto_return": True,
    "auto_away": False,
    "auto_away_grace": 300,
    "night_schedule": {"type": "off"},
    "legacy_mirror": {},
}
REASONS = ["user", "door", "gate", "presence", "schedule", "service"]
