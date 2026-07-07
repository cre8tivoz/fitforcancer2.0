import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatContext } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { saveDailyCheckIn } from '../utils/patientContextStorage';
import { getFatigueZone } from '../utils/fatigueScore';

export interface UseChatOptions {
  initialFatigueScore?: number | null;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: (userPrompt?: string) => Promise<void>;
  resetChat: () => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'model',
  content:
    "Hello, I'm your Fit For Cancer assistant. I provide evidence-based oncology exercise and nutrition guidance.\n\nTo get started, **on a scale of 0-10, how is your fatigue today?**\n\n| Score | Zone | Guidance |\n| :--- | :--- | :--- |\n| 🟢 0-3 | Green | Mild: Energy levels are good |\n| 🟡 4-6 | Yellow | Moderate: Energy is dipping |\n| 🔴 7-10 | Red | Severe: Critical fatigue |\n\nPlease also provide a **Quick Note** about your current context (e.g., 'Post-treatment' or 'Poor sleep').",
};

export function useChat(options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (userPrompt?: string) => {
      const textToSend = userPrompt || input;
      if (!textToSend.trim() || isLoading) return;

      const userMessage: ChatMessage = { role: 'user', content: textToSend };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      setIsLoading(true);

      try {
        const context: ChatContext = {
          fatigueScore: options?.initialFatigueScore ?? null,
          fatigueZone: options?.initialFatigueScore != null ? getFatigueZone(options.initialFatigueScore) : null,
          isMyelomaPatient: false,
        };
        const aiResponse = await getGeminiResponse(newMessages, context);
        setMessages((prev) => [...prev, { role: 'model', content: aiResponse }]);
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: "There was an error connecting to the health assistant. Please check your connection.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, input, isLoading, options?.initialFatigueScore]
  );

  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setIsLoading(false);
  }, []);

  return { messages, input, setInput, isLoading, sendMessage, resetChat };
}
