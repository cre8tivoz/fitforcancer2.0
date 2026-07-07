import { useState, useCallback, useRef } from 'react';

interface UsePdfGeneratingOptions {
  filename?: string;
  onGenerate?: () => void;
}

export function usePdfGenerating(options?: UsePdfGeneratingOptions) {
  const [generating, setGenerating] = useState(false);
  const resetTimer = useRef<number | null>(null);

  const handleGenerate = useCallback(() => {
    if (generating) return;

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }

    setGenerating(true);
    try {
      options?.onGenerate?.();
    } finally {
      resetTimer.current = window.setTimeout(() => {
        setGenerating(false);
        resetTimer.current = null;
      }, 1000);
    }
  }, [generating, options?.onGenerate]);

  return { generating, handleGenerate };
}
