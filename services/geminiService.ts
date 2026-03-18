import { ChatContext, ChatMessage } from "../types";

const UNAUTHORIZED_MESSAGE = "Incorrect password. Please re-enter it to continue using the health assistant.";

const parseJson = async (response: Response) => response.json().catch(() => null);

export const validateChatPassword = async (accessPassword: string) => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chat-password": accessPassword,
      },
      body: JSON.stringify({
        accessPassword,
        validateOnly: true,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Chat password validation error:", error);
    return false;
  }
};

export const getGeminiResponse = async (history: ChatMessage[], accessPassword: string, context?: ChatContext) => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chat-password": accessPassword,
      },
      body: JSON.stringify({
        history,
        context,
        cancerType: context?.cancerType,
        accessPassword,
      }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      if (response.status === 401) {
        return UNAUTHORIZED_MESSAGE;
      }

      return data?.error || "There was an error connecting to the health assistant. Please check your connection.";
    }

    return data?.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API proxy error:", error);
    return "There was an error connecting to the health assistant. Please check your connection.";
  }
};
