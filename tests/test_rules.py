"""Date arithmetic that has to stay correct for the next decade."""

from datetime import date

from custom_components.house_state.rules import dates_active, easter, evaluate, window

# The dates this feature exists for: neither is expressible as a calendar recurrence.
EASTER_SUNDAY = {
    2026: date(2026, 4, 5),
    2027: date(2027, 3, 28),
    2028: date(2028, 4, 16),
    2029: date(2029, 4, 1),
    2030: date(2030, 4, 21),
}
FIRST_ADVENT = {
    2026: date(2026, 11, 29),
    2027: date(2027, 11, 28),
    2028: date(2028, 12, 3),
    2029: date(2029, 12, 2),
    2030: date(2030, 12, 1),
}


def test_easter_swings_twenty_five_days():
    for year, sunday in EASTER_SUNDAY.items():
        assert easter(year) == sunday
        assert easter(year).weekday() == 6


def test_advent_counts_sundays_before_christmas():
    rule = {"type": "nth_weekday", "weekday": "sun", "nth": -4, "anchor": "12-25", "days": 28}
    for year, sunday in FIRST_ADVENT.items():
        assert window(rule, year)[0] == sunday


def test_easter_window_covers_palm_sunday_to_easter_monday():
    rule = {"type": "easter", "from": -7, "to": 1}
    assert window(rule, 2027) == (date(2027, 3, 21), date(2027, 3, 29))
    assert dates_active(rule, date(2027, 3, 21))
    assert dates_active(rule, date(2027, 3, 29))
    assert not dates_active(rule, date(2027, 3, 20))
    assert not dates_active(rule, date(2027, 3, 30))
    # The window that looked right when it was written, a year later.
    fixed = {"type": "fixed", "from": "04-01", "to": "04-10"}
    assert dates_active(fixed, date(2026, 4, 5))
    assert not dates_active(fixed, date(2027, 3, 28))


def test_fixed_window_wraps_new_year():
    rule = {"type": "fixed", "from": "12-24", "to": "01-02"}
    assert window(rule, 2026) == (date(2026, 12, 24), date(2027, 1, 2))
    assert dates_active(rule, date(2026, 12, 31))
    assert dates_active(rule, date(2027, 1, 1))
    assert not dates_active(rule, date(2027, 1, 3))


def test_fixed_window_is_inclusive_at_both_ends():
    rule = {"type": "fixed", "from": "10-25", "to": "11-01"}
    assert dates_active(rule, date(2026, 10, 25))
    assert dates_active(rule, date(2026, 11, 1))
    assert not dates_active(rule, date(2026, 10, 24))
    assert not dates_active(rule, date(2026, 11, 2))


def test_nth_weekday_counts_from_either_end_of_a_month():
    last_monday = {"type": "nth_weekday", "weekday": "mon", "nth": -1, "month": 5, "days": 1}
    assert window(last_monday, 2026)[0] == date(2026, 5, 25)
    third_thursday = {"type": "nth_weekday", "weekday": "thu", "nth": 3, "month": 11, "days": 1}
    assert window(third_thursday, 2026)[0] == date(2026, 11, 19)
    missing = {"type": "nth_weekday", "weekday": "mon", "nth": 5, "month": 5, "days": 1}
    assert window(missing, 2026) is None


def test_leap_day_window_skips_common_years():
    rule = {"type": "fixed", "from": "02-29", "to": "02-29"}
    assert window(rule, 2027) is None
    assert dates_active(rule, date(2028, 2, 29))
    assert not dates_active(rule, date(2027, 2, 28))


def test_priority_wins_then_configuration_order():
    christmas = {"id": "christmas", "dates": {"type": "fixed", "from": "12-01", "to": "12-26"}}
    birthday = {"id": "birthday", "dates": {"type": "fixed", "from": "12-25", "to": "12-25"}}
    today = date(2026, 12, 25)
    assert evaluate([christmas, birthday], today, set(), ["house"], True) == "christmas"
    assert evaluate([birthday, christmas], today, set(), ["house"], True) == "birthday"
    ranked = [christmas, dict(birthday, priority=1)]
    assert evaluate(ranked, today, set(), ["house"], True) == "birthday"


def test_gating_on_occupancy_and_active_path():
    rule = {"type": "fixed", "from": "12-01", "to": "12-26"}
    today = date(2026, 12, 10)
    home_only = [{"id": "christmas", "dates": rule, "when_occupied": True}]
    assert evaluate(home_only, today, set(), ["house", "awake"], True) == "christmas"
    assert evaluate(home_only, today, set(), ["out"], False) == "none"
    awake_only = [{"id": "christmas", "dates": rule, "when_state": ["awake"]}]
    # A parent in the active path covers its whole subtree.
    assert evaluate(awake_only, today, set(), ["house", "awake", "quiet"], True) == "christmas"
    assert evaluate(awake_only, today, set(), ["house", "sleep"], True) == "none"


def test_calendar_overlays_follow_the_supplied_membership():
    overlays = [{"id": "birthday", "calendar": "calendar.family"}]
    today = date(2026, 6, 1)
    assert evaluate(overlays, today, {"birthday"}, ["house"], True) == "birthday"
    assert evaluate(overlays, today, set(), ["house"], True) == "none"


def test_an_overlay_without_a_rule_never_activates_itself():
    assert evaluate([{"id": "party"}], date(2026, 12, 25), set(), ["house"], True) == "none"
