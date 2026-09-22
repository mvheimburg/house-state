import { afterEach, describe, expect, it } from "vitest";
import {
  $,
  $$,
  choose,
  click,
  settle,
  setup,
  starterConfig,
  text,
  type,
} from "./helpers";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("loading", () => {
  it("renders the tree with default, start and role badges", async () => {
    const { el, callWS } = await setup();
    expect(callWS).toHaveBeenCalledWith({ type: "house_state/config/get" });
    const rows = $$(el, "[data-node]").map((row) => row.dataset.node);
    expect(rows).toEqual([
      "home",
      "day",
      "idle",
      "tv",
      "eating",
      "night",
      "away",
      "vacation",
    ]);
    expect($(el, '[data-node="home"] [data-badge="initial"]')).toBeTruthy();
    expect($(el, '[data-node="day"] [data-badge="default"]')).toBeTruthy();
    expect($(el, '[data-node="tv"] [data-badge="default"]')).toBeNull();
    expect(text($(el, '[data-node="home"] [data-badge="role-arrival"]'))).toBe(
      "Arrival",
    );
    expect(
      $(el, '[data-node="vacation"] [data-badge="role-vacation"]'),
    ).toBeTruthy();
    expect($(el, '[data-node="home"] [data-occupancy]').dataset.occupancy).toBe(
      "explicit",
    );
    expect($(el, '[data-node="tv"] [data-occupancy]').dataset.occupancy).toBe(
      "inherited",
    );
    expect(text($(el, '[data-node="idle"]'))).toContain(
      "Inherits Home lights from Home",
    );
    expect(text($(el, ".subtitle"))).toBe("Hjemme");
    expect($<HTMLButtonElement>(el, '[data-action="save"]').disabled).toBe(
      true,
    );
  });

  it("explains how to add the integration when no house exists", async () => {
    const { el } = await setup({ config: null });
    expect(text(el.shadowRoot!.querySelector(".empty"))).toContain(
      "No house set up yet",
    );
    expect($<HTMLAnchorElement>(el, "a.btn").getAttribute("href")).toContain(
      "domain=house_state",
    );
  });

  it("shows the websocket error, for example for non-admins", async () => {
    const { el } = await setup({
      handlers: {
        "house_state/config/get": () => {
          throw { code: "unauthorized", message: "Unauthorized" };
        },
      },
    });
    expect(text($(el, ".banner.error"))).toContain("Unauthorized");
  });
});

describe("editing", () => {
  it("marks the draft dirty on a name edit and Discard restores it", async () => {
    const { el } = await setup();
    await click(el, '[data-node="tv"]');
    await type(el, "#state-name", "Movie");
    expect(text($(el, '[data-node="tv"] .node-name'))).toContain("Movie");
    expect(text($(el, ".status"))).toContain("Unsaved changes");
    expect($<HTMLButtonElement>(el, '[data-action="save"]').disabled).toBe(
      false,
    );
    await click(el, '[data-action="discard"]');
    await click(el, '.dialog [data-action="confirm"]');
    expect(text($(el, '[data-node="tv"] .node-name'))).toContain("TV");
    expect(el.dirty).toBe(false);
  });

  it("adds a child with a slug ID from its name", async () => {
    const { el } = await setup();
    await click(el, '[data-node="day"]');
    await click(el, '[data-action="add-child"]');
    await type(el, "#state-name", "Gåtur på søndag");
    const created = el.draft!.state_tree.at(-1)!;
    expect(created).toMatchObject({
      id: "gatur_pa_sondag",
      name: "Gåtur på søndag",
      parent: "day",
    });
    expect($<HTMLInputElement>(el, "#state-id").readOnly).toBe(false);
    // Duplicate IDs are refused next to the field and not committed.
    await type(el, "#state-id", "tv");
    await type(el, "#state-id", "tv", "change");
    expect(text($(el, '[data-editor="state"]'))).toContain(
      "Another item already uses this ID",
    );
    expect(
      el.draft!.state_tree.filter((node) => node.id === "tv"),
    ).toHaveLength(1);
    await type(el, "#state-id", "walk", "change");
    expect(el.draft!.state_tree.at(-1)!.id).toBe("walk");
    // Existing IDs stay fixed.
    await click(el, '[data-node="tv"]');
    expect($<HTMLInputElement>(el, "#state-id").readOnly).toBe(true);
  });

  it("offers only valid parents and default children", async () => {
    const { el } = await setup();
    await click(el, '[data-node="day"]');
    const parents = $$<HTMLOptionElement>(el, "#state-parent option").map(
      (o) => o.value,
    );
    expect(parents).not.toContain("day");
    expect(parents).not.toContain("tv");
    expect(parents).toContain("away");
    const defaults = $$<HTMLOptionElement>(el, "#state-default option").map(
      (o) => o.value,
    );
    expect(defaults).toEqual(["", "idle", "tv", "eating"]);
  });

  it("flags a role that leads to the wrong occupancy", async () => {
    const { el } = await setup();
    await choose(el, "#role-night", "away");
    expect(text($(el, '[data-card="roles"]'))).toContain(
      "Night must lead to a state where someone is home",
    );
    expect(text($(el, '[data-section="states"] .count'))).toBe("1");
  });

  it("sets the scene through the entity selector", async () => {
    const { el } = await setup();
    await click(el, '[data-node="night"]');
    ($(el, '[data-picker="state-scene"] ha-selector') as any).pick("scene.tv");
    await settle(el);
    expect(
      el.draft!.state_tree.find((node) => node.id === "night")!.scene,
    ).toBe("scene.tv");
  });
});

