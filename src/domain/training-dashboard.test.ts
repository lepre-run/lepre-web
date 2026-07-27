import { describe, expect, it } from "vitest";
import { createTrainingDashboard } from "./training-dashboard";
import { createWorkout, type Workout } from "./workout";

function workout(input: {
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
  const laps = input.laps.map((lap, index) => ({
    index: index + 1,
    name: `Lap ${index + 1}`,
    movingDurationSeconds: lap.movingDurationSeconds,
    elapsedDurationSeconds: lap.movingDurationSeconds,
    distanceMeters: lap.distanceMeters,
    averageHeartRateBpm: lap.averageHeartRateBpm ?? null,
    maxHeartRateBpm:
      lap.averageHeartRateBpm === null || lap.averageHeartRateBpm === undefined
        ? null
        : lap.averageHeartRateBpm + 12,
  }));
  const durationSeconds = laps.reduce((sum, lap) => sum + lap.movingDurationSeconds, 0);
  const distanceMeters = laps.reduce((sum, lap) => sum + lap.distanceMeters, 0);
  const recordedHeartRates = laps.flatMap((lap) =>
    lap.averageHeartRateBpm === null ? [] : [lap.averageHeartRateBpm],
  );
  const result = createWorkout({
    id: input.id,
    performedAt: input.performedAt,
    name: input.id,
    description: "",
    type: input.type ?? "workout",
    sport: input.sport ?? "Run",
    durationSeconds,
    elapsedDurationSeconds: durationSeconds,
    distanceMeters,
    averageHeartRateBpm:
      recordedHeartRates.length === 0
        ? null
        : recordedHeartRates.reduce((sum, value) => sum + value, 0) / recordedHeartRates.length,
    maxHeartRateBpm: recordedHeartRates.length === 0 ? null : 170,
    laps,
  });
  if (result.kind !== "created") throw new Error("invalid test workout");
  return result.workout;
}

function easy(id: string, performedAt: string, secondsPerKilometer: number): Workout {
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

function distanceIntervals(input: {
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

function sixByOneKilometer(id: string, performedAt: string, repetitionSeconds: number): Workout {
  return distanceIntervals({
    id,
    performedAt,
    repetitions: 6,
    workMeters: 1_000,
    recoveryMeters: 400,
    repetitionSeconds,
  });
}

describe("training dashboard", () => {
  it("builds comparable six-week pace, interval, volume, and training-mix evidence", () => {
    const dashboard = createTrainingDashboard([
      easy("easy-now-1", "2026-07-20T06:00:00.000Z", 330),
      easy("easy-now-2", "2026-07-10T06:00:00.000Z", 336),
      sixByOneKilometer("interval-now-1", "2026-07-18T06:00:00.000Z", 220),
      sixByOneKilometer("interval-now-2", "2026-06-28T06:00:00.000Z", 224),
      easy("easy-before-1", "2026-06-05T06:00:00.000Z", 348),
      easy("easy-before-2", "2026-05-20T06:00:00.000Z", 354),
      sixByOneKilometer("interval-before-1", "2026-06-02T06:00:00.000Z", 232),
      sixByOneKilometer("interval-before-2", "2026-05-15T06:00:00.000Z", 236),
    ]);

    expect(dashboard).not.toBeNull();
    expect(dashboard?.workoutCount).toBe(4);
    expect(dashboard?.easyPace).toMatchObject({
      secondsPerKilometer: 333,
      workoutCount: 2,
      evidence: "early",
    });
    expect(dashboard?.easyPace?.trend?.direction).toBe("up");
    expect(dashboard?.easyPace?.trend?.percent).toBeCloseTo(5.4, 1);
    expect(dashboard?.referenceIntervals?.primary).toMatchObject({
      work: { kind: "distance", meters: 1_000 },
      secondsPerKilometer: 224,
      repetitions: 6,
      sessionCount: 4,
    });
    expect(dashboard?.referenceIntervals?.primary.trend?.direction).toBe("up");
    expect(dashboard?.trainingMix).toMatchObject({ low: 2, moderate: 0, high: 2, unknown: 0 });
    expect(dashboard?.trainingMix.lowSharePercent).toBe(50);
    expect(dashboard?.weeklyVolume.workoutCount).toBe(4);
    expect(dashboard?.weeklyVolume.averageWeeklyDistanceMeters).toBeGreaterThan(7_000);
  });

  it("selects the most repeated recent interval family and keeps alternatives concise", () => {
    const interval = (
      id: string,
      performedAt: string,
      workMeters: number,
      repetitions: number,
      repetitionSeconds: number,
    ) =>
      distanceIntervals({
        id,
        performedAt,
        workMeters,
        repetitions,
        recoveryMeters: workMeters === 400 ? 200 : 400,
        repetitionSeconds,
      });
    const dashboard = createTrainingDashboard([
      interval("400-now-1", "2026-07-20T06:00:00.000Z", 400, 10, 84),
      interval("400-now-2", "2026-07-05T06:00:00.000Z", 400, 12, 86),
      interval("400-now-3", "2026-06-15T06:00:00.000Z", 400, 10, 88),
      interval("400-before-1", "2026-05-20T06:00:00.000Z", 400, 12, 90),
      interval("400-before-2", "2026-04-20T06:00:00.000Z", 400, 10, 92),
      interval("1k-now", "2026-07-18T06:00:00.000Z", 1_000, 6, 220),
      interval("1k-before", "2026-05-18T06:00:00.000Z", 1_000, 5, 230),
      interval("800-now", "2026-07-12T06:00:00.000Z", 800, 8, 176),
      interval("800-before", "2026-04-12T06:00:00.000Z", 800, 8, 184),
      interval("2k-once", "2026-07-10T06:00:00.000Z", 2_000, 3, 460),
    ]);

    expect(dashboard?.referenceIntervals?.primary).toMatchObject({
      work: { kind: "distance", meters: 400 },
      recovery: { kind: "distance", meters: 200 },
      repetitions: 10,
      sessionCount: 5,
      recentSessionCount: 4,
    });
    expect(dashboard?.referenceIntervals?.primary.trend?.direction).toBe("up");
    expect(dashboard?.referenceIntervals?.alternatives.map((format) => format.work)).toEqual([
      { kind: "distance", meters: 1_000 },
      { kind: "distance", meters: 800 },
    ]);
  });

  it("does not describe trail, race, or short activities as easy-pace evidence", () => {
    const dashboard = createTrainingDashboard([
      workout({
        id: "trail",
        performedAt: "2026-07-20T06:00:00.000Z",
        sport: "TrailRun",
        laps: [{ distanceMeters: 10_000, movingDurationSeconds: 4_000 }],
      }),
      workout({
        id: "race",
        performedAt: "2026-07-15T06:00:00.000Z",
        type: "race",
        laps: [{ distanceMeters: 5_000, movingDurationSeconds: 1_200 }],
      }),
      workout({
        id: "short",
        performedAt: "2026-07-12T06:00:00.000Z",
        laps: [{ distanceMeters: 2_500, movingDurationSeconds: 900 }],
      }),
    ]);

    expect(dashboard?.easyPace).toBeNull();
    expect(dashboard?.trainingMix).toMatchObject({ low: 2, high: 1 });
  });

  it("returns no dashboard without workouts", () => {
    expect(createTrainingDashboard([])).toBeNull();
  });
});
