import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";
import { initializeI18n } from "./i18n/i18n";

beforeAll(async () => {
  await initializeI18n();
});
