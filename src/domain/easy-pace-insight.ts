import { evidenceStrength, median, trendFromPaces } from "./training-dashboard-math";
import type { EasyPaceInsight } from "./training-dashboard-types";
import type { Workout } from "./workout";

function secondsPerKilometer(workout: Workout): number {
  return (workout.durationSeconds / workout.distanceMeters) * 1_000;
}

function candidates(workouts: ReadonlyArray<Workout>): ReadonlyArray<Workout> {
  return workouts.filter(
    (workout) =>
      workout.type === "workout" &&
      workout.sport !== "TrailRun" &&
      workout.structure.kind === "free-run" &&
      workout.distanceMeters >= 3_000 &&
      workout.durationSeconds >= 20 * 60,
  );
}

export function easyPaceInsight(
  currentWorkouts: ReadonlyArray<Workout>,
  previousWorkouts: ReadonlyArray<Workout>,
): EasyPaceInsight | null {
  const current = candidates(currentWorkouts);
  if (current.length === 0) return null;
  const paces = current.map(secondsPerKilometer);
  const heartRates = current.flatMap((workout) =>
    workout.averageHeartRateBpm === null ? [] : [workout.averageHeartRateBpm],
  );
  return {
    secondsPerKilometer: median(paces),
    fastestSecondsPerKilometer: Math.min(...paces),
    slowestSecondsPerKilometer: Math.max(...paces),
    medianHeartRateBpm: heartRates.length > 0 ? median(heartRates) : null,
    workoutCount: current.length,
    evidence: evidenceStrength(current.length),
    trend: trendFromPaces(paces, candidates(previousWorkouts).map(secondsPerKilometer)),
  };
}
