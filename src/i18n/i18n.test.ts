import i18n from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { selectLanguage } from "./i18n";
import { resolveLanguage, supportedLanguage } from "./language-detection";

const LANGUAGE_STORAGE_KEY = "lepre.language";

afterEach(async () => {
  vi.restoreAllMocks();
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

  it("changes language and reports when browser storage is unavailable", async () => {
    const storageError = new DOMException("Storage is blocked", "SecurityError");
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw storageError;
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(selectLanguage("it")).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledWith("Could not persist language preference.", storageError);
    expect(i18n.resolvedLanguage).toBe("it");
    expect(document.documentElement).toHaveAttribute("lang", "it");
  });
});
