import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
  selectLanguage,
  supportedLanguage,
} from "./i18n";

const LANGUAGE_OPTIONS: ReadonlyArray<Readonly<{ code: SupportedLanguage; name: string }>> = [
  { code: "en", name: "English" },
  { code: "it", name: "Italiano" },
];

export function LanguageSelector(): JSX.Element {
  const { t, i18n } = useTranslation();
  const selected = supportedLanguage(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LANGUAGE;

  return (
    <fieldset className="language-selector">
      <legend>{t("language.label")}</legend>
      <div className="language-selector__options">
        {LANGUAGE_OPTIONS.map(({ code, name }) => (
          <button
            type="button"
            aria-pressed={selected === code}
            key={code}
            lang={code}
            onClick={() => void selectLanguage(code)}
          >
            {name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
