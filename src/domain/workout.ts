import {
  type ActualWorkoutStructure,
  isCurrentActualWorkoutStructure,
} from "./actual-workout-structure";
import { classifyWorkout } from "./classifier";
import type { DistanceMeters, DurationSeconds, Instant, WorkoutId, WorkoutName } from "./identity";

export type RunSport = "Run" | "TrailRun" | "VirtualRun";
export type WorkoutCategory = "workout" | "race";

export type Lap = Readonly<{
  index: number;
  name: string;
  movingDurationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
}>;

export type Workout = Readonly<{
  id: WorkoutId;
  performedAt: Instant;
  name: WorkoutName;
  description: string;
  type: WorkoutCategory;
  sport: RunSport;
  durationSeconds: DurationSeconds;
  elapsedDurationSeconds: DurationSeconds;
  distanceMeters: DistanceMeters;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  laps: ReadonlyArray<Lap>;
  structure: ActualWorkoutStructure;
}>;

export type CreateWorkoutResult =
  | Readonly<{ kind: "created"; workout: Workout }>
  | Readonly<{ kind: "invalid-workout" }>;

export function createWorkout(input: {
  id: string;
  performedAt: string;
  name: string;
  description: string;
  type: string;
  sport: string;
  durationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm?: number | null;
  maxHeartRateBpm?: number | null;
  laps: ReadonlyArray<{
    index: number;
    name: string;
    movingDurationSeconds: number;
    elapsedDurationSeconds: number;
    distanceMeters: number;
    averageHeartRateBpm?: number | null;
    maxHeartRateBpm?: number | null;
  }>;
  structure?: unknown;
}): CreateWorkoutResult {
  const id = input.id.trim();
  const name = input.name;
  const timestamp = Date.parse(input.performedAt);
  const validDuration = Number.isInteger(input.durationSeconds) && input.durationSeconds >= 0;
  const validElapsedDuration =
    Number.isInteger(input.elapsedDurationSeconds) && input.elapsedDurationSeconds >= 0;
  const validDistance = Number.isFinite(input.distanceMeters) && input.distanceMeters >= 0;
  const validHeartRate = (value: number | null | undefined) =>
    value == null || (Number.isFinite(value) && value >= 0);
  const validWorkoutHeartRate =
    validHeartRate(input.averageHeartRateBpm) && validHeartRate(input.maxHeartRateBpm);
  const validType = ["workout", "race"].includes(input.type);
  const validSport = ["Run", "TrailRun", "VirtualRun"].includes(input.sport);
  const validLaps = input.laps.every(
    (lap) =>
      Number.isInteger(lap.index) &&
      lap.index >= 1 &&
      lap.name.trim().length > 0 &&
      Number.isInteger(lap.movingDurationSeconds) &&
      lap.movingDurationSeconds >= 0 &&
      Number.isInteger(lap.elapsedDurationSeconds) &&
      lap.elapsedDurationSeconds >= 0 &&
      Number.isFinite(lap.distanceMeters) &&
      lap.distanceMeters >= 0 &&
      validHeartRate(lap.averageHeartRateBpm) &&
      validHeartRate(lap.maxHeartRateBpm),
  );
  if (
    id.length === 0 ||
    name.trim().length === 0 ||
    !Number.isFinite(timestamp) ||
    !validDuration ||
    !validElapsedDuration ||
    !validDistance ||
    !validWorkoutHeartRate ||
    !validType ||
    !validSport ||
    !validLaps
  ) {
    return { kind: "invalid-workout" };
  }
  return {
    kind: "created",
    workout: (() => {
      const laps = input.laps.map((lap) => ({
        ...lap,
        averageHeartRateBpm: lap.averageHeartRateBpm ?? null,
        maxHeartRateBpm: lap.maxHeartRateBpm ?? null,
      }));
      return {
        id: id as WorkoutId,
        performedAt: input.performedAt as Instant,
        name: name as WorkoutName,
        description: input.description,
        type: input.type as WorkoutCategory,
        sport: input.sport as RunSport,
        durationSeconds: input.durationSeconds as DurationSeconds,
        elapsedDurationSeconds: input.elapsedDurationSeconds as DurationSeconds,
        distanceMeters: input.distanceMeters as DistanceMeters,
        averageHeartRateBpm: input.averageHeartRateBpm ?? null,
        maxHeartRateBpm: input.maxHeartRateBpm ?? null,
        laps,
        structure: isCurrentActualWorkoutStructure(input.structure)
          ? input.structure
          : classifyWorkout(laps),
      };
    })(),
  };
}
