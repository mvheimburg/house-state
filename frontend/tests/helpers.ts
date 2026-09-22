import { vi } from "vitest";
import "../src/house-state-panel";
import type { HouseStatePanel } from "../src/house-state-panel";
import type { HouseConfig, StateNode } from "../src/types";

/** Stand-in for Home Assistant's ha-selector: an input firing value-changed. */
if (!customElements.get("ha-selector")) {
  customElements.define(
    "ha-selector",
    class extends HTMLElement {
      hass: unknown;
      selector: any;
      label = "";
      private _value: unknown;
      set value(value: unknown) {
        this._value = value;
        this.dataset.value = JSON.stringify(value ?? null);
      }
      get value() {
        return this._value;
      }
      pick(value: unknown) {
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            detail: { value },
            bubbles: true,
            composed: true,
          }),
        );
      }
    },
  );
}

const node = (
  id: string,
  name: string,
  parent: string | null = null,
  default_child: string | null = null,
  occupied: boolean | null = null,
  scene = "",
): StateNode => ({ id, name, parent, scene, default_child, occupied });

/** The integration's DEFAULTS, with a few scenes and rules. */
export function starterConfig(): HouseConfig {
  return {
    state_tree: [
      node("home", "Home", null, "day", true, "scene.home"),
      node("day", "Day", "home", "idle"),
      node("idle", "None", "day"),
      node("tv", "TV", "day", null, null, "scene.tv"),
      node("eating", "Eating", "day"),
      node("night", "Night", "home"),
      node("away", "Away", null, null, false),
      node("vacation", "Vacation", null, null, false),
    ],
    initial_state: "home",
    overlays: [
      {
        id: "christmas",
        name: "Christmas",
        scene: "scene.xmas",
        calendar: "calendar.family",
        match: "Jul",
        priority: 10,
      },
      {
        id: "halloween",
        name: "Halloween",
        scene: "",
        dates: { type: "fixed", from: "12-01", to: "12-26" },
        when_state: ["day", "tv"],
        when_occupied: true,
      },
      { id: "party", name: "Party", scene: "" },
    ],
    roles: {
      arrival: "home",
      departure: "away",
      vacation: "vacation",
      night: "night",
    },
    door_entities: [],
    gate_entities: [],
    person_entities: [],
    auto_return: true,
    auto_away: false,
    auto_away_grace: 300,
    arrival_delay: 3,
    night_schedule: { type: "sun", event: "sunset", offset: 5400 },
    legacy_mirror: {},
    visit_duration: 7200,
    visit_max_duration: 43200,
    visit_exit_grace: 120,
    visit_reapply_scene: true,
    visit_lock_entities: [],
    water_valves: [],
  };
}

export type WsHandler = (message: any) => unknown;

export async function setup(
  options: {
    config?: HouseConfig | null;
    language?: string;
    narrow?: boolean;
    handlers?: Record<string, WsHandler>;
  } = {},
) {
  const config =
    options.config === undefined ? starterConfig() : options.config;
  const handlers: Record<string, WsHandler> = {
    "house_state/config/get": () =>
      config
        ? {
            entries: [{ entry_id: "e1", title: "Hjemme" }],
            entry_id: "e1",
            config: JSON.parse(JSON.stringify(config)),
            revision: "r1",
            limits: { min_duration: 60, max_duration: 604800 },
          }
        : { entries: [] },
    ...options.handlers,
  };
  const callWS = vi.fn(async (message: any) => {
    const handler = handlers[message.type];
    if (!handler) throw new Error(`unexpected ${message.type}`);
    return handler(message);
  });
  const el = document.createElement("house-state-panel") as HouseStatePanel;
  el.narrow = !!options.narrow;
  el.hass = {
    language: options.language ?? "en",
    locale: { language: options.language ?? "en" },
    states: {
      "scene.home": {
        entity_id: "scene.home",
        state: "on",
        attributes: { friendly_name: "Home lights" },
      },
      "scene.tv": {
        entity_id: "scene.tv",
        state: "on",
        attributes: { friendly_name: "TV dim" },
      },
      "scene.xmas": { entity_id: "scene.xmas", state: "on", attributes: {} },
    },
    callWS: callWS as any,
  };
  document.body.appendChild(el);
  await settle(el);
  return { el, callWS };
}

export async function settle(el: HouseStatePanel) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
  }
}

export const $ = <T extends Element = HTMLElement>(
  el: HouseStatePanel,
  selector: string,
) => el.shadowRoot!.querySelector(selector) as T;
export const $$ = <T extends Element = HTMLElement>(
  el: HouseStatePanel,
  selector: string,
) => [...el.shadowRoot!.querySelectorAll(selector)] as T[];

export async function click(el: HouseStatePanel, selector: string) {
  const target = $(el, selector);
  if (!target) throw new Error(`missing ${selector}`);
  target.click();
  await settle(el);
}

export async function type(
  el: HouseStatePanel,
  selector: string,
  value: string,
  event: "input" | "change" = "input",
) {
  const input = $<HTMLInputElement>(el, selector);
  if (!input) throw new Error(`missing ${selector}`);
  input.value = value;
  input.dispatchEvent(new Event(event, { bubbles: true }));
  await settle(el);
}

export async function choose(
  el: HouseStatePanel,
  selector: string,
  value: string,
) {
  const select = $<HTMLSelectElement>(el, selector);
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await settle(el);
}

export const text = (element: Element | null) =>
  (element?.textContent ?? "").replace(/\s+/g, " ").trim();
