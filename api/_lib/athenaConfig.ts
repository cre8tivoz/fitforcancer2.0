export const ATHENA_MODEL = "gemini-3.5-flash-lite";
export const ATHENA_TIMEOUT_MS = 25_000;
// Shared ceiling includes thinking tokens; visible brevity remains in the prompt.
// Validate latency, token use and tone on a preview before release.
export const ATHENA_GENERATION_SETTINGS = {
  maxOutputTokens: 4096,
} as const;
export const ATHENA_GOOGLE_OPTIONS = {
  thinkingConfig: { thinkingLevel: "medium" },
} as const;

// Server-only rollout switch. Unknown values fail closed to the legacy path.
export const getAthenaTransport = (): "legacy" | "sdk" =>
  "sdk";
