"""Structured settings run through Home Assistant's real flow manager."""

from copy import deepcopy

import pytest
from homeassistant import data_entry_flow

from .conftest import setup


async def choose(hass, flow, step):
    return await submit(hass, flow, {"next_step_id": step})


async def submit(hass, flow, data):
    return await hass.config_entries.options.async_configure(flow["flow_id"], data)


async def test_menu_draft_cancel_and_explicit_save(hass, entry, scenes):
    await setup(hass, entry)
    before = deepcopy(dict(entry.options))
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    assert flow["type"] == data_entry_flow.FlowResultType.MENU
    assert {
        "states",
        "overlays",
        "general",
        "presence",
        "night",
        "legacy",
        "save",
        "discard",
    } <= set(flow["menu_options"])
    flow = await choose(hass, flow, "general")
    flow = await submit(
        hass,
        flow,
        {
            "initial_state": "cinema",
            "arrival": "house",
            "departure": "out",
            "vacation": "trip",
            "night": "sleep",
        },
    )
    assert flow["step_id"] == "init"
    assert entry.options == before
    flow = await choose(hass, flow, "discard")
    assert flow["type"] == data_entry_flow.FlowResultType.ABORT
    assert entry.options == before
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "presence")
    flow = await submit(
        hass,
        flow,
        {
            "door_entities": ["lock.front"],
            "gate_entities": [],
            "person_entities": [],
            "auto_return": True,
            "auto_away": True,
            "auto_away_grace": 120,
        },
    )
    assert entry.options == before
    flow = await choose(hass, flow, "save")
    assert flow["step_id"] == "save"
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    assert entry.options["door_entities"] == ["lock.front"]
    await hass.async_block_till_done()


async def test_states_add_edit_delete_and_reference_cleanup(hass, entry, scenes):
    await setup(hass, entry)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_add")
    flow = await submit(
        hass,
        flow,
        {
            "id": "reading",
            "name": "Reading",
            "parent": "awake",
            "scene": "scene.day",
            "occupied": "inherit",
            "default_child": "",
        },
    )
    assert flow["step_id"] == "states"
    flow = await choose(hass, flow, "state_edit")
    flow = await submit(hass, flow, {"state": "awake"})
    flow = await submit(
        hass,
        flow,
        {
            "name": "Awake",
            "parent": "house",
            "scene": "scene.day",
            "occupied": "inherit",
            "default_child": "reading",
        },
    )
    assert flow["step_id"] == "states"
    flow = await choose(hass, flow, "state_remove")
    flow = await submit(hass, flow, {"state": "cinema"})
    assert flow["step_id"] == "state_delete"
    flow = await submit(hass, flow, {"confirm": True})
    flow = await choose(hass, flow, "init")
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    nodes = {node["id"]: node for node in entry.options["state_tree"]}
    assert nodes["awake"]["default_child"] == "reading"
    assert nodes["film"]["parent"] == "awake"
    assert "cinema" not in nodes
    await hass.async_block_till_done()


async def test_rejected_save_and_scene_warnings_are_atomic(hass, entry, scenes):
    await setup(hass, entry)
    before = deepcopy(dict(entry.options))
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "general")
    flow = await submit(
        hass,
        flow,
        {
            "initial_state": "house",
            "arrival": "out",
            "departure": "out",
            "vacation": "trip",
            "night": "sleep",
        },
    )
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["errors"] == {"base": "invalid_config"}
    assert entry.options == before
    flow = await submit(hass, flow, {"back": True})
    flow = await choose(hass, flow, "general")
    flow = await submit(
        hass,
        flow,
        {
            "initial_state": "house",
            "arrival": "house",
            "departure": "out",
            "vacation": "trip",
            "night": "sleep",
        },
    )
    hass.states.async_set("scene.night", "unknown", {"entity_id": ["lock.missing"]})
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["step_id"] == "warnings"
    assert "lock.missing" in flow["description_placeholders"]["warnings"]
    assert entry.options == before
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()


async def add_overlay(hass, flow, kind, details):
    flow = await choose(hass, flow, "overlays")
    flow = await choose(hass, flow, "overlay_add")
    flow = await submit(
        hass,
        flow,
        {
            "id": "test_rule",
            "name": "My rule",
            "scene": "scene.party",
            "priority": 7,
            "when_occupied": "occupied",
            "when_state": ["house"],
            "rule": kind,
        },
    )
    if kind != "manual":
        flow = await submit(hass, flow, details)
    assert flow["step_id"] == "overlays"
    return await choose(hass, flow, "init")


