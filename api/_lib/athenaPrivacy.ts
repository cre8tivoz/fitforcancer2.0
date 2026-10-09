/** Metadata-only production diagnostics. Unknown fields and arbitrary text are dropped. */
export function safeAthenaMetadata(input: Record<string, unknown>): Record<string, string | number | boolean> {
  const enums: Record<string, ReadonlySet<string>> = {
    model: new Set(["gemini-2.5-flash"]),
    transport: new Set(["google-generate-content"]),
    finishReason: new Set(["stop", "tool-calls", "length", "blocked", "unknown", "error"]),
    errorCategory: new Set(["timeout", "aborted", "upstream", "invalid-response", "rate-limit", "configuration"]),
  };
  const numbers = ["callCount", "recoveryCount", "durationMs", "inputTokens", "outputTokens"] as const;
  const result: Record<string, string | number | boolean> = {};
  if (typeof input.requestId === "string" && /^[a-f0-9]{12}$/.test(input.requestId)) result.requestId = input.requestId;
  for (const [key, choices] of Object.entries(enums)) {
    if (typeof input[key] === "string" && choices.has(input[key] as string)) result[key] = input[key] as string;
  }
  for (const key of numbers) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) result[key] = value;
  }
  return result;
}
