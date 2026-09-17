"""House occupancy."""

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity

from .entity import HouseEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([HouseOccupied(entry.runtime_data)])


class HouseOccupied(HouseEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coordinator):
        super().__init__(coordinator, "occupied")

    @property
    def is_on(self):
        return self.coordinator.state.presence == "home"
