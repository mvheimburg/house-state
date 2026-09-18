"""House occupancy."""

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity

from .entity import HouseEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([HouseOccupied(entry.runtime_data), HouseVisit(entry.runtime_data)])


class HouseOccupied(HouseEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coordinator):
        super().__init__(coordinator, "occupied")

    @property
    def is_on(self):
        return self.coordinator.tree.occupied(self.coordinator.state)


class HouseVisit(HouseEntity, BinarySensorEntity):
    """A guest visit in progress; the state tree is untouched by it."""

    _attr_icon = "mdi:account-clock"

    def __init__(self, coordinator):
        super().__init__(coordinator, "visit")

    @property
    def is_on(self):
        return self.coordinator.visits.active is not None

    @property
    def extra_state_attributes(self):
        visits = self.coordinator.visits
        record = visits.active or visits.last or {}
        keys = ("id", "started", "expires", "source", "actor", "user_id", "user_name")
        return {f"visit_{key}" if key == "id" else key: record.get(key) for key in keys} | {
            key: record.get(key) for key in ("ended", "outcome", "exit_until", "cleanup")
        }
