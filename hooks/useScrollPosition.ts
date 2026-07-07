import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'page-scroll-positions';

export interface ScrollPositionManager {
  capture: () => void;
  restore: () => void;
  clear: () => void;
}

export function useScrollPosition(callback?: (entry: number) => void): ScrollPositionManager {
  const positionsRef = useRef<Record<string, number>>({});

  const capture = useCallback(() => {
    if (typeof window === 'undefined') return;
    positionsRef.current[pathname()] = window.scrollY;
  }, []);

  const restore = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = positionsRef.current[pathname()];
    if (saved !== undefined && saved > 0) {
      window.scrollTo({ top: saved, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const clear = useCallback(() => {
    positionsRef.current = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY + '-' + pathname());
    }
  }, []);

  return { capture, restore, clear };
}

const pathname = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
