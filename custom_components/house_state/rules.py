"""Date rules and overlay rule evaluation. Pure stdlib, no Home Assistant."""

from datetime import date, timedelta

WEEKDAYS = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
RULE_TYPES = ("fixed", "easter", "nth_weekday")


def easter(year):
    """Gregorian Easter Sunday; the one date no calendar recurrence expresses."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    moon = (32 + 2 * e + 2 * i - h - k) % 7
    correction = (a + 11 * h + 22 * moon) // 451
    month, day = divmod(h + moon - 7 * correction + 114, 31)
    return date(year, month, day + 1)


def _day(year, mmdd):
    month, day = (int(part) for part in mmdd.split("-"))
    try:
        return date(year, month, day)
    except ValueError:  # 02-29 outside a leap year
        return None


def valid_mmdd(mmdd):
    """Whether MM-DD names a real day; 2024 is a leap year, so 02-29 counts."""
    return _day(2024, mmdd) is not None


def _nth_in_month(year, month, weekday, nth):
    first = date(year, month, 1)
    last = (date(year + month // 12, month % 12 + 1, 1)) - timedelta(days=1)
    offset = (weekday - first.weekday()) % 7
    days = []
    cursor = first + timedelta(days=offset)
    while cursor <= last:
        days.append(cursor)
        cursor += timedelta(days=7)
    index = nth - 1 if nth > 0 else len(days) + nth
    return days[index] if 0 <= index < len(days) else None


def _nth_from_anchor(anchor, weekday, nth):
    """The |nth| weekday strictly before (nth < 0) or after (nth > 0) an anchor."""
    step = 1 if nth > 0 else -1
    cursor = anchor + timedelta(days=step)
    remaining = abs(nth)
    while remaining:
        if cursor.weekday() == weekday:
            remaining -= 1
            if not remaining:
                return cursor
        cursor += timedelta(days=step)
    return None


def window(rule, year):
    """Inclusive (start, end) dates for a rule anchored in one year, or None."""
    kind = rule["type"]
    if kind == "fixed":
        start, end = _day(year, rule["from"]), _day(year, rule["to"])
        if start is None or end is None:
            return None
        if end < start:  # a window that crosses New Year
            end = _day(year + 1, rule["to"])
        return None if end is None else (start, end)
    if kind == "easter":
        sunday = easter(year)
        return sunday + timedelta(days=rule["from"]), sunday + timedelta(days=rule["to"])
    if kind == "nth_weekday":
        weekday = WEEKDAYS[rule["weekday"]]
        if "anchor" in rule:
            anchor = _day(year, rule["anchor"])
            start = None if anchor is None else _nth_from_anchor(anchor, weekday, rule["nth"])
        else:
            start = _nth_in_month(year, rule["month"], weekday, rule["nth"])
        return None if start is None else (start, start + timedelta(days=rule["days"] - 1))
    return None


def dates_active(rule, today):
    """Whether today falls in the rule's window for any nearby anchor year."""
    for year in (today.year - 1, today.year, today.year + 1):
        span = window(rule, year)
        if span and span[0] <= today <= span[1]:
            return True
    return False


def has_rules(overlays):
    return any("calendar" in overlay or "dates" in overlay for overlay in overlays)


def _matches(overlay, today, calendar_active):
    if "calendar" in overlay:
        return overlay["id"] in calendar_active
    if "dates" in overlay:
        return dates_active(overlay["dates"], today)
    return False


def _permitted(overlay, active_path, occupied):
    required = overlay.get("when_occupied")
    if required is not None and required != occupied:
        return False
    states = overlay.get("when_state") or []
    return not states or any(state in active_path for state in states)


def evaluate(overlays, today, calendar_active, active_path, occupied):
    """The winning overlay ID for today: highest priority, then configuration order."""
    best = None
    for index, overlay in enumerate(overlays):
        if not _matches(overlay, today, calendar_active):
            continue
        if not _permitted(overlay, active_path, occupied):
            continue
        key = (-overlay.get("priority", 0), index)
        if best is None or key < best[0]:
            best = (key, overlay["id"])
    return best[1] if best else "none"
