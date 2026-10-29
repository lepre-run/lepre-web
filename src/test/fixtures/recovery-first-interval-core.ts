import { WORKOUT_CLASSIFIER_VERSION } from "../../domain/actual-workout-structure";
import { createWorkout, type Lap, type Workout } from "../../domain/workout";
import fixture from "./recovery-first-interval-core.laps.json";

export const recoveryFirstIntervalLaps: ReadonlyArray<Lap> = fixture.laps;

export const storedV2RecoveryFirstStructure: unknown = fixture.classifierV2Structure;

export function recoveryFirstIntervalWorkout(structure?: unknown): Workout {
  const durationSeconds = fixture.laps.reduce((total, lap) => total + lap.movingDurationSeconds, 0);
  const elapsedDurationSeconds = fixture.laps.reduce(
    (total, lap) => total + lap.elapsedDurationSeconds,
    0,
  );
  const distanceMeters = fixture.laps.reduce((total, lap) => total + lap.distanceMeters, 0);
  const result = createWorkout({
    id: "fixture:recovery-first-interval-core",
    performedAt: "2026-01-01T07:00:00Z",
    name: "Recovery-first interval core",
    description: "",
    type: "workout",
    sport: "Run",
    durationSeconds,
    elapsedDurationSeconds,
    distanceMeters,
    averageHeartRateBpm: null,
    maxHeartRateBpm: null,
    laps: fixture.laps,
    structure,
  });
  if (result.kind !== "created") throw new Error("expected the fixture to create a workout");
  return result.workout;
}

export function inconsistentRecoveryFirstIntervalWorkout(): Workout {
  return {
    ...recoveryFirstIntervalWorkout(),
    structure: {
      ...fixture.classifierV2Structure,
      classifierVersion: WORKOUT_CLASSIFIER_VERSION,
    } as Workout["structure"],
  };
}
