import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createWorkout, type Lap, type Workout } from "../domain/workout";
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

function workout(laps: ReadonlyArray<Lap>, name = "Original activity"): Workout {
  const durationSeconds = laps.reduce((total, value) => total + value.movingDurationSeconds, 0);
  const distanceMeters = laps.reduce((total, value) => total + value.distanceMeters, 0);
  const result = createWorkout({
    id: `strava:${name}`,
    performedAt: "2026-07-15T06:00:00Z",
    name,
    description: "",
    type: "workout",
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

describe("WorkoutCard", () => {
  it("pairs each interval with its following recovery", () => {
    const value = workout([
      lap(1, "Warm up", 2_000, 660),
      lap(2, "Rep 1", 1_000, 240),
      lap(3, "Recovery 1", 400, 150),
      lap(4, "Rep 2", 1_000, 238),
      lap(5, "Recovery 2", 400, 150),
      lap(6, "Rep 3", 1_000, 235),
      lap(7, "Cool down", 2_000, 680),
    ]);

    render(<WorkoutCard workout={value} />);

    expect(
      screen.getByRole("heading", { name: "3 × 1 km intervals with 400 m recovery" }),
    ).toBeInTheDocument();
    const repetitions = screen.getAllByTestId("repetition-row");
    expect(repetitions).toHaveLength(3);
    expect(within(repetitions[0]).getByText("Laps 2 + 3")).toBeInTheDocument();
    expect(within(repetitions[1]).getByText("Laps 4 + 5")).toBeInTheDocument();
    expect(within(repetitions[2]).getByText("Lap 6")).toBeInTheDocument();
    expect(within(repetitions[2]).getByText("No recovery lap")).toBeInTheDocument();
    expect(screen.getByText("Session structure")).toBeInTheDocument();
  });

  it("keeps the dominant one-lap free run compact", () => {
    const value = workout([lap(1, "Run", 10_000, 3_300)], "Easy river loop");

    render(<WorkoutCard workout={value} />);

    const heading = screen.getByRole("heading", { name: "Easy river loop" });
    expect(heading.closest("article")).toHaveClass("workout-card--compact");
    expect(screen.getByText("Free run")).toBeInTheDocument();
    expect(screen.queryByText("Session structure")).not.toBeInTheDocument();
    expect(screen.getAllByText("Source-lap evidence")).not.toHaveLength(0);
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

    expect(screen.getByRole("heading", { name: "4-stage progressive run" })).toBeInTheDocument();
    expect(screen.getAllByTestId("stage-row")).toHaveLength(4);
    expect(screen.getByText("Slower → faster")).toBeInTheDocument();
  });
});
