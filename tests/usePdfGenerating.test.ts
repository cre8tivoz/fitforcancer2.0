import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePdfGenerating } from '../hooks/usePdfGenerating';
import { renderHook, act } from '@testing-library/react';

describe('usePdfGenerating', () => {
  vi.useFakeTimers();

  it('starts with generating=false', () => {
    const { result } = renderHook(() => usePdfGenerating());
    expect(result.current.generating).toBe(false);
  });

  it('sets generating to true on handleGenerate', () => {
    const { result } = renderHook(() => usePdfGenerating());
    act(() => {
      result.current.handleGenerate();
    });
    expect(result.current.generating).toBe(true);
  });

  it('calls the onGenerate callback', () => {
    const onGenerate = vi.fn();
    const { result } = renderHook(() => usePdfGenerating({ onGenerate }));
    act(() => {
      result.current.handleGenerate();
    });
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('resets generating to false after timeout', () => {
    const { result } = renderHook(() => usePdfGenerating());
    act(() => {
      result.current.handleGenerate();
    });
    expect(result.current.generating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1001);
    });

    expect(result.current.generating).toBe(false);
  });

  it('ignores subsequent calls while generating', () => {
    const onGenerate = vi.fn();
    const { result } = renderHook(() => usePdfGenerating({ onGenerate }));
    act(() => {
      result.current.handleGenerate();
    });
    act(() => {
      result.current.handleGenerate();
    });
    act(() => {
      result.current.handleGenerate();
    });
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
