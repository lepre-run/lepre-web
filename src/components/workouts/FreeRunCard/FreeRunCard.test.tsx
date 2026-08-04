import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DistanceMeters, DurationSeconds, Instant } from "../../../domain/identity";
import { createWorkout } from "../../../domain/workout";
import { FreeRunCard, freeRunCardPropsFromWorkout } from "../FreeRunCard/FreeRunCard";

describe("FreeRunCard", () => {
  it("renders its complete, strict summary contract", () => {
    render(
      <FreeRunCard
        title="Quiet morning"
        description="Easy miles by the river."
        privateDescription="Calf felt good after the first kilometre."
        distance={10_000 as DistanceMeters}
        time={3_120 as DurationSeconds}
        elevation={{ kind: "recorded", value: 84 }}
        averageHeartRate={{ kind: "recorded", value: 142.4 }}
        performedAt={"2026-07-20T06:00:00Z" as Instant}
        category="workout"
        sourceLapsAvailable={true}
        shapeSeed={42}
      />,
    );

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("Quiet morning");
    expect(card).toHaveTextContent("Easy miles by the river.");
    expect(card).toHaveTextContent("Private note");
    expect(card).toHaveTextContent("Calf felt good after the first kilometre.");
    expect(card).toHaveTextContent("10.00 km");
    expect(card).toHaveTextContent("52:00");
    expect(card).toHaveTextContent("84 m");
    expect(card).toHaveTextContent("142 bpm");
  });

  it("normalizes source limitations without leaking null into required measurements", () => {
    const result = createWorkout({
      id: "strava:free-run",
      performedAt: "2026-07-20T06:00:00Z",
      name: "Easy run",
      description: "   ",
      type: "workout",
      sport: "Run",
      durationSeconds: 1_800,
      elapsedDurationSeconds: 1_800,
      distanceMeters: 5_000,
      averageHeartRateBpm: null,
      maxHeartRateBpm: null,
      laps: [
        {
          index: 1,
          name: "Run",
          movingDurationSeconds: 1_800,
          elapsedDurationSeconds: 1_800,
          distanceMeters: 5_000,
          averageHeartRateBpm: null,
          maxHeartRateBpm: null,
        },
      ],
    });
    if (result.kind !== "created") throw new Error("expected workout");

    expect(freeRunCardPropsFromWorkout(result.workout)).toMatchObject({
      title: "Easy run",
      description: null,
      privateDescription: null,
      elevation: { kind: "unavailable" },
      averageHeartRate: { kind: "unavailable" },
    });
  });
});
