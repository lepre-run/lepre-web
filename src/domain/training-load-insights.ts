import { trendFromTotals } from "./training-dashboard-math";
import type { TrainingMixInsight, WeeklyVolumeInsight } from "./training-dashboard-types";
import type { Workout } from "./workout";

export type WorkoutWindow = Readonly<{
  current: ReadonlyArray<Workout>;
  previous: ReadonlyArray<Workout>;
}>;

export function weeklyVolumeInsight(windows: WorkoutWindow): WeeklyVolumeInsight {
  const distance = windows.current.reduce((sum, workout) => sum + workout.distanceMeters, 0);
  const previous = windows.previous.reduce((sum, workout) => sum + workout.distanceMeters, 0);
  return {
    distanceMeters: distance,
    durationSeconds: windows.current.reduce((sum, workout) => sum + workout.durationSeconds, 0),
    workoutCount: windows.current.length,
    averageWeeklyDistanceMeters: distance / 6,
    trend: trendFromTotals(distance, previous),
  };
}

type Intensity = "low" | "moderate" | "high" | "unknown";
const INTENSITY_BY_STRUCTURE: Record<Workout["structure"]["kind"], Intensity> = {
  "free-run": "low",
  "steady-structured-run": "low",
  progressive: "moderate",
  tempo: "moderate",
  intervals: "high",
  "repeated-hills": "high",
  "hill-circuit": "high",
  unknown: "unknown",
};

export function trainingMixInsight(workouts: ReadonlyArray<Workout>): TrainingMixInsight {
  const counts = { low: 0, moderate: 0, high: 0, unknown: 0 };
  for (const workout of workouts)
    counts[workout.type === "race" ? "high" : INTENSITY_BY_STRUCTURE[workout.structure.kind]] += 1;
  const classified = counts.low + counts.moderate + counts.high;
  return {
    ...counts,
    lowSharePercent: classified === 0 ? null : (counts.low / classified) * 100,
    classifiedSharePercent: workouts.length === 0 ? 0 : (classified / workouts.length) * 100,
  };
}
