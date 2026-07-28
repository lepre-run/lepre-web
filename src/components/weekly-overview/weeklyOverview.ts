import type { Workout } from "../../domain/workout";

export const WEEKS_PER_PAGE = 4;

export type WorkoutDay = Readonly<{
  date: Date;
  dateKey: string;
  workouts: ReadonlyArray<Workout>;
}>;

export type WorkoutWeek = Readonly<{
  start: Date;
  end: Date;
  dateKey: string;
  days: ReadonlyArray<WorkoutDay>;
  workouts: ReadonlyArray<Workout>;
  distanceMeters: number;
  durationSeconds: number;
}>;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localMidnight(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function mondayOf(date: Date): Date {
  const dayFromMonday = (date.getDay() + 6) % 7;
  return addDays(localMidnight(date), -dayFromMonday);
}

export function workoutWeeks(workouts: ReadonlyArray<Workout>): ReadonlyArray<WorkoutWeek> {
  if (workouts.length === 0) return [];

  const workoutsByDay = new Map<string, Array<Workout>>();
  for (const workout of workouts) {
    const key = localDateKey(new Date(workout.performedAt));
    const day = workoutsByDay.get(key) ?? [];
    day.push(workout);
    workoutsByDay.set(key, day);
  }
  for (const day of workoutsByDay.values()) {
    day.sort((left, right) => right.performedAt.localeCompare(left.performedAt));
  }

  const timestamps = workouts.map((workout) => new Date(workout.performedAt).getTime());
  const latestMonday = mondayOf(new Date(Math.max(...timestamps)));
  const earliestMonday = mondayOf(new Date(Math.min(...timestamps)));
  const weeks: Array<WorkoutWeek> = [];

  for (
    let start = latestMonday;
    start.getTime() >= earliestMonday.getTime();
    start = addDays(start, -7)
  ) {
    const days = Array.from({ length: 7 }, (_, index): WorkoutDay => {
      const date = addDays(start, index);
      const dateKey = localDateKey(date);
      return { date, dateKey, workouts: workoutsByDay.get(dateKey) ?? [] };
    });
    const weekWorkouts = days.flatMap((day) => day.workouts);
    weeks.push({
      start,
      end: addDays(start, 6),
      dateKey: localDateKey(start),
      days,
      workouts: weekWorkouts,
      distanceMeters: weekWorkouts.reduce((total, workout) => total + workout.distanceMeters, 0),
      durationSeconds: weekWorkouts.reduce((total, workout) => total + workout.durationSeconds, 0),
    });
  }

  return weeks;
}

export function pageCount(weeks: ReadonlyArray<WorkoutWeek>): number {
  return Math.max(1, Math.ceil(weeks.length / WEEKS_PER_PAGE));
}

export function weeksOnPage(
  weeks: ReadonlyArray<WorkoutWeek>,
  page: number,
): ReadonlyArray<WorkoutWeek> {
  const start = page * WEEKS_PER_PAGE;
  return weeks.slice(start, start + WEEKS_PER_PAGE);
}
