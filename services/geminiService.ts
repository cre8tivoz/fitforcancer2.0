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

interface AthenaStreamEvent {
  event: string;
  data: Record<string, unknown>;
}

const requestHeaders = (password: string | null, accept?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accept) headers.Accept = accept;
  if (password) headers["x-chat-access-password"] = password;
  return headers;
};

const requestBody = (history: ChatMessage[], context: ChatContext | undefined) =>
  JSON.stringify({
    history,
    context,
    cancerType: context?.cancerType,
  });

const fetchWithPassword = async (
  history: ChatMessage[],
  context: ChatContext | undefined,
  password: string | null,
): Promise<{ ok: boolean; status: number; data: GeminiClientData | null }> => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: requestHeaders(password),
    body: requestBody(history, context),
  });

  const data = await parseJson(response);
  return { ok: response.ok, status: response.status, data };
};

const fetchStreamWithPassword = (
  history: ChatMessage[],
  context: ChatContext | undefined,
  password: string | null,
) =>
  fetch("/api/gemini", {
    method: "POST",
    headers: requestHeaders(password, "text/event-stream"),
    body: requestBody(history, context),
  });

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

const getStoredPassword = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY)
    : null;

const promptForAccessPassword = () => {
  if (typeof window === "undefined") return null;
  return window.prompt("ATHENA is access-restricted. Enter the access password:");
};

const getStreamingResponse = async (
  history: ChatMessage[],
  context: ChatContext | undefined,
): Promise<Response> => {
  const storedPassword = getStoredPassword();
  let response = await fetchStreamWithPassword(history, context, storedPassword);

  if (response.status !== 401 || typeof window === "undefined") return response;

  const userPassword = promptForAccessPassword();
  if (!userPassword) return response;

  window.sessionStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, userPassword);
  response = await fetchStreamWithPassword(history, context, userPassword);
  if (response.status === 401) {
    window.sessionStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
  }
  return response;
};

const parseStreamBlock = (block: string): AthenaStreamEvent | null => {
  const lines = block.split("\n");
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() || "message";
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return null;

  try {
    return {
      event,
      data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
};

export const getGeminiStreamingResponsePayload = async (
  history: ChatMessage[],
  context: ChatContext | undefined,
  onText: (accumulatedText: string) => void,
): Promise<GeminiClientResponse> => {
  const fallback = "There was an error connecting to ATHENA. Please check your connection.";

  try {
    const response = await getStreamingResponse(history, context);
    if (!response.ok) {
      const data = await parseJson(response);
      return toClientResponse(data, fallback);
    }

    const contentType = response.headers?.get?.("content-type") || "";
    if (!contentType.includes("text/event-stream") || !response.body) {
      const data = await parseJson(response);
      const result = toClientResponse(data, fallback);
      if (result.text) onText(result.text);
      return result;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedText = "";
    let recommendations: AthenaRecommendationRef[] = [];
    let streamError: string | null = null;

    const handleBlock = (block: string) => {
      const parsed = parseStreamBlock(block);
      if (!parsed) return;

      if (parsed.event === "delta" && typeof parsed.data.text === "string") {
        accumulatedText += parsed.data.text;
        onText(accumulatedText);
        return;
      }

      if (parsed.event === "done") {
        recommendations = normaliseRecommendations(parsed.data.recommendations);
        return;
      }

      if (parsed.event === "error") {
        streamError = typeof parsed.data.error === "string" ? parsed.data.error : fallback;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);
        if (block) handleBlock(block);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) break;
    }

    const tail = buffer.trim();
    if (tail) handleBlock(tail);

    if (streamError) {
      throw new Error(streamError);
    }

    if (!accumulatedText.trim()) {
      throw new Error("ATHENA returned an empty response. Please try again.");
    }

    return {
      text: accumulatedText,
      recommendations,
    };
  } catch (error) {
    console.error("Gemini streaming proxy error:", error);
    throw error;
  }
};

export const getGeminiResponsePayload = async (
  history: ChatMessage[],
  context?: ChatContext,
): Promise<GeminiClientResponse> => {
  const fallback = "There was an error connecting to ATHENA. Please check your connection.";

  try {
    const storedPassword = getStoredPassword();
    const result = await fetchWithPassword(history, context, storedPassword);

    // If 401 and we have a stored password, prompt and retry once
    if (result.status === 401 && typeof window !== "undefined") {
      const userPassword = promptForAccessPassword();
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