describe("deleting a state", () => {
  it("lists and applies the cleanup", async () => {
    const config = starterConfig();
    config.overlays[1].when_state = ["day", "tv"];
    const { el } = await setup({ config });
    await click(el, '[data-node="day"]');
    await click(el, '[data-action="delete-state"]');
    const effects = text($(el, "[data-effects]"));
    expect(effects).toContain("None, TV, Eating move to Home.");
    expect(effects).toContain("Home no longer has a default child.");
    expect(effects).toContain(
      "Overlay Halloween no longer lists it among its states.",
    );
    await click(el, '.dialog [data-action="confirm"]');
    const tree = el.draft!.state_tree;
    expect(tree.find((node) => node.id === "day")).toBeUndefined();
    expect(tree.find((node) => node.id === "tv")!.parent).toBe("home");
    expect(tree.find((node) => node.id === "home")!.default_child).toBeNull();
    expect(el.draft!.overlays[1].when_state).toEqual(["tv"]);
  });

  it("clears roles and asks for a new start state", async () => {
    const { el } = await setup();
    await click(el, '[data-node="home"]');
    await click(el, '[data-action="delete-state"]');
    expect(text($(el, "[data-effects]"))).toContain(
      "The Arrival role is turned off.",
    );
    await choose(el, "#replacement", "away");
    await click(el, '.dialog [data-action="confirm"]');
    expect(el.draft!.initial_state).toBe("away");
    expect(el.draft!.roles.arrival).toBeNull();
    expect(
      el.draft!.state_tree.find((node) => node.id === "day")!.parent,
    ).toBeNull();
  });

  it("refuses when an overlay depends only on that state", async () => {
    const config = starterConfig();
    config.overlays[1].when_state = ["tv"];
    const { el } = await setup({ config });
    await click(el, '[data-node="tv"]');
    await click(el, '[data-action="delete-state"]');
    expect($(el, '[data-blocked="overlay"]')).toBeTruthy();
    expect(text($(el, ".dialog"))).toContain(
      "Overlay Halloween is only allowed in this state",
    );
    expect($(el, '.dialog [data-action="confirm"]')).toBeNull();
    expect(el.draft!.state_tree.some((node) => node.id === "tv")).toBe(true);
  });

  it("refuses to delete the last state", async () => {
    const config = starterConfig();
    config.state_tree = [config.state_tree[0]];
    config.state_tree[0].default_child = null;
    config.roles = {
      arrival: "home",
      departure: null,
      vacation: null,
      night: null,
    };
    config.overlays = [];
    const { el } = await setup({ config });
    await click(el, '[data-node="home"]');
    await click(el, '[data-action="delete-state"]');
    expect($(el, '[data-blocked="last"]')).toBeTruthy();
  });
});

