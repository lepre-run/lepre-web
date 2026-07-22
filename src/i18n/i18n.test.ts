import { afterEach, describe, expect, it } from "vitest";
import {
  i18n,
  LANGUAGE_STORAGE_KEY,
  resolveLanguage,
  selectLanguage,
  supportedLanguage,
} from "./i18n";

afterEach(async () => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage("en");
});

describe("interface language", () => {
  it("normalizes supported regional language tags", () => {
    expect(supportedLanguage("it-IT")).toBe("it");
    expect(supportedLanguage("en_GB")).toBe("en");
    expect(supportedLanguage("fr-FR")).toBeNull();
  });

  it("prefers a saved choice over browser preferences", () => {
    expect(resolveLanguage("en", ["it-IT", "en-US"])).toBe("en");
  });

  it("uses the first supported browser preference and otherwise falls back to English", () => {
    expect(resolveLanguage(null, ["fr-FR", "it-IT", "en-US"])).toBe("it");
    expect(resolveLanguage(null, ["fr-FR", "de-DE"])).toBe("en");
  });

  it("persists an explicit choice and reflects it on the document", async () => {
    await selectLanguage("it");

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
    expect(i18n.resolvedLanguage).toBe("it");
    expect(document.documentElement).toHaveAttribute("lang", "it");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
