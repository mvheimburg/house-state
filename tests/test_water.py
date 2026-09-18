"""Water shuts off for vacation, runs for guests, and is never assumed to have moved."""

from unittest.mock import patch

import pytest
from homeassistant import data_entry_flow
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .conftest import call, setup
from .test_options_flow import choose, submit
from .test_visits import visit


def valves(hass, broken=()):
    """Valve and switch services that move the entity, except those listed as broken."""
    calls = []

    def service(state):
        async def handle(service_call):
            entity = service_call.data["entity_id"]
            calls.append((entity, state))
            if entity in broken:
                raise HomeAssistantError("valve offline")
            hass.states.async_set(entity, state)

        return handle

    for domain, service_name, state in (
        ("valve", "open_valve", "open"),
        ("valve", "close_valve", "closed"),
        ("switch", "turn_on", "on"),
        ("switch", "turn_off", "off"),
    ):
        hass.services.async_register(domain, service_name, service(state))
    return calls


@pytest.fixture
def house(hass, entry):
    hass.config_entries.async_update_entry(
        entry,
        options=dict(entry.options) | {"water_valves": ["valve.main", "switch.garden_water"]},
    )
    hass.states.async_set("valve.main", "open")
    hass.states.async_set("switch.garden_water", "on")
    return entry


def water(hass):
    return hass.states.get("sensor.house_state").attributes["water"]


async def test_vacation_closes_and_return_opens_the_water(hass, house, scenes):
    calls = valves(hass)
    events = []
    hass.bus.async_listen("house_state_event", lambda event: events.append(event.data))
    await setup(hass, house)
    assert not calls, "a first start adopts the current water"
    await call(hass, state="trip")
    assert hass.states.get("valve.main").state == "closed"
    assert hass.states.get("switch.garden_water").state == "off"
    assert water(hass)["status"] == "ok"
    assert water(hass)["valves"] == {"valve.main": "closed", "switch.garden_water": "closed"}
    assert [event["desired"] for event in events if event["type"] == "water"] == ["closed"]
    await call(hass, state="house")
    assert hass.states.get("valve.main").state == "open"
    assert hass.states.get("switch.garden_water").state == "on"
    assert water(hass)["desired"] == "open"


async def test_away_and_state_changes_within_home_leave_the_water_alone(hass, house, scenes):
    calls = valves(hass)
    await setup(hass, house)
    await call(hass, state="out")
    await call(hass, state="cinema")
    await call(hass, state="sleep")
    assert not calls
    assert water(hass) is None


async def test_guest_during_vacation_gets_water_until_they_leave(hass, house, scenes):
    valves(hass)
    await setup(hass, house)
    await call(hass, state="trip")
    started = await visit(hass, visit_id="cat-sitter")
    assert started["status"] == "started"
    await hass.async_block_till_done()
    assert hass.states.get("valve.main").state == "open"
    assert hub_state(hass) == "trip"
    ended = await visit(hass, "visit_end", visit_id="cat-sitter")
    assert ended["cleanup"]["water"]["desired"] == "closed"
    assert ended["cleanup"]["water"]["status"] == "ok"
    assert ended["cleanup"]["status"] == "ok"
    assert hass.states.get("valve.main").state == "closed"
    assert hass.states.get("switch.garden_water").state == "off"


async def test_guest_while_away_does_not_touch_the_water(hass, house, scenes):
    calls = valves(hass)
    await setup(hass, house)
    await call(hass, state="out")
    await visit(hass)
    ended = await visit(hass, "visit_end")
    assert not calls
    assert "water" not in ended["cleanup"]


async def test_family_returning_during_a_vacation_visit_keeps_water_on(hass, house, scenes):
    valves(hass)
    await setup(hass, house)
    await call(hass, state="trip")
    await visit(hass)
    await hass.async_block_till_done()
    await call(hass, "arrive")
    await hass.async_block_till_done()
    assert hass.states.get("valve.main").state == "open"
    assert hass.states.get("sensor.house_state").attributes["last_visit"]["outcome"] == "arrived"


async def test_failed_valve_is_reported_and_retried_when_it_returns(hass, house, scenes):
    valves(hass)
    await setup(hass, house)
    hass.states.async_set("valve.main", "unavailable")
    await call(hass, state="trip")
    assert water(hass)["status"] == "failed"
    assert water(hass)["valves"] == {"valve.main": "unavailable", "switch.garden_water": "closed"}
    hass.states.async_set("valve.main", "open")
    await hass.async_block_till_done()
    assert hass.states.get("valve.main").state == "closed"
    assert water(hass)["status"] == "ok"


async def test_refused_and_unconfirmed_valves_fail(hass, house, scenes):
    valves(hass, broken={"valve.main"})
    hass.services.async_register("switch", "turn_off", lambda call: None)
    await setup(hass, house)
    with patch("custom_components.house_state.devices.VERIFY_TIMEOUT", 0.01):
        await call(hass, state="trip")
    assert water(hass)["valves"] == {"valve.main": "failed", "switch.garden_water": "unverified"}
    assert water(hass)["status"] == "failed"


async def test_restart_does_not_reopen_valves_something_else_closed(hass, house, scenes):
    calls = valves(hass)
    await setup(hass, house)
    await call(hass, state="house")
    # A leak automation shuts the water while everyone is home.
    hass.states.async_set("valve.main", "closed")
    assert await hass.config_entries.async_reload(house.entry_id)
    await hass.async_block_till_done()
    await call(hass, "set_config", water_valves=["valve.main"])
    await hass.async_block_till_done()
    assert not calls
    assert hass.states.get("valve.main").state == "closed"


async def test_change_missed_while_stopped_is_applied_at_start(hass, house, scenes):
    valves(hass)
    await setup(hass, house)
    hass.states.async_set("valve.main", "unavailable")
    await call(hass, state="trip")
    assert await hass.config_entries.async_unload(house.entry_id)
    hass.states.async_set("valve.main", "open")
    await hass.async_block_till_done()
    await setup(hass, house)
    assert hass.states.get("valve.main").state == "closed"
    assert water(hass)["status"] == "ok"


async def test_only_valves_and_switches_are_accepted(hass, house, scenes):
    await setup(hass, house)
    with pytest.raises(ServiceValidationError, match="valve or switch"):
        await call(hass, "set_config", water_valves=["light.kitchen"])


async def test_water_settings_are_a_draft_until_saved(hass, house, scenes):
    await setup(hass, house)
    flow = await hass.config_entries.options.async_init(house.entry_id)
    assert "water" in flow["menu_options"]
    flow = await choose(hass, flow, "water")
    flow = await submit(hass, flow, {"water_valves": ["valve.main"]})
    assert house.options["water_valves"] == ["valve.main", "switch.garden_water"]
    flow = await choose(hass, flow, "save")
    flow = await submit(hass, flow, {})
    assert flow["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert house.options["water_valves"] == ["valve.main"]


def hub_state(hass):
    return hass.states.get("sensor.house_state").state
