import { createWorkout, type Workout } from "../domain/workout";

type WorkoutInput = Parameters<typeof createWorkout>[0];

const defaultLap: WorkoutInput["laps"][number] = {
  index: 1,
  name: "Morning run",
  movingDurationSeconds: 1_800,
  elapsedDurationSeconds: 1_820,
  distanceMeters: 5_000,
  averageHeartRateBpm: 142,
  maxHeartRateBpm: 158,
};

export function buildWorkout(overrides: Partial<WorkoutInput> = {}): Workout {
  const laps = overrides.laps ?? [defaultLap];
  const durationSeconds = laps.reduce((sum, lap) => sum + lap.movingDurationSeconds, 0);
  const elapsedDurationSeconds = laps.reduce((sum, lap) => sum + lap.elapsedDurationSeconds, 0);
  const distanceMeters = laps.reduce((sum, lap) => sum + lap.distanceMeters, 0);
  const result = createWorkout({
    id: "workout:morning-run",
    performedAt: "2026-07-20T06:00:00Z",
    name: "Morning run",
    description: "Easy miles before breakfast.",
    type: "workout",
    sport: "Run",
    durationSeconds,
    elapsedDurationSeconds,
    distanceMeters,
    averageHeartRateBpm: 142,
    maxHeartRateBpm: 158,
    laps,
    ...overrides,
  });
  if (result.kind !== "created") throw new Error("test workout should be valid");
  return result.workout;
}
