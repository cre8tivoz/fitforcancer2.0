import { useState } from 'react';
import type React from 'react';
import type { ChatMessage } from '../types';

export const INITIAL_ATHENA_MESSAGE =
  "Hi, I'm ATHENA — your treatment-day companion. How's your energy today? Choose a number from 0–10 and we'll go from there.";

export const buildInitialAthenaMessages = (score: number | null): ChatMessage[] => [
  {
    role: 'model',
    content:
      score === null
        ? INITIAL_ATHENA_MESSAGE
        : `Hi, I'm ATHENA — your treatment-day companion. I see your energy is set to ${score} today. What would you like help with first — nutrition, movement, or just a chat?`,
  },
];

export interface AthenaSessionState {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  hasStartedConversation: boolean;
  setHasStartedConversation: React.Dispatch<React.SetStateAction<boolean>>;
  reset: (score?: number | null) => void;
}

export const useAthenaSession = (initialScore: number | null): AthenaSessionState => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialAthenaMessages(initialScore));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  const reset = (score: number | null = null) => {
    setMessages(buildInitialAthenaMessages(score));
    setInput('');
    setIsLoading(false);
    setHasStartedConversation(false);
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    hasStartedConversation,
    setHasStartedConversation,
    reset,
  };
};
