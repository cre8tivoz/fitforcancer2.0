import { describe, expect, it } from "vitest";
import { RECIPES } from "../constants";
import { MOVEMENTS } from "../movements";
import {
  MOVEMENT_RECOMMENDATION_CATALOG,
  RECIPE_RECOMMENDATION_CATALOG,
  executeAthenaRecommendationTool,
  recommendMovements,
  recommendRecipes,
} from "../utils/athenaRecommendations";

describe("ATHENA recommendation catalogues", () => {
  it("keeps the server-safe movement projection aligned with the app catalogue", () => {
    expect(
      MOVEMENT_RECOMMENDATION_CATALOG.map(({ id, title, zone }) => ({ id, title, zone })),
    ).toEqual(
      MOVEMENTS.map(({ id, title, intensity }) => ({ id, title, zone: intensity })),
    );
  });

  it("keeps the server-safe recipe projection aligned with the app catalogue", () => {
    expect(
      RECIPE_RECOMMENDATION_CATALOG.map(({ id, title, zone, category }) => ({ id, title, zone, category })),
    ).toEqual(
      RECIPES.map(({ id, title, fatigueZone, category }) => ({
        id,
        title,
        zone: fatigueZone.split(" ")[1],
        category,
      })),
    );
  });
});

describe("ATHENA deterministic recommendations", () => {
  it("returns only Red movement items on a Red fatigue day", () => {
    const result = recommendMovements("🔴 Red", "any");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected recommendations");
    expect(result.items.map((item) => item.id)).toEqual(["16", "17", "18"]);
    expect(result.items.every((item) => item.zone === "Red")).toBe(true);
  });

  it("honours a seated movement preference without leaving the current band", () => {
    const result = recommendMovements("🔴 Red", "seated");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected recommendations");
    expect(result.preferenceMatched).toBe(true);
    expect(result.items.map((item) => item.id)).toEqual(["16", "17", "18"]);
    expect(result.items.every((item) => item.zone === "Red")).toBe(true);
  });

  it("returns the existing Yellow walking option for a Yellow day", () => {
    const result = recommendMovements("🟡 Yellow", "walking");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected recommendations");
    expect(result.items).toEqual([
      {
        id: "14",
        title: "Short Easy Walk",
        zone: "Yellow",
        duration: "5–10 mins",
        benefit: "Gentle aerobic activity",
      },
    ]);
  });

  it("returns Red zero-prep recipes from the real catalogue", () => {
    const result = recommendRecipes("🔴 Red", "zero_prep");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected recommendations");
    expect(result.preferenceMatched).toBe(true);
    expect(result.items.map((item) => item.id)).toEqual(["11", "12", "14"]);
    expect(result.items.every((item) => item.zone === "Red")).toBe(true);
  });

  it("falls back to same-band recipes when a requested category has no Red match", () => {
    const result = recommendRecipes("🔴 Red", "anti_nausea");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("expected recommendations");
    expect(result.preferenceMatched).toBe(false);
    expect(result.items.map((item) => item.id)).toEqual(["10", "11", "12"]);
    expect(result.items.every((item) => item.zone === "Red")).toBe(true);
  });

  it("does not guess a catalogue effort level without a fatigue band", () => {
    const movement = recommendMovements(null, "walking");
    const recipe = recommendRecipes(null, "zero_prep");

    expect(movement.status).toBe("needs_fatigue_score");
    expect(movement.items).toEqual([]);
    expect(recipe.status).toBe("needs_fatigue_score");
    expect(recipe.items).toEqual([]);
  });

  it("normalises unknown tool arguments instead of trusting model-provided filters", () => {
    const execution = executeAthenaRecommendationTool(
      "recommend_movement",
      { preference: "do_100_burpees" },
      "🔴 Red",
    );

    expect(execution.refs).toEqual([
      { kind: "movement", id: "16" },
      { kind: "movement", id: "17" },
      { kind: "movement", id: "18" },
    ]);
    expect(execution.response).toMatchObject({ status: "ok", preference: "any" });
  });
});
