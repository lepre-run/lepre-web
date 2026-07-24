import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../domain/workout";
import { formatWorkoutDate } from "../../i18n/formatters";
import { journalCardShape, journalCardShapeSeed } from "./journalCardShape";
import { WorkoutCardSummary } from "./WorkoutCardSummary";
import { type CommonWorkoutCardProps, commonWorkoutCardPropsFromWorkout } from "./workoutCardData";

export type FreeRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    sourceLapsAvailable: boolean;
    shapeSeed: number;
  }>;

export function freeRunCardPropsFromWorkout(workout: Workout): FreeRunCardProps {
  if (workout.structure.kind !== "free-run") {
    throw new Error("a free-run card requires a free-run workout");
  }

  return {
    ...commonWorkoutCardPropsFromWorkout(workout),
    sourceLapsAvailable: workout.laps.length > 0,
    shapeSeed: journalCardShapeSeed(workout.id),
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
  const shape = journalCardShape(shapeSeed);

  return (
    <article
      className="workout-card workout-card--journal workout-card--free-run workout-card--compact"
      data-workout-type={category}
    >
      <svg
        className="journal-card__outline"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={shape.outlinePath} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="journal-card__type">
        <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
          <path d={shape.badgePath} />
        </svg>
        <span>{t("classification.freeRun")}</span>
      </div>
      <header className="workout-card__header">
        <div className="workout-card__topline">
          <time dateTime={performedAt}>{formatWorkoutDate(performedAt, language)}</time>
        </div>

        <WorkoutCardSummary {...summary} />
      </header>
      {!sourceLapsAvailable && <p className="no-laps">{t("workout.noLaps")}</p>}
    </article>
  );
}
