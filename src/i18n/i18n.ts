import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { english } from "./locales/en";
import { italian } from "./locales/it";

export const DEFAULT_LANGUAGE = "en";

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
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export { i18n };
