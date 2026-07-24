import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createWorkout, type Workout } from "../../domain/workout";
import { RaceCard, raceCardPropsFromWorkout } from "./RaceCard";

function raceWorkout(laps = true): Workout {
  const result = createWorkout({
    id: "strava:race",
    performedAt: "2026-07-13T06:00:00Z",
    name: "City 8K race",
    description: "A patient start and a strong finish.",
    type: "race",
    sport: "Run",
    durationSeconds: laps ? 1_770 : 0,
    elapsedDurationSeconds: laps ? 1_790 : 0,
    distanceMeters: laps ? 6_000 : 0,
    averageHeartRateBpm: 164,
    maxHeartRateBpm: 181,
    laps: laps
      ? [
          {
            index: 1,
            name: "First split",
            movingDurationSeconds: 620,
            elapsedDurationSeconds: 630,
            distanceMeters: 2_000,
            averageHeartRateBpm: 154,
            maxHeartRateBpm: 168,
          },
          {
            index: 2,
            name: "Second split",
            movingDurationSeconds: 590,
            elapsedDurationSeconds: 595,
            distanceMeters: 2_000,
            averageHeartRateBpm: 165,
            maxHeartRateBpm: 176,
          },
          {
            index: 3,
            name: "Final split",
            movingDurationSeconds: 560,
            elapsedDurationSeconds: 565,
            distanceMeters: 2_000,
            averageHeartRateBpm: 173,
            maxHeartRateBpm: 181,
          },
        ]
      : [],
  });
  if (result.kind !== "created") throw new Error("expected race workout");
  return result.workout;
}

describe("RaceCard", () => {
  it("maps a race into a dedicated strict payload", () => {
    const props = raceCardPropsFromWorkout(raceWorkout());

    expect(props).toMatchObject({
      category: "race",
      title: "City 8K race",
      description: "A patient start and a strong finish.",
      privateDescription: null,
      elevation: { kind: "unavailable" },
      averageHeartRate: { kind: "recorded", value: 164 },
      lapData: { kind: "available" },
    });
    if (props.lapData.kind !== "available") throw new Error("expected race laps");
    expect(props.lapData.laps.map((lap) => lap.role)).toEqual([
      { kind: "race", splitNumber: 1 },
      { kind: "race", splitNumber: 2 },
      { kind: "race", splitNumber: 3 },
    ]);
  });

  it("renders race splits instead of the inferred training structure", () => {
    render(<RaceCard {...raceCardPropsFromWorkout(raceWorkout())} />);

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.queryByText("Progressive")).not.toBeInTheDocument();
    const splits = screen.getAllByTestId("race-split-row");
    expect(splits).toHaveLength(3);
    expect(within(splits[0]).getByText("Lap 1")).toBeInTheDocument();
    expect(within(splits[2]).getByText("Final split")).toBeInTheDocument();
    expect(screen.getByText("3 laps")).toBeInTheDocument();
  });

  it("represents missing lap data explicitly", () => {
    const props = raceCardPropsFromWorkout(raceWorkout(false));
    expect(props.lapData).toEqual({ kind: "unavailable" });

    render(<RaceCard {...props} />);
    expect(screen.getByText("Strava did not provide lap data for this run.")).toBeInTheDocument();
  });

  it("rejects non-race workouts", () => {
    const value: Workout = { ...raceWorkout(), type: "workout" };
    expect(() => raceCardPropsFromWorkout(value)).toThrow("a race card requires a race workout");
  });
});
