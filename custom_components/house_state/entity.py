"""Shared entities for a house."""

from homeassistant.helpers.entity import DeviceInfo, Entity

from .const import DOMAIN


class HouseEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, coordinator, key):
        self.coordinator = coordinator
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{key}"
        self._attr_translation_key = key
        self._attr_name = key.replace("_", " ").capitalize()
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.entry.title,
            manufacturer="House State",
            model="House",
        )

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.coordinator.listeners.add(self.async_write_ha_state)
        self.async_on_remove(lambda: self.coordinator.listeners.discard(self.async_write_ha_state))
