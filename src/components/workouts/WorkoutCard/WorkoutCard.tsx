import type { JSX } from "react";
import type { Workout } from "../../../domain/workout";
import { FreeRunCard, freeRunCardPropsFromWorkout } from "../FreeRunCard/FreeRunCard";
import {
  IntervalRunCard,
  intervalRunCardPropsFromWorkout,
} from "../IntervalRunCard/IntervalRunCard";
import {
  ProgressiveRunCard,
  progressiveRunCardPropsFromWorkout,
} from "../ProgressiveRunCard/ProgressiveRunCard";
import { RaceCard, raceCardPropsFromWorkout } from "../RaceCard/RaceCard";
import { StructuredWorkoutCard } from "../StructuredWorkoutCard/StructuredWorkoutCard";

function cardPropsOrFallback<Props>(
  workout: Workout,
  build: (workout: Workout) => Props,
): Props | undefined {
  try {
    return build(workout);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Workout ${workout.id} has an inconsistent ${workout.structure.kind} classification; ` +
        `showing the structured workout card instead: ${reason}`,
    );
    return undefined;
  }
}

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  if (workout.type === "race") {
    return <RaceCard {...raceCardPropsFromWorkout(workout)} />;
  }
  if (workout.structure.kind === "free-run") {
    return <FreeRunCard {...freeRunCardPropsFromWorkout(workout)} />;
  }
  if (workout.structure.kind === "progressive") {
    const props = cardPropsOrFallback(workout, progressiveRunCardPropsFromWorkout);
    if (props) return <ProgressiveRunCard {...props} />;
  }
  if (workout.structure.kind === "intervals") {
    const props = cardPropsOrFallback(workout, intervalRunCardPropsFromWorkout);
    if (props) return <IntervalRunCard {...props} />;
  }
  return <StructuredWorkoutCard workout={workout} />;
}