describe("overlays", () => {
  it("summarizes rules in English", async () => {
    const { el } = await setup();
    await click(el, '[data-section="overlays"]');
    expect(text($(el, '[data-overlay="christmas"] [data-summary]'))).toBe(
      "Calendar: calendar.family matching “Jul”",
    );
    expect(text($(el, '[data-overlay="halloween"] [data-summary]'))).toBe(
      "Every year Dec 1 → Dec 26",
    );
    expect(text($(el, '[data-overlay="halloween"] [data-conditions]'))).toBe(
      "Only when someone is home · Only in: Day, TV",
    );
    expect(text($(el, '[data-overlay="party"] [data-summary]'))).toBe(
      "Manual only",
    );
  });

  it("summarizes rules in Bokmål", async () => {
    const { el } = await setup({ language: "nb" });
    await click(el, '[data-section="overlays"]');
    expect(text($(el, '[data-overlay="christmas"] .node-name'))).toContain(
      "Jul",
    );
    expect(text($(el, '[data-overlay="christmas"] [data-summary]'))).toBe(
      "Kalender: calendar.family som passer «Jul»",
    );
    expect(text($(el, '[data-overlay="halloween"] [data-summary]'))).toMatch(
      /^Hvert år 1\. des\.? → 26\. des\.?$/,
    );
    expect(text($(el, '[data-overlay="halloween"] [data-conditions]'))).toBe(
      "Bare når noen er hjemme · Bare i: Dag, TV",
    );
  });

  it("edits Easter and weekday rules with live summaries", async () => {
    const { el } = await setup();
    await click(el, '[data-section="overlays"]');
    await click(el, '[data-overlay="party"]');
    await click(el, '[data-name="activation"] [data-value="dates"]');
    await click(el, '[data-name="date-kind"] [data-value="easter"]');
    await type(el, "#easter-from", "-2", "change");
    expect(text($(el, "[data-preview]"))).toBe("Easter −2 to +1 days");
    await type(el, "#easter-from", "3", "change");
    expect(text($(el, '[data-editor="overlay"]'))).toContain(
      "The first day must not come after the last day",
    );
    await click(el, '[data-name="date-kind"] [data-value="nth_weekday"]');
    await choose(el, "#nth", "2");
    await choose(el, "#month", "5");
    expect(text($(el, "[data-preview]"))).toBe("2nd Sunday in May for 1 day");
    await click(el, '[data-name="anchor-kind"] [data-value="anchor"]');
    await choose(el, "#nth", "4");
    await choose(el, "#before-after", "before");
    expect(text($(el, "[data-preview]"))).toBe(
      "4th Sunday before Dec 25 for 1 day",
    );
    expect(el.draft!.overlays[2].dates).toEqual({
      type: "nth_weekday",
      weekday: "sun",
      nth: -4,
      days: 1,
      anchor: "12-25",
    });
  });

  it("adds an overlay with a slug ID and refuses reserved IDs", async () => {
    const { el } = await setup();
    await click(el, '[data-section="overlays"]');
    await click(el, '[data-action="add-overlay"]');
    await type(el, "#overlay-name", "Sommerfest");
    expect(el.draft!.overlays.at(-1)!.id).toBe("sommerfest");
    await type(el, "#overlay-id", "auto");
    expect(text($(el, '[data-editor="overlay"]'))).toContain(
      "none and auto are reserved",
    );
  });

  it("limits an overlay to states", async () => {
    const { el } = await setup();
    await click(el, '[data-section="overlays"]');
    await click(el, '[data-overlay="party"]');
    await click(el, '[data-when="night"]');
    expect(el.draft!.overlays[2].when_state).toEqual(["night"]);
    await click(el, '[data-when="night"]');
    expect(el.draft!.overlays[2].when_state).toBeUndefined();
    expect(el.dirty).toBe(false);
  });
});

