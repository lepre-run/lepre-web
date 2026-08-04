import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { buildWeeklyWorkout } from "../../../test/weekly-builders";
import { WeeklyOverview } from "./WeeklyOverview";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WeeklyOverview", () => {
  it("opens and closes a workout without leaving the weekly context", () => {
    render(
      <WeeklyOverview
        workouts={[buildWeeklyWorkout("workout:overview", "2026-07-20T06:00:00Z", "Lunch run")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Open Lunch run/ }));
    expect(screen.getByRole("region", { name: "Workout details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("region", { name: "Workout details" })).not.toBeInTheDocument();
  });

  it("moves between groups of weeks", () => {
    const workouts = Array.from({ length: 6 }, (_, index) =>
      buildWeeklyWorkout(
        `workout:page-${index}`,
        new Date(Date.UTC(2026, 6, 20 - index * 7, 6)).toISOString(),
        `Week ${index + 1}`,
      ),
    );
    render(<WeeklyOverview workouts={workouts} />);
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Older weeks/ }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Week 6/ })).toBeInTheDocument();
  });
});
