import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { buildWeeklyWorkout, weekFor } from "../../../test/weekly-builders";
import { WeeklyDay } from "../WeeklyDay/WeeklyDay";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WeeklyDay", () => {
  it("announces a rest day when no workouts are present", () => {
    const week = weekFor([buildWeeklyWorkout("workout:rest-day", "2026-07-20T06:00:00Z")]);
    const restDay = week.days.find((day) => day.workouts.length === 0);
    if (!restDay) throw new Error("expected a rest day");
    render(<WeeklyDay day={restDay} language="en" selectedWorkoutId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Rest day")).toBeInTheDocument();
  });

  it("delegates selection of a workout on the day", () => {
    const selected = vi.fn();
    const workout = buildWeeklyWorkout("workout:day", "2026-07-20T06:00:00Z");
    const activeDay = weekFor([workout]).days.find((day) => day.workouts.length > 0);
    if (!activeDay) throw new Error("expected an active day");
    render(
      <WeeklyDay day={activeDay} language="en" selectedWorkoutId={null} onSelect={selected} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Open Morning run/ }));
    expect(selected).toHaveBeenCalledWith(workout.id);
  });
});
