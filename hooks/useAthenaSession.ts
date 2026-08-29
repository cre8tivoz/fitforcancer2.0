import { useCallback, useRef, useState } from 'react';
import type React from 'react';
import type { ChatMessage } from '../types';

export const INITIAL_ATHENA_MESSAGE =
  "Hi, I'm ATHENA — your treatment-day companion. How's your fatigue today? Choose 0–10, where 0 means no fatigue and 10 means the worst fatigue.";

export const buildInitialAthenaMessages = (score: number | null): ChatMessage[] => [
  {
    role: 'model',
    content:
      score === null
        ? INITIAL_ATHENA_MESSAGE
        : `Hi, I'm ATHENA — your treatment-day companion. I see your fatigue is set to ${score}/10 today. What would you like help with first — nutrition, movement, or just a chat?`,
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
  getGeneration: () => number;
  isCurrentGeneration: (generation: number) => boolean;
  reset: (score?: number | null) => void;
}

export const useAthenaSession = (initialScore: number | null): AthenaSessionState => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialAthenaMessages(initialScore));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const generationRef = useRef(0);

  const getGeneration = useCallback(() => generationRef.current, []);
  const isCurrentGeneration = useCallback((generation: number) => generationRef.current === generation, []);

  const reset = useCallback((score: number | null = null) => {
    // Invalidate any async reply that started before this reset. The network
    // request may still finish, but its completion must not repopulate a
    // conversation the user has explicitly cleared.
    generationRef.current += 1;
    setMessages(buildInitialAthenaMessages(score));
    setInput('');
    setIsLoading(false);
    setHasStartedConversation(false);
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    hasStartedConversation,
    setHasStartedConversation,
    getGeneration,
    isCurrentGeneration,
    reset,
  };
};