describe("saving", () => {
  it("shows a validation error inline and keeps the draft", async () => {
    const { el, callWS } = await setup({
      handlers: {
        "house_state/config/validate": () => ({
          valid: false,
          error: "Default child must be a direct child",
        }),
      },
    });
    await click(el, '[data-node="tv"]');
    await type(el, "#state-name", "Film");
    await click(el, '[data-action="save"]');
    expect(text($(el, ".banner.error"))).toContain(
      "Default child must be a direct child",
    );
    expect(
      callWS.mock.calls.some(
        ([message]) => message.type === "house_state/config/save",
      ),
    ).toBe(false);
    expect(el.dirty).toBe(true);
  });

  it("asks before saving with scene warnings, then acknowledges", async () => {
    const saves: any[] = [];
    let revision = "r1";
    const { el } = await setup({
      handlers: {
        "house_state/config/validate": (message) => ({
          valid: true,
          config: message.config,
          warnings: ["scene.x: missing scene"],
        }),
        "house_state/config/save": (message) => {
          saves.push(message);
          if (!message.acknowledge_warnings)
            return { saved: false, warnings: ["scene.x: missing scene"] };
          revision = "r2";
          return { saved: true, revision };
        },
      },
    });
    await click(el, '[data-node="tv"]');
    await type(el, "#state-name", "Film");
    await click(el, '[data-action="save"]');
    expect(text($(el, "[data-warnings]"))).toContain("scene.x: missing scene");
    await click(el, '.dialog [data-action="confirm"]');
    expect(saves).toHaveLength(2);
    expect(saves[0]).toMatchObject({ entry_id: "e1", revision: "r1" });
    expect(saves[0].acknowledge_warnings).toBeUndefined();
    expect(saves[1].acknowledge_warnings).toBe(true);
    expect(
      saves[1].config.state_tree.find((node: any) => node.id === "tv").name,
    ).toBe("Film");
    expect(text($(el, ".banner.success"))).toBe(
      "Saved. House State reloads; no scenes were applied.",
    );
  });

  it("refreshes from get after a save", async () => {
    let stored = starterConfig();
    const { el, callWS } = await setup({
      handlers: {
        "house_state/config/validate": (message) => ({
          valid: true,
          config: message.config,
          warnings: [],
        }),
        "house_state/config/save": (message) => {
          stored = message.config;
          return { saved: true, revision: "r2" };
        },
        "house_state/config/get": () => ({
          entries: [{ entry_id: "e1", title: "Hjemme" }],
          entry_id: "e1",
          config: stored,
          revision: stored === undefined ? "r1" : "r3",
        }),
      },
    });
    await click(el, '[data-node="tv"]');
    await type(el, "#state-name", "Film");
    await click(el, '[data-action="save"]');
    expect(
      callWS.mock.calls.filter(([m]) => m.type === "house_state/config/get"),
    ).toHaveLength(2);
    expect(el.revision).toBe("r3");
    expect(el.dirty).toBe(false);
    expect($<HTMLButtonElement>(el, '[data-action="save"]').disabled).toBe(
      true,
    );
  });

  it("offers a reload on a revision conflict", async () => {
    const { el, callWS } = await setup({
      handlers: {
        "house_state/config/validate": (message) => ({
          valid: true,
          config: message.config,
          warnings: [],
        }),
        "house_state/config/save": () => {
          throw { code: "conflict", message: "Configuration changed" };
        },
      },
    });
    await click(el, '[data-node="tv"]');
    await type(el, "#state-name", "Film");
    await click(el, '[data-action="save"]');
    expect(text($(el, ".banner.warn"))).toContain("changed somewhere else");
    await click(el, '[data-action="reload"]');
    expect(
      callWS.mock.calls.filter(([m]) => m.type === "house_state/config/get"),
    ).toHaveLength(2);
    expect(el.dirty).toBe(false);
    expect(el.draft!.state_tree.find((node) => node.id === "tv")!.name).toBe(
      "TV",
    );
  });
});

describe("stock names in the editor", () => {
  const saving = () => {
    const saves: any[] = [];
    return {
      saves,
      handlers: {
        "house_state/config/validate": (message: any) => ({
          valid: true,
          config: message.config,
          warnings: [],
        }),
        "house_state/config/save": (message: any) => {
          saves.push(message);
          return { saved: true, revision: "r2" };
        },
      },
    };
  };

  it("shows the translated stock name and keeps the stored name untouched", async () => {
    const { saves, handlers } = saving();
    const { el } = await setup({ language: "nb", handlers });
    await click(el, '[data-node="vacation"]');
    expect($<HTMLInputElement>(el, "#state-name").value).toBe("Ferie");
    expect(el.dirty).toBe(false);
    await click(el, '[data-section="overlays"]');
    await click(el, '[data-overlay="christmas"]');
    expect($<HTMLInputElement>(el, "#overlay-name").value).toBe("Jul");
    expect(el.dirty).toBe(false);
    // Another edit, then save: the stock names are sent as stored.
    await type(el, "#overlay-priority", "20", "change");
    await click(el, '[data-action="save"]');
    const sent = saves[0].config;
    expect(sent.state_tree.find((n: any) => n.id === "vacation").name).toBe(
      "Vacation",
    );
    expect(sent.overlays.find((o: any) => o.id === "christmas").name).toBe(
      "Christmas",
    );
  });

  it("stores a typed name exactly as typed", async () => {
    const { el } = await setup({ language: "nb" });
    await click(el, '[data-node="vacation"]');
    await type(el, "#state-name", "Ferie");
    expect(el.draft!.state_tree.find((n) => n.id === "vacation")!.name).toBe(
      "Ferie",
    );
    expect(el.dirty).toBe(true);
    await type(el, "#state-name", "Sommerferie");
    expect(el.draft!.state_tree.find((n) => n.id === "vacation")!.name).toBe(
      "Sommerferie",
    );
    await click(el, '[data-section="overlays"]');
    await click(el, '[data-overlay="christmas"]');
    await type(el, "#overlay-name", "Juletid");
    expect(el.draft!.overlays.find((o) => o.id === "christmas")!.name).toBe(
      "Juletid",
    );
    expect(el.draft!.overlays.find((o) => o.id === "christmas")!.id).toBe(
      "christmas",
    );
  });
});

