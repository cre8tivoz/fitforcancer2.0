import type { ChatContext, Recipe } from "../types";

export type RecommendationKind = "movement" | "recipe";
export type RecommendationRef = { kind: RecommendationKind; id: string };

type ZoneName = "Green" | "Yellow" | "Red";
export type MovementPreference =
  | "any"
  | "walking"
  | "seated"
  | "lying_down"
  | "strength"
  | "mobility"
  | "balance"
  | "breathing";
export type RecipePreference =
  | "any"
  | "high_protein"
  | "easy_to_digest"
  | "hydrating"
  | "anti_nausea"
  | "zero_prep"
  | "quick_assembly";

type RecipeCategory = Recipe["category"];

interface MovementRecommendationCatalogItem {
  id: string;
  title: string;
  zone: ZoneName;
  duration: string;
  benefit: string;
  preferences: MovementPreference[];
}

interface RecipeRecommendationCatalogItem {
  id: string;
  title: string;
  zone: ZoneName;
  prepTime: string;
  category: RecipeCategory;
}

// Server-safe projections of the app's canonical Movement and Nutrition catalogues.
// They intentionally omit image imports and detailed instructions so the Vercel
// function can use them without bundling frontend assets. Parity tests keep every
// copied canonical field aligned with MOVEMENTS and RECIPES.
export const MOVEMENT_RECOMMENDATION_CATALOG: MovementRecommendationCatalogItem[] = [
  { id: "1", title: "Brisk Walking", zone: "Green", duration: "15–30 mins", benefit: "Aerobic fitness", preferences: ["walking"] },
  { id: "2", title: "Seated Leg Extensions", zone: "Green", duration: "5–10 mins", benefit: "Thigh strength", preferences: ["seated", "strength"] },
  { id: "3", title: "Wall Squat Holds", zone: "Green", duration: "10–30 secs", benefit: "Lower-body strength", preferences: ["strength"] },
  { id: "4", title: "Lateral Side Steps", zone: "Green", duration: "5–10 mins", benefit: "Hip strength & control", preferences: ["strength"] },
  { id: "5", title: "Standing Row (Resistance Band)", zone: "Green", duration: "5–10 mins", benefit: "Upper-back strength", preferences: ["strength"] },
  { id: "6", title: "Bird-Dog (Quadruped)", zone: "Green", duration: "5–10 mins", benefit: "Core control", preferences: ["strength"] },
  { id: "7", title: "Gentle Wall Push-ups", zone: "Yellow", duration: "5–10 mins", benefit: "Upper-body strength", preferences: ["strength"] },
  { id: "8", title: "Bicep Curls (Household Weights)", zone: "Yellow", duration: "5–10 mins", benefit: "Arm strength", preferences: ["strength"] },
  { id: "9", title: "Sit-to-Stand (Chair Rise)", zone: "Yellow", duration: "5–10 mins", benefit: "Everyday leg strength", preferences: ["strength"] },
  { id: "10", title: "Wall Slides (Shoulder Mobility)", zone: "Yellow", duration: "3–5 mins", benefit: "Shoulder mobility", preferences: ["mobility"] },
  { id: "11", title: "Supported Heel Raises", zone: "Yellow", duration: "3–5 mins", benefit: "Calf strength", preferences: ["strength"] },
  { id: "12", title: "Seated Torso Turn", zone: "Yellow", duration: "2–4 mins", benefit: "Gentle trunk mobility", preferences: ["seated", "mobility"] },
  { id: "13", title: "Modified Step-Ups", zone: "Yellow", duration: "3–5 mins", benefit: "Functional leg strength", preferences: ["strength"] },
  { id: "14", title: "Short Easy Walk", zone: "Yellow", duration: "5–10 mins", benefit: "Gentle aerobic activity", preferences: ["walking"] },
  { id: "15", title: "Supported Balance Practice", zone: "Yellow", duration: "2–5 mins", benefit: "Balance & stability", preferences: ["balance"] },
  { id: "16", title: "Diaphragmatic Breathing", zone: "Red", duration: "2–5 mins", benefit: "Slow breathing & relaxation", preferences: ["seated", "lying_down", "breathing"] },
  { id: "17", title: "Ankle Flex & Point", zone: "Red", duration: "1–3 mins", benefit: "Ankle mobility", preferences: ["seated", "lying_down", "mobility"] },
  { id: "18", title: "Seated Shoulder Shrugs", zone: "Red", duration: "1–3 mins", benefit: "Shoulder mobility", preferences: ["seated", "mobility"] },
  { id: "19", title: "Gentle Bed Rotations", zone: "Red", duration: "2–4 mins", benefit: "Gentle trunk mobility", preferences: ["lying_down", "mobility"] },
  { id: "20", title: "Pelvic Tilts (Supine)", zone: "Red", duration: "2–4 mins", benefit: "Gentle core control", preferences: ["lying_down", "strength"] },
  { id: "21", title: "Seated Hamstring Stretch", zone: "Red", duration: "2–4 mins", benefit: "Gentle leg flexibility", preferences: ["seated", "mobility"] },
];

