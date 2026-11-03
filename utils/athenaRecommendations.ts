import { ATHENA_RECIPE_INGREDIENTS } from "./athenaRecipeIngredients.js";
import type { ChatContext, Recipe } from "../types";

export type RecommendationKind = "movement" | "recipe";
export type RecommendationRef = { kind: RecommendationKind; id: string };

export interface RecipeConstraints { mealOnly?: boolean; solidOnly?: boolean; vegan?: boolean; vegetarian?: boolean; excludedAllergens?: string[] }
const ALLERGENS: Record<string, RegExp> = {
  peanut: /peanuts?/, tree_nut: /almonds?|cashews?|walnuts?|hazelnuts?|pecans?|pistachios?|macadamias?|brazil nuts?/,
  milk: /milk|cream|yog[uh]?urt|yoghurt|cheese|feta|butter|custard|parmesan|milo|horlicks/,
  egg: /\beggs?\b/, fish: /fish|sardines?|salmon|tuna/, shellfish: /shellfish|prawns?|shrimp|crab|lobster/,
  wheat: /wheat|gluten|flour|bread|toast|spaghetti|fettuccine|oats|milo|horlicks/,
  sesame: /sesame|tahini/, soy: /soy|soya|tofu/,
};
const ALLERGEN_NAMES: Record<string, RegExp> = { ...ALLERGENS,
  peanut: /peanuts?|nuts?/,
  milk: /milk|dairy|lactose/, wheat: /wheat|gluten|coeliac|celiac/,
  tree_nut: /(?:tree )?nuts?|almonds?|cashews?|walnuts?|hazelnuts?|pecans?|pistachios?|macadamias?/,
};
const DRINK_IDS = new Set(['1','10','11','14']);
const MEAL_IDS = new Set(['5','6','7','8','9','13','17']);
// Existing catalogue options with protein ingredients; not a nutrient-content guarantee.
const PROTEIN_IDS = new Set(['1','5','8','9','11','12','13','14','17']);

// Conservatively retain explicit food restrictions from user turns. Model prose
// cannot remove them. This screens listed ingredients, not manufacturing labels
// or cross-contact, and must never be presented as allergy certification.
export const deriveRecipeConstraints = (history: readonly { role: string; content: string }[]): RecipeConstraints => {
  const result: RecipeConstraints = {}; const allergens = new Set<string>();
  for (const turn of history) {
    if (turn.role !== 'user') continue;
    const text = turn.content.toLowerCase();
    if (/\bvegan\b/.test(text) && !/not (?:a )?vegan/.test(text)) result.vegan = true;
    if (/\bvegetarian\b/.test(text) && !/not (?:a )?vegetarian/.test(text)) result.vegetarian = true;
    for (const [name, pattern] of Object.entries(ALLERGEN_NAMES)) {
      const ingredient = `\\b(?:${pattern.source})\\b`;
      const negated = new RegExp(`(?:not allergic to|no allergy to)\\s+(?:${pattern.source})|no\\s+(?:${pattern.source})\\s+allergy`).test(text);
      const stated = new RegExp(`(?:allerg\\w*|anaphyla\\w*|intoleran\\w*|avoid|can't (?:eat|have)|cannot (?:eat|have)).{0,35}${ingredient}|${ingredient}.{0,20}(?:allerg\\w*|intoleran\\w*)|(?:no|without)\\s+(?:any\\s+)?${ingredient}|${ingredient}[- ]free`).test(text);
      if (stated && !negated) allergens.add(name);
    }
    if (/\bmeal\b|\blunch\b|\bdinner\b|\bbreakfast\b/.test(text)) result.mealOnly = true;
    if (/something (?:i can |to )?eat|not a drink|solid food/.test(text)) result.solidOnly = true;
    if (!/not|\bno\b|without|rather than/.test(text) && /(?:want|like|recommend|suggest|have|need).{0,25}(?:drink|smoothie|shake|cooler)/.test(text)) { result.mealOnly = false; result.solidOnly = false; }
  }
  if (allergens.size) result.excludedAllergens = [...allergens];
  return result;
};

const recipeMatchesConstraints = (id: string, constraints: RecipeConstraints): boolean => {
  const ingredients = ATHENA_RECIPE_INGREDIENTS[id];
  if (!ingredients) return false;
  const text = ingredients.join(' ').toLowerCase();
  if (constraints.mealOnly && !MEAL_IDS.has(id)) return false;
  if (constraints.solidOnly && DRINK_IDS.has(id)) return false;
  if (constraints.vegan && /milk|cream|yoghurt|yogurt|cheese|feta|butter|custard|parmesan|eggs?|chicken|fish|sardine|honey|milo|horlicks/.test(text)) return false;
  if (constraints.vegetarian && /chicken|fish|sardine|beef|pork|lamb/.test(text)) return false;
  return !(constraints.excludedAllergens || []).some(name => ALLERGENS[name]?.test(text));
};

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

const normaliseExcludedIds = (value: readonly string[]): Set<string> =>
  new Set(value.filter((id) => typeof id === "string" && id.length > 0));