@pytest.mark.parametrize(
    ("kind", "details", "expected"),
    [
        ("manual", {}, {}),
        (
            "calendar",
            {"calendar": "calendar.family", "match": "Party"},
            {"calendar": "calendar.family", "match": "Party"},
        ),
        (
            "fixed",
            {"from": "12-01", "to": "01-06"},
            {"dates": {"type": "fixed", "from": "12-01", "to": "01-06"}},
        ),
        ("easter", {"from": -3, "to": 1}, {"dates": {"type": "easter", "from": -3, "to": 1}}),
        (
            "nth_weekday",
            {
                "weekday": "sun",
                "nth": -4,
                "anchor_kind": "anchor",
                "anchor": "12-24",
                "month": 12,
                "days": 28,
            },
            {
                "dates": {
                    "type": "nth_weekday",
                    "weekday": "sun",
                    "nth": -4,
                    "anchor": "12-24",
                    "days": 28,
                }
            },
        ),
    ],
)
async def test_overlay_rules_round_trip(hass, entry, scenes, kind, details, expected):
    await setup(hass, entry)
    before = deepcopy(dict(entry.options))
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await add_overlay(hass, flow, kind, details)
    assert entry.options == before
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    overlay = entry.options["overlays"][-1]
    assert overlay == {
        "id": "test_rule",
        "name": "My rule",
        "scene": "scene.party",
        "priority": 7,
        "when_occupied": True,
        "when_state": ["house"],
        **expected,
    }
    await hass.async_block_till_done()


@pytest.mark.parametrize(
    ("kind", "details", "expected"),
    [
        ("off", None, {"type": "off"}),
        ("fixed", {"time": "22:30"}, {"type": "fixed", "time": "22:30:00"}),
        (
            "sun",
            {"event": "sunrise", "offset": -1200},
            {"type": "sun", "event": "sunrise", "offset": -1200},
        ),
    ],
)
async def test_night_settings_and_no_scene_application(
    hass, entry, scenes, kind, details, expected
):
    await setup(hass, entry)
    before = len(scenes)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "night")
    flow = await submit(hass, flow, {"type": kind})
    if details:
        flow = await submit(hass, flow, details)
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    assert entry.options["night_schedule"] == expected
    await hass.async_block_till_done()
    assert len(scenes) == before


async def test_blank_entity_fields_and_back_from_empty_forms(hass, entry, scenes):
    await setup(hass, entry)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    for menu, action in [("states", "state_add"), ("overlays", "overlay_add")]:
        flow = await choose(hass, flow, menu)
        flow = await choose(hass, flow, action)
        # Exercise HA's real schema, including defaults, without any scene selected.
        assert flow["data_schema"]({"back": True})["back"]
        flow = await submit(hass, flow, {"back": True})
        assert flow["step_id"] == menu
        flow = await choose(hass, flow, "init")
    flow = await choose(hass, flow, "legacy")
    flow = await submit(
        hass, flow, {"state": "input_select.old_state", "overlay": "input_select.old_overlay"}
    )
    flow = await choose(hass, flow, "legacy")
    flow = await submit(hass, flow, {})
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_edit")
    flow = await submit(hass, flow, {"state": "cinema"})
    flow = await submit(
        hass,
        flow,
        {"name": "Cinema", "parent": "awake", "default_child": "film", "occupied": "inherit"},
    )
    flow = await choose(hass, flow, "init")
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    assert entry.options["legacy_mirror"] == {}
    assert next(n for n in entry.options["state_tree"] if n["id"] == "cinema")["scene"] == ""
    await hass.async_block_till_done()


async def test_parent_choices_exclude_self_and_descendants(hass, entry, scenes):
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_edit")
    flow = await submit(hass, flow, {"state": "awake"})
    parent = next(
        value for key, value in flow["data_schema"].schema.items() if key.schema == "parent"
    )
    ids = {option["value"] for option in parent.config["options"]}
    assert {"awake", "cinema", "film", "quiet"}.isdisjoint(ids)
    assert {"", "house", "out", "sleep"} <= ids


async def test_deletion_cannot_broaden_overlay_or_remove_last_state(hass, entry, scenes):
    options = deepcopy(dict(entry.options))
    options["overlays"][0]["when_state"] = ["cinema"]
    hass.config_entries.async_update_entry(entry, options=options)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_remove")
    flow = await submit(hass, flow, {"state": "cinema"})
    flow = await submit(hass, flow, {"confirm": True})
    assert flow["errors"] == {"base": "state_gates_overlay"}
    assert entry.options == options
    hass.config_entries.options.async_abort(flow["flow_id"])
    options = {
        "state_tree": [{"id": "only", "name": "Only", "occupied": True}],
        "initial_state": "only",
        "roles": {},
        "overlays": [],
    }
    hass.config_entries.async_update_entry(entry, options=options)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_remove")
    flow = await submit(hass, flow, {"state": "only"})
    flow = await submit(hass, flow, {"confirm": True})
    assert flow["errors"] == {"base": "last_state"}
    assert entry.options == options