export const RECIPE_RECOMMENDATION_CATALOG: RecipeRecommendationCatalogItem[] = [
  { id: "1", title: "Protein-Packed Berry Smoothie", zone: "Yellow", prepTime: "5 mins", category: "High Protein" },
  { id: "2", title: "Ginger & Turmeric Broth", zone: "Yellow", prepTime: "5 mins", category: "Anti-Nausea" },
  { id: "3", title: "Zucchini & Feta Muffins", zone: "Green", prepTime: "15 mins", category: "Easy to Digest" },
  { id: "4", title: "Soft Roasted Root Vegetables", zone: "Green", prepTime: "10 mins", category: "Easy to Digest" },
  { id: "5", title: "Poached Chicken & Steamed Greens", zone: "Green", prepTime: "10 mins", category: "High Protein" },
  { id: "6", title: "Classic Spaghetti with Butter", zone: "Green", prepTime: "5 mins", category: "Easy to Digest" },
  { id: "7", title: "Low-Flavour Chicken & Rice Soup", zone: "Green", prepTime: "10 mins", category: "Anti-Nausea" },
  { id: "8", title: "High-Protein Overnight Oats", zone: "Yellow", prepTime: "8 mins", category: "High Protein" },
  { id: "9", title: "Red Lentil & Spinach Dhal", zone: "Green", prepTime: "5 mins", category: "High Protein" },
  { id: "10", title: "Hydrating Watermelon & Mint Cooler", zone: "Red", prepTime: "3 mins", category: "Hydrating" },
  { id: "11", title: "The \"Crash\" Shake", zone: "Red", prepTime: "2 mins", category: "Zero-Prep" },
  { id: "12", title: "Energy Blitz Greek Yoghurt", zone: "Red", prepTime: "1 min", category: "Zero-Prep" },
  { id: "13", title: "Sardine \"Emergency\" Toast", zone: "Yellow", prepTime: "3 mins", category: "Quick Assembly" },
  { id: "14", title: "Fortified Milky Drink", zone: "Red", prepTime: "2 mins", category: "Zero-Prep" },
  { id: "15", title: "Custard & Pear Cup", zone: "Red", prepTime: "1 min", category: "Zero-Prep" },
  { id: "16", title: "Creamed Rice Cup", zone: "Red", prepTime: "1 min", category: "Zero-Prep" },
  { id: "17", title: "Microwave Beans & Cheese", zone: "Yellow", prepTime: "2 mins", category: "Quick Assembly" },
];

export const RECIPE_PREFERENCE_BY_CATEGORY: Record<RecipeCategory, RecipePreference> = {
  "High Protein": "high_protein",
  "Easy to Digest": "easy_to_digest",
  Hydrating: "hydrating",
  "Anti-Nausea": "anti_nausea",
  "Zero-Prep": "zero_prep",
  "Quick Assembly": "quick_assembly",
  "Balanced Fuel": "any",
};

const MOVEMENT_PREFERENCES = new Set<MovementPreference>([
  "any",
  "walking",
  "seated",
  "lying_down",
  "strength",
  "mobility",
  "balance",
  "breathing",
]);

const RECIPE_PREFERENCES = new Set<RecipePreference>([
  "any",
  "high_protein",
  "easy_to_digest",
  "hydrating",
  "anti_nausea",
  "zero_prep",
  "quick_assembly",
]);

const getZoneName = (fatigueZone: ChatContext["fatigueZone"]): ZoneName | null => {
  if (fatigueZone === "🟢 Green") return "Green";
  if (fatigueZone === "🟡 Yellow") return "Yellow";
  if (fatigueZone === "🔴 Red") return "Red";
  return null;
};

const normaliseMovementPreference = (value: unknown): MovementPreference =>
  typeof value === "string" && MOVEMENT_PREFERENCES.has(value as MovementPreference)
    ? (value as MovementPreference)
    : "any";

const normaliseRecipePreference = (value: unknown): RecipePreference =>
  typeof value === "string" && RECIPE_PREFERENCES.has(value as RecipePreference)
    ? (value as RecipePreference)
    : "any";

const normaliseRecommendationCount = (value: unknown): number => {
  if (!Number.isInteger(value)) return 3;
  return Math.min(3, Math.max(1, value as number));
};

