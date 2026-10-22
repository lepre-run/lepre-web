import { describe, expect, it } from "vitest";
import { buildWeeklyWorkout } from "../../test/weekly-builders";
import { arrivalOrder, newWorkoutIds } from "./workoutArrivals";

const workoutOn = (day: number) =>
  buildWeeklyWorkout(`workout:${day}`, `2026-07-${String(day).padStart(2, "0")}T06:00:00Z`);

describe("newWorkoutIds", () => {
  it("treats the initial IndexedDB hydration as already known", () => {
    expect(newWorkoutIds(null, [workoutOn(1), workoutOn(2)]).size).toBe(0);
  });

  it("returns only workouts that were not present in the previous load", () => {
    const known = new Set(["workout:1"]);
    expect(Array.from(newWorkoutIds(known, [workoutOn(1), workoutOn(2), workoutOn(3)]))).toEqual([
      "workout:2",
      "workout:3",
    ]);
  });
});

describe("arrivalOrder", () => {
  it("staggers the newest arrivals first", () => {
    const workouts = [workoutOn(1), workoutOn(3), workoutOn(2)];
    const order = arrivalOrder(new Set(workouts.map((workout) => workout.id)), workouts);
    expect(Array.from(order)).toEqual([
      ["workout:3", 0],
      ["workout:2", 1],
      ["workout:1", 2],
    ]);
  });

  it("caps a large backfill batch at six staggered arrivals", () => {
    const backfill = Array.from({ length: 200 }, (_, day) =>
      buildWeeklyWorkout(
        `workout:backfill-${day}`,
        new Date(Date.UTC(2025, 6, 1 + day)).toISOString(),
      ),
    );
    const order = arrivalOrder(new Set(backfill.map((workout) => workout.id)), backfill);

    expect(order.size).toBe(6);
    expect(Array.from(order.values())).toEqual([0, 1, 2, 3, 4, 5]);
    expect(order.get("workout:backfill-199")).toBe(0);
    expect(order.has("workout:backfill-0")).toBe(false);
  });
});
