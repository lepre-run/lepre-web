import { fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("marks a newly arrived workout with its stagger position", () => {
    const workout = buildWeeklyWorkout("workout:arrived", "2026-07-20T06:00:00Z", "River loop");
    const { rerender } = render(
      <WorkoutButton workout={workout} selected={false} language="en" onSelect={vi.fn()} />,
    );
    const button = screen.getByRole("button", { name: /Open River loop/ });
    expect(button).not.toHaveAttribute("data-new");

    rerender(
      <WorkoutButton
        workout={workout}
        selected={false}
        language="en"
        onSelect={vi.fn()}
        arrivalOrder={2}
      />,
    );
    expect(button).toHaveAttribute("data-new", "true");
    expect(button.style.getPropertyValue("--arrival-order")).toBe("2");
  });
});
