import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
  WORKOUT_CLASSIFIER_VERSION,
} from "../../domain/actual-workout-structure";
import { createWorkout, type Workout } from "../../domain/workout";
import { ProgressiveRunCard, progressiveRunCardPropsFromWorkout } from "./ProgressiveRunCard";

function progressiveWorkout(stageCount = 4): Workout {
  const result = createWorkout({
    id: "strava:progressive-run",
    performedAt: "2026-07-20T06:00:00Z",
    name: "Progressive morning",
    description: "Finished faster than I started.",
    type: "workout",
    sport: "Run",
    durationSeconds: 3_300,
    elapsedDurationSeconds: 3_330,
    distanceMeters: 10_000,
    averageHeartRateBpm: 148,
    maxHeartRateBpm: 171,
    laps: [
      {
        index: 1,
        name: "Warm up",
        movingDurationSeconds: 600,
        elapsedDurationSeconds: 620,
        distanceMeters: 1_500,
        averageHeartRateBpm: 128,
        maxHeartRateBpm: 139,
      },
      {
        index: 2,
        name: "Stage 1",
        movingDurationSeconds: 650,
        elapsedDurationSeconds: 650,
        distanceMeters: 2_000,
        averageHeartRateBpm: 140,
        maxHeartRateBpm: 151,
      },
      {
        index: 3,
        name: "Stage 2",
        movingDurationSeconds: 620,
        elapsedDurationSeconds: 620,
        distanceMeters: 2_000,
        averageHeartRateBpm: null,
        maxHeartRateBpm: null,
      },
      {
        index: 4,
        name: "Stage 3",
        movingDurationSeconds: 590,
        elapsedDurationSeconds: 590,
        distanceMeters: 2_000,
        averageHeartRateBpm: 158,
        maxHeartRateBpm: 169,
      },
      {
        index: 5,
        name: "Stage 4",
        movingDurationSeconds: 540,
        elapsedDurationSeconds: 550,
        distanceMeters: 2_000,
        averageHeartRateBpm: 163,
        maxHeartRateBpm: 174,
      },
      {
        index: 6,
        name: "Cool down",
        movingDurationSeconds: 300,
        elapsedDurationSeconds: 300,
        distanceMeters: 500,
        averageHeartRateBpm: 143,
        maxHeartRateBpm: 151,
      },
    ],
    structure: {
      schemaVersion: ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
      classifierVersion: WORKOUT_CLASSIFIER_VERSION,
      source: "inferred_from_strava_laps",
      confidence: 0.91,
      kind: "progressive",
      stageCount,
      coreLapIndexes: [2, 3, 4, 5],
      lapRoles: {
        warmup: [1],
        work: [2, 3, 4, 5],
        recovery: [],
        cooldown: [6],
        main: [],
        unknown: [],
      },
    },
  });
  if (result.kind !== "created") throw new Error("expected progressive workout");
  return result.workout;
}

describe("ProgressiveRunCard", () => {
  it("maps shared data, ordered stages, and complete raw laps into strict props", () => {
    const props = progressiveRunCardPropsFromWorkout(progressiveWorkout());

    expect(props).toMatchObject({
      title: "Progressive morning",
      description: "Finished faster than I started.",
      privateDescription: null,
      elevation: { kind: "unavailable" },
      averageHeartRate: { kind: "recorded", value: 148 },
    });
    expect(props.stages.map((stage) => stage.sourceLapNumber)).toEqual([2, 3, 4, 5]);
    expect(props.stages[1].averageHeartRate).toEqual({ kind: "unavailable" });
    expect(props.sourceLaps.map((lap) => lap.role)).toEqual([
      { kind: "warmup" },
      { kind: "stage", stageNumber: 1 },
      { kind: "stage", stageNumber: 2 },
      { kind: "stage", stageNumber: 3 },
      { kind: "stage", stageNumber: 4 },
      { kind: "cooldown" },
    ]);
  });

  it("renders from the strict payload without receiving a domain workout", () => {
    render(<ProgressiveRunCard {...progressiveRunCardPropsFromWorkout(progressiveWorkout())} />);

    expect(screen.getByRole("heading", { name: "Progressive morning" })).toBeInTheDocument();
    expect(screen.getByText("Progressive")).toBeInTheDocument();
    const laps = screen.getAllByTestId("progressive-lap-row");
    expect(laps).toHaveLength(6);
    expect(within(laps[0]).getByText("Warm-up")).toBeInTheDocument();
    expect(within(laps[1]).getByText("Lap 1")).toBeInTheDocument();
    expect(within(laps[5]).getByText("Cool-down")).toBeInTheDocument();
    expect(screen.queryByText("Stage execution")).not.toBeInTheDocument();
    expect(screen.queryByText("Slower → faster")).not.toBeInTheDocument();
    expect(screen.getByText("6 laps")).toBeInTheDocument();
  });

  it("rejects inconsistent stage metadata instead of rendering partial data", () => {
    expect(() => progressiveRunCardPropsFromWorkout(progressiveWorkout(3))).toThrow(
      "progressive stage metadata does not match its work laps",
    );
  });

  it("rejects source-lap roles that reference missing data", () => {
    const valid = progressiveWorkout();
    if (valid.structure.kind !== "progressive") throw new Error("expected progressive structure");
    const invalid: Workout = {
      ...valid,
      structure: {
        ...valid.structure,
        lapRoles: { ...valid.structure.lapRoles, unknown: [99] },
      },
    };

    expect(() => progressiveRunCardPropsFromWorkout(invalid)).toThrow(
      "progressive workout role references missing lap 99",
    );
  });
});
