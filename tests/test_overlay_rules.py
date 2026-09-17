"""Date-driven overlays: quiet application, the manual hold and the auto sentinel."""

from datetime import timedelta

import pytest
from homeassistant.exceptions import ServiceValidationError
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from .conftest import call, setup

CHRISTMAS = {"type": "fixed", "from": "12-01", "to": "12-26"}


def configure(entry, festive=None, **extra):
    """Options with an activation rule attached to the festive overlay."""
    overlays = [
        {"id": "festive", "name": "Festive", "scene": "scene.christmas", **(festive or {})},
        {"id": "guests", "name": "Guests", "scene": "scene.party"},
    ]
    return dict(entry.options) | {"overlays": overlays} | extra


async def advance(hass, freezer, seconds):
    freezer.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass, dt_util.utcnow())
    await hass.async_block_till_done()


def hub(hass):
    return hass.states.get("sensor.house_state").attributes


def applied(scenes):
    return [scene.data["entity_id"] for scene in scenes]


async def test_rule_sets_the_mode_and_the_next_transition_applies_the_scene(
    hass, entry, scenes, freezer
):
    freezer.move_to("2026-11-30 22:59:50+00:00")  # 23:59:50 in Oslo
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "none"
    await call(hass, state="cinema")
    assert applied(scenes) == ["scene.tv"]
    scenes.clear()

    await advance(hass, freezer, 20)  # across local midnight into December
    assert hub(hass)["overlay"] == "festive"
    assert hub(hass)["overlay_choice"] == "auto"
    assert hub(hass)["overlay_rule"] == "festive"
    assert hub(hass)["last_changed_by"] == "schedule"
    assert hub(hass)["scene_stale"] is True
    assert applied(scenes) == []  # the tree does not light up in a sleeping house

    await call(hass, state="quiet")
    assert applied(scenes) == ["scene.day", "scene.christmas"]
    assert hub(hass)["scene_stale"] is False


