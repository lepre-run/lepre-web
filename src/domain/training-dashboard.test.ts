import { describe, expect, it } from "vitest";
import {
  distanceIntervals,
  easy,
  sixByOneKilometer,
  workout,
} from "../test/training-dashboard-workouts";
import { createTrainingDashboard } from "./training-dashboard";

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
    const interval = (session: {
      id: string;
      performedAt: string;
      workMeters: number;
      repetitions: number;
      repetitionSeconds: number;
    }) =>
      distanceIntervals({
        ...session,
        recoveryMeters: session.workMeters === 400 ? 200 : 400,
      });
    const dashboard = createTrainingDashboard([
      interval({
        id: "400-now-1",
        performedAt: "2026-07-20T06:00:00.000Z",
        workMeters: 400,
        repetitions: 10,
        repetitionSeconds: 84,
      }),
      interval({
        id: "400-now-2",
        performedAt: "2026-07-05T06:00:00.000Z",
        workMeters: 400,
        repetitions: 12,
        repetitionSeconds: 86,
      }),
      interval({
        id: "400-now-3",
        performedAt: "2026-06-15T06:00:00.000Z",
        workMeters: 400,
        repetitions: 10,
        repetitionSeconds: 88,
      }),
      interval({
        id: "400-before-1",
        performedAt: "2026-05-20T06:00:00.000Z",
        workMeters: 400,
        repetitions: 12,
        repetitionSeconds: 90,
      }),
      interval({
        id: "400-before-2",
        performedAt: "2026-04-20T06:00:00.000Z",
        workMeters: 400,
        repetitions: 10,
        repetitionSeconds: 92,
      }),
      interval({
        id: "1k-now",
        performedAt: "2026-07-18T06:00:00.000Z",
        workMeters: 1_000,
        repetitions: 6,
        repetitionSeconds: 220,
      }),
      interval({
        id: "1k-before",
        performedAt: "2026-05-18T06:00:00.000Z",
        workMeters: 1_000,
        repetitions: 5,
        repetitionSeconds: 230,
      }),
      interval({
        id: "800-now",
        performedAt: "2026-07-12T06:00:00.000Z",
        workMeters: 800,
        repetitions: 8,
        repetitionSeconds: 176,
      }),
      interval({
        id: "800-before",
        performedAt: "2026-04-12T06:00:00.000Z",
        workMeters: 800,
        repetitions: 8,
        repetitionSeconds: 184,
      }),
      interval({
        id: "2k-once",
        performedAt: "2026-07-10T06:00:00.000Z",
        workMeters: 2_000,
        repetitions: 3,
        repetitionSeconds: 460,
      }),
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
