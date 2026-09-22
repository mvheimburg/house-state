/** Readable, localized descriptions of overlay rules and schedules. */
import { displayName, fill, type Strings } from "./localize";
import { splitMmdd } from "./model";
import type { HassEntity, NightSchedule, Overlay, StateNode } from "./types";

export interface SummaryContext {
  strings: Strings;
  locale: string;
  states?: Record<string, HassEntity>;
  tree: StateNode[];
  timeFormat?: string;
}

export function entityName(
  states: Record<string, HassEntity> | undefined,
  entityId: string,
): string {
  return states?.[entityId]?.attributes?.friendly_name || entityId;
}

/** A day and month in the formatting locale, e.g. "Dec 1" or "1. des.". */
export function formatDayMonth(value: string, locale: string): string {
  const [month, day] = splitMmdd(value);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, month - 1, day)));
  } catch {
    return value;
  }
}

export function formatNumber(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

export function formatTime(
  value: string,
  locale: string,
  timeFormat?: string,
): string {
  const [h, m, s] = value.split(":").map(Number);
  if ([h, m].some((part) => Number.isNaN(part))) return value;
  const hour12 =
    timeFormat === "12" ? true : timeFormat === "24" ? false : undefined;
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      ...(s ? { second: "2-digit" } : {}),
      hour12,
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 1, h, m, s || 0)));
  } catch {
    return value;
  }
}

export function daysText(strings: Strings, days: number, locale: string) {
  return days === 1
    ? strings.dayOne
    : fill(strings.dayMany, { count: formatNumber(days, locale) });
}

/** The activation rule alone: "Every year Dec 1 → Dec 26". */
export function ruleSummary(overlay: Overlay, ctx: SummaryContext): string {
  const { strings, locale } = ctx;
  if (overlay.calendar !== undefined) {
    const text = fill(strings.sumCalendar, {
      calendar: overlay.calendar
        ? entityName(ctx.states, overlay.calendar)
        : "—",
    });
    return overlay.match
      ? fill(strings.sumMatch, { text, match: overlay.match })
      : text;
  }
  const rule = overlay.dates;
  if (!rule) return strings.sumManual;
  if (rule.type === "fixed")
    return fill(strings.sumFixed, {
      from: formatDayMonth(rule.from, locale),
      to: formatDayMonth(rule.to, locale),
    });
  if (rule.type === "easter") {
    if (rule.from === 0 && rule.to === 0) return strings.sumEasterSunday;
    const signed = (value: number) =>
      formatNumber(value, locale, { signDisplay: "exceptZero" }).replace(
        /^-/,
        "−",
      );
    return fill(strings.sumEaster, {
      from: signed(rule.from),
      to: signed(rule.to),
    });
  }
  const weekday = strings.weekdaysInline[rule.weekday] ?? rule.weekday;
  let text: string;
  if (rule.anchor !== undefined) {
    text = fill(rule.nth < 0 ? strings.sumNthBefore : strings.sumNthAfter, {
      nth: strings.ordinalAnchor[String(rule.nth)] ?? String(rule.nth),
      weekday,
      date: formatDayMonth(rule.anchor, locale),
    });
  } else {
    text = fill(strings.sumNthMonth, {
      nth: strings.ordinal[String(rule.nth)] ?? String(rule.nth),
      weekday,
      month: strings.monthsInline[(rule.month ?? 1) - 1] ?? String(rule.month),
    });
  }
  return fill(strings.sumDays, {
    text,
    days: daysText(strings, rule.days, locale),
  });
}

/** Extra limits on when a rule may switch the overlay on. */
export function conditionSummary(
  overlay: Overlay,
  ctx: SummaryContext,
): string[] {
  const { strings } = ctx;
  const parts: string[] = [];
  if (overlay.when_occupied === true) parts.push(strings.sumHome);
  if (overlay.when_occupied === false) parts.push(strings.sumAway);
  if (overlay.when_state?.length) {
    const names = overlay.when_state.map((id) => {
      const node = ctx.tree.find((item) => item.id === id);
      return node ? displayName(strings, node, "starterStates") : id;
    });
    parts.push(fill(strings.sumStates, { states: names.join(", ") }));
  }
  return parts;
}

export function offsetText(
  strings: Strings,
  seconds: number,
  locale: string,
): string {
  const minutes = Math.abs(seconds) / 60;
  if (minutes >= 60 && Number.isInteger(minutes)) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m
      ? `${formatNumber(h, locale)} ${strings.hours} ${formatNumber(m, locale)} ${strings.minutes}`
      : `${formatNumber(h, locale)} ${strings.hours}`;
  }
  return `${formatNumber(minutes, locale, { maximumFractionDigits: 2 })} ${strings.minutes}`;
}

export function nightSummary(
  schedule: NightSchedule,
  ctx: SummaryContext,
): string {
  const { strings, locale } = ctx;
  if (schedule.type === "fixed")
    return fill(strings.nightAt, {
      time: formatTime(schedule.time, locale, ctx.timeFormat),
    });
  if (schedule.type === "sun") {
    const event = (
      schedule.event === "sunrise" ? strings.sunrise : strings.sunset
    ).toLowerCase();
    if (!schedule.offset) return fill(strings.nightSunExact, { event });
    return fill(
      schedule.offset < 0 ? strings.nightSunBefore : strings.nightSunAfter,
      { event, offset: offsetText(strings, schedule.offset, locale) },
    );
  }
  return strings.nightOff;
}
