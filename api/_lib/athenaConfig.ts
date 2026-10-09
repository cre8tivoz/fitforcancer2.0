export const ATHENA_MODEL = "gemini-2.5-flash";
export const ATHENA_TIMEOUT_MS = 25_000;
export const ATHENA_GENERATION_SETTINGS = {
  temperature: 0.7,
  maxOutputTokens: 512,
} as const;
export const ATHENA_GOOGLE_OPTIONS = {
  thinkingConfig: { thinkingBudget: 0 },
} as const;

// Server-only rollout switch. Unknown values fail closed to the legacy path.
export const getAthenaTransport = (): "legacy" | "sdk" =>
  process.env.ATHENA_TRANSPORT === "sdk" ? "sdk" : "legacy";
