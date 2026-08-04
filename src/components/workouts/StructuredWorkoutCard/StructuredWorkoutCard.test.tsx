import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Workout } from "../../../domain/workout";
import { i18n } from "../../../i18n/i18n";
import { buildWorkout } from "../../../test/builders";
import { StructuredWorkoutCard } from "../StructuredWorkoutCard/StructuredWorkoutCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

function tempoWorkout(): Workout {
  return buildWorkout({
    id: "workout:tempo",
    name: "Friday tempo",
    laps: [
      {
        index: 1,
        name: "Warm up",
        movingDurationSeconds: 600,
        elapsedDurationSeconds: 600,
        distanceMeters: 1_500,
        averageHeartRateBpm: 130,
        maxHeartRateBpm: 142,
      },
      {
        index: 2,
        name: "Tempo",
        movingDurationSeconds: 1_400,
        elapsedDurationSeconds: 1_400,
        distanceMeters: 5_000,
        averageHeartRateBpm: 158,
        maxHeartRateBpm: 171,
      },
      {
        index: 3,
        name: "Cool down",
        movingDurationSeconds: 480,
        elapsedDurationSeconds: 480,
        distanceMeters: 1_200,
        averageHeartRateBpm: 139,
        maxHeartRateBpm: 149,
      },
    ],
    structure: {
      schemaVersion: 1,
      classifierVersion: 1,
      source: "inferred_from_strava_laps",
      confidence: 0.94,
      kind: "tempo",
      distanceMeters: 5_000,
      coreLapIndexes: [2],
      lapRoles: {
        warmup: [1],
        work: [2],
        recovery: [],
        cooldown: [3],
        main: [],
        unknown: [],
      },
    },
  });
}

function repeatedHillsWorkout(): Workout {
  return buildWorkout({
    id: "workout:hills",
    name: "Hill pairs",
    laps: [
      {
        index: 1,
        name: "Climb 1",
        movingDurationSeconds: 120,
        elapsedDurationSeconds: 120,
        distanceMeters: 300,
      },
      {
        index: 2,
        name: "Return 1",
        movingDurationSeconds: 150,
        elapsedDurationSeconds: 150,
        distanceMeters: 300,
      },
      {
        index: 3,
        name: "Climb 2",
        movingDurationSeconds: 115,
        elapsedDurationSeconds: 115,
        distanceMeters: 300,
      },
      {
        index: 4,
        name: "Return 2",
        movingDurationSeconds: 145,
        elapsedDurationSeconds: 145,
        distanceMeters: 300,
      },
    ],
    structure: {
      schemaVersion: 1,
      classifierVersion: 1,
      source: "inferred_from_strava_laps",
      confidence: 0.9,
      kind: "repeated-hills",
      repetitions: 2,
      coreLapIndexes: [1, 2, 3, 4],
      lapRoles: {
        warmup: [],
        work: [1, 3],
        recovery: [2, 4],
        cooldown: [],
        main: [],
        unknown: [],
      },
    },
  });
}

describe("StructuredWorkoutCard", () => {
  it("shows a tempo workout as an ordered execution", () => {
    const workout = tempoWorkout();

    render(<StructuredWorkoutCard workout={workout} />);

    expect(screen.getByRole("heading", { name: "Friday tempo" })).toBeInTheDocument();
    expect(screen.getByText("5 km tempo")).toBeInTheDocument();
    const execution = screen.getByRole("region", { name: "Stage execution" });
    expect(within(execution).getByText("Work")).toBeInTheDocument();
    expect(within(execution).getByText("5.00 km · 23:20")).toBeInTheDocument();
  });

  it("shows the complete workout summary", () => {
    render(<StructuredWorkoutCard workout={tempoWorkout()} />);

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("Jul 20, 2026");
    expect(card).toHaveTextContent("7.70 km");
    expect(card).toHaveTextContent("41:20");
    expect(card).toHaveTextContent("142 bpm");
    expect(card).toHaveTextContent("Easy miles before breakfast.");
  });

  it("reveals the original laps as source evidence", () => {
    render(<StructuredWorkoutCard workout={tempoWorkout()} />);

    const summary = screen.getByText("Expand").closest("summary");
    if (!summary) throw new Error("expected source evidence summary");
    fireEvent.click(summary);

    const table = screen.getByRole("table", { name: "Source-lap evidence" });
    expect(within(table).getByRole("cell", { name: /Warm up/ })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Work" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: /Cool down/ })).toBeInTheDocument();
  });

  it("pairs repeated hills with their recovery laps", () => {
    render(<StructuredWorkoutCard workout={repeatedHillsWorkout()} />);

    const execution = screen.getByRole("region", { name: "Main-set execution" });
    expect(within(execution).getByText("Laps 1 + 2")).toBeInTheDocument();
    expect(within(execution).getByText("Laps 3 + 4")).toBeInTheDocument();
    expect(within(execution).getAllByText("Work")).toHaveLength(2);
    expect(within(execution).getAllByText("Recovery")).toHaveLength(2);
  });

  it("makes a missing hill recovery explicit", () => {
    const paired = repeatedHillsWorkout();
    const workout = buildWorkout({
      laps: paired.laps.slice(0, 3),
      structure: {
        ...paired.structure,
        coreLapIndexes: [1, 2, 3],
        lapRoles: {
          ...paired.structure.lapRoles,
          work: [1, 3],
          recovery: [2],
        },
      },
    });

    render(<StructuredWorkoutCard workout={workout} />);

    const execution = screen.getByRole("region", { name: "Main-set execution" });
    expect(within(execution).getByText("No recovery lap")).toBeInTheDocument();
  });

  it("explains when the source activity has no lap data", () => {
    render(<StructuredWorkoutCard workout={buildWorkout({ laps: [] })} />);

    expect(screen.getByText("Strava did not provide lap data for this run.")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows only source evidence when the structure is unknown", () => {
    const workout = buildWorkout({
      structure: {
        schemaVersion: 1,
        classifierVersion: 1,
        source: "inferred_from_strava_laps",
        confidence: 0.2,
        kind: "unknown",
        coreLapIndexes: [],
        lapRoles: {
          warmup: [],
          work: [],
          recovery: [],
          cooldown: [],
          main: [],
          unknown: [1],
        },
      },
    });

    render(<StructuredWorkoutCard workout={workout} />);

    expect(screen.getByText("Expand")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
