import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// vitest 4.x + happy-dom 20.x ships a broken window.localStorage that
// is a bare object with no Storage prototype methods. Polyfill it with
// a proper in-memory implementation so the test environment works.
if (typeof window !== "undefined") {
  const store = new Map<string, string>();
  window.localStorage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store.clear();
    },
    get length(): number {
      return store.size;
    },
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null,
  };
}

// ─── Browser API mocks for component tests ─────────────────
if (typeof window !== "undefined") {
  // document/element scrolling
  window.scrollTo = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = () => undefined;
  window.HTMLElement.prototype.scrollTo = () => undefined;

  // matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });

  // IntersectionObserver
  class IntersectionObserverMock implements IntersectionObserver {
    root: Element | null = null;
    rootMargin: string = "";
    thresholds: ReadonlyArray<number> = [];
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
    takeRecords = () => [];
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverMock,
  });

  // SpeechRecognition
  class SpeechRecognitionMock {
    continuous = false;
    interimResults = false;
    lang = "en-AU";
    onresult: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onend: (() => void) | null = null;
    start = vi.fn();
    stop = vi.fn();
  }
  Object.defineProperty(window, "SpeechRecognition", {
    writable: true,
    value: SpeechRecognitionMock,
  });
  Object.defineProperty(window, "webkitSpeechRecognition", {
    writable: true,
    value: SpeechRecognitionMock,
  });
}

// ─── ResizeObserver ────────────────────────────────────────
if (typeof global !== "undefined") {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(global, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });
}
