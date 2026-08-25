import type { DistanceMeters, DurationSeconds, Instant } from "../../domain/identity";
import type { Workout, WorkoutCategory } from "../../domain/workout";

export type Measurement<Value> =
  | Readonly<{ kind: "recorded"; value: Value }>
  | Readonly<{ kind: "unavailable" }>;

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];

export type CommonWorkoutCardProps = Readonly<{
  title: string;
  description: string | null;
  privateDescription: string | null;
  performedAt: Instant;
  category: WorkoutCategory;
  distance: DistanceMeters;
  time: DurationSeconds;
  elevation: Measurement<number>;
  averageHeartRate: Measurement<number>;
}>;

const fieldsUnavailableFromWorkoutSource = {
  privateDescription: null,
  elevation: { kind: "unavailable" },
} as const satisfies Pick<CommonWorkoutCardProps, "privateDescription" | "elevation">;

export function recordedOrUnavailable(value: number | null): Measurement<number> {
  return value === null ? { kind: "unavailable" } : { kind: "recorded", value };
}

function nullableDescription(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export function commonWorkoutCardPropsFromWorkout(workout: Workout): CommonWorkoutCardProps {
  return {
    title: workout.name,
    description: nullableDescription(workout.description),
    ...fieldsUnavailableFromWorkoutSource,
    performedAt: workout.performedAt,
    category: workout.type,
    distance: workout.distanceMeters,
    time: workout.durationSeconds,
    averageHeartRate: recordedOrUnavailable(workout.averageHeartRateBpm),
  };
}
