import { act, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOTION_DURATION_BASE_MS } from "../../../hooks/motionDurations";
import { buildWeeklyWorkout } from "../../../test/weekly-builders";
import { WeeklyDetailPanel } from "./WeeklyDetailPanel";

const workout = buildWeeklyWorkout("workout:panel", "2026-07-20T06:00:00Z", "Canal run");

beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("WeeklyDetailPanel", () => {
  it("focuses the opened detail and scrolls it into view once it has expanded", () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(scrollIntoView);
    const { rerender } = render(<WeeklyDetailPanel workout={null} onClose={vi.fn()} />);

    rerender(<WeeklyDetailPanel workout={workout} onClose={vi.fn()} />);

    const detail = screen.getByRole("region", { name: "Workout details" });
    expect(detail).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(MOTION_DURATION_BASE_MS));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
  });

  it("keeps the closing detail on screen until it has collapsed", () => {
    const { container, rerender } = render(
      <WeeklyDetailPanel workout={workout} onClose={vi.fn()} />,
    );

    rerender(<WeeklyDetailPanel workout={null} onClose={vi.fn()} />);

    const panel = container.querySelector(".weekly-detail-panel");
    expect(panel).toHaveAttribute("data-open", "false");
    expect(panel).toHaveAttribute("inert");
    expect(screen.queryByRole("region", { name: "Workout details" })).not.toBeInTheDocument();
    expect(panel).toHaveTextContent("Canal run");
    act(() => vi.advanceTimersByTime(MOTION_DURATION_BASE_MS));
    expect(panel).not.toHaveTextContent("Canal run");
  });
});
