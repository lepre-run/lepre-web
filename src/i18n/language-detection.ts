export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "it"] as const;

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
