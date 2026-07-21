import type { Workout } from "./workout";

export const WORKOUT_HISTORY_EXPORT_FORMAT = "lepre.workout-history" as const;
export const WORKOUT_HISTORY_EXPORT_VERSION = 1 as const;

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
    semantics: {
      containsPlannedWorkouts: false,
      measurementsAreActual: true,
      structuresAreInferredFromStravaLaps: true,
      lapRoleIndexesReference: "actual.laps[].index",
      distanceUnit: "meters",
      durationUnit: "seconds",
    },
    scope: {
      from: range.from,
      to: range.to,
      workoutCount: selected.length,
    },
    workouts: selected.map((workout) => ({
      id: workout.id,
      sourceProvider: "strava" as const,
      performedAt: workout.performedAt,
      sport: workout.sport,
      name: workout.name,
      description: workout.description,
      actual: {
        summary: {
          distanceMeters: workout.distanceMeters,
          movingDurationSeconds: workout.durationSeconds,
          elapsedDurationSeconds: workout.elapsedDurationSeconds,
        },
        structure: workout.structure,
        laps: workout.laps,
      },
    })),
  } as const;
}

export function workoutHistoryFilename(range: WorkoutHistoryRange): string {
  return `lepre-workouts-${range.from}-to-${range.to}.json`;
}
