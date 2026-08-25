import type { Workout } from "../../../domain/workout";
import type { SimpleLapCardProps } from "../SimpleLapWorkoutCard/SimpleLapWorkoutCard";
import { simpleLapCardPropsFromWorkout } from "../SimpleLapWorkoutCard/simpleLapCardData";

export type RaceLapRole = Readonly<{ kind: "race"; splitNumber: number }>;
export type RaceCardProps = SimpleLapCardProps<RaceLapRole> & Readonly<{ category: "race" }>;

export function raceCardPropsFromWorkout(workout: Workout): RaceCardProps {
  if (workout.type !== "race") throw new Error("a race card requires a race workout");
  return simpleLapCardPropsFromWorkout(workout, (index) => ({
    kind: "race",
    splitNumber: index + 1,
  })) as RaceCardProps;
}
