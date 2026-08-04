import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { buildWeeklyWorkout } from "../../../test/weekly-builders";
import { WeeklyDetail } from "../WeeklyDetail/WeeklyDetail";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WeeklyDetail", () => {
  it("renders the selected workout and closes on request", () => {
    const onClose = vi.fn();
    render(
      <WeeklyDetail
        workout={buildWeeklyWorkout("workout:detail", "2026-07-20T06:00:00Z", "Canal run")}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("region", { name: "Workout details" })).toHaveTextContent("Canal run");
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
