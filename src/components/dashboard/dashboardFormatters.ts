import type { TFunction } from "i18next";
import type { IntervalFormatInsight } from "../../domain/training-dashboard";
import { formatStageMeasure } from "../../i18n/formatters";
import { localeFor } from "../../i18n/i18n";

export function paceValue(secondsPerKilometer: number): string {
  const rounded = Math.round(secondsPerKilometer);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${(rounded % 60).toString().padStart(2, "0")}`;
}

export function decimal(value: number, language: string, digits = 1): string {
  return new Intl.NumberFormat(localeFor(language), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function intervalProtocol(
  format: IntervalFormatInsight,
  language: string,
  t: TFunction,
): string {
  return t("dashboard.intervals.protocol", {
    repetitions: format.repetitions,
    work: formatStageMeasure(format.work, language),
    recovery: formatStageMeasure(format.recovery, language),
    variation: decimal(format.repetitionVariationPercent, language),
  });
}
