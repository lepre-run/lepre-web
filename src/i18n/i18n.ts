import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { english } from "./locales/en";
import { italian } from "./locales/it";

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "it"] as const;
export const LANGUAGE_STORAGE_KEY = "lepre.language";

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function supportedLanguage(language: string | null | undefined): SupportedLanguage | null {
  const baseLanguage = language?.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.find((supported) => supported === baseLanguage) ?? null;
}

export function resolveLanguage(
  savedLanguage: string | null,
  preferredLanguages: ReadonlyArray<string>,
): SupportedLanguage {
  const saved = supportedLanguage(savedLanguage);
  if (saved) return saved;

  for (const preference of preferredLanguages) {
    const detected = supportedLanguage(preference);
    if (detected) return detected;
  }
  return DEFAULT_LANGUAGE;
}

function savedLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function browserLanguages(): ReadonlyArray<string> {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages.length > 0) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

function detectedLanguage(): SupportedLanguage {
  return resolveLanguage(savedLanguage(), browserLanguages());
}

function reflectDocumentLanguage(language: string): void {
  if (typeof document === "undefined") return;
  const resolved = supportedLanguage(language) ?? DEFAULT_LANGUAGE;
  document.documentElement.lang = resolved;
  document.documentElement.dir = i18n.dir(resolved);
}

function saveLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // A blocked storage API should not prevent the language from changing.
  }
}

export function localeFor(language: string = DEFAULT_LANGUAGE): string {
  return language.toLowerCase().startsWith("it") ? "it-IT" : "en-US";
}

export async function initializeI18n(): Promise<void> {
  if (i18n.isInitialized) return;
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: english },
      it: { translation: italian },
    },
    lng: detectedLanguage(),
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  reflectDocumentLanguage(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
  i18n.on("languageChanged", reflectDocumentLanguage);
}

export async function selectLanguage(language: SupportedLanguage): Promise<void> {
  saveLanguage(language);
  await i18n.changeLanguage(language);
}

export { i18n };
