import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";
import { initializeI18n } from "./i18n/i18n";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: createMemoryStorage(),
});

beforeAll(async () => {
  await initializeI18n();
});
