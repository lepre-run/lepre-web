import type { Workout } from "../domain/workout";
import { buildWorkout } from "./builders";

type DashboardWorkoutInput = Parameters<typeof workout>[0];

function dashboardLaps(input: DashboardWorkoutInput) {
  return input.laps.map((lap, index) => ({
    index: index + 1,
    name: `Lap ${index + 1}`,
    movingDurationSeconds: lap.movingDurationSeconds,
    elapsedDurationSeconds: lap.movingDurationSeconds,
    distanceMeters: lap.distanceMeters,
    averageHeartRateBpm: lap.averageHeartRateBpm ?? null,
    maxHeartRateBpm: lap.averageHeartRateBpm == null ? null : lap.averageHeartRateBpm + 12,
  }));
}

function averageHeartRate(laps: ReturnType<typeof dashboardLaps>): number | null {
  const values = laps.flatMap((lap) =>
    lap.averageHeartRateBpm === null ? [] : [lap.averageHeartRateBpm],
  );
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function workout(input: {
  id: string;
  performedAt: string;
  type?: "workout" | "race";
  sport?: "Run" | "TrailRun" | "VirtualRun";
  laps: ReadonlyArray<{
    distanceMeters: number;
    movingDurationSeconds: number;
    averageHeartRateBpm?: number | null;
  }>;
}): Workout {
  const laps = dashboardLaps(input);
  return buildWorkout({
    id: input.id,
    performedAt: input.performedAt,
    name: input.id,
    description: "",
    type: input.type ?? "workout",
    sport: input.sport ?? "Run",
    averageHeartRateBpm: averageHeartRate(laps),
    maxHeartRateBpm: averageHeartRate(laps) === null ? null : 170,
    laps,
  });
}

export function easy(id: string, performedAt: string, secondsPerKilometer: number): Workout {
  return workout({
    id,
    performedAt,
    laps: [
      {
        distanceMeters: 10_000,
        movingDurationSeconds: secondsPerKilometer * 10,
        averageHeartRateBpm: 140,
      },
    ],
  });
}

export function distanceIntervals(input: {
  id: string;
  performedAt: string;
  repetitions: number;
  workMeters: number;
  recoveryMeters: number;
  repetitionSeconds: number;
}): Workout {
  const laps = [
    { distanceMeters: 2_000, movingDurationSeconds: 720 },
    ...Array.from({ length: input.repetitions - 1 }, () => [
      {
        distanceMeters: input.workMeters,
        movingDurationSeconds: input.repetitionSeconds,
      },
      { distanceMeters: input.recoveryMeters, movingDurationSeconds: 150 },
    ]).flat(),
    {
      distanceMeters: input.workMeters,
      movingDurationSeconds: input.repetitionSeconds,
    },
    { distanceMeters: 1_500, movingDurationSeconds: 570 },
  ];
  return workout({ id: input.id, performedAt: input.performedAt, laps });
}

export function sixByOneKilometer(
  id: string,
  performedAt: string,
  repetitionSeconds: number,
): Workout {
  return distanceIntervals({
    id,
    performedAt,
    repetitions: 6,
    workMeters: 1_000,
    recoveryMeters: 400,
    repetitionSeconds,
  });
}
