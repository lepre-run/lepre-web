import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { buildWeeklyWorkout, weekdayFormatter, weekFor } from "../../../test/weekly-builders";
import { WeeklySummary } from "../WeeklySummary/WeeklySummary";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WeeklySummary", () => {
  it("reports totals and active training days", () => {
    const week = weekFor([buildWeeklyWorkout("workout:summary", "2026-07-20T06:00:00Z")]);
    render(<WeeklySummary week={week} language="en" weekdayFormatter={weekdayFormatter} />);

    expect(screen.getByText("1 run")).toBeInTheDocument();
    expect(screen.getByText("5.00 km")).toBeInTheDocument();
    expect(document.querySelectorAll('.weekly-cadence > li[data-active="true"]')).toHaveLength(1);
  });
});