export const recommendMovements = (
  fatigueZone: ChatContext["fatigueZone"],
  preferenceInput: unknown = "any",
  countInput: unknown = 3,
  excludedIdsInput: readonly string[] = [],
) => {
  const zone = getZoneName(fatigueZone);
  const preference = normaliseMovementPreference(preferenceInput);
  const count = normaliseRecommendationCount(countInput);
  const excludedIds = normaliseExcludedIds(excludedIdsInput);

  if (!zone) {
    return {
      status: "needs_fatigue_score" as const,
      kind: "movement" as const,
      items: [],
      message: "No current fatigue band is available, so Fit for Cancer will not guess an exercise intensity.",
    };
  }

  const sameZoneAll = MOVEMENT_RECOMMENDATION_CATALOG.filter((item) => item.zone === zone);
  const sameZone = sameZoneAll.filter((item) => !excludedIds.has(item.id));

  if (sameZone.length === 0 && sameZoneAll.length > 0 && excludedIds.size > 0) {
    return {
      status: "no_new_results" as const,
      kind: "movement" as const,
      zone,
      preference,
      items: [],
      message: "No unseen movement recommendations remain in the current fatigue band.",
    };
  }

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
  excludedIdsInput: readonly string[] = [],
  constraints: RecipeConstraints = {},
) => {
  const zone = getZoneName(fatigueZone);
  const preference = normaliseRecipePreference(preferenceInput);
  const count = normaliseRecommendationCount(countInput);
  const excludedIds = normaliseExcludedIds(excludedIdsInput);

  if (!zone) {
    return {
      status: "needs_fatigue_score" as const,
      kind: "recipe" as const,
      items: [],
      message: "No current fatigue band is available, so Fit for Cancer will not guess a recipe effort level.",
    };
  }

  const sameZoneAll = RECIPE_RECOMMENDATION_CATALOG.filter((item) => item.zone === zone && recipeMatchesConstraints(item.id, constraints));
  const sameZone = sameZoneAll.filter((item) => !excludedIds.has(item.id));

  if (sameZone.length === 0 && sameZoneAll.length > 0 && excludedIds.size > 0) {
    return {
      status: "no_new_results" as const,
      kind: "recipe" as const,
      zone,
      preference,
      items: [],
      message: "No unseen recipe recommendations remain in the current fatigue band.",
    };
  }

  const preferred = preference === "any"
    ? sameZone
    : sameZone.filter((item) => (preference === "high_protein" ? PROTEIN_IDS.has(item.id) : RECIPE_PREFERENCE_BY_CATEGORY[item.category] === preference));
  const preferenceMatched = preference === "any" || preferred.length > 0;
  const items = (preferenceMatched ? preferred : sameZone).slice(0, count).map(item => ({
    ...item, ingredients: ATHENA_RECIPE_INGREDIENTS[item.id],
    format: DRINK_IDS.has(item.id) ? 'drink' : MEAL_IDS.has(item.id) ? 'meal' : 'snack',
  }));
  if (!items.length) return {
    status: 'no_suitable_results' as const, kind: 'recipe' as const, zone, preference, items: [],
    message: 'No catalogue recipe matches the stated food restrictions and meal request in this fatigue band. Explain the gap honestly and offer a simple general idea if useful. Do not substitute an unsuitable item, claim another search is running, or call tools again.',
  };

  return {
    status: "ok" as const,
    kind: "recipe" as const,
    zone,
    preference,
    preferenceMatched,
    safetyNote: 'Listed ingredients only: check actual product labels and cross-contact advice for allergies. Never guarantee an item is allergy-safe.',
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
        avoid_previous: {
          type: "BOOLEAN",
          description: "Set true when the user explicitly asks for another, different or new movement option, or points out that a previous movement was repeated. Fit For Cancer derives the IDs to exclude from conversation history.",
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
        avoid_previous: {
          type: "BOOLEAN",
          description: "Set true when the user explicitly asks for another, different or new recipe/food option, or points out that a previous recipe was repeated. Fit For Cancer derives the IDs to exclude from conversation history.",
        },
      },
    },
  },
];

export const executeAthenaRecommendationTool = (
  name: unknown,
  args: unknown,
  fatigueZone: ChatContext["fatigueZone"],
  previousRecommendations: readonly RecommendationRef[] = [],
  constraints: RecipeConstraints = {},
): { response: Record<string, unknown>; refs: RecommendationRef[] } => {
  const safeArgs = args && typeof args === "object" && !Array.isArray(args)
    ? (args as Record<string, unknown>)
    : {};

  if (name === "recommend_movement") {
    const excludedIds = safeArgs.avoid_previous === true
      ? previousRecommendations.filter((ref) => ref.kind === "movement").map((ref) => ref.id)
      : [];
    const response = recommendMovements(fatigueZone, safeArgs.preference, safeArgs.count, excludedIds);
    return {
      response,
      refs: response.status === "ok"
        ? response.items.map((item) => ({ kind: "movement" as const, id: item.id }))
        : [],
    };
  }

  if (name === "recommend_recipe") {
    const excludedIds = safeArgs.avoid_previous === true
      ? previousRecommendations.filter((ref) => ref.kind === "recipe").map((ref) => ref.id)
      : [];
    const response = recommendRecipes(fatigueZone, safeArgs.preference, safeArgs.count, excludedIds, constraints);
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
