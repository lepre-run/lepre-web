import { describe, expect, it } from "vitest";

import { createWorkout } from "./workout";
import {
  createWorkoutHistoryExport,
  workoutHistoryFilename,
  workoutsInRange,
} from "./workout-history-export";

function workout(id: string, performedAt: string, type: "workout" | "race" = "workout") {
  const result = createWorkout({
    id,
    performedAt,
    name: "Track session",
    description: "Four controlled repetitions",
    type,
    sport: "Run",
    durationSeconds: 660,
    elapsedDurationSeconds: 660,
    distanceMeters: 3_400,
    laps: [
      {
        index: 1,
        name: "Rep 1",
        movingDurationSeconds: 240,
        elapsedDurationSeconds: 240,
        distanceMeters: 1_000,
      },
      {
        index: 2,
        name: "Recovery",
        movingDurationSeconds: 90,
        elapsedDurationSeconds: 90,
        distanceMeters: 200,
      },
      {
        index: 3,
        name: "Rep 2",
        movingDurationSeconds: 240,
        elapsedDurationSeconds: 240,
        distanceMeters: 1_000,
      },
      {
        index: 4,
        name: "Recovery",
        movingDurationSeconds: 90,
        elapsedDurationSeconds: 90,
        distanceMeters: 200,
      },
      {
        index: 5,
        name: "Rep 3",
        movingDurationSeconds: 240,
        elapsedDurationSeconds: 240,
        distanceMeters: 1_000,
      },
    ],
  });
  if (result.kind !== "created") throw new Error("expected workout");
  return result.workout;
}

describe("workout history export", () => {
  it("uses the canonical cached structure and includes only the selected date range", () => {
    const included = workout("strava:1", "2026-07-15T06:00:00Z", "race");
    const excluded = workout("strava:2", "2026-06-15T06:00:00Z");
    const range = { from: "2026-07-01", to: "2026-07-31" };

    const document = createWorkoutHistoryExport(
      [included, excluded],
      range,
      new Date("2026-08-01T12:00:00Z"),
    );

    expect(workoutsInRange([included, excluded], range)).toEqual([included]);
    expect(document).toMatchObject({
      format: "lepre.workout-history",
      version: 2,
      generatedAt: "2026-08-01T12:00:00.000Z",
      semantics: {
        containsPlannedWorkouts: false,
        measurementsAreActual: true,
      },
      scope: { from: "2026-07-01", to: "2026-07-31", workoutCount: 1 },
    });
    expect(document.workouts[0].actual.structure).toBe(included.structure);
    expect(document.workouts[0].actual.laps).toBe(included.laps);
    expect(document.workouts[0].type).toBe("race");
    expect(workoutHistoryFilename(range)).toBe("lepre-workouts-2026-07-01-to-2026-07-31.json");
  });
});
