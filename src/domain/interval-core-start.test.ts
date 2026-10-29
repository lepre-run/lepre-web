import { describe, expect, it } from "vitest";
import { intervalRunCardPropsFromWorkout } from "../components/workouts/IntervalRunCard/intervalRunCardData";
import { buildWorkout } from "../test/builders";
import {
  recoveryFirstIntervalLaps,
  recoveryFirstIntervalWorkout,
  storedV2RecoveryFirstStructure,
} from "../test/fixtures/recovery-first-interval-core";
import { WORKOUT_CLASSIFIER_VERSION } from "./actual-workout-structure";
import { classifyWorkout } from "./classifier";
import type { Lap } from "./workout";

describe("interval core start", () => {
  it("moves a leading easy lap into the warm-up instead of starting the core with recovery", () => {
    expect(classifyWorkout(recoveryFirstIntervalLaps)).toMatchObject({
      classifierVersion: WORKOUT_CLASSIFIER_VERSION,
      kind: "intervals",
      repetitions: 3,
      coreLapIndexes: [3, 4, 5, 6, 7],
      lapRoles: { warmup: [1, 2], work: [3, 5, 7], recovery: [4, 6], cooldown: [8] },
    });
  });

  it("reclassifies a stored v2 structure whose interval core starts with recovery", () => {
    const workout = recoveryFirstIntervalWorkout(storedV2RecoveryFirstStructure);

    expect(workout.structure).toEqual(classifyWorkout(recoveryFirstIntervalLaps));
    expect(workout.structure.coreLapIndexes[0]).toBe(3);
  });

  it("always starts an interval core with a work lap", () => {
    const random = seededRandom(6);
    let intervalCount = 0;
    for (let sample = 0; sample < 300; sample += 1) {
      const workout = buildWorkout({ laps: randomAlternatingLaps(random) });
      const { structure } = workout;
      if (structure.kind !== "intervals") continue;
      intervalCount += 1;
      expect(structure.lapRoles.work).toContain(structure.coreLapIndexes[0]);
      expect(() => intervalRunCardPropsFromWorkout(workout)).not.toThrow();
    }
    expect(intervalCount).toBeGreaterThan(50);
  });
});

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

function randomAlternatingLaps(random: () => number): ReadonlyArray<Lap> {
  const jitter = (value: number, spread: number) => value * (1 + (random() - 0.5) * spread);
  const workDistance = 400 + Math.round(random() * 1_200);
  const recoveryDistance = 200 + Math.round(random() * 1_000);
  const paces: number[] = [];
  const distances: number[] = [];
  const push = (distance: number, pace: number) => {
    distances.push(Math.round(jitter(distance, 0.1)));
    paces.push(Math.round(jitter(pace, 0.06)));
  };
  if (random() < 0.7) push(1_000 + random() * 3_000, 340);
  if (random() < 0.6) push(recoveryDistance, 350);
  const repetitions = 3 + Math.floor(random() * 4);
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    push(workDistance, 240);
    if (repetition < repetitions - 1 || random() < 0.5) push(recoveryDistance, 360);
  }
  if (random() < 0.7) push(1_000 + random() * 3_000, 330);
  return distances.map((distance, position) => {
    const movingDurationSeconds = Math.round((distance / 1_000) * paces[position]);
    return {
      index: position + 1,
      name: `Generated ${position + 1}`,
      movingDurationSeconds,
      elapsedDurationSeconds: movingDurationSeconds,
      distanceMeters: distance,
      averageHeartRateBpm: null,
      maxHeartRateBpm: null,
    };
  });
}
