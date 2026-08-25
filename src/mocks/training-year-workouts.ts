import {
  detailedLap,
  distanceIntervals,
  type MockWorkout,
  workout,
} from "./workout-fixture-builders";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
const TRAINING_YEAR_START = Date.UTC(2025, 6, 28);
const TRAINING_WEEK_COUNT = 52;

function generatedInstant(dayTimestamp: number, weekIndex: number): string {
  const hour = 5 + (weekIndex % 3);
  const minute = 10 + ((weekIndex * 7) % 35);
  return new Date(dayTimestamp + (hour * 60 + minute) * 60 * 1_000).toISOString();
}

function repetitionSeries(count: number, baseSeconds: number): ReadonlyArray<number> {
  return Array.from({ length: count }, (_, index) => baseSeconds + Math.max(0, 3 - index));
}

function generatedIntervals(weekIndex: number, performedAt: string): MockWorkout {
  const progress = weekIndex / (TRAINING_WEEK_COUNT - 1);
  const profile = intervalProfile(weekIndex);
  return distanceIntervals({
    id: `mock-year-${weekIndex}-${profile.id}`,
    performedAt,
    name: profile.name,
    workMeters: profile.workMeters,
    recoveryMeters: profile.recoveryMeters,
    recoverySeconds: profile.recoverySeconds,
    description: profile.description,
    repetitionSeconds: repetitionSeries(
      profile.repetitions,
      Math.round(profile.baseSeconds - progress * profile.progressSeconds),
    ),
  });
}

const INTERVAL_PROFILES = [
  {
    id: "400m",
    name: "10 × 400 m",
    repetitions: 10,
    workMeters: 400,
    recoveryMeters: 200,
    recoverySeconds: 82,
    baseSeconds: 92,
    progressSeconds: 8,
    description: "Short track repetitions with controlled float recoveries.",
  },
  {
    id: "800m",
    name: "8 × 800 m",
    repetitions: 8,
    workMeters: 800,
    recoveryMeters: 400,
    recoverySeconds: 148,
    baseSeconds: 190,
    progressSeconds: 14,
    description: "Eight steady 800 metre repetitions at a repeatable rhythm.",
  },
  {
    id: "400m",
    name: "12 × 400 m",
    repetitions: 12,
    workMeters: 400,
    recoveryMeters: 200,
    recoverySeconds: 82,
    baseSeconds: 92,
    progressSeconds: 8,
    description: "Short track repetitions with controlled float recoveries.",
  },
  {
    id: "1k",
    name: "6 × 1 km",
    repetitions: 6,
    workMeters: 1_000,
    recoveryMeters: 400,
    recoverySeconds: 150,
    baseSeconds: 240,
    progressSeconds: 18,
    description: "Six controlled kilometre repetitions with relaxed recoveries.",
  },
] as const;

function intervalProfile(weekIndex: number) {
  return INTERVAL_PROFILES[weekIndex % INTERVAL_PROFILES.length];
}

function generatedEasyRun(weekIndex: number, dayOffset: number, performedAt: string): MockWorkout {
  const progress = weekIndex / (TRAINING_WEEK_COUNT - 1);
  const isLongRun = dayOffset === 6;
  const distanceMeters = isLongRun
    ? 16_000 + (weekIndex % 7) * 1_000
    : 6_500 + ((weekIndex + dayOffset * 2) % 6) * 900;
  const paceSecondsPerKilometer = 370 - progress * 22 + (isLongRun ? 5 : (dayOffset % 3) * 3);
  const durationSeconds = Math.round((distanceMeters / 1_000) * paceSecondsPerKilometer);
  const averageHeartRate = Math.round(136 - progress * 3 + (isLongRun ? 2 : dayOffset % 2));
  return workout({
    id: `mock-year-${weekIndex}-easy-${dayOffset}`,
    performedAt,
    name: isLongRun ? "Sunday aerobic long run" : "Easy aerobic run",
    description: isLongRun
      ? "Comfortable weekly long run, kept conversational from start to finish."
      : "Low-intensity aerobic mileage at a conversational effort.",
    laps: [
      detailedLap({
        index: 1,
        name: isLongRun ? "Long run" : "Easy run",
        distanceMeters,
        movingDurationSeconds: durationSeconds,
        averageHeartRateBpm: averageHeartRate,
        maxHeartRateBpm: averageHeartRate + 13,
      }),
    ],
  });
}

export function trainingYearWorkouts(
  curated: ReadonlyArray<MockWorkout>,
): ReadonlyArray<MockWorkout> {
  const curatedByDate = new Map(curated.map((entry) => [entry.performedAt.slice(0, 10), entry]));
  const generated = Array.from({ length: TRAINING_WEEK_COUNT }, (_, weekIndex) =>
    generatedWeek(weekIndex, curatedByDate),
  ).flat();
  return [...curated, ...generated].sort((left, right) =>
    right.performedAt.localeCompare(left.performedAt),
  );
}

function generatedWeek(weekIndex: number, curatedByDate: ReadonlyMap<string, MockWorkout>) {
  const weekStart = TRAINING_YEAR_START + weekIndex * 7 * DAY_MILLISECONDS;
  const occupied = occupiedDays(weekStart, curatedByDate);
  const target = weekIndex % 3 === 0 ? 5 : 6;
  return [1, 3, 5, 6, 0, 2, 4]
    .filter((day) => !occupied.has(day))
    .slice(0, target - occupied.size)
    .map((day) => generatedRun(weekIndex, weekStart, day));
}

function occupiedDays(weekStart: number, curatedByDate: ReadonlyMap<string, MockWorkout>) {
  return new Set(
    Array.from({ length: 7 }, (_, day) => day).filter((day) => {
      const date = new Date(weekStart + day * DAY_MILLISECONDS).toISOString().slice(0, 10);
      return curatedByDate.has(date);
    }),
  );
}

function generatedRun(weekIndex: number, weekStart: number, day: number): MockWorkout {
  const performedAt = generatedInstant(weekStart + day * DAY_MILLISECONDS, weekIndex);
  return day === 1
    ? generatedIntervals(weekIndex, performedAt)
    : generatedEasyRun(weekIndex, day, performedAt);
}
