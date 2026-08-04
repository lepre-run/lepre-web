import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { buildWeeklyWorkout, weekdayFormatter, weekFor } from "../../../test/weekly-builders";
import { WeekRow } from "../WeekRow/WeekRow";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WeekRow", () => {
  it("places selected workout details inside their week", () => {
    const workout = buildWeeklyWorkout("workout:row", "2026-07-20T06:00:00Z", "Park run");
    render(
      <WeekRow
        week={weekFor([workout])}
        language="en"
        selectedWorkoutId={workout.id}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        weekdayFormatter={weekdayFormatter}
      />,
    );
    const row = screen.getByRole("listitem");
    expect(within(row).getByRole("region", { name: "Workout details" })).toHaveTextContent(
      "Park run",
    );
  });
});
