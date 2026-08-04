import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
  WORKOUT_CLASSIFIER_VERSION,
} from "../../../domain/actual-workout-structure";
import { createWorkout, type Workout } from "../../../domain/workout";
import {
  IntervalRunCard,
  intervalRunCardPropsFromWorkout,
} from "../IntervalRunCard/IntervalRunCard";

function intervalWorkout(repetitionCount = 3): Workout {
  const result = createWorkout({
    id: "strava:interval-run",
    performedAt: "2026-07-20T06:00:00Z",
    name: "Track intervals",
    description: "Controlled effort throughout.",
    type: "workout",
    sport: "Run",
    durationSeconds: 2_403,
    elapsedDurationSeconds: 2_430,
    distanceMeters: 6_800,
    averageHeartRateBpm: 151,
    maxHeartRateBpm: 177,
    laps: [
      {
        index: 1,
        name: "Warm up",
        movingDurationSeconds: 660,
        elapsedDurationSeconds: 670,
        distanceMeters: 2_000,
        averageHeartRateBpm: 128,
        maxHeartRateBpm: 142,
      },
      {
        index: 2,
        name: "Rep 1",
        movingDurationSeconds: 240,
        elapsedDurationSeconds: 240,
        distanceMeters: 1_000,
        averageHeartRateBpm: 158,
        maxHeartRateBpm: 169,
      },
      {
        index: 3,
        name: "Recovery 1",
        movingDurationSeconds: 150,
        elapsedDurationSeconds: 155,
        distanceMeters: 400,
        averageHeartRateBpm: 146,
        maxHeartRateBpm: 160,
      },
      {
        index: 4,
        name: "Rep 2",
        movingDurationSeconds: 238,
        elapsedDurationSeconds: 238,
        distanceMeters: 1_000,
        averageHeartRateBpm: null,
        maxHeartRateBpm: null,
      },
      {
        index: 5,
        name: "Recovery 2",
        movingDurationSeconds: 150,
        elapsedDurationSeconds: 150,
        distanceMeters: 400,
        averageHeartRateBpm: 149,
        maxHeartRateBpm: 163,
      },
      {
        index: 6,
        name: "Rep 3",
        movingDurationSeconds: 235,
        elapsedDurationSeconds: 237,
        distanceMeters: 1_000,
        averageHeartRateBpm: 164,
        maxHeartRateBpm: 177,
      },
      {
        index: 7,
        name: "Cool down",
        movingDurationSeconds: 730,
        elapsedDurationSeconds: 740,
        distanceMeters: 1_000,
        averageHeartRateBpm: 142,
        maxHeartRateBpm: 151,
      },
    ],
    structure: {
      schemaVersion: ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
      classifierVersion: WORKOUT_CLASSIFIER_VERSION,
      source: "inferred_from_strava_laps",
      confidence: 0.96,
      kind: "intervals",
      repetitions: repetitionCount,
      work: { kind: "distance", meters: 1_000 },
      recovery: { kind: "distance", meters: 400 },
      coreLapIndexes: [2, 3, 4, 5, 6],
      lapRoles: {
        warmup: [1],
        work: [2, 4, 6],
        recovery: [3, 5],
        cooldown: [7],
        main: [],
        unknown: [],
      },
    },
  });
  if (result.kind !== "created") throw new Error("expected interval workout");
  return result.workout;
}

describe("IntervalRunCard", () => {
  it("maps shared data, explicit repetitions, and complete raw laps into strict props", () => {
    const props = intervalRunCardPropsFromWorkout(intervalWorkout());

    expect(props).toMatchObject({
      title: "Track intervals",
      description: "Controlled effort throughout.",
      privateDescription: null,
      elevation: { kind: "unavailable" },
      averageHeartRate: { kind: "recorded", value: 151 },
    });
    expect(props.repetitions.map((repetition) => repetition.kind)).toEqual([
      "work-and-recovery",
      "work-and-recovery",
      "work-only",
    ]);
    expect(props.repetitions.map((repetition) => repetition.work.sourceLapNumber)).toEqual([
      2, 4, 6,
    ]);
    expect(props.repetitions[1].work.averageHeartRate).toEqual({ kind: "unavailable" });
    expect(props.sourceLaps.map((lap) => lap.role)).toEqual([
      { kind: "warmup" },
      { kind: "work", repetitionNumber: 1 },
      { kind: "recovery", repetitionNumber: 1 },
      { kind: "work", repetitionNumber: 2 },
      { kind: "recovery", repetitionNumber: 2 },
      { kind: "work", repetitionNumber: 3 },
      { kind: "cooldown" },
    ]);
  });

  it("renders work and recovery together while retaining warm-up and cool-down", () => {
    render(<IntervalRunCard {...intervalRunCardPropsFromWorkout(intervalWorkout())} />);

    expect(screen.getByRole("heading", { name: "Track intervals" })).toBeInTheDocument();
    expect(screen.getByText("Intervals")).toBeInTheDocument();
    const boundaries = screen.getAllByTestId("interval-boundary-lap-row");
    expect(boundaries).toHaveLength(2);
    expect(within(boundaries[0]).getByText("Warm-up")).toBeInTheDocument();
    expect(within(boundaries[1]).getByText("Cool-down")).toBeInTheDocument();

    const repetitions = screen.getAllByTestId("interval-repetition-row");
    expect(repetitions).toHaveLength(3);
    expect(within(repetitions[0]).getByText(/Interval 1/)).toBeInTheDocument();
    expect(within(repetitions[0]).getByText(/Recovery 1/)).toBeInTheDocument();
    expect(within(repetitions[1]).getByText(/Interval 2/)).toBeInTheDocument();
    expect(within(repetitions[1]).getByText(/Recovery 2/)).toBeInTheDocument();
    expect(within(repetitions[2]).getByText(/Interval 3/)).toBeInTheDocument();
    expect(within(repetitions[2]).getByText("No recovery lap")).toBeInTheDocument();
    expect(screen.getByText("7 laps")).toBeInTheDocument();
  });

  it("rejects inconsistent repetition metadata instead of rendering partial data", () => {
    expect(() => intervalRunCardPropsFromWorkout(intervalWorkout(2))).toThrow(
      "interval repetition metadata does not match its work laps",
    );
  });

  it("rejects roles that do not follow the chronological core-lap sequence", () => {
    const valid = intervalWorkout();
    if (valid.structure.kind !== "intervals") throw new Error("expected interval structure");
    const invalid: Workout = {
      ...valid,
      structure: { ...valid.structure, coreLapIndexes: [3, 2, 4, 5, 6] },
    };

    expect(() => intervalRunCardPropsFromWorkout(invalid)).toThrow(
      "interval core laps are not in chronological work/recovery order",
    );
  });
});
