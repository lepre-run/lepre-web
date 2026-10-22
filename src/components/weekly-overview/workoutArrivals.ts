import type { Workout } from "../../domain/workout";
import { STAGGERED_ARRIVAL_LIMIT } from "../../hooks/motionDurations";

export type WorkoutArrivals = ReadonlyMap<string, number>;

export const NO_ARRIVALS: WorkoutArrivals = new Map();

export function newWorkoutIds(
  previousIds: ReadonlySet<string> | null,
  nextWorkouts: ReadonlyArray<Workout>,
): ReadonlySet<string> {
  if (previousIds === null) return new Set();
  return new Set(nextWorkouts.map((workout) => workout.id).filter((id) => !previousIds.has(id)));
}

export function arrivalOrder(
  arrivedIds: ReadonlySet<string>,
  workouts: ReadonlyArray<Workout>,
): WorkoutArrivals {
  const newest = workouts
    .filter((workout) => arrivedIds.has(workout.id))
    .toSorted((left, right) => right.performedAt.localeCompare(left.performedAt))
    .slice(0, STAGGERED_ARRIVAL_LIMIT);
  return new Map(newest.map((workout, order) => [workout.id, order]));
}
