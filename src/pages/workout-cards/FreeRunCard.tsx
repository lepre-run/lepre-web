import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { Instant } from "../../domain/identity";
import type { Workout, WorkoutCategory } from "../../domain/workout";
import { formatWorkoutDate } from "../../i18n/formatters";
import { freeRunCardShape, freeRunShapeSeed } from "./freeRunCardShape";
import {
  type CommonWorkoutCardProps,
  type Measurement,
  WorkoutCardSummary,
} from "./WorkoutCardSummary";

export type FreeRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    performedAt: Instant;
    category: WorkoutCategory;
    sourceLapsAvailable: boolean;
    shapeSeed: number;
  }>;

function recordedOrUnavailable(value: number | null): Measurement<number> {
  return value === null ? { kind: "unavailable" } : { kind: "recorded", value };
}

function nullableDescription(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export function freeRunCardPropsFromWorkout(workout: Workout): FreeRunCardProps {
  if (workout.structure.kind !== "free-run") {
    throw new Error("a free-run card requires a free-run workout");
  }

  return {
    title: workout.name,
    description: nullableDescription(workout.description),
    privateDescription: null,
    distance: workout.distanceMeters,
    time: workout.durationSeconds,
    // Elevation and private notes are not exposed by the current workout source.
    elevation: { kind: "unavailable" },
    averageHeartRate: recordedOrUnavailable(workout.averageHeartRateBpm),
    performedAt: workout.performedAt,
    category: workout.type,
    sourceLapsAvailable: workout.laps.length > 0,
    shapeSeed: freeRunShapeSeed(workout.id),
  };
}

export function FreeRunCard({
  performedAt,
  category,
  sourceLapsAvailable,
  shapeSeed,
  ...summary
}: FreeRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const shape = freeRunCardShape(shapeSeed);

  return (
    <article
      className="workout-card workout-card--free-run workout-card--compact"
      data-workout-type={category}
    >
      <svg
        className="free-run-card__outline"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={shape.outlinePath} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="free-run-card__type">
        <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
          <path d={shape.badgePath} />
        </svg>
        <span>{t("classification.freeRun")}</span>
      </div>
      <header className="workout-card__header">
        <div className="workout-card__topline">
          <time dateTime={performedAt}>{formatWorkoutDate(performedAt, language)}</time>
          {category === "race" && (
            <span className="race-badge">
              <span aria-hidden="true">🏁</span>
              {t("workout.race")}
            </span>
          )}
        </div>

        <WorkoutCardSummary {...summary} />
      </header>
      {!sourceLapsAvailable && <p className="no-laps">{t("workout.noLaps")}</p>}
    </article>
  );
}
