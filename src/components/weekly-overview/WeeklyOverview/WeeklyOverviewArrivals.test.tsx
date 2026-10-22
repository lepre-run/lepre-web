import { act, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Workout } from "../../../domain/workout";
import { useWorkoutArrivals } from "../../../hooks/useWorkoutArrivals";
import { buildWeeklyWorkout } from "../../../test/weekly-builders";
import { WeeklyOverview } from "./WeeklyOverview";

beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function SynchronizedOverview({ workouts }: Readonly<{ workouts: ReadonlyArray<Workout> }>) {
  return <WeeklyOverview workouts={workouts} arrivals={useWorkoutArrivals(workouts, true)} />;
}

const history = Array.from({ length: 6 }, (_, index) =>
  buildWeeklyWorkout(
    `workout:history-${index}`,
    new Date(Date.UTC(2026, 6, 20 - index * 7, 6)).toISOString(),
    `Week ${index + 1}`,
  ),
);

describe("WeeklyOverview arrivals", () => {
  it("does not replay the arrival animation after paging away and back", () => {
    const arrived = buildWeeklyWorkout("workout:arrived", "2026-07-21T06:00:00Z", "Fresh run");
    const { rerender } = render(<SynchronizedOverview workouts={history} />);
    rerender(<SynchronizedOverview workouts={[arrived, ...history]} />);
    expect(screen.getByRole("button", { name: /Open Fresh run/ })).toHaveAttribute(
      "data-new",
      "true",
    );

    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(screen.getByRole("button", { name: /Older weeks/ }));
    fireEvent.click(screen.getByRole("button", { name: /Newer weeks/ }));

    expect(screen.getByRole("button", { name: /Open Fresh run/ })).not.toHaveAttribute("data-new");
    expect(screen.getByRole("button", { name: /Open Week 1/ })).not.toHaveAttribute("data-new");
  });
});
