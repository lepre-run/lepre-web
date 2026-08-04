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

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  if (workout.type === "race") {
    return <RaceCard {...raceCardPropsFromWorkout(workout)} />;
  }
  if (workout.structure.kind === "free-run") {
    return <FreeRunCard {...freeRunCardPropsFromWorkout(workout)} />;
  }
  if (workout.structure.kind === "progressive") {
    return <ProgressiveRunCard {...progressiveRunCardPropsFromWorkout(workout)} />;
  }
  if (workout.structure.kind === "intervals") {
    return <IntervalRunCard {...intervalRunCardPropsFromWorkout(workout)} />;
  }
  return <StructuredWorkoutCard workout={workout} />;
}
