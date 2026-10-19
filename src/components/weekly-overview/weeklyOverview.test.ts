import { describe, expect, it } from "vitest";
import { createWorkout, type Workout } from "../../domain/workout";
import { pageCount, weeksOnPage, workoutWeeks } from "./weeklyOverview";

function workout(
  id: string,
  performedAt: string,
  distanceMeters = 5_000,
  durationSeconds = 1_800,
): Workout {
  const result = createWorkout({
    id,
    performedAt,
    name: id,
    description: "",
    type: "workout",
    sport: "Run",
    durationSeconds,
    elapsedDurationSeconds: durationSeconds,
    distanceMeters,
    laps: [
      {
        index: 1,
        name: "Run",
        movingDurationSeconds: durationSeconds,
        elapsedDurationSeconds: durationSeconds,
        distanceMeters,
      },
    ],
  });
  if (result.kind !== "created") throw new Error("expected workout");
  return result.workout;
}

describe("weekly overview grouping", () => {
  it("groups Monday-to-Sunday weeks newest-first and calculates visible totals", () => {
    const weeks = workoutWeeks([
      workout("monday", "2026-07-20T10:00:00Z", 8_000, 2_400),
      workout("wednesday", "2026-07-22T10:00:00Z", 12_000, 3_600),
      workout("older", "2026-07-06T10:00:00Z"),
    ]);

    expect(weeks.map((week) => week.dateKey)).toEqual(["2026-07-20", "2026-07-13", "2026-07-06"]);
    expect(weeks[0]).toMatchObject({
      distanceMeters: 20_000,
      durationSeconds: 6_000,
    });
    expect(weeks[0].days[0].workouts.map((value) => value.id)).toEqual(["monday"]);
    expect(weeks[0].days[2].workouts.map((value) => value.id)).toEqual(["wednesday"]);
    expect(weeks[1].workouts).toHaveLength(0);
  });

  it("orders workouts within a day by start time ascending, then by id", () => {
    const weeks = workoutWeeks([
      workout("evening", "2026-07-22T13:00:00Z"),
      workout("afternoon-b", "2026-07-22T11:00:00Z"),
      workout("afternoon-a", "2026-07-22T11:00:00Z"),
      workout("morning", "2026-07-22T09:00:00Z"),
    ]);

    expect(weeks[0].days[2].workouts.map((value) => value.id)).toEqual([
      "morning",
      "afternoon-a",
      "afternoon-b",
      "evening",
    ]);
  });

  it("paginates continuous history in sets of four weeks", () => {
    const weeks = workoutWeeks([
      workout("latest", "2026-07-22T10:00:00Z"),
      workout("oldest", "2026-06-17T10:00:00Z"),
    ]);

    expect(weeks).toHaveLength(6);
    expect(pageCount(weeks)).toBe(2);
    expect(weeksOnPage(weeks, 0).map((week) => week.dateKey)).toEqual([
      "2026-07-20",
      "2026-07-13",
      "2026-07-06",
      "2026-06-29",
    ]);
    expect(weeksOnPage(weeks, 1).map((week) => week.dateKey)).toEqual(["2026-06-22", "2026-06-15"]);
  });
});
