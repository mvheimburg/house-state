"""Hub entity and public service endpoints."""

from homeassistant.components.sensor import SensorEntity

from .entity import HouseEntity


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([HouseSensor(entry.runtime_data)])


class HouseSensor(HouseEntity, SensorEntity):
    _attr_icon = "mdi:home-switch"

    def __init__(self, coordinator):
        super().__init__(coordinator, "state")

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.coordinator.entity_id = self.entity_id

    @property
    def native_value(self):
        return self.coordinator.state.presence

    @property
    def extra_state_attributes(self):
        return self.coordinator.attributes

    async def async_set(self, reason="service", force=False, **changes):
        await self.coordinator.transition(changes, reason, force)

    async def async_arrive(self, reason="service"):
        if self.coordinator.state.presence != "home":
            await self.coordinator.transition({"presence": "home"}, reason)

    async def async_depart(self, vacation=False):
        await self.coordinator.transition({"presence": "vacation" if vacation else "away"})

    async def async_apply_scene(self, force=True):
        await self.coordinator.transition({}, force=force)

    async def async_set_config(self, **changes):
        from .config import validate_config

        coordinator = self.coordinator
        options = validate_config(self.hass, coordinator.config | changes)
        self.hass.config_entries.async_update_entry(coordinator.entry, options=options)
