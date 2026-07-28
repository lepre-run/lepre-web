import { type WorkoutWeek, workoutWeeks } from "../components/weekly-overview/weeklyOverview";
import type { Workout } from "../domain/workout";
import { localeFor } from "../i18n/i18n";
import { buildWorkout } from "./builders";

export function buildWeeklyWorkout(id: string, performedAt: string, name = "Morning run"): Workout {
  return buildWorkout({ id, performedAt, name });
}

export function weekFor(workouts: ReadonlyArray<Workout>): WorkoutWeek {
  const week = workoutWeeks(workouts)[0];
  if (!week) throw new Error("expected a workout week");
  return week;
}

export const weekdayFormatter = new Intl.DateTimeFormat(localeFor("en"), {
  weekday: "short",
});
