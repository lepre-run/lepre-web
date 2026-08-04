import type { TFunction } from "i18next";
import type { Workout } from "../../domain/workout";
import { formatClassification, formatPace } from "../../i18n/formatters";
import { localeFor } from "../../i18n/i18n";
import type { WorkoutWeek } from "./weeklyOverview";

export function weekRange(week: WorkoutWeek, language: string): string {
  const locale = localeFor(language);
  const sameYear = week.start.getFullYear() === week.end.getFullYear();
  const sameMonth = sameYear && week.start.getMonth() === week.end.getMonth();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const year = new Intl.DateTimeFormat(locale, { year: "numeric" });
  if (sameMonth) {
    return `${day.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
  }
  if (sameYear) {
    return `${day.format(week.start)} ${month.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
  }
  return `${day.format(week.start)} ${month.format(week.start)} ${year.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
}

export function compactDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}m`;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
}

export function workoutKind(workout: Workout): string {
  return workout.type === "race" ? "race" : workout.structure.kind;
}

export function workoutType(workout: Workout, t: TFunction): string {
  if (workout.type === "race") return t("workout.race");
  switch (workout.structure.kind) {
    case "intervals":
      return t("classification.intervalsBadge");
    case "progressive":
      return t("classification.progressiveBadge");
    case "tempo":
      return t("weekly.types.tempo");
    case "repeated-hills":
    case "hill-circuit":
      return t("weekly.types.hills");
    case "steady-structured-run":
      return t("weekly.types.steady");
    case "free-run":
      return t("classification.freeRun");
    case "unknown":
      return t("weekly.types.run");
  }
}

export function workoutDetail(workout: Workout, t: TFunction, language: string): string {
  const simpleKinds = new Set(["free-run", "steady-structured-run", "unknown"]);
  return workout.type === "race" || simpleKinds.has(workout.structure.kind)
    ? formatPace(workout.durationSeconds, workout.distanceMeters)
    : formatClassification(workout.structure, t, language);
}
