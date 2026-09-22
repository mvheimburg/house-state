"""Admin websocket API for the configuration panel: read, validate, save a draft.

The panel edits a draft; nothing is stored until save. Save uses the same
validation as the options flow and stores options the same way, so the entry
reloads without applying scenes.
"""

import hashlib
import json
from copy import deepcopy

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError

from .config import scene_warnings, validate_config
from .const import DEFAULTS, DOMAIN, MAX_DURATION, MIN_DURATION, RESERVED_OVERLAYS, ROLE_KEYS


def _revision(options) -> str:
    """A fingerprint of the stored options, so a save can detect a newer edit."""
    return hashlib.sha256(json.dumps(options, sort_keys=True, default=str).encode()).hexdigest()


def _entries(hass):
    return hass.config_entries.async_entries(DOMAIN)


def _entry(hass, connection, msg):
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No such House State entry")
        return None
    return entry


def _validate(hass, config):
    """Return (normalized config, warnings) or raise ServiceValidationError."""
    normalized = validate_config(hass, config)
    return normalized, scene_warnings(hass, normalized)


@callback
def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_validate)
    websocket_api.async_register_command(hass, ws_save)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "house_state/config/get", vol.Optional("entry_id"): str}
)
@callback
def ws_get(hass, connection, msg):
    entries = _entries(hass)
    result = {
        "entries": [{"entry_id": e.entry_id, "title": e.title} for e in entries],
        "limits": {"min_duration": MIN_DURATION, "max_duration": MAX_DURATION},
        "roles": list(ROLE_KEYS),
        "reserved_overlays": sorted(RESERVED_OVERLAYS),
    }
    if not entries:
        connection.send_result(msg["id"], result)
        return
    if "entry_id" in msg:
        entry = _entry(hass, connection, msg)
        if entry is None:
            return
    else:
        entry = entries[0]
    result["entry_id"] = entry.entry_id
    result["config"] = deepcopy(DEFAULTS) | deepcopy(dict(entry.options))
    result["revision"] = _revision(dict(entry.options))
    connection.send_result(msg["id"], result)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "house_state/config/validate",
        vol.Required("entry_id"): str,
        vol.Required("config"): dict,
    }
)
@callback
def ws_validate(hass, connection, msg):
    if _entry(hass, connection, msg) is None:
        return
    try:
        config, warnings = _validate(hass, msg["config"])
    except ServiceValidationError as err:
        connection.send_result(msg["id"], {"valid": False, "error": str(err)})
        return
    connection.send_result(msg["id"], {"valid": True, "config": config, "warnings": warnings})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "house_state/config/save",
        vol.Required("entry_id"): str,
        vol.Required("config"): dict,
        vol.Required("revision"): str,
        vol.Optional("acknowledge_warnings", default=False): bool,
    }
)
@callback
def ws_save(hass, connection, msg):
    entry = _entry(hass, connection, msg)
    if entry is None:
        return
    if msg["revision"] != _revision(dict(entry.options)):
        connection.send_error(
            msg["id"], "conflict", "House State settings changed elsewhere; reload them first"
        )
        return
    try:
        config, warnings = _validate(hass, msg["config"])
    except ServiceValidationError as err:
        connection.send_result(msg["id"], {"saved": False, "error": str(err)})
        return
    if warnings and not msg["acknowledge_warnings"]:
        connection.send_result(msg["id"], {"saved": False, "warnings": warnings})
        return
    # The update listener reloads the entry; a reload never applies scenes.
    hass.config_entries.async_update_entry(entry, options=config)
    connection.send_result(msg["id"], {"saved": True, "revision": _revision(config)})
