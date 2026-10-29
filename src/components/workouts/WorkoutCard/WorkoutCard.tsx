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
  card: string,
  build: (workout: Workout) => Props,
): Props | undefined {
  try {
    return build(workout);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Workout ${workout.id} has inconsistent ${card} data; ` +
        `showing the structured workout card instead: ${reason}`,
    );
    return undefined;
  }
}

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  if (workout.type === "race") {
    const props = cardPropsOrFallback(workout, "race", raceCardPropsFromWorkout);
    if (props) return <RaceCard {...props} />;
  } else if (workout.structure.kind === "free-run") {
    const props = cardPropsOrFallback(workout, "free-run", freeRunCardPropsFromWorkout);
    if (props) return <FreeRunCard {...props} />;
  } else if (workout.structure.kind === "progressive") {
    const props = cardPropsOrFallback(workout, "progressive", progressiveRunCardPropsFromWorkout);
    if (props) return <ProgressiveRunCard {...props} />;
  } else if (workout.structure.kind === "intervals") {
    const props = cardPropsOrFallback(workout, "intervals", intervalRunCardPropsFromWorkout);
    if (props) return <IntervalRunCard {...props} />;
  }
  return <StructuredWorkoutCard workout={workout} />;
}
