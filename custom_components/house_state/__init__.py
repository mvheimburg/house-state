"""House State integration."""

import voluptuous as vol
from homeassistant.core import SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.service import async_register_platform_entity_service

from .const import DOMAIN, PLATFORMS, REASONS
from .coordinator import HouseCoordinator

# Caller-chosen, so a retried request is recognized; a UUID fits.
_VISIT_ID = vol.All(str, vol.Match(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$"))


async def async_setup(hass, config):
    services = {
        "set": {
            vol.Optional("state"): str,
            vol.Optional("overlay"): str,
            vol.Optional("reason", default="service"): vol.In(REASONS),
            vol.Optional("force", default=False): cv.boolean,
        },
        "arrive": {vol.Optional("reason", default="service"): vol.In(REASONS)},
        "depart": {
            vol.Optional("vacation", default=False): cv.boolean,
            vol.Optional("reason", default="service"): vol.In(REASONS),
        },
        "apply_scene": {vol.Optional("force", default=True): cv.boolean},
        "set_config": {
            vol.Optional("door_entities"): cv.entity_ids,
            vol.Optional("gate_entities"): cv.entity_ids,
            vol.Optional("person_entities"): cv.entity_ids,
            vol.Optional("state_tree"): list,
            vol.Optional("overlays"): list,
            vol.Optional("initial_state"): str,
            vol.Optional("roles"): dict,
            vol.Optional("auto_return"): cv.boolean,
            vol.Optional("auto_away"): cv.boolean,
            vol.Optional("auto_away_grace"): vol.All(vol.Coerce(int), vol.Range(min=0)),
            vol.Optional("night_schedule"): dict,
            vol.Optional("legacy_mirror"): dict,
            vol.Optional("visit_duration"): vol.Coerce(int),
            vol.Optional("visit_max_duration"): vol.Coerce(int),
            vol.Optional("visit_exit_grace"): vol.Coerce(int),
            vol.Optional("visit_reapply_scene"): cv.boolean,
            vol.Optional("visit_lock_entities"): cv.entity_ids,
        },
        "visit_start": {
            vol.Optional("visit_id"): _VISIT_ID,
            vol.Optional("duration"): cv.positive_time_period,
            vol.Optional("source", default="service"): vol.All(str, vol.Length(min=1, max=64)),
            vol.Optional("actor"): vol.All(str, vol.Length(min=1, max=100)),
        },
        "visit_end": {vol.Optional("visit_id"): _VISIT_ID},
    }
    for name, schema in services.items():
        async_register_platform_entity_service(
            hass,
            DOMAIN,
            name,
            entity_domain="sensor",
            schema=schema,
            func=f"async_{name}",
            supports_response=(
                SupportsResponse.OPTIONAL if name.startswith("visit_") else SupportsResponse.NONE
            ),
        )
    return True


async def async_setup_entry(hass, entry):
    coordinator = HouseCoordinator(hass, entry)
    await coordinator.load()
    entry.runtime_data = coordinator
    from homeassistant.helpers import entity_registry as er

    registry = er.async_get(hass)
    valid_branches = {
        f"{entry.entry_id}_branch_{id}"
        for id in coordinator.tree.nodes
        if coordinator.tree.children(id)
    }
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        if (
            entity.unique_id.startswith(f"{entry.entry_id}_branch_")
            and entity.unique_id not in valid_branches
        ):
            registry.async_remove(entity.entity_id)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await coordinator.start()
    entry.async_on_unload(entry.add_update_listener(update_options))
    return True


async def update_options(hass, entry):
    hass.data[(DOMAIN, entry.entry_id, "options_reload")] = True
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass, entry):
    if await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        entry.runtime_data.stop()
        return True
    return False
