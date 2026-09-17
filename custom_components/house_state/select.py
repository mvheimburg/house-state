"""Native selects for voice, Bubble and automations."""

from homeassistant.components.select import SelectEntity

from .const import AXES
from .entity import HouseEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([HouseSelect(entry.runtime_data, axis) for axis in AXES])


class HouseSelect(HouseEntity, SelectEntity):
    def __init__(self, coordinator, axis):
        super().__init__(coordinator, axis)
        self.axis = axis
        self._attr_options = AXES[axis]

    @property
    def current_option(self):
        return getattr(self.coordinator.state, self.axis)

    @property
    def available(self):
        if self.axis in ("mode", "activity") and self.coordinator.state.presence != "home":
            return False
        return self.axis != "activity" or self.coordinator.state.mode == "day"

    async def async_select_option(self, option):
        await self.coordinator.transition({self.axis: option}, reason="user")
