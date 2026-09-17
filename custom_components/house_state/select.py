"""Root, branch and overlay selects with stable IDs."""

from homeassistant.components.select import SelectEntity

from .entity import HouseEntity
from .model import Rejected


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = entry.runtime_data
    entities = [HouseSelect(coordinator), OverlaySelect(coordinator)]
    entities.extend(
        HouseSelect(coordinator, id)
        for id in coordinator.tree.nodes
        if coordinator.tree.children(id)
    )
    async_add_entities(entities)


class HouseSelect(HouseEntity, SelectEntity):
    def __init__(self, coordinator, parent=None):
        super().__init__(coordinator, f"branch_{parent}" if parent else "state_select")
        self.parent = parent
        self._attr_translation_key = None
        self._attr_name = coordinator.tree.nodes[parent]["name"] if parent else "State"
        self._attr_options = coordinator.tree.children(parent)

    @property
    def current_option(self):
        path = self.coordinator.tree.path(self.coordinator.state)
        if self.parent is None:
            return path[0]
        if self.parent not in path:
            return None
        index = path.index(self.parent) + 1
        return path[index] if index < len(path) else None

    @property
    def available(self):
        return self.parent is None or self.parent in self.coordinator.tree.path(
            self.coordinator.state
        )

    async def async_select_option(self, option):
        def validate_parent():
            if not self.available or option not in self.options:
                raise Rejected(
                    "state", option, "Branch is inactive or selection is not a direct child"
                )
            return True

        await self.coordinator.transition({"state": option}, reason="user", guard=validate_parent)


class OverlaySelect(HouseEntity, SelectEntity):
    def __init__(self, coordinator):
        super().__init__(coordinator, "overlay")
        self._attr_options = ["none", *coordinator.tree.overlays]

    @property
    def current_option(self):
        return self.coordinator.overlay

    async def async_select_option(self, option):
        await self.coordinator.transition({"overlay": option}, reason="user")
