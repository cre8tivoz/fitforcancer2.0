import { ChatContext, ChatMessage } from "../types";

const parseJson = async (response: Response) => response.json().catch(() => null);

const ACCESS_PASSWORD_STORAGE_KEY = "fit-for-cancer-chat-access-password";

const fetchWithPassword = async (
  history: ChatMessage[],
  context: ChatContext | undefined,
  password: string | null,
): Promise<{ ok: boolean; status: number; data: { error?: string; text?: string } | null }> => {
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

export const getGeminiResponse = async (history: ChatMessage[], context?: ChatContext) => {
  try {
    const storedPassword =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY)
        : null;

    const result = await fetchWithPassword(history, context, storedPassword);

    // If 401 and we have a stored password, prompt and retry once
    if (result.status === 401 && typeof window !== "undefined") {
      const userPassword = window.prompt(
        "This chat is access-restricted. Enter the access password:",
      );
      if (userPassword) {
        window.sessionStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, userPassword);
        const retryResult = await fetchWithPassword(history, context, userPassword);
        if (retryResult.ok) {
          return retryResult.data?.text || "I'm sorry, I couldn't generate a response. Please try again.";
        }
        // Retry also 401 — remove stored password, show server error
        if (retryResult.status === 401) {
          window.sessionStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
        }
        return retryResult.data?.error || "There was an error connecting to the health assistant. Please check your connection.";
      }
      // User cancelled the prompt
      return result.data?.error || "There was an error connecting to the health assistant. Please check your connection.";
    }

    if (!result.ok) {
      return result.data?.error || "There was an error connecting to the health assistant. Please check your connection.";
    }

    return result.data?.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API proxy error:", error);
    return "There was an error connecting to the health assistant. Please check your connection.";
  }
};
