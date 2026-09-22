/** Pure draft operations. Nothing here talks to Home Assistant. */
import type { DateRule, HouseConfig, Overlay, Role, StateNode } from "./types";

export const ROLES: Role[] = ["arrival", "departure", "vacation", "night"];
export const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
export const RESERVED_OVERLAYS = ["none", "auto"];
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DEFAULT_LIMITS = { min_duration: 60, max_duration: 604800 };

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Stable ID from a display name: lowercase ASCII and underscores. */
export function slugify(name: string, fallback = "state"): string {
  const folded = name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const slug = /^[a-z]/.test(folded)
    ? folded
    : folded
      ? `${fallback}_${folded}`
      : fallback;
  return slug.slice(0, 64).replace(/_+$/, "");
}

export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `_${n}`;
    const candidate = base.slice(0, 64 - suffix.length) + suffix;
    if (!used.has(candidate)) return candidate;
  }
}

export const nodeMap = (tree: StateNode[]) =>
  new Map(tree.map((node) => [node.id, node]));

export const childrenOf = (tree: StateNode[], id: string | null) =>
  tree.filter((node) => node.parent === id);

/** The node and everything below it; cycles cannot loop forever. */
export function descendants(tree: StateNode[], id: string): Set<string> {
  const found = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of tree) {
      if (node.parent && found.has(node.parent) && !found.has(node.id)) {
        found.add(node.id);
        grew = true;
      }
    }
  }
  return found;
}

/** Path from a root to the node, guarding against cycles and missing parents. */
export function pathTo(tree: StateNode[], id: string): string[] {
  const nodes = nodeMap(tree);
  const path: string[] = [];
  let cursor: string | null = id;
  while (cursor && nodes.has(cursor) && !path.includes(cursor)) {
    path.unshift(cursor);
    cursor = nodes.get(cursor)!.parent;
  }
  return path;
}

export interface Occupancy {
  value: boolean;
  /** The node that decides it, or null when nothing on the path is explicit. */
  source: string | null;
  inherited: boolean;
}

export function occupancy(tree: StateNode[], id: string): Occupancy {
  const nodes = nodeMap(tree);
  const path = pathTo(tree, id);
  for (let i = path.length - 1; i >= 0; i--) {
    const value = nodes.get(path[i])!.occupied;
    if (value !== null && value !== undefined)
      return { value, source: path[i], inherited: path[i] !== id };
  }
  return { value: false, source: null, inherited: true };
}

/** Follow default children like the integration does when a state is chosen. */
export function descend(tree: StateNode[], id: string): string {
  const nodes = nodeMap(tree);
  const seen = new Set<string>();
  let cursor = id;
  while (!seen.has(cursor)) {
    seen.add(cursor);
    const next = nodes.get(cursor)?.default_child;
    if (!next || !nodes.has(next)) break;
    cursor = next;
  }
  return cursor;
}

/** The scene that applies at a node and where it comes from. */
export function sceneSource(
  tree: StateNode[],
  id: string,
): { scene: string; source: string } | null {
  const nodes = nodeMap(tree);
  const path = pathTo(tree, id);
  for (let i = path.length - 1; i >= 0; i--) {
    const scene = nodes.get(path[i])!.scene;
    if (scene) return { scene, source: path[i] };
  }
  return null;
}

export const ROLE_NEEDS_HOME: Record<Role, boolean> = {
  arrival: true,
  night: true,
  departure: false,
  vacation: false,
};

export type RoleProblem = "missing" | "needsHome" | "needsAway" | null;

export function roleProblem(config: HouseConfig, role: Role): RoleProblem {
  const target = config.roles[role];
  if (!target) return null;
  if (!config.state_tree.some((node) => node.id === target)) return "missing";
  const landed = descend(config.state_tree, target);
  const home = occupancy(config.state_tree, landed).value;
  if (home === ROLE_NEEDS_HOME[role]) return null;
  return ROLE_NEEDS_HOME[role] ? "needsHome" : "needsAway";
}

