import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { buildWorkout } from "../../../test/builders";
import { inconsistentRecoveryFirstIntervalWorkout } from "../../../test/fixtures/recovery-first-interval-core";
import { WorkoutCard } from "./WorkoutCard";

const builders = vi.hoisted(() => ({ raceFails: false, freeRunFails: false }));

vi.mock("../RaceCard/raceCardData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../RaceCard/raceCardData")>();
  return {
    ...actual,
    raceCardPropsFromWorkout: (...args: Parameters<typeof actual.raceCardPropsFromWorkout>) => {
      if (builders.raceFails) throw new Error("race splits are inconsistent");
      return actual.raceCardPropsFromWorkout(...args);
    },
  };
});

vi.mock("../FreeRunCard/freeRunCardData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../FreeRunCard/freeRunCardData")>();
  return {
    ...actual,
    freeRunCardPropsFromWorkout: (
      ...args: Parameters<typeof actual.freeRunCardPropsFromWorkout>
    ) => {
      if (builders.freeRunFails) throw new Error("free-run laps are inconsistent");
      return actual.freeRunCardPropsFromWorkout(...args);
    },
  };
});

afterEach(() => {
  builders.raceFails = false;
  builders.freeRunFails = false;
  vi.restoreAllMocks();
});

it("falls back to the structured card when the race builder rejects a race", () => {
  builders.raceFails = true;
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const value = buildWorkout({ id: "strava:broken-race", name: "Broken race", type: "race" });

  render(<WorkoutCard workout={value} />);

  const article = screen.getByRole("heading", { name: "Broken race" }).closest("article");
  expect(article).toHaveClass("workout-card", `workout-card--${value.structure.kind}`);
  expect(article).not.toHaveClass("workout-card--race");
  expect(screen.queryByTestId("race-split-row")).not.toBeInTheDocument();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain("strava:broken-race");
  expect(warn.mock.calls[0][0]).toContain("race splits are inconsistent");
});

it("falls back to the structured card when the free-run builder rejects a free run", () => {
  builders.freeRunFails = true;
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const value = buildWorkout({ id: "strava:broken-free-run", name: "Broken free run" });
  expect(value.structure.kind).toBe("free-run");

  render(<WorkoutCard workout={value} />);

  const article = screen.getByRole("heading", { name: "Broken free run" }).closest("article");
  expect(article).toHaveClass("workout-card", "workout-card--free-run");
  expect(article).not.toHaveClass("workout-card--compact");
  expect(screen.queryByTestId("free-run-lap-row")).not.toBeInTheDocument();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain("strava:broken-free-run");
  expect(warn.mock.calls[0][0]).toContain("free-run laps are inconsistent");
});

it("warns once per workout object instead of on every render", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const value = inconsistentRecoveryFirstIntervalWorkout();
  const { rerender } = render(<WorkoutCard workout={value} />);

  rerender(<WorkoutCard workout={value} />);
  rerender(<WorkoutCard workout={value} />);

  expect(warn).toHaveBeenCalledTimes(1);

  rerender(<WorkoutCard workout={{ ...value }} />);

  expect(warn).toHaveBeenCalledTimes(2);
});

it("warns once per workout under StrictMode double rendering", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const value = inconsistentRecoveryFirstIntervalWorkout();

  render(
    <StrictMode>
      <WorkoutCard workout={value} />
    </StrictMode>,
  );

  expect(screen.queryByTestId("interval-repetition-row")).not.toBeInTheDocument();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain(value.id);
});
