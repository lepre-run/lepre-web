import { describe, expect, it } from "vitest";
import { intervalRunCardPropsFromWorkout } from "../components/workouts/IntervalRunCard/intervalRunCardData";
import { buildWorkout } from "../test/builders";
import { heartRateLedIntervalLaps } from "../test/fixtures/heart-rate-led-interval-core";
import { WORKOUT_CLASSIFIER_VERSION } from "./actual-workout-structure";
import { classifyWorkout } from "./classifier";

describe("interval work/rest split with heart rate", () => {
  it("uses heart rate to pick the work laps when the rest laps have a faster pace", () => {
    expect(classifyWorkout(heartRateLedIntervalLaps)).toMatchObject({
      classifierVersion: WORKOUT_CLASSIFIER_VERSION,
      kind: "intervals",
      repetitions: 3,
      coreLapIndexes: [2, 3, 4, 5, 6, 7],
      lapRoles: { warmup: [1], work: [2, 4, 6], recovery: [3, 5, 7], cooldown: [8] },
    });
  });

  it("shows the rest lap before the cool-down as the last recovery", () => {
    const props = intervalRunCardPropsFromWorkout(buildWorkout({ laps: heartRateLedIntervalLaps }));

    expect(props.repetitions.map((repetition) => repetition.kind)).toEqual([
      "work-and-recovery",
      "work-and-recovery",
      "work-and-recovery",
    ]);
  });

  it("falls back to pace when heart rate is missing", () => {
    const laps = heartRateLedIntervalLaps.map((lap) => ({ ...lap, averageHeartRateBpm: null }));

    expect(classifyWorkout(laps)).toMatchObject({
      kind: "intervals",
      lapRoles: { warmup: [1, 2], work: [3, 5, 7], recovery: [4, 6], cooldown: [8] },
    });
  });
});