/** Depth-first display order; orphans and cycle members still appear once. */
export function flatten(
  tree: StateNode[],
): { node: StateNode; depth: number }[] {
  const ids = new Set(tree.map((node) => node.id));
  const out: { node: StateNode; depth: number }[] = [];
  const placed = new Set<string>();
  const visit = (node: StateNode, depth: number) => {
    if (placed.has(node.id)) return;
    placed.add(node.id);
    out.push({ node, depth });
    for (const child of childrenOf(tree, node.id)) visit(child, depth + 1);
  };
  for (const node of tree)
    if (!node.parent || !ids.has(node.parent)) visit(node, 0);
  for (const node of tree) visit(node, 0);
  return out;
}

// ---------------------------------------------------------------- editing

/** Change a new node's ID and every reference to it in the draft. */
export function renameState(
  config: HouseConfig,
  from: string,
  to: string,
): HouseConfig {
  const next = clone(config);
  for (const node of next.state_tree) {
    if (node.id === from) node.id = to;
    if (node.parent === from) node.parent = to;
    if (node.default_child === from) node.default_child = to;
  }
  if (next.initial_state === from) next.initial_state = to;
  for (const role of ROLES)
    if (next.roles[role] === from) next.roles[role] = to;
  for (const overlay of next.overlays)
    if (overlay.when_state)
      overlay.when_state = overlay.when_state.map((id) =>
        id === from ? to : id,
      );
  return next;
}

/** Move a node; a previous parent that defaulted to it loses that default. */
export function setParent(
  config: HouseConfig,
  id: string,
  parent: string | null,
): HouseConfig {
  const next = clone(config);
  if (parent && descendants(next.state_tree, id).has(parent)) return config;
  for (const node of next.state_tree) {
    if (node.id === id) node.parent = parent;
    else if (node.default_child === id && node.id !== parent)
      node.default_child = null;
  }
  return next;
}

export interface DeletionPlan {
  blocked: "last" | "overlay" | null;
  blockingOverlays: Overlay[];
  reparented: StateNode[];
  newParent: StateNode | null;
  defaultCleared: StateNode[];
  rolesCleared: Role[];
  overlaysTrimmed: Overlay[];
  needsInitial: boolean;
}

/** Describe exactly what deleting a state changes before the user confirms. */
export function planDeletion(config: HouseConfig, id: string): DeletionPlan {
  const tree = config.state_tree;
  const node = tree.find((item) => item.id === id);
  const blockingOverlays = config.overlays.filter(
    (overlay) =>
      overlay.when_state?.length &&
      new Set(overlay.when_state).size === 1 &&
      overlay.when_state[0] === id,
  );
  return {
    blocked:
      tree.length <= 1 ? "last" : blockingOverlays.length ? "overlay" : null,
    blockingOverlays,
    reparented: childrenOf(tree, id),
    newParent: tree.find((item) => item.id === node?.parent) ?? null,
    defaultCleared: tree.filter((item) => item.default_child === id),
    rolesCleared: ROLES.filter((role) => config.roles[role] === id),
    overlaysTrimmed: config.overlays.filter((overlay) =>
      overlay.when_state?.includes(id),
    ),
    needsInitial: config.initial_state === id,
  };
}

export function deleteState(
  config: HouseConfig,
  id: string,
  replacement?: string,
): HouseConfig {
  const plan = planDeletion(config, id);
  if (plan.blocked) throw new Error(plan.blocked);
  const next = clone(config);
  const node = next.state_tree.find((item) => item.id === id)!;
  next.state_tree = next.state_tree.filter((item) => item.id !== id);
  for (const other of next.state_tree) {
    if (other.parent === id) other.parent = node.parent;
    if (other.default_child === id) other.default_child = null;
  }
  for (const role of ROLES)
    if (next.roles[role] === id) next.roles[role] = null;
  for (const overlay of next.overlays)
    if (overlay.when_state?.includes(id))
      overlay.when_state = overlay.when_state.filter((state) => state !== id);
  if (next.initial_state === id)
    next.initial_state =
      replacement && next.state_tree.some((item) => item.id === replacement)
        ? replacement
        : next.state_tree[0].id;
  return next;
}

// ---------------------------------------------------------------- dates

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function validMmdd(value: string | undefined): boolean {
  const match = /^(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return false;
  const month = Number(match[1]);
  const day = Number(match[2]);
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1]
  );
}

