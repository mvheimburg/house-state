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
        return self.coordinator.state

    @property
    def extra_state_attributes(self):
        return self.coordinator.attributes

    async def async_set(self, reason="service", force=False, **changes):
        await self.coordinator.transition(changes, reason, force)

    async def async_arrive(self, reason="service"):
        target = self.coordinator.tree.role("arrival")
        await self.coordinator.transition(
            {"state": target},
            reason,
            guard=lambda: not self.coordinator.tree.occupied(self.coordinator.state),
        )

    async def async_depart(self, vacation=False, reason="service"):
        target = self.coordinator.tree.role("vacation" if vacation else "departure")
        await self.coordinator.transition({"state": target}, reason)

    async def async_apply_scene(self, force=True):
        await self.coordinator.transition({}, force=force)

    async def async_set_config(self, **changes):
        await self.coordinator.set_config(changes)

    async def async_visit_start(self, visit_id=None, duration=None, source="service", actor=None):
        # The HA user is supporting evidence; the caller's own authentication
        # decides who the actor is and that this is a guest admission.
        user_id = self._context.user_id if self._context else None
        return await self.coordinator.visits.start(visit_id, duration, source, actor, user_id)

    async def async_visit_end(self, visit_id=None):
        return await self.coordinator.visits.end(visit_id)
