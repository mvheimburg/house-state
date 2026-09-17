"""Pure hierarchy validation and scene resolution."""

from dataclasses import asdict, dataclass, replace

from homeassistant.exceptions import ServiceValidationError

from .const import AXES


class Rejected(ServiceValidationError):
    """An invalid child transition."""

    def __init__(self, field, value, because):
        self.details = {"field": field, "value": value, "because": because}
        super().__init__(f"{field}={value}: {because}")


@dataclass
class HouseState:
    presence: str = "home"
    mode: str = "day"
    activity: str = "none"
    overlay: str = "none"

    def transition(self, changes):
        candidate = replace(self)
        for field, value in changes.items():
            if field not in AXES or value not in AXES[field]:
                raise Rejected(field, value, "invalid value")
            setattr(candidate, field, value)
        if candidate.presence != "home":
            for field in ("mode", "activity"):
                if field in changes:
                    raise Rejected(field, changes[field], "presence must be home")
            candidate.mode, candidate.activity = "day", "none"
        elif candidate.mode != "day":
            if "activity" in changes:
                raise Rejected("activity", changes["activity"], "mode must be day")
            candidate.activity = "none"
        return candidate

    def resolve(self, scene_map):
        keys = [self.presence]
        if self.presence == "home":
            keys.insert(0, self.mode)
            if self.mode == "day" and self.activity != "none":
                keys.insert(0, self.activity)
        source = next((key for key in keys if scene_map.get(key)), None)
        return scene_map.get(source), source, scene_map.get(self.overlay) or None

    def as_dict(self):
        return asdict(self)
