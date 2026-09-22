/** Shapes of the House State configuration, as exchanged over the websocket API. */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language?: string;
  locale?: { language?: string; time_format?: string };
  user?: { is_admin?: boolean; name?: string };
  callWS<T = any>(message: Record<string, unknown>): Promise<T>;
}

export interface StateNode {
  id: string;
  name: string;
  parent: string | null;
  scene: string;
  default_child: string | null;
  occupied: boolean | null;
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DateRule =
  | { type: "fixed"; from: string; to: string }
  | { type: "easter"; from: number; to: number }
  | {
      type: "nth_weekday";
      weekday: Weekday;
      nth: number;
      days: number;
      month?: number;
      anchor?: string;
    };

export interface Overlay {
  id: string;
  name: string;
  scene: string;
  priority?: number;
  calendar?: string;
  match?: string;
  dates?: DateRule;
  when_occupied?: boolean | null;
  when_state?: string[];
}

export type Role = "arrival" | "departure" | "vacation" | "night";
export type Roles = Record<Role, string | null>;

export type NightSchedule =
  | { type: "off" }
  | { type: "fixed"; time: string }
  | { type: "sun"; event: "sunset" | "sunrise"; offset: number };

export interface HouseConfig {
  state_tree: StateNode[];
  initial_state: string;
  overlays: Overlay[];
  roles: Roles;
  door_entities: string[];
  gate_entities: string[];
  person_entities: string[];
  auto_return: boolean;
  auto_away: boolean;
  auto_away_grace: number;
  arrival_delay: number;
  night_schedule: NightSchedule;
  legacy_mirror: { state?: string; overlay?: string };
  visit_duration: number;
  visit_max_duration: number;
  visit_exit_grace: number;
  visit_reapply_scene: boolean;
  visit_lock_entities: string[];
  water_valves: string[];
}

export interface Entry {
  entry_id: string;
  title: string;
}

export interface GetResponse {
  entries: Entry[];
  entry_id?: string;
  config?: HouseConfig;
  revision?: string;
  limits?: { min_duration: number; max_duration: number };
  roles?: Role[];
  reserved_overlays?: string[];
}

export type ValidateResponse =
  | { valid: true; config: HouseConfig; warnings: string[] }
  | { valid: false; error: string };

export type SaveResponse =
  | { saved: true; revision: string }
  | { saved: false; warnings: string[]; error?: undefined }
  | { saved: false; error: string; warnings?: undefined };
