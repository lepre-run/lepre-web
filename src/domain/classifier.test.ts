import { describe, expect, it } from "vitest";

import { classifyWorkout } from "./classifier";
import type { Lap } from "./workout";

function lap(index: number, distanceMeters: number, paceSecondsPerKilometer: number): Lap {
  const movingDurationSeconds = Math.round((distanceMeters / 1_000) * paceSecondsPerKilometer);
  return {
    index,
    name: `Lap ${index}`,
    movingDurationSeconds,
    elapsedDurationSeconds: movingDurationSeconds,
    distanceMeters,
    averageHeartRateBpm: null,
    maxHeartRateBpm: null,
  };
}

describe("workout classifier", () => {
  it("recognizes repeated work and recovery stages", () => {
    const laps = [
      lap(1, 2_000, 330),
      lap(2, 1_000, 240),
      lap(3, 400, 390),
      lap(4, 1_000, 242),
      lap(5, 400, 385),
      lap(6, 1_000, 238),
      lap(7, 400, 395),
      lap(8, 1_000, 241),
      lap(9, 1_500, 340),
    ];

    expect(classifyWorkout(laps)).toMatchObject({
      schemaVersion: 1,
      classifierVersion: 2,
      source: "inferred_from_strava_laps",
      confidence: 0.98,
      kind: "intervals",
      repetitions: 4,
      work: { kind: "distance", meters: 1_000 },
      recovery: { kind: "distance", meters: 400 },
      coreLapIndexes: [2, 3, 4, 5, 6, 7, 8],
      lapRoles: {
        warmup: [1],
        work: [2, 4, 6, 8],
        recovery: [3, 5, 7],
        cooldown: [9],
        main: [],
        unknown: [],
      },
    });
  });

  it("recognizes a progressive sequence", () => {
    expect(
      classifyWorkout([
        lap(1, 2_000, 330),
        lap(2, 2_000, 310),
        lap(3, 2_000, 290),
        lap(4, 2_000, 270),
      ]),
    ).toMatchObject({ kind: "progressive", stageCount: 4 });
  });

  it("recognizes a sustained tempo core between easier running", () => {
    expect(
      classifyWorkout([
        lap(1, 2_000, 350),
        lap(2, 1_000, 270),
        lap(3, 1_000, 272),
        lap(4, 1_000, 268),
        lap(5, 2_000, 345),
      ]),
    ).toMatchObject({ kind: "tempo", distanceMeters: 3_000, coreLapIndexes: [2, 3, 4] });
  });

  it("recognizes deliberately varied steady stages", () => {
    expect(
      classifyWorkout([lap(1, 1_000, 300), lap(2, 2_000, 302), lap(3, 1_000, 298)]),
    ).toMatchObject({ kind: "steady-structured-run" });
  });

  it("recognizes repeated equal-distance hill efforts and returns", () => {
    expect(
      classifyWorkout([
        lap(1, 400, 360),
        lap(2, 400, 260),
        lap(3, 400, 355),
        lap(4, 400, 265),
        lap(5, 400, 365),
      ]),
    ).toMatchObject({ kind: "repeated-hills", repetitions: 3 });
  });

  it("recognizes a Lydiard hill circuit with alternating uphill and downhill stages", () => {
    const structure = classifyWorkout([
      lap(1, 5_254.05, 311),
      lap(2, 1_021.65, 310),
      lap(3, 288.08, 347),
      lap(4, 1_007.46, 202),
      lap(5, 366.76, 311),
      lap(6, 1_016.08, 324),
      lap(7, 296.63, 374),
      lap(8, 996.77, 211),
      lap(9, 7_516.96, 321),
    ]);

    expect(structure).toMatchObject({
      schemaVersion: 1,
      classifierVersion: 2,
      kind: "hill-circuit",
      repetitions: 2,
      coreLapIndexes: [2, 3, 4, 5, 6, 7, 8],
      lapRoles: {
        warmup: [1],
        work: [2, 4, 6, 8],
        recovery: [3, 5, 7],
        cooldown: [9],
      },
    });
  });

  it("keeps consistent automatic laps as a free run", () => {
    expect(
      classifyWorkout([
        lap(1, 1_000, 300),
        lap(2, 1_000, 302),
        lap(3, 1_000, 298),
        lap(4, 1_000, 301),
      ]),
    ).toMatchObject({
      schemaVersion: 1,
      classifierVersion: 2,
      source: "inferred_from_strava_laps",
      confidence: 0.9,
      kind: "free-run",
      coreLapIndexes: [],
      lapRoles: { main: [1, 2, 3, 4] },
    });
  });

  it("prefers unknown for irregular unsupported lap data", () => {
    expect(
      classifyWorkout([lap(1, 700, 300), lap(2, 1_800, 420), lap(3, 400, 250), lap(4, 2_300, 360)])
        .kind,
    ).toBe("unknown");
  });
});
