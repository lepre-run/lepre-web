import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../../domain/workout";
import { JournalWorkoutCard } from "../JournalWorkoutCard/JournalWorkoutCard";
import { journalCardShapeSeed } from "../journalCardShape";
import { type CommonWorkoutCardProps, commonWorkoutCardPropsFromWorkout } from "../workoutCardData";

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

  return (
    <JournalWorkoutCard
      kind="free-run"
      category={category}
      badge={t("classification.freeRun")}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
      compact
    >
      {!sourceLapsAvailable && <p className="no-laps">{t("workout.noLaps")}</p>}
    </JournalWorkoutCard>
  );
}
