import { vi } from "vitest";

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