describe("language and layout", () => {
  it("uses Bokmål for nb, nb-NO, no and nn, and English otherwise", async () => {
    for (const language of ["nb", "nb_NO", "no", "nn"]) {
      const { el } = await setup({ language });
      expect(text($(el, "h1"))).toBe("Hustilstand");
      expect(text($(el, '[data-section="states"]'))).toContain("Tilstander");
      expect(text($(el, '[data-node="home"] .node-name'))).toContain("Hjemme");
      // IDs are never translated.
      expect(text($(el, '[data-node="home"] .node-id'))).toBe("home");
      document.body.innerHTML = "";
    }
    const { el } = await setup({ language: "de" });
    expect(text($(el, "h1"))).toBe("House State");
  });

  it("keeps custom names and follows a language change", async () => {
    const config = starterConfig();
    config.state_tree[0].name = "Hytta";
    const { el } = await setup({ config });
    expect(text($(el, '[data-node="home"] .node-name'))).toContain("Hytta");
    expect(text($(el, '[data-node="day"] .node-name'))).toContain("Day");
    el.hass = { ...el.hass!, language: "nb" };
    await settle(el);
    expect(text($(el, '[data-node="home"] .node-name'))).toContain("Hytta");
    expect(text($(el, '[data-node="day"] .node-name'))).toContain("Dag");
    expect(text($(el, "[data-action=save]"))).toBe("Lagre");
  });

  it("renders an accordion on narrow screens", async () => {
    const { el } = await setup({ narrow: true });
    expect($(el, ".tabs")).toBeNull();
    expect($$(el, ".acc")).toHaveLength(7);
    expect(
      $(el, '.acc.open[data-section="states"] [data-node="home"]'),
    ).toBeTruthy();
    const toggled: Event[] = [];
    el.addEventListener("hass-toggle-menu", (event) => toggled.push(event));
    await click(el, ".bar .icon-btn");
    expect(toggled).toHaveLength(1);
    await click(el, '[data-section="visits"] .acc-head');
    expect($(el, '.acc.open[data-section="visits"]')).toBeTruthy();
    expect($(el, '[data-section="states"] [data-node="home"]')).toBeNull();
  });
});

describe("unit conversions", () => {
  it("shows the night offset in minutes and stores seconds", async () => {
    const { el } = await setup();
    await click(el, '[data-section="night"]');
    expect($<HTMLInputElement>(el, "#night-offset").value).toBe("90");
    expect(text($(el, '[data-preview="night"]'))).toBe(
      "Night starts 1 h 30 min after sunset.",
    );
    await type(el, "#night-offset", "30", "change");
    await choose(el, "#night-direction", "before");
    expect(el.draft!.night_schedule).toEqual({
      type: "sun",
      event: "sunset",
      offset: -1800,
    });
    expect(text($(el, '[data-preview="night"]'))).toBe(
      "Night starts 30 min before sunset.",
    );
    await click(el, '[data-name="night-type"] [data-value="fixed"]');
    await type(el, "#night-time", "22:30", "change");
    expect(el.draft!.night_schedule).toEqual({
      type: "fixed",
      time: "22:30:00",
    });
  });

  it("shows visit durations in hours and minutes and stores seconds", async () => {
    const { el } = await setup();
    await click(el, '[data-section="visits"]');
    const inputs = (id: string) => $$<HTMLInputElement>(el, `#${id} input`);
    expect(inputs("visit_duration").map((i) => i.value)).toEqual(["2", "0"]);
    expect(inputs("visit_max_duration").map((i) => i.value)).toEqual([
      "12",
      "0",
    ]);
    expect(inputs("visit_exit_grace").map((i) => i.value)).toEqual(["2", "0"]);
    const minutes = inputs("visit_duration")[1];
    minutes.value = "45";
    minutes.dispatchEvent(new Event("change"));
    await settle(el);
    expect(el.draft!.visit_duration).toBe(2 * 3600 + 45 * 60);
    const hours = inputs("visit_duration")[0];
    hours.value = "13";
    hours.dispatchEvent(new Event("change"));
    await settle(el);
    expect(el.draft!.visit_duration).toBe(13 * 3600 + 45 * 60);
    expect(text($(el, "#visit_duration"))).toContain(
      "longer than the longest allowed visit",
    );
  });
});
