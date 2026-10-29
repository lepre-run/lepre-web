import { fireEvent, render, screen, within } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, expect, it } from "vitest";
import { buildWorkout } from "../../../test/builders";
import { StructuredWorkoutCard } from "../StructuredWorkoutCard/StructuredWorkoutCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

import { repeatedHillsWorkout, tempoWorkout } from "../../../test/structured-workout-card-builders";

it("shows a tempo workout as an ordered execution", () => {
  const workout = tempoWorkout();

  render(<StructuredWorkoutCard workout={workout} />);

  expect(screen.getByRole("heading", { name: "Friday tempo" })).toBeInTheDocument();
  expect(screen.getByText("5 km tempo")).toBeInTheDocument();
  const execution = screen.getByRole("region", { name: "Stage execution" });
  expect(within(execution).getAllByTestId("structured-lap-row")).toHaveLength(3);
  expect(within(execution).getByText("Warm-up")).toBeInTheDocument();
  expect(within(execution).getByText("Work")).toBeInTheDocument();
  expect(within(execution).getByText("Cool-down")).toBeInTheDocument();
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

it("retains warm-up and cool-down around paired hills", () => {
  const paired = repeatedHillsWorkout();
  const workout = buildWorkout({
    id: paired.id,
    name: paired.name,
    laps: [
      {
        index: 1,
        name: "Warm up",
        movingDurationSeconds: 600,
        elapsedDurationSeconds: 600,
        distanceMeters: 1_500,
      },
      ...paired.laps.map((lap) => ({ ...lap, index: lap.index + 1 })),
      {
        index: 6,
        name: "Cool down",
        movingDurationSeconds: 480,
        elapsedDurationSeconds: 480,
        distanceMeters: 1_200,
      },
    ],
    structure: {
      ...paired.structure,
      coreLapIndexes: [2, 3, 4, 5],
      lapRoles: {
        warmup: [1],
        work: [2, 4],
        recovery: [3, 5],
        cooldown: [6],
        main: [],
        unknown: [],
      },
    },
  });

  render(<StructuredWorkoutCard workout={workout} />);

  const execution = screen.getByRole("region", { name: "Main-set execution" });
  expect(within(execution).getAllByTestId("structured-lap-row")).toHaveLength(2);
  expect(within(execution).getByText("Warm-up")).toBeInTheDocument();
  expect(within(execution).getByText("Cool-down")).toBeInTheDocument();
  expect(within(execution).getByText("Laps 2 + 3")).toBeInTheDocument();
  expect(within(execution).getByText("Laps 4 + 5")).toBeInTheDocument();
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

it("shows every lap when the structure is unknown", () => {
  const workout = buildWorkout({
    structure: {
      schemaVersion: 1,
      classifierVersion: 3,
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
  const execution = screen.getByRole("region", { name: "Stage execution" });
  expect(within(execution).getAllByTestId("structured-lap-row")).toHaveLength(1);
  expect(within(execution).getByText("Unknown")).toBeInTheDocument();
});
