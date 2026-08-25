import type { Workout } from "../../../domain/workout";
import type { SimpleLapCardProps } from "../SimpleLapWorkoutCard/SimpleLapWorkoutCard";
import { simpleLapCardPropsFromWorkout } from "../SimpleLapWorkoutCard/simpleLapCardData";

export type FreeRunLapRole = Readonly<{ kind: "main" }>;
export type FreeRunCardProps = SimpleLapCardProps<FreeRunLapRole>;

export function freeRunCardPropsFromWorkout(workout: Workout): FreeRunCardProps {
  if (workout.structure.kind !== "free-run") {
    throw new Error("a free-run card requires a free-run workout");
  }
  return simpleLapCardPropsFromWorkout(workout, () => ({ kind: "main" }));
}
