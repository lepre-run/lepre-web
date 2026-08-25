import type { Workout, WorkoutInput } from "../domain/workout";
import { buildWorkout } from "./builders";

const TEMPO_WORKOUT = {
  id: "workout:tempo",
  name: "Friday tempo",
  laps: [
    {
      index: 1,
      name: "Warm up",
      movingDurationSeconds: 600,
      elapsedDurationSeconds: 600,
      distanceMeters: 1_500,
      averageHeartRateBpm: 130,
      maxHeartRateBpm: 142,
    },
    {
      index: 2,
      name: "Tempo",
      movingDurationSeconds: 1_400,
      elapsedDurationSeconds: 1_400,
      distanceMeters: 5_000,
      averageHeartRateBpm: 158,
      maxHeartRateBpm: 171,
    },
    {
      index: 3,
      name: "Cool down",
      movingDurationSeconds: 480,
      elapsedDurationSeconds: 480,
      distanceMeters: 1_200,
      averageHeartRateBpm: 139,
      maxHeartRateBpm: 149,
    },
  ],
  structure: {
    schemaVersion: 1,
    classifierVersion: 2,
    source: "inferred_from_strava_laps",
    confidence: 0.94,
    kind: "tempo",
    distanceMeters: 5_000,
    coreLapIndexes: [2],
    lapRoles: {
      warmup: [1],
      work: [2],
      recovery: [],
      cooldown: [3],
      main: [],
      unknown: [],
    },
  },
} satisfies Partial<WorkoutInput>;

export function tempoWorkout(): Workout {
  return buildWorkout(TEMPO_WORKOUT);
}

const REPEATED_HILLS_WORKOUT = {
  id: "workout:hills",
  name: "Hill pairs",
  laps: [
    {
      index: 1,
      name: "Climb 1",
      movingDurationSeconds: 120,
      elapsedDurationSeconds: 120,
      distanceMeters: 300,
    },
    {
      index: 2,
      name: "Return 1",
      movingDurationSeconds: 150,
      elapsedDurationSeconds: 150,
      distanceMeters: 300,
    },
    {
      index: 3,
      name: "Climb 2",
      movingDurationSeconds: 115,
      elapsedDurationSeconds: 115,
      distanceMeters: 300,
    },
    {
      index: 4,
      name: "Return 2",
      movingDurationSeconds: 145,
      elapsedDurationSeconds: 145,
      distanceMeters: 300,
    },
  ],
  structure: {
    schemaVersion: 1,
    classifierVersion: 2,
    source: "inferred_from_strava_laps",
    confidence: 0.9,
    kind: "repeated-hills",
    repetitions: 2,
    coreLapIndexes: [1, 2, 3, 4],
    lapRoles: {
      warmup: [],
      work: [1, 3],
      recovery: [2, 4],
      cooldown: [],
      main: [],
      unknown: [],
    },
  },
} satisfies Partial<WorkoutInput>;

export function repeatedHillsWorkout(): Workout {
  return buildWorkout(REPEATED_HILLS_WORKOUT);
}