export const recommendMovements = (
  fatigueZone: ChatContext["fatigueZone"],
  preferenceInput: unknown = "any",
  countInput: unknown = 3,
) => {
  const zone = getZoneName(fatigueZone);
  const preference = normaliseMovementPreference(preferenceInput);
  const count = normaliseRecommendationCount(countInput);

  if (!zone) {
    return {
      status: "needs_fatigue_score" as const,
      kind: "movement" as const,
      items: [],
      message: "No current fatigue band is available, so Fit for Cancer will not guess an exercise intensity.",
    };
  }

  const sameZone = MOVEMENT_RECOMMENDATION_CATALOG.filter((item) => item.zone === zone);
  const preferred = preference === "any"
    ? sameZone
    : sameZone.filter((item) => item.preferences.includes(preference));
  const preferenceMatched = preference === "any" || preferred.length > 0;
  const items = (preferenceMatched ? preferred : sameZone).slice(0, count).map(({ preferences: _preferences, ...item }) => item);

  return {
    status: "ok" as const,
    kind: "movement" as const,
    zone,
    preference,
    preferenceMatched,
    items,
  };
};

export const recommendRecipes = (
  fatigueZone: ChatContext["fatigueZone"],
  preferenceInput: unknown = "any",
  countInput: unknown = 3,
) => {
  const zone = getZoneName(fatigueZone);
  const preference = normaliseRecipePreference(preferenceInput);
  const count = normaliseRecommendationCount(countInput);

  if (!zone) {
    return {
      status: "needs_fatigue_score" as const,
      kind: "recipe" as const,
      items: [],
      message: "No current fatigue band is available, so Fit for Cancer will not guess a recipe effort level.",
    };
  }

  const sameZone = RECIPE_RECOMMENDATION_CATALOG.filter((item) => item.zone === zone);
  const preferred = preference === "any"
    ? sameZone
    : sameZone.filter((item) => RECIPE_PREFERENCE_BY_CATEGORY[item.category] === preference);
  const preferenceMatched = preference === "any" || preferred.length > 0;
  const items = (preferenceMatched ? preferred : sameZone).slice(0, count);

  return {
    status: "ok" as const,
    kind: "recipe" as const,
    zone,
    preference,
    preferenceMatched,
    items,
  };
};

export const ATHENA_RECOMMENDATION_TOOL_DECLARATIONS = [
  {
    name: "recommend_movement",
    description:
      "Return real movement items already built into Fit for Cancer, constrained to the user's current fatigue band. Use this when ATHENA wants to recommend a specific in-app movement or exercise. The app, not the model, chooses the catalogue items.",
    parameters: {
      type: "OBJECT",
      properties: {
        preference: {
          type: "STRING",
          enum: ["any", "walking", "seated", "lying_down", "strength", "mobility", "balance", "breathing"],
          description: "Optional movement preference inferred from the user's request. Use any when no specific format is requested.",
        },
        count: {
          type: "INTEGER",
          description: "Optional number of movement recommendations explicitly requested by the user. Use 1, 2 or 3. Omit when the user did not specify a quantity.",
        },
      },
    },
  },
  {
    name: "recommend_recipe",
    description:
      "Return real recipes already built into Fit for Cancer, constrained to the user's current fatigue band. Use this when ATHENA wants to recommend a specific in-app food or recipe. The app, not the model, chooses the catalogue items.",
    parameters: {
      type: "OBJECT",
      properties: {
        preference: {
          type: "STRING",
          enum: ["any", "high_protein", "easy_to_digest", "hydrating", "anti_nausea", "zero_prep", "quick_assembly"],
          description: "Optional recipe preference inferred from the user's request. Use any when no specific category is requested.",
        },
        count: {
          type: "INTEGER",
          description: "Optional number of recipe recommendations explicitly requested by the user. Use 1, 2 or 3. Omit when the user did not specify a quantity.",
        },
      },
    },
  },
];

export const executeAthenaRecommendationTool = (
  name: unknown,
  args: unknown,
  fatigueZone: ChatContext["fatigueZone"],
): { response: Record<string, unknown>; refs: RecommendationRef[] } => {
  const safeArgs = args && typeof args === "object" && !Array.isArray(args)
    ? (args as Record<string, unknown>)
    : {};

  if (name === "recommend_movement") {
    const response = recommendMovements(fatigueZone, safeArgs.preference, safeArgs.count);
    return {
      response,
      refs: response.status === "ok"
        ? response.items.map((item) => ({ kind: "movement" as const, id: item.id }))
        : [],
    };
  }

  if (name === "recommend_recipe") {
    const response = recommendRecipes(fatigueZone, safeArgs.preference, safeArgs.count);
    return {
      response,
      refs: response.status === "ok"
        ? response.items.map((item) => ({ kind: "recipe" as const, id: item.id }))
        : [],
    };
  }

  return {
    response: {
      status: "error",
      message: "Unknown Fit for Cancer recommendation tool.",
    },
    refs: [],
  };
};
