import type { DistanceMeters, DurationSeconds, Instant, WorkoutId, WorkoutName } from "./identity";

export type Workout = Readonly<{
  id: WorkoutId;
  performedAt: Instant;
  name: WorkoutName;
  durationSeconds: DurationSeconds;
  distanceMeters: DistanceMeters;
}>;

export type CreateWorkoutResult =
  | Readonly<{ kind: "created"; workout: Workout }>
  | Readonly<{ kind: "invalid-workout" }>;

export function createWorkout(input: {
  id: string;
  performedAt: string;
  name: string;
  durationSeconds: number;
  distanceMeters: number;
}): CreateWorkoutResult {
  const id = input.id.trim();
  const name = input.name.trim();
  const timestamp = Date.parse(input.performedAt);
  const validDuration = Number.isInteger(input.durationSeconds) && input.durationSeconds >= 0;
  const validDistance = Number.isFinite(input.distanceMeters) && input.distanceMeters >= 0;
  if (
    id.length === 0 ||
    name.length === 0 ||
    !Number.isFinite(timestamp) ||
    !validDuration ||
    !validDistance
  ) {
    return { kind: "invalid-workout" };
  }
  return {
    kind: "created",
    workout: {
      id: id as WorkoutId,
      performedAt: new Date(timestamp).toISOString() as Instant,
      name: name as WorkoutName,
      durationSeconds: input.durationSeconds as DurationSeconds,
      distanceMeters: input.distanceMeters as DistanceMeters,
    },
  };
}
