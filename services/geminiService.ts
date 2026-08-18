import { AthenaRecommendationRef, ChatContext, ChatMessage } from "../types";

const parseJson = async (response: Response) => response.json().catch(() => null);

const ACCESS_PASSWORD_STORAGE_KEY = "fit-for-cancer-chat-access-password";

interface GeminiClientData {
  error?: string;
  text?: string;
  recommendations?: AthenaRecommendationRef[];
}

export interface GeminiClientResponse {
  text: string;
  recommendations: AthenaRecommendationRef[];
}

const fetchWithPassword = async (
  history: ChatMessage[],
  context: ChatContext | undefined,
  password: string | null,
): Promise<{ ok: boolean; status: number; data: GeminiClientData | null }> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (password) {
    headers["x-chat-access-password"] = password;
  }

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers,
    body: JSON.stringify({
      history,
      context,
      cancerType: context?.cancerType,
    }),
  });

  const data = await parseJson(response);
  return { ok: response.ok, status: response.status, data };
};

const normaliseRecommendations = (value: unknown): AthenaRecommendationRef[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.filter((item): item is AthenaRecommendationRef => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    if ((candidate.kind !== "movement" && candidate.kind !== "recipe") || typeof candidate.id !== "string" || !candidate.id) {
      return false;
    }
    const key = `${candidate.kind}:${candidate.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toClientResponse = (data: GeminiClientData | null, fallback: string): GeminiClientResponse => ({
  text: data?.text || data?.error || fallback,
  recommendations: normaliseRecommendations(data?.recommendations),
});

export const getGeminiResponsePayload = async (
  history: ChatMessage[],
  context?: ChatContext,
): Promise<GeminiClientResponse> => {
  const fallback = "There was an error connecting to ATHENA. Please check your connection.";

  try {
    const storedPassword =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY)
        : null;

    const result = await fetchWithPassword(history, context, storedPassword);

    // If 401 and we have a stored password, prompt and retry once
    if (result.status === 401 && typeof window !== "undefined") {
      const userPassword = window.prompt(
        "ATHENA is access-restricted. Enter the access password:",
      );
      if (userPassword) {
        window.sessionStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, userPassword);
        const retryResult = await fetchWithPassword(history, context, userPassword);
        if (retryResult.ok) {
          return toClientResponse(
            retryResult.data,
            "I'm sorry, I couldn't generate a response. Please try again.",
          );
        }
        // Retry also 401 — remove stored password, show server error
        if (retryResult.status === 401) {
          window.sessionStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
        }
        return toClientResponse(retryResult.data, fallback);
      }
      // User cancelled the prompt
      return toClientResponse(result.data, fallback);
    }

    if (!result.ok) {
      return toClientResponse(result.data, fallback);
    }

    return toClientResponse(
      result.data,
      "I'm sorry, I couldn't generate a response. Please try again.",
    );
  } catch (error) {
    console.error("Gemini API proxy error:", error);
    return { text: fallback, recommendations: [] };
  }
};

// Backwards-compatible text-only helper for any callers that do not need
// structured recommendation refs.
export const getGeminiResponse = async (history: ChatMessage[], context?: ChatContext) =>
  (await getGeminiResponsePayload(history, context)).text;
