import type { Workout } from "./workout";

const WORKOUT_HISTORY_EXPORT_FORMAT = "lepre.workout-history" as const;
const WORKOUT_HISTORY_EXPORT_VERSION = 3 as const;

export type WorkoutHistoryRange = Readonly<{
  from: string;
  to: string;
}>;

export function localWorkoutDate(instant: string): string {
  const date = new Date(instant);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function workoutsInRange(
  workouts: ReadonlyArray<Workout>,
  range: WorkoutHistoryRange,
): ReadonlyArray<Workout> {
  return workouts.filter((workout) => {
    const date = localWorkoutDate(workout.performedAt);
    return date >= range.from && date <= range.to;
  });
}

export function createWorkoutHistoryExport(
  workouts: ReadonlyArray<Workout>,
  range: WorkoutHistoryRange,
  generatedAt = new Date(),
) {
  const selected = workoutsInRange(workouts, range);
  return {
    format: WORKOUT_HISTORY_EXPORT_FORMAT,
    version: WORKOUT_HISTORY_EXPORT_VERSION,
    generatedAt: generatedAt.toISOString(),
    semantics: EXPORT_SEMANTICS,
    scope: { from: range.from, to: range.to, workoutCount: selected.length },
    workouts: selected.map(exportedWorkout),
  } as const;
}

const EXPORT_SEMANTICS = {
  containsPlannedWorkouts: false,
  measurementsAreActual: true,
  structuresAreInferredFromStravaLaps: true,
  lapRoleIndexesReference: "actual.laps[].index",
  distanceUnit: "meters",
  durationUnit: "seconds",
} as const;

function exportedWorkout(workout: Workout) {
  const summary = {
    distanceMeters: workout.distanceMeters,
    movingDurationSeconds: workout.durationSeconds,
    elapsedDurationSeconds: workout.elapsedDurationSeconds,
    averageHeartRateBpm: workout.averageHeartRateBpm,
    maxHeartRateBpm: workout.maxHeartRateBpm,
  };
  return {
    id: workout.id,
    sourceProvider: "strava" as const,
    performedAt: workout.performedAt,
    sport: workout.sport,
    type: workout.type,
    name: workout.name,
    description: workout.description,
    actual: { summary, structure: workout.structure, laps: workout.laps },
  };
}

export function workoutHistoryFilename(range: WorkoutHistoryRange): string {
  return `lepre-workouts-${range.from}-to-${range.to}.json`;
}
