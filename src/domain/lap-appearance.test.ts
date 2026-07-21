import { describe, expect, it } from "vitest";

import { appearanceForLap } from "./lap-appearance";
import { createWorkout } from "./workout";

function lap(index: number, distanceMeters: number, paceSecondsPerKilometer: number) {
  const movingDurationSeconds = Math.round((distanceMeters / 1_000) * paceSecondsPerKilometer);
  return {
    index,
    name: `Lap ${index}`,
    movingDurationSeconds,
    elapsedDurationSeconds: movingDurationSeconds,
    distanceMeters,
  };
}

describe("lap appearance", () => {
  it("maps interval laps to preparation, work, recovery, and cooldown roles", () => {
    const result = createWorkout({
      id: "strava:intervals",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Intervals",
      description: "",
      type: "workout",
      sport: "Run",
      durationSeconds: 2_400,
      elapsedDurationSeconds: 2_400,
      distanceMeters: 7_700,
      laps: [
        lap(1, 1_000, 330),
        lap(2, 1_000, 240),
        lap(3, 400, 390),
        lap(4, 1_000, 240),
        lap(5, 400, 390),
        lap(6, 1_000, 240),
        lap(7, 1_500, 340),
      ],
    });
    if (result.kind !== "created") throw new Error("expected workout");

    expect(
      result.workout.laps.map((value) => appearanceForLap(result.workout, value).role),
    ).toEqual(["warmup", "work", "recovery", "work", "recovery", "work", "cooldown"]);
  });

  it("assigns progressively darker intensity values to faster stages", () => {
    const result = createWorkout({
      id: "strava:progressive",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Progressive",
      description: "",
      type: "workout",
      sport: "Run",
      durationSeconds: 2_400,
      elapsedDurationSeconds: 2_400,
      distanceMeters: 8_000,
      laps: [lap(1, 2_000, 330), lap(2, 2_000, 310), lap(3, 2_000, 290), lap(4, 2_000, 270)],
    });
    if (result.kind !== "created") throw new Error("expected workout");

    expect(result.workout.laps.map((value) => appearanceForLap(result.workout, value))).toEqual([
      { role: "work", progressiveStage: 1, progressiveIntensity: 0 },
      { role: "work", progressiveStage: 2, progressiveIntensity: 1 / 3 },
      { role: "work", progressiveStage: 3, progressiveIntensity: 2 / 3 },
      { role: "work", progressiveStage: 4, progressiveIntensity: 1 },
    ]);
  });
});