async def test_apply_scene_now_lands_a_deferred_overlay(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "festive"
    assert applied(scenes) == []
    await call(hass, "apply_scene")
    assert applied(scenes) == ["scene.day", "scene.christmas"]


async def test_manual_choice_outranks_the_rules_until_local_midnight(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "festive"

    await call(hass, overlay="none", reason="user")  # not today
    assert hub(hass)["overlay"] == "none"
    assert hub(hass)["overlay_choice"] == "none"
    assert hub(hass)["overlay_rule"] == "festive"  # the rule still matches, it just lost
    assert hub(hass)["overlay_hold_until"] == "2026-12-10T23:00:00+00:00"

    await advance(hass, freezer, 3600)  # same local day: the rule does not take over
    assert hub(hass)["overlay"] == "none"

    await advance(hass, freezer, 86400)  # past local midnight
    assert hub(hass)["overlay"] == "festive"
    assert hub(hass)["overlay_choice"] == "auto"
    assert hub(hass)["overlay_hold_until"] is None


async def test_manual_choice_is_eager_and_auto_hands_the_axis_straight_back(
    hass, entry, scenes, freezer
):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    scenes.clear()

    await call(hass, overlay="guests", reason="user")
    assert hub(hass)["overlay"] == "guests"
    assert applied(scenes) == ["scene.day", "scene.party"]  # a person gets feedback
    assert hub(hass)["overlay_hold_until"] is not None
    scenes.clear()

    await call(hass, overlay="auto", reason="user")
    assert hub(hass)["overlay"] == "festive"
    assert hub(hass)["overlay_choice"] == "auto"
    assert hub(hass)["overlay_hold_until"] is None
    assert applied(scenes) == ["scene.day", "scene.christmas"]


async def test_hold_survives_a_restart(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    await call(hass, overlay="none", reason="user")
    assert await hass.config_entries.async_unload(entry.entry_id)

    await setup(hass, entry)
    assert hub(hass)["overlay"] == "none"  # a 22:00 reboot must not reinstate Christmas
    assert hub(hass)["overlay_hold_until"] == "2026-12-10T23:00:00+00:00"
    await advance(hass, freezer, 86400)
    assert hub(hass)["overlay"] == "festive"


async def test_gating_resolves_with_the_state_change(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(
        entry, options=configure(entry, {"dates": CHRISTMAS, "when_occupied": True})
    )
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "festive"
    scenes.clear()

    await call(hass, state="out")
    assert hub(hass)["overlay"] == "none"
    # No Christmas chime for the neighbours, and no wasted second application.
    assert applied(scenes) == ["scene.away"]
    await call(hass, state="house")
    assert hub(hass)["overlay"] == "festive"


async def test_overlapping_rules_resolve_by_priority_then_order(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-25 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    overlays = [
        {"id": "festive", "name": "Festive", "scene": "scene.christmas", "dates": CHRISTMAS},
        {
            "id": "guests",
            "name": "Guests",
            "scene": "scene.party",
            "dates": {"type": "fixed", "from": "12-25", "to": "12-25"},
            "priority": 1,
        },
    ]
    hass.config_entries.async_update_entry(
        entry, options=dict(entry.options) | {"overlays": overlays}
    )
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "guests"


async def test_auto_appears_only_where_rules_exist(hass, entry, scenes):
    await setup(hass, entry)
    assert hass.states.get("select.house_overlay").attributes["options"] == [
        "none",
        "festive",
        "guests",
    ]
    with pytest.raises(ServiceValidationError):
        await call(hass, overlay="auto")

    assert await hass.config_entries.async_unload(entry.entry_id)
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    assert hass.states.get("select.house_overlay").attributes["options"] == [
        "auto",
        "none",
        "festive",
        "guests",
    ]


async def test_overlay_select_drives_the_choice(hass, entry, scenes, freezer):
    freezer.move_to("2026-12-10 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    hass.config_entries.async_update_entry(entry, options=configure(entry, {"dates": CHRISTMAS}))
    await setup(hass, entry)
    assert hass.states.get("select.house_overlay").state == "auto"
    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": "select.house_overlay", "option": "none"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert hass.states.get("select.house_overlay").state == "none"
    assert hub(hass)["overlay"] == "none"


async def test_calendar_rule_matches_on_the_event_summary(hass, entry, scenes, freezer):
    freezer.move_to("2026-06-01 12:00:00+00:00")
    await hass.config.async_set_time_zone("Europe/Oslo")
    events = {"calendar.family": {"events": [{"summary": "Bursdag Ada", "start": "2026-06-01"}]}}
    hass.services.async_register(
        "calendar", "get_events", lambda service: events, supports_response="only"
    )
    hass.states.async_set("calendar.family", "on")
    hass.config_entries.async_update_entry(
        entry, options=configure(entry, {"calendar": "calendar.family", "match": "^bursdag"})
    )
    await setup(hass, entry)
    assert hub(hass)["overlay"] == "festive"

    events["calendar.family"]["events"] = [{"summary": "Tannlege", "start": "2026-06-01"}]
    hass.states.async_set("calendar.family", "off")
    await hass.async_block_till_done()
    assert hub(hass)["overlay"] == "none"


async def test_unreadable_calendar_keeps_the_last_answer(hass, entry, scenes, freezer):
    freezer.move_to("2026-06-01 12:00:00+00:00")
    hass.config_entries.async_update_entry(
        entry, options=configure(entry, {"calendar": "calendar.missing"})
    )
    await setup(hass, entry)  # the calendar integration is not even loaded
    assert hub(hass)["overlay"] == "none"
    assert hass.states.get("sensor.house_state").state == "quiet"


async def test_rules_are_validated_before_they_are_stored(hass, entry, scenes):
    await setup(hass, entry)
    rejected = [
        {"dates": {"type": "fixed", "from": "04-31", "to": "05-01"}},
        {"dates": {"type": "easter", "from": 5, "to": -5}},
        {"dates": {"type": "nth_weekday", "weekday": "sun", "nth": -4}},
        {"dates": {"type": "nth_weekday", "weekday": "sun", "nth": 0, "month": 12}},
        {"dates": {"type": "phase_of_moon", "from": "01-01"}},
        {"calendar": "calendar.x", "dates": CHRISTMAS},
        {"calendar": "light.not_a_calendar"},
        {"match": "^jul"},
        {"calendar": "calendar.x", "match": "["},
        {"when_state": ["nowhere"]},
    ]
    for festive in rejected:
        with pytest.raises(ServiceValidationError):
            await call(hass, "set_config", overlays=configure(entry, festive)["overlays"])
    for reserved in ("none", "auto"):
        with pytest.raises(ServiceValidationError):
            await call(hass, "set_config", overlays=[{"id": reserved, "name": "X", "scene": ""}])
