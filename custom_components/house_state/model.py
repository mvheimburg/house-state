"""Generic tree traversal, selection and scene resolution."""

from homeassistant.exceptions import ServiceValidationError

from .const import RESERVED_OVERLAYS
from .rules import has_rules


class Rejected(ServiceValidationError):
    def __init__(self, field, value, because):
        self.details = {"field": field, "value": value, "because": because}
        super().__init__(f"{field}={value}: {because}")


class StateTree:
    """A validated state tree; node names never imply behavior."""

    def __init__(self, config):
        self.nodes = {node["id"]: node for node in config["state_tree"]}
        self.overlays = {overlay["id"]: overlay for overlay in config["overlays"]}
        self.initial = config["initial_state"]
        self.roles = config["roles"]
        self.has_rules = has_rules(config["overlays"])

    def descend(self, node_id):
        if node_id not in self.nodes:
            raise Rejected("state", node_id, "state does not exist")
        while self.nodes[node_id]["default_child"]:
            node_id = self.nodes[node_id]["default_child"]
        return node_id

    def path(self, node_id):
        result = []
        while node_id:
            result.append(node_id)
            node_id = self.nodes[node_id]["parent"]
        return result[::-1]

    def children(self, parent):
        return [id for id, node in self.nodes.items() if node["parent"] == parent]

    def occupied(self, node_id):
        for id in reversed(self.path(node_id)):
            if self.nodes[id]["occupied"] is not None:
                return self.nodes[id]["occupied"]
        return False

    def resolve(self, node_id, overlay):
        source = next((id for id in reversed(self.path(node_id)) if self.nodes[id]["scene"]), None)
        base = self.nodes[source]["scene"] if source else None
        overlay_scene = self.overlays[overlay]["scene"] or None if overlay != "none" else None
        return base, source, overlay_scene

    def select(self, state, choice, changes):
        """Resolve a requested state and overlay choice; the choice may be a sentinel."""
        if "state" in changes:
            state = self.descend(changes["state"])
        if "overlay" in changes:
            choice = changes["overlay"]
            if choice not in RESERVED_OVERLAYS and choice not in self.overlays:
                raise Rejected("overlay", choice, "overlay does not exist")
            if choice == "auto" and not self.has_rules:
                raise Rejected("overlay", choice, "no overlay defines a rule")
        return state, choice

    def effective(self, choice, evaluated):
        """The overlay in force: a manual choice, otherwise what the rules picked."""
        return evaluated if choice == "auto" else choice

    def role(self, role):
        if not (target := self.roles.get(role)):
            raise Rejected("role", role, "role is disabled")
        return target
