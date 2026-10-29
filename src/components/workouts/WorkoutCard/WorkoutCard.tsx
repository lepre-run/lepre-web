import { type JSX, useEffect, useMemo } from "react";
import type { Workout } from "../../../domain/workout";
import { FreeRunCard, freeRunCardPropsFromWorkout } from "../FreeRunCard/FreeRunCard";
import type { FreeRunCardProps } from "../FreeRunCard/freeRunCardData";
import {
  IntervalRunCard,
  intervalRunCardPropsFromWorkout,
} from "../IntervalRunCard/IntervalRunCard";
import type { IntervalRunCardProps } from "../IntervalRunCard/intervalRunCardTypes";
import {
  ProgressiveRunCard,
  progressiveRunCardPropsFromWorkout,
} from "../ProgressiveRunCard/ProgressiveRunCard";
import type { ProgressiveRunCardProps } from "../ProgressiveRunCard/progressiveRunCardData";
import { RaceCard, raceCardPropsFromWorkout } from "../RaceCard/RaceCard";
import type { RaceCardProps } from "../RaceCard/raceCardData";
import { StructuredWorkoutCard } from "../StructuredWorkoutCard/StructuredWorkoutCard";

type CardSelection =
  | Readonly<{ kind: "race"; props: RaceCardProps }>
  | Readonly<{ kind: "free-run"; props: FreeRunCardProps }>
  | Readonly<{ kind: "progressive"; props: ProgressiveRunCardProps }>
  | Readonly<{ kind: "intervals"; props: IntervalRunCardProps }>
  | Readonly<{ kind: "structured"; fallbackReason?: string }>;

const warnedWorkouts = new WeakSet<Workout>();

function cardOrFallback(card: string, select: () => CardSelection): CardSelection {
  try {
    return select();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "structured", fallbackReason: `inconsistent ${card} data: ${reason}` };
  }
}

function selectCard(workout: Workout): CardSelection {
  if (workout.type === "race") {
    return cardOrFallback("race", () => ({
      kind: "race",
      props: raceCardPropsFromWorkout(workout),
    }));
  }
  if (workout.structure.kind === "free-run") {
    return cardOrFallback("free-run", () => ({
      kind: "free-run",
      props: freeRunCardPropsFromWorkout(workout),
    }));
  }
  if (workout.structure.kind === "progressive") {
    return cardOrFallback("progressive", () => ({
      kind: "progressive",
      props: progressiveRunCardPropsFromWorkout(workout),
    }));
  }
  if (workout.structure.kind === "intervals") {
    return cardOrFallback("intervals", () => ({
      kind: "intervals",
      props: intervalRunCardPropsFromWorkout(workout),
    }));
  }
  return { kind: "structured" };
}

function useFallbackWarning(workout: Workout, card: CardSelection): void {
  useEffect(() => {
    if (card.kind !== "structured" || !card.fallbackReason || warnedWorkouts.has(workout)) return;
    warnedWorkouts.add(workout);
    console.warn(
      `Workout ${workout.id} has ${card.fallbackReason}; showing the structured workout card instead`,
    );
  }, [workout, card]);
}

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  const card = useMemo(() => selectCard(workout), [workout]);
  useFallbackWarning(workout, card);

  switch (card.kind) {
    case "race":
      return <RaceCard {...card.props} />;
    case "free-run":
      return <FreeRunCard {...card.props} />;
    case "progressive":
      return <ProgressiveRunCard {...card.props} />;
    case "intervals":
      return <IntervalRunCard {...card.props} />;
    case "structured":
      return <StructuredWorkoutCard workout={workout} />;
  }
}
