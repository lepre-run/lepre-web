import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createWorkout, type Lap, type Workout } from "../../../domain/workout";
import {
  inconsistentRecoveryFirstIntervalWorkout,
  recoveryFirstIntervalWorkout,
} from "../../../test/fixtures/recovery-first-interval-core";
import { expectIntervalExecution } from "../../../test/workout-card-assertions";
import { WorkoutCard } from "./WorkoutCard";

function lap(
  index: number,
  name: string,
  distanceMeters: number,
  movingDurationSeconds: number,
): Lap {
  return {
    index,
    name,
    distanceMeters,
    movingDurationSeconds,
    elapsedDurationSeconds: movingDurationSeconds,
    averageHeartRateBpm: 140 + index,
    maxHeartRateBpm: 150 + index,
  };
}

function workout(
  laps: ReadonlyArray<Lap>,
  name = "Original activity",
  type: "workout" | "race" = "workout",
): Workout {
  const durationSeconds = laps.reduce((total, value) => total + value.movingDurationSeconds, 0);
  const distanceMeters = laps.reduce((total, value) => total + value.distanceMeters, 0);
  const result = createWorkout({
    id: `strava:${name}`,
    performedAt: "2026-07-15T06:00:00Z",
    name,
    description: "",
    type,
    sport: "Run",
    durationSeconds,
    elapsedDurationSeconds: durationSeconds,
    distanceMeters,
    averageHeartRateBpm: 150,
    maxHeartRateBpm: 170,
    laps,
  });
  if (result.kind !== "created") throw new Error("expected workout");
  return result.workout;
}

function intervalLaps(includeCooldown = true): ReadonlyArray<Lap> {
  const core = [
    lap(1, "Warm up", 2_000, 660),
    lap(2, "Rep 1", 1_000, 240),
    lap(3, "Recovery 1", 400, 150),
    lap(4, "Rep 2", 1_000, 238),
    lap(5, "Recovery 2", 400, 150),
    lap(6, "Rep 3", 1_000, 235),
  ];
  return includeCooldown ? [...core, lap(7, "Cool down", 2_000, 680)] : core;
}

afterEach(() => {
  vi.restoreAllMocks();
});

it("shows each interval beside its recovery", () => {
  const value = workout(intervalLaps());

  render(<WorkoutCard workout={value} />);

  expectIntervalExecution("Original activity");
  expect(screen.queryByText("Session structure")).not.toBeInTheDocument();
});

it("keeps a free run compact while showing every lap", () => {
  const value = workout([lap(1, "Run", 10_000, 3_300)], "Easy river loop");

  render(<WorkoutCard workout={value} />);

  const heading = screen.getByRole("heading", { name: "Easy river loop" });
  expect(heading.closest("article")).toHaveClass("workout-card--compact");
  expect(screen.getByText("Free run")).toBeInTheDocument();
  expect(screen.queryByText("Session structure")).not.toBeInTheDocument();
  expect(screen.getAllByTestId("free-run-lap-row")).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Lap execution" })).toBeInTheDocument();
});

it("routes races to their own card instead of an inferred workout card", () => {
  const value = workout(
    [
      lap(1, "First split", 2_000, 620),
      lap(2, "Second split", 2_000, 590),
      lap(3, "Final split", 2_000, 560),
    ],
    "City race",
    "race",
  );

  render(<WorkoutCard workout={value} />);

  const article = screen.getByRole("heading", { name: "City race" }).closest("article");
  expect(article).toHaveClass("workout-card--race");
  expect(screen.getByText("Race")).toBeInTheDocument();
  expect(screen.queryByText("Progressive")).not.toBeInTheDocument();
  expect(screen.getAllByTestId("race-split-row")).toHaveLength(3);
});

it("makes structured source evidence visibly expandable", () => {
  const value = workout(intervalLaps(false));

  render(<WorkoutCard workout={value} />);

  const summary = screen.getByText("Expand").closest("summary");
  if (!summary) throw new Error("expected source-evidence summary");
  expect(summary.closest("details")).not.toHaveAttribute("open");
  expect(within(summary).getByText("Expand")).toBeInTheDocument();

  fireEvent.click(summary);

  expect(within(summary).getByText("Collapse")).toBeInTheDocument();
  expect(summary.closest("details")).toHaveAttribute("open");
});

it("explains when the source activity has no lap data", () => {
  render(<WorkoutCard workout={workout([], "Run without laps")} />);

  expect(screen.getByText("Strava did not provide lap data for this run.")).toBeInTheDocument();
  expect(screen.queryByText("Source-lap evidence")).not.toBeInTheDocument();
});

it("shows progressive stages as an ordered execution sequence", () => {
  const value = workout([
    lap(1, "Stage 1", 2_000, 660),
    lap(2, "Stage 2", 2_000, 620),
    lap(3, "Stage 3", 2_000, 580),
    lap(4, "Stage 4", 2_000, 540),
  ]);

  render(<WorkoutCard workout={value} />);

  expect(screen.getByRole("heading", { name: "Original activity" })).toBeInTheDocument();
  expect(screen.getByText("Progressive")).toBeInTheDocument();
  expect(screen.getAllByTestId("progressive-lap-row")).toHaveLength(4);
  expect(screen.queryByText("Stage execution")).not.toBeInTheDocument();
  expect(screen.queryByText("Slower → faster")).not.toBeInTheDocument();
});

it("renders the reclassified recovery-first fixture as warm-up, three reps and cool-down", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  render(<WorkoutCard workout={recoveryFirstIntervalWorkout()} />);

  const repetitions = screen.getAllByTestId("interval-repetition-row");
  expect(repetitions).toHaveLength(3);
  expect(within(repetitions[2]).getByText("No recovery lap")).toBeInTheDocument();
  expect(screen.getAllByTestId("interval-boundary-lap-row")).toHaveLength(3);
  expect(warn).not.toHaveBeenCalled();
});

it("falls back to the structured card when a stored interval core starts with recovery", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const value = inconsistentRecoveryFirstIntervalWorkout();

  render(<WorkoutCard workout={value} />);

  const article = screen.getByRole("heading", { name: value.name }).closest("article");
  expect(article).toHaveClass("workout-card", "workout-card--intervals");
  expect(screen.queryByTestId("interval-repetition-row")).not.toBeInTheDocument();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain(value.id);
  expect(warn.mock.calls[0][0]).toContain("interval core lap 2 must be a work lap");
});

it("falls back to the structured card when progressive stages are inconsistent", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const progressive = workout(
    [
      lap(1, "Stage 1", 2_000, 660),
      lap(2, "Stage 2", 2_000, 620),
      lap(3, "Stage 3", 2_000, 580),
      lap(4, "Stage 4", 2_000, 540),
    ],
    "Broken progressive",
  );
  const value = {
    ...progressive,
    structure: { ...progressive.structure, stageCount: 9 },
  } as Workout;

  render(<WorkoutCard workout={value} />);

  const article = screen.getByRole("heading", { name: "Broken progressive" }).closest("article");
  expect(article).toHaveClass("workout-card--progressive");
  expect(screen.queryByTestId("progressive-lap-row")).not.toBeInTheDocument();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain("strava:Broken progressive");
});
