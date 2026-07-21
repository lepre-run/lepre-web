import type { TFunction } from "i18next";
import type { ActualWorkoutStructure, StageMeasure } from "../domain/actual-workout-structure";
import type { LapAppearance } from "../domain/lap-appearance";
import { DEFAULT_LANGUAGE, localeFor } from "./i18n";

function decimal(
  value: number,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
  language: string,
) {
  return new Intl.NumberFormat(localeFor(language), {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatWorkoutDate(instant: string, language = DEFAULT_LANGUAGE): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(instant));
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
    : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number, language = DEFAULT_LANGUAGE): string {
  return meters >= 1_000
    ? `${decimal(meters / 1_000, 2, 2, language)} km`
    : `${decimal(Math.round(meters), 0, 0, language)} m`;
}

export function formatPace(seconds: number, meters: number): string {
  if (seconds <= 0 || meters <= 0) return "—";
  const secondsPerKilometer = Math.round((seconds / meters) * 1_000);
  const minutes = Math.floor(secondsPerKilometer / 60);
  const remainder = secondsPerKilometer % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")} /km`;
}

function formatStageDistance(meters: number, language: string): string {
  if (meters < 950) return `${decimal(Math.round(meters / 10) * 10, 0, 0, language)} m`;
  const kilometers = meters / 1_000;
  const digits = Math.abs(kilometers - Math.round(kilometers)) < 0.05 ? 0 : 1;
  return `${decimal(kilometers, digits, digits, language)} km`;
}

function formatStageDuration(seconds: number): string {
  const rounded = Math.round(seconds / 5) * 5;
  if (rounded < 60) return `${rounded} sec`;
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatStage(stage: StageMeasure, language: string): string {
  return stage.kind === "distance"
    ? formatStageDistance(stage.meters, language)
    : formatStageDuration(stage.seconds);
}

export function formatClassification(
  classification: ActualWorkoutStructure,
  t: TFunction,
  language = DEFAULT_LANGUAGE,
): string {
  switch (classification.kind) {
    case "intervals":
      return t("classification.intervals", {
        repetitions: classification.repetitions,
        work: formatStage(classification.work, language),
        recovery: formatStage(classification.recovery, language),
      });
    case "progressive":
      return t("classification.progressive", { stageCount: classification.stageCount });
    case "tempo":
      return t("classification.tempo", {
        distance: formatStageDistance(classification.distanceMeters, language),
      });
    case "repeated-hills":
      return t("classification.repeatedHills", {
        repetitions: classification.repetitions,
      });
    case "steady-structured-run":
      return t("classification.steadyStructuredRun");
    case "free-run":
      return t("classification.freeRun");
    case "unknown":
      return t("classification.unknown");
  }
}

export function formatLapRole(appearance: LapAppearance, t: TFunction): string {
  if (appearance.progressiveStage !== undefined) {
    return t("lapRole.stage", { stage: appearance.progressiveStage });
  }
  return t(`lapRole.${appearance.role}`);
}