async def test_unknown_schedule_fields_are_not_silently_discarded(hass, entry, scenes):
    options = deepcopy(dict(entry.options)) | {
        "night_schedule": {"type": "fixed", "time": "22:00:00", "future_setting": "keep me"}
    }
    hass.config_entries.async_update_entry(entry, options=options)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "night")
    flow = await submit(hass, flow, {"type": "off"})
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["errors"] == {"base": "invalid_config"}
    assert "night schedule" in flow["description_placeholders"]["error"]
    assert entry.options == options


async def test_invalid_calendar_rule_can_be_corrected_or_abandoned(hass, entry, scenes):
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "overlays")
    flow = await choose(hass, flow, "overlay_add")
    flow = await submit(hass, flow, {"id": "calendar_test", "name": "Calendar", "rule": "calendar"})
    # Empty calendar selector must not trap the Back action.
    assert flow["data_schema"]({"back": True})["back"]
    flow = await submit(hass, flow, {"calendar": "calendar.family", "match": "["})
    assert flow["errors"] == {"base": "invalid_rule"}
    flow = await submit(hass, flow, {"back": True})
    assert flow["step_id"] == "overlays"
    flow = await choose(hass, flow, "overlay_edit")
    options = next(
        value.config["options"]
        for key, value in flow["data_schema"].schema.items()
        if key.schema == "overlay"
    )
    assert "calendar_test" not in {o["value"] for o in options}


async def test_remove_initial_parent_cleans_roles_and_defaults(hass, entry, scenes):
    await setup(hass, entry)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await choose(hass, flow, "states")
    flow = await choose(hass, flow, "state_remove")
    flow = await submit(hass, flow, {"state": "house"})
    flow = await submit(hass, flow, {"confirm": True, "replacement": "out"})
    flow = await choose(hass, flow, "init")
    # Removing the occupied parent makes the inherited night role invalid.
    # Keep the draft editable and resolve that role before saving.
    flow = await choose(hass, flow, "general")
    flow = await submit(
        hass,
        flow,
        {
            "initial_state": "out",
            "arrival": "",
            "departure": "out",
            "vacation": "trip",
            "night": "",
        },
    )
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    assert entry.options["initial_state"] == "out"
    assert entry.options["roles"]["arrival"] is None
    nodes = {node["id"]: node for node in entry.options["state_tree"]}
    assert nodes["awake"]["parent"] is None
    assert nodes["sleep"]["parent"] is None
    assert nodes["awake"]["default_child"] == "quiet"
    await hass.async_block_till_done()


async def test_overlay_edit_rule_replacement_and_confirmed_delete(hass, entry, scenes):
    await setup(hass, entry)
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    flow = await add_overlay(
        hass,
        flow,
        "nth_weekday",
        {
            "weekday": "thu",
            "nth": 4,
            "anchor_kind": "month",
            "month": 11,
            "anchor": "12-25",
            "days": 1,
        },
    )
    flow = await choose(hass, flow, "overlays")
    flow = await choose(hass, flow, "overlay_edit")
    flow = await submit(hass, flow, {"overlay": "test_rule"})
    # Stable ID, custom name and raw scene remain independent of rule choice.
    flow = await submit(
        hass,
        flow,
        {
            "name": "My renamed rule",
            "scene": "scene.party",
            "priority": 9,
            "when_occupied": "any",
            "when_state": [],
            "rule": "manual",
        },
    )
    flow = await choose(hass, flow, "overlay_remove")
    flow = await submit(hass, flow, {"overlay": "festive"})
    flow = await submit(hass, flow, {"confirm": False})
    flow = await choose(hass, flow, "overlay_remove")
    flow = await submit(hass, flow, {"overlay": "guests"})
    flow = await submit(hass, flow, {"confirm": True})
    flow = await choose(hass, flow, "init")
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    overlays = {item["id"]: item for item in entry.options["overlays"]}
    assert "festive" in overlays
    assert "guests" not in overlays
    assert overlays["test_rule"] == {
        "id": "test_rule",
        "name": "My renamed rule",
        "scene": "scene.party",
        "priority": 9,
        "when_occupied": None,
        "when_state": [],
    }
    await hass.async_block_till_done()


async def test_translations_cover_all_structured_steps_selectors_and_fields():
    import json
    from pathlib import Path

    base = Path(__file__).parents[1] / "custom_components" / "house_state"
    en = json.loads((base / "strings.json").read_text())
    assert en == json.loads((base / "translations" / "en.json").read_text())
    nb = json.loads((base / "translations" / "nb.json").read_text())
    assert en["options"]["step"].keys() == nb["options"]["step"].keys()
    for step, definition in en["options"]["step"].items():
        translated = nb["options"]["step"][step]
        assert definition.keys() == translated.keys()
        for section in ("data", "menu_options"):
            assert definition.get(section, {}).keys() == translated.get(section, {}).keys()
    for name, definition in en["selector"].items():
        assert definition["options"].keys() == nb["selector"][name]["options"].keys()
