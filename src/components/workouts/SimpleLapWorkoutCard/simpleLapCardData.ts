import type { Workout } from "../../../domain/workout";
import { journalCardShapeSeed } from "../journalCardShape";
import { sourceLapData } from "../sourceLapData";
import { commonWorkoutCardPropsFromWorkout } from "../workoutCardData";
import type { SimpleLapCardProps, SimpleLapData } from "./SimpleLapWorkoutCard";

export function simpleLapCardPropsFromWorkout<Role>(
  workout: Workout,
  role: (index: number) => Role,
): SimpleLapCardProps<Role> {
  const laps = workout.laps.map((lap, index) => sourceLapData(lap, role(index)));
  const lapData: SimpleLapData<Role> =
    laps.length === 0
      ? { kind: "unavailable" }
      : { kind: "available", laps: [laps[0], ...laps.slice(1)] };
  return {
    ...commonWorkoutCardPropsFromWorkout(workout),
    lapData,
    shapeSeed: journalCardShapeSeed(workout.id),
  };
}
