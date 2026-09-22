"""The configuration panel's registration and its admin websocket API."""

from copy import deepcopy

from homeassistant.components.frontend import DATA_PANELS

from .conftest import OPTIONS, setup


async def ws(client, **message):
    await client.send_json_auto_id(message)
    return await client.receive_json()


async def test_panel_is_registered_for_admins_and_removed_with_the_entry(hass, entry, scenes):
    await setup(hass, entry)
    panel = hass.data[DATA_PANELS]["house-state"]
    assert panel.require_admin is True
    assert panel.sidebar_icon == "mdi:home-switch"
    custom = panel.config["_panel_custom"]
    assert custom["name"] == "house-state-panel"
    assert custom["module_url"].startswith("/house_state_static/house-state-panel.js?v=")

    # An options reload keeps the panel.
    hass.config_entries.async_update_entry(entry, options={**entry.options, "arrival_delay": 5})
    await hass.async_block_till_done()
    assert "house-state" in hass.data[DATA_PANELS]

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert "house-state" not in hass.data[DATA_PANELS]


async def test_get_returns_the_full_draft_and_its_revision(hass, entry, scenes, hass_ws_client):
    await setup(hass, entry)
    client = await hass_ws_client(hass)
    reply = await ws(client, type="house_state/config/get")
    assert reply["success"]
    result = reply["result"]
    assert result["entries"] == [{"entry_id": entry.entry_id, "title": "House"}]
    assert result["entry_id"] == entry.entry_id
    assert result["config"]["state_tree"] == OPTIONS["state_tree"]
    # Keys the entry has not stored yet come with their defaults.
    assert result["config"]["water_valves"] == []
    assert result["roles"] == ["arrival", "departure", "vacation", "night"]
    assert result["reserved_overlays"] == ["auto", "none"]
    assert result["limits"] == {"min_duration": 60, "max_duration": 604800}
    assert result["revision"]

    missing = await ws(client, type="house_state/config/get", entry_id="nope")
    assert missing["error"]["code"] == "not_found"


async def test_validate_reports_errors_and_scene_warnings(hass, entry, scenes, hass_ws_client):
    await setup(hass, entry)
    client = await hass_ws_client(hass)
    config = (await ws(client, type="house_state/config/get"))["result"]["config"]

    bad = deepcopy(config)
    bad["state_tree"][0]["default_child"] = "film"  # not a direct child
    reply = await ws(
        client, type="house_state/config/validate", entry_id=entry.entry_id, config=bad
    )
    assert reply["result"] == {"valid": False, "error": "Default child must be a direct child"}

    hass.states.async_set("scene.tv", "unknown", {"entity_id": ["light.gone"]})
    reply = await ws(
        client, type="house_state/config/validate", entry_id=entry.entry_id, config=config
    )
    assert reply["result"]["valid"] is True
    assert reply["result"]["warnings"] == ["scene.tv: light.gone"]


async def test_save_stores_options_without_applying_scenes(hass, entry, scenes, hass_ws_client):
    await setup(hass, entry)
    applied = len(scenes)
    client = await hass_ws_client(hass)
    got = (await ws(client, type="house_state/config/get"))["result"]
    config = deepcopy(got["config"])
    config["state_tree"][1]["name"] = "Våken"
    config["arrival_delay"] = 10

    reply = await ws(
        client,
        type="house_state/config/save",
        entry_id=entry.entry_id,
        config=config,
        revision=got["revision"],
    )
    assert reply["result"]["saved"] is True
    await hass.async_block_till_done()
    assert entry.options["state_tree"][1]["name"] == "Våken"
    assert entry.options["arrival_delay"] == 10
    assert len(scenes) == applied
    # The new revision is what a following get reports.
    again = (await ws(client, type="house_state/config/get"))["result"]
    assert again["revision"] == reply["result"]["revision"]


async def test_save_needs_warnings_acknowledged_and_rejects_invalid(
    hass, entry, scenes, hass_ws_client
):
    await setup(hass, entry)
    client = await hass_ws_client(hass)
    got = (await ws(client, type="house_state/config/get"))["result"]
    before = deepcopy(dict(entry.options))

    bad = deepcopy(got["config"])
    bad["initial_state"] = "nowhere"
    reply = await ws(
        client,
        type="house_state/config/save",
        entry_id=entry.entry_id,
        config=bad,
        revision=got["revision"],
    )
    assert reply["result"] == {"saved": False, "error": "Initial state does not exist"}

    hass.states.async_set("scene.tv", "unknown", {"entity_id": ["light.gone"]})
    config = deepcopy(got["config"])
    config["arrival_delay"] = 7
    save = {
        "type": "house_state/config/save",
        "entry_id": entry.entry_id,
        "config": config,
        "revision": got["revision"],
    }
    reply = await ws(client, **save)
    assert reply["result"] == {"saved": False, "warnings": ["scene.tv: light.gone"]}
    assert dict(entry.options) == before
    reply = await ws(client, **save, acknowledge_warnings=True)
    assert reply["result"]["saved"] is True
    assert entry.options["arrival_delay"] == 7


async def test_save_refuses_a_stale_draft(hass, entry, scenes, hass_ws_client):
    await setup(hass, entry)
    client = await hass_ws_client(hass)
    got = (await ws(client, type="house_state/config/get"))["result"]
    # Someone saves through the options flow meanwhile.
    hass.config_entries.async_update_entry(entry, options={**entry.options, "arrival_delay": 9})
    await hass.async_block_till_done()
    reply = await ws(
        client,
        type="house_state/config/save",
        entry_id=entry.entry_id,
        config=got["config"],
        revision=got["revision"],
    )
    assert reply["error"]["code"] == "conflict"
    assert entry.options["arrival_delay"] == 9


async def test_the_api_is_for_admins_only(
    hass, entry, scenes, hass_ws_client, hass_read_only_access_token
):
    await setup(hass, entry)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    reply = await ws(client, type="house_state/config/get")
    assert reply["error"]["code"] == "unauthorized"


async def test_no_entries_yet(hass, hass_ws_client):
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "house_state", {})
    client = await hass_ws_client(hass)
    reply = await ws(client, type="house_state/config/get")
    assert reply["result"]["entries"] == []
    assert "config" not in reply["result"]
