import { createTrainingDashboard } from "../domain/training-dashboard";
import { createWorkout } from "../domain/workout";
import { mockWorkouts } from "./fixtures";

describe("mock workout fixtures", () => {
  it("cover a realistic year of five-to-six-run weeks", () => {
    const classifications = mockWorkouts.map((fixture) => {
      const result = createWorkout(fixture);
      expect(result.kind).toBe("created");
      return result.kind === "created" ? result.workout.structure.kind : "invalid";
    });

    expect(new Set(mockWorkouts.map((fixture) => fixture.id)).size).toBe(mockWorkouts.length);
    expect(mockWorkouts.length).toBeGreaterThanOrEqual(52 * 5);
    expect(mockWorkouts.length).toBeLessThanOrEqual(52 * 6);
    expect(new Set(classifications)).toEqual(
      new Set([
        "intervals",
        "free-run",
        "repeated-hills",
        "progressive",
        "tempo",
        "unknown",
        "steady-structured-run",
      ]),
    );

    const start = Date.UTC(2025, 6, 28);
    const weekMilliseconds = 7 * 24 * 60 * 60 * 1_000;
    const weeklyCounts = Array.from({ length: 52 }, () => 0);
    for (const fixture of mockWorkouts) {
      const weekIndex = Math.floor((Date.parse(fixture.performedAt) - start) / weekMilliseconds);
      if (weekIndex >= 0 && weekIndex < weeklyCounts.length) weeklyCounts[weekIndex] += 1;
    }
    expect(weeklyCounts.every((count) => count === 5 || count === 6)).toBe(true);
  });

  it("makes short repetitions the adaptive reference while retaining other formats", () => {
    const workouts = mockWorkouts.flatMap((fixture) => {
      const result = createWorkout(fixture);
      return result.kind === "created" ? [result.workout] : [];
    });
    const intervals = createTrainingDashboard(workouts)?.referenceIntervals;

    expect(intervals?.primary.work).toEqual({ kind: "distance", meters: 400 });
    expect(intervals?.primary.sessionCount).toBeGreaterThan(10);
    expect(intervals?.primary.trend?.direction).toBe("up");
    expect(intervals?.alternatives.map((format) => format.work)).toEqual(
      expect.arrayContaining([
        { kind: "distance", meters: 800 },
        { kind: "distance", meters: 1_000 },
      ]),
    );
  });
});
