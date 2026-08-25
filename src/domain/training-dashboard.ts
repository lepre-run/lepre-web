import { easyPaceInsight } from "./easy-pace-insight";
import { intervalBenchmarkInsight } from "./interval-benchmark-insight";
import type { TrainingDashboard } from "./training-dashboard-types";
import {
  trainingMixInsight,
  type WorkoutWindow,
  weeklyVolumeInsight,
} from "./training-load-insights";
import type { Workout } from "./workout";

export type {
  EasyPaceInsight,
  EvidenceStrength,
  IntervalBenchmarkInsight,
  IntervalFormatInsight,
  RelativeTrend,
  TrainingDashboard,
  TrainingMixInsight,
  WeeklyVolumeInsight,
} from "./training-dashboard-types";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
const CONDITION_WINDOW_DAYS = 42;

function workoutWindows(workouts: ReadonlyArray<Workout>): WorkoutWindow {
  const latest = Math.max(...workouts.map((workout) => Date.parse(workout.performedAt)));
  const currentStart = latest - CONDITION_WINDOW_DAYS * DAY_MILLISECONDS;
  const previousStart = currentStart - CONDITION_WINDOW_DAYS * DAY_MILLISECONDS;
  const timestamp = (workout: Workout) => Date.parse(workout.performedAt);
  return {
    current: workouts.filter(
      (workout) => timestamp(workout) > currentStart && timestamp(workout) <= latest,
    ),
    previous: workouts.filter(
      (workout) => timestamp(workout) > previousStart && timestamp(workout) <= currentStart,
    ),
  };
}

export function createTrainingDashboard(
  workouts: ReadonlyArray<Workout>,
): TrainingDashboard | null {
  if (workouts.length === 0) return null;
  const windows = workoutWindows(workouts);
  const latest = [...workouts].sort((left, right) =>
    right.performedAt.localeCompare(left.performedAt),
  )[0];
  return {
    windowDays: CONDITION_WINDOW_DAYS,
    through: latest.performedAt,
    workoutCount: windows.current.length,
    easyPace: easyPaceInsight(windows.current, windows.previous),
    referenceIntervals: intervalBenchmarkInsight(workouts, Date.parse(latest.performedAt)),
    weeklyVolume: weeklyVolumeInsight(windows),
    trainingMix: trainingMixInsight(windows.current),
  };
}
