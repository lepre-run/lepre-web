import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { buildWeeklyWorkout } from "../../../test/weekly-builders";
import { WorkoutButton } from "../WorkoutButton/WorkoutButton";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WorkoutButton", () => {
  it("summarizes a workout and delegates selection", () => {
    const onSelect = vi.fn();
    render(
      <WorkoutButton
        workout={buildWeeklyWorkout("workout:button", "2026-07-20T06:00:00Z", "River loop")}
        selected={false}
        language="en"
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole("button", { name: /Open River loop, Free run/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("5.00 km");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