export const mmdd = (month: number, day: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function splitMmdd(value: string | undefined): [number, number] {
  const [month, day] = (value ?? "01-01").split("-").map(Number);
  return [month || 1, day || 1];
}

export function defaultRule(kind: DateRule["type"]): DateRule {
  if (kind === "fixed") return { type: "fixed", from: "12-01", to: "12-26" };
  if (kind === "easter") return { type: "easter", from: -3, to: 1 };
  return { type: "nth_weekday", weekday: "sun", nth: 1, days: 1, month: 1 };
}

export type Activation = "manual" | "calendar" | "dates";

export const activationOf = (overlay: Overlay): Activation =>
  overlay.calendar !== undefined
    ? "calendar"
    : overlay.dates
      ? "dates"
      : "manual";

export function setActivation(overlay: Overlay, kind: Activation): Overlay {
  const next = clone(overlay);
  if (kind !== "calendar") {
    delete next.calendar;
    delete next.match;
  }
  if (kind !== "dates") delete next.dates;
  if (kind === "calendar" && next.calendar === undefined) next.calendar = "";
  if (kind === "dates" && !next.dates) next.dates = defaultRule("fixed");
  return next;
}

// ---------------------------------------------------------------- durations

export interface Parts {
  h: number;
  m: number;
  s: number;
}

export function toParts(seconds: number, units: ("h" | "m" | "s")[]): Parts {
  let rest = Math.max(0, Math.round(seconds));
  const parts: Parts = { h: 0, m: 0, s: 0 };
  if (units.includes("h")) {
    parts.h = Math.floor(rest / 3600);
    rest -= parts.h * 3600;
  }
  if (units.includes("m")) {
    parts.m = units.includes("s") ? Math.floor(rest / 60) : rest / 60;
    rest -= Math.floor(parts.m) * 60;
  }
  if (units.includes("s")) parts.s = rest;
  return parts;
}

export const fromParts = (parts: Parts) =>
  Math.round(parts.h * 3600 + parts.m * 60 + parts.s);

/** Night offsets are whole seconds in config and signed minutes in the UI. */
export const offsetToMinutes = (seconds: number) => seconds / 60;
export const minutesToOffset = (minutes: number) => Math.round(minutes * 60);

// ---------------------------------------------------------------- checks

export type IssueKey =
  | "nameRequired"
  | "nameTooLong"
  | "idInvalid"
  | "idDuplicate"
  | "idReserved"
  | "roleNeedsHome"
  | "roleNeedsAway"
  | "roleMissing"
  | "calendarRequired"
  | "matchInvalid"
  | "noSuchDay"
  | "easterOrder"
  | "durationOverMax"
  | "outOfRange"
  | "timeInvalid";

export interface Issue {
  section: "states" | "overlays" | "presence" | "night" | "visits";
  /** Field address, such as `state:home:name`, `role:night` or `visit_duration`. */
  field: string;
  key: IssueKey;
  params?: Record<string, string | number>;
}

function nameIssue(name: string): IssueKey | null {
  if (!name.trim()) return "nameRequired";
  if (name.length > 100) return "nameTooLong";
  return null;
}

function idIssues(
  ids: string[],
  reserved: string[] = [],
): Map<number, IssueKey> {
  const issues = new Map<number, IssueKey>();
  ids.forEach((id, index) => {
    if (!ID_PATTERN.test(id) || id.length > 64) issues.set(index, "idInvalid");
    else if (reserved.includes(id)) issues.set(index, "idReserved");
    else if (ids.indexOf(id) !== index || ids.lastIndexOf(id) !== index)
      issues.set(index, "idDuplicate");
  });
  return issues;
}

function regexValid(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/** Obvious problems for immediate feedback; the backend stays authoritative. */
export function checkConfig(
  config: HouseConfig,
  limits = DEFAULT_LIMITS,
): Issue[] {
  const issues: Issue[] = [];
  const stateIds = idIssues(config.state_tree.map((node) => node.id));
  config.state_tree.forEach((node, index) => {
    const name = nameIssue(node.name);
    if (name)
      issues.push({
        section: "states",
        field: `state:${index}:name`,
        key: name,
      });
    const id = stateIds.get(index);
    if (id)
      issues.push({ section: "states", field: `state:${index}:id`, key: id });
  });
  for (const role of ROLES) {
    const problem = roleProblem(config, role);
    if (problem)
      issues.push({
        section: "states",
        field: `role:${role}`,
        key:
          problem === "missing"
            ? "roleMissing"
            : problem === "needsHome"
              ? "roleNeedsHome"
              : "roleNeedsAway",
        params: { role },
      });
  }
  const overlayIds = idIssues(
    config.overlays.map((overlay) => overlay.id),
    RESERVED_OVERLAYS,
  );
  config.overlays.forEach((overlay, index) => {
    const at = (field: string) => `overlay:${index}:${field}`;
    const name = nameIssue(overlay.name);
    if (name)
      issues.push({ section: "overlays", field: at("name"), key: name });
    const id = overlayIds.get(index);
    if (id) issues.push({ section: "overlays", field: at("id"), key: id });
    if (
      overlay.calendar !== undefined &&
      !overlay.calendar.startsWith("calendar.")
    )
      issues.push({
        section: "overlays",
        field: at("calendar"),
        key: "calendarRequired",
      });
    if (overlay.match && !regexValid(overlay.match))
      issues.push({
        section: "overlays",
        field: at("match"),
        key: "matchInvalid",
      });
    const rule = overlay.dates;
    if (rule?.type === "fixed")
      for (const bound of ["from", "to"] as const)
        if (!validMmdd(rule[bound]))
          issues.push({
            section: "overlays",
            field: at(bound),
            key: "noSuchDay",
          });
    if (rule?.type === "easter" && rule.from > rule.to)
      issues.push({
        section: "overlays",
        field: at("easter"),
        key: "easterOrder",
      });
    if (rule?.type === "nth_weekday") {
      if (rule.anchor !== undefined && !validMmdd(rule.anchor))
        issues.push({
          section: "overlays",
          field: at("anchor"),
          key: "noSuchDay",
        });
      if (!(rule.days >= 1 && rule.days <= 366))
        issues.push({
          section: "overlays",
          field: at("days"),
          key: "outOfRange",
          params: { min: 1, max: 366 },
        });
    }
  });
  const range = (
    section: Issue["section"],
    field: keyof HouseConfig,
    min: number,
    max: number,
  ) => {
    const value = config[field] as number;
    if (!(value >= min && value <= max))
      issues.push({ section, field, key: "outOfRange", params: { min, max } });
  };
  range("presence", "auto_away_grace", 0, 86400 * 7);
  range("presence", "arrival_delay", 0, 60);
  range("visits", "visit_duration", limits.min_duration, limits.max_duration);
  range(
    "visits",
    "visit_max_duration",
    limits.min_duration,
    limits.max_duration,
  );
  range("visits", "visit_exit_grace", 0, 3600);
  if (config.visit_duration > config.visit_max_duration)
    issues.push({
      section: "visits",
      field: "visit_duration",
      key: "durationOverMax",
    });
  const night = config.night_schedule;
  if (night.type === "fixed" && !/^\d{2}:\d{2}:\d{2}$/.test(night.time))
    issues.push({ section: "night", field: "night_time", key: "timeInvalid" });
  if (night.type === "sun" && !(Math.abs(night.offset) <= 86400))
    issues.push({
      section: "night",
      field: "night_offset",
      key: "outOfRange",
      params: { min: -1440, max: 1440 },
    });
  return issues;
}

/** Order-insensitive comparison that ignores values meaning "not set". */
export function canonical(config: HouseConfig | undefined): string {
  if (!config) return "";
  const overlays = config.overlays.map((overlay) => {
    const copy: Record<string, unknown> = { ...overlay };
    if (copy.when_occupied === null) delete copy.when_occupied;
    if (Array.isArray(copy.when_state) && !copy.when_state.length)
      delete copy.when_state;
    if (copy.priority === 0) delete copy.priority;
    if (copy.match === "") delete copy.match;
    return copy;
  });
  const sort = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sort)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
              .filter(([, item]) => item !== undefined)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, item]) => [key, sort(item)]),
          )
        : value;
  return JSON.stringify(sort({ ...config, overlays }));
}
