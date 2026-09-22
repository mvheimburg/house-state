import { describe, expect, it } from "vitest";
import { formattingLocale, language } from "../src/localize";
import {
  canonical,
  checkConfig,
  deleteState,
  fromParts,
  minutesToOffset,
  occupancy,
  offsetToMinutes,
  renameState,
  roleProblem,
  slugify,
  toParts,
  uniqueId,
  validMmdd,
} from "../src/model";
import { starterConfig } from "./helpers";

describe("model", () => {
  it("slugifies names into stable IDs", () => {
    expect(slugify("Game night")).toBe("game_night");
    expect(slugify("Ærlig ødeland på tur")).toBe("aerlig_odeland_pa_tur");
    expect(slugify("1. etasje")).toBe("state_1_etasje");
    expect(slugify("!!!")).toBe("state");
    expect(uniqueId("tv", ["tv", "tv_2"])).toBe("tv_3");
  });

  it("resolves inherited occupancy and role targets", () => {
    const config = starterConfig();
    expect(occupancy(config.state_tree, "tv")).toEqual({
      value: true,
      source: "home",
      inherited: true,
    });
    expect(occupancy(config.state_tree, "away").inherited).toBe(false);
    expect(roleProblem(config, "arrival")).toBeNull();
    config.roles.departure = "home";
    expect(roleProblem(config, "departure")).toBe("needsAway");
  });

  it("renames a new state's references", () => {
    const next = renameState(starterConfig(), "day", "daytime");
    expect(
      next.state_tree.find((node) => node.id === "home")!.default_child,
    ).toBe("daytime");
    expect(next.state_tree.find((node) => node.id === "tv")!.parent).toBe(
      "daytime",
    );
    expect(next.overlays[1].when_state).toEqual(["daytime", "tv"]);
  });

  it("deletes with cleanup", () => {
    const next = deleteState(starterConfig(), "night");
    expect(next.roles.night).toBeNull();
    expect(() =>
      deleteState(
        {
          ...starterConfig(),
          overlays: [{ id: "o", name: "O", scene: "", when_state: ["tv"] }],
        },
        "tv",
      ),
    ).toThrow();
  });

  it("checks obvious problems", () => {
    const config = starterConfig();
    config.state_tree[1].name = "  ";
    config.state_tree.push({ ...config.state_tree[2] });
    config.overlays[0].id = "none";
    const keys = checkConfig(config).map(
      (issue) => `${issue.field}:${issue.key}`,
    );
    expect(keys).toContain("state:1:name:nameRequired");
    expect(keys).toContain("state:8:id:idDuplicate");
    expect(keys).toContain("overlay:0:id:idReserved");
    expect(validMmdd("02-29")).toBe(true);
    expect(validMmdd("02-30")).toBe(false);
  });

  it("converts units", () => {
    expect(toParts(7260, ["h", "m"])).toEqual({ h: 2, m: 1, s: 0 });
    expect(fromParts({ h: 1, m: 30, s: 5 })).toBe(5405);
    expect(offsetToMinutes(-1800)).toBe(-30);
    expect(minutesToOffset(1.5)).toBe(90);
  });

  it("treats unset optional overlay fields as unchanged", () => {
    const a = starterConfig();
    const b = starterConfig();
    b.overlays[2] = {
      ...b.overlays[2],
      when_state: [],
      when_occupied: null,
      priority: 0,
    };
    expect(canonical(a)).toBe(canonical(b));
  });
});

describe("locale", () => {
  it("separates translation language from formatting locale", () => {
    expect(language({ language: "nb-NO" })).toBe("nb");
    expect(language({ language: "NO" })).toBe("nb");
    expect(language({ language: "nn" })).toBe("nb");
    expect(language({ language: "en-GB" })).toBe("en");
    expect(language({ locale: { language: "nb" } })).toBe("nb");
    expect(formattingLocale({ language: "en_GB" })).toBe("en-GB");
    expect(formattingLocale({ language: "no" })).toBe("nb");
    expect(formattingLocale({ language: "!!bad!!" })).toBe("en");
  });
});
