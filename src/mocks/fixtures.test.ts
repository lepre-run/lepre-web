import { createTrainingDashboard } from "../domain/training-dashboard";
import { createWorkout } from "../domain/workout";
import {
  HILL_CIRCUIT_CORE_LAPS,
  HILL_CIRCUIT_LAP_ROLES,
} from "../test/classification-expectations";
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
        "hill-circuit",
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

  it("includes the downloaded Lydiard hill circuit as local example data", () => {
    const fixture = mockWorkouts.find(({ id }) => id === "mock-hill-circuit-2026-08-04");
    expect(fixture).toBeDefined();
    if (!fixture) throw new Error("expected hill circuit fixture");
    expect(fixture).toMatchObject({
      name: "Circuito collinare di Lydiard",
      description:
        "Due giri in stile Lydiard: salita controllata, recupero facile, discesa veloce e un altro recupero facile.",
    });
    expect(fixture.laps.map(({ name }) => name)).toEqual([
      "Riscaldamento",
      "Salita 1",
      "Recupero 1",
      "Discesa 1",
      "Recupero 2",
      "Salita 2",
      "Recupero 3",
      "Discesa 2",
      "Defaticamento",
    ]);

    const result = createWorkout(fixture);
    expect(result.kind).toBe("created");
    if (result.kind !== "created") throw new Error("expected workout");
    expect(result.workout.structure).toMatchObject({
      classifierVersion: 2,
      kind: "hill-circuit",
      repetitions: 2,
      coreLapIndexes: HILL_CIRCUIT_CORE_LAPS,
      lapRoles: HILL_CIRCUIT_LAP_ROLES,
    });
  });
});
