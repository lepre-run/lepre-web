import type { StageMeasure } from "./actual-workout-structure";
import type { Workout } from "./workout";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
export const CONDITION_WINDOW_DAYS = 42;

export type EvidenceStrength = "early" | "growing" | "strong";
export type TrendDirection = "up" | "steady" | "down";

export type RelativeTrend = Readonly<{
  percent: number;
  direction: TrendDirection;
}>;

export type EasyPaceInsight = Readonly<{
  secondsPerKilometer: number;
  fastestSecondsPerKilometer: number;
  slowestSecondsPerKilometer: number;
  medianHeartRateBpm: number | null;
  workoutCount: number;
  evidence: EvidenceStrength;
  trend: RelativeTrend | null;
}>;

export type KilometerIntervalInsight = Readonly<{
  secondsPerKilometer: number;
  repetitions: number;
  recovery: StageMeasure;
  sessionCount: number;
  repetitionVariationPercent: number;
  evidence: EvidenceStrength;
  trend: RelativeTrend | null;
}>;

export type WeeklyVolumeInsight = Readonly<{
  distanceMeters: number;
  durationSeconds: number;
  workoutCount: number;
  averageWeeklyDistanceMeters: number;
  trend: RelativeTrend | null;
}>;

export type TrainingMixInsight = Readonly<{
  low: number;
  moderate: number;
  high: number;
  unknown: number;
  lowSharePercent: number | null;
  classifiedSharePercent: number;
}>;

export type TrainingDashboard = Readonly<{
  windowDays: typeof CONDITION_WINDOW_DAYS;
  through: string;
  workoutCount: number;
  easyPace: EasyPaceInsight | null;
  kilometerIntervals: KilometerIntervalInsight | null;
  weeklyVolume: WeeklyVolumeInsight;
  trainingMix: TrainingMixInsight;
}>;

type WorkoutWindow = Readonly<{
  current: ReadonlyArray<Workout>;
  previous: ReadonlyArray<Workout>;
}>;

type KilometerIntervalObservation = Readonly<{
  workout: Workout;
  secondsPerKilometer: number;
  repetitions: number;
  recovery: StageMeasure;
  repetitionVariationPercent: number;
}>;

function median(values: ReadonlyArray<number>): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function evidenceStrength(count: number): EvidenceStrength {
  if (count >= 6) return "strong";
  if (count >= 3) return "growing";
  return "early";
}

function trendFromPaces(
  currentPaces: ReadonlyArray<number>,
  previousPaces: ReadonlyArray<number>,
  minimumEvidence = 2,
): RelativeTrend | null {
  if (currentPaces.length < minimumEvidence || previousPaces.length < minimumEvidence) return null;
  const currentSpeed = 1_000 / median(currentPaces);
  const previousSpeed = 1_000 / median(previousPaces);
  const percent = ((currentSpeed - previousSpeed) / previousSpeed) * 100;
  return {
    percent,
    direction: percent > 0.75 ? "up" : percent < -0.75 ? "down" : "steady",
  };
}

function trendFromTotals(current: number, previous: number): RelativeTrend | null {
  if (previous <= 0) return null;
  const percent = ((current - previous) / previous) * 100;
  return {
    percent,
    direction: percent > 0.75 ? "up" : percent < -0.75 ? "down" : "steady",
  };
}

function secondsPerKilometer(workout: Workout): number {
  return (workout.durationSeconds / workout.distanceMeters) * 1_000;
}

function easyPaceCandidates(workouts: ReadonlyArray<Workout>): ReadonlyArray<Workout> {
  return workouts.filter(
    (workout) =>
      workout.type === "workout" &&
      workout.sport !== "TrailRun" &&
      workout.structure.kind === "free-run" &&
      workout.distanceMeters >= 3_000 &&
      workout.durationSeconds >= 20 * 60,
  );
}

function easyPaceInsight(
  currentWorkouts: ReadonlyArray<Workout>,
  previousWorkouts: ReadonlyArray<Workout>,
): EasyPaceInsight | null {
  const current = easyPaceCandidates(currentWorkouts);
  if (current.length === 0) return null;
  const previous = easyPaceCandidates(previousWorkouts);
  const paces = current.map(secondsPerKilometer);
  const heartRates = current.flatMap((workout) =>
    workout.averageHeartRateBpm === null ? [] : [workout.averageHeartRateBpm],
  );
  return {
    secondsPerKilometer: median(paces),
    fastestSecondsPerKilometer: Math.min(...paces),
    slowestSecondsPerKilometer: Math.max(...paces),
    medianHeartRateBpm: heartRates.length > 0 ? median(heartRates) : null,
    workoutCount: current.length,
    evidence: evidenceStrength(current.length),
    trend: trendFromPaces(paces, previous.map(secondsPerKilometer)),
  };
}

function coefficientOfVariation(values: ReadonlyArray<number>): number {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return average === 0 ? 0 : Math.sqrt(variance) / average;
}

function kilometerIntervalObservation(workout: Workout): KilometerIntervalObservation | null {
  if (
    workout.type !== "workout" ||
    workout.structure.kind !== "intervals" ||
    workout.structure.work.kind !== "distance" ||
    workout.structure.work.meters < 900 ||
    workout.structure.work.meters > 1_100
  ) {
    return null;
  }
  const workIndexes = new Set(workout.structure.lapRoles.work);
  const workLaps = workout.laps.filter(
    (lap) =>
      workIndexes.has(lap.index) &&
      lap.distanceMeters >= 900 &&
      lap.distanceMeters <= 1_100 &&
      lap.movingDurationSeconds > 0,
  );
  if (workLaps.length === 0) return null;
  const paces = workLaps.map((lap) => (lap.movingDurationSeconds / lap.distanceMeters) * 1_000);
  return {
    workout,
    secondsPerKilometer: median(paces),
    repetitions: workLaps.length,
    recovery: workout.structure.recovery,
    repetitionVariationPercent: coefficientOfVariation(paces) * 100,
  };
}

function stageValue(stage: StageMeasure): number {
  return stage.kind === "distance" ? stage.meters : stage.seconds;
}

function sameIntervalFingerprint(
  candidate: KilometerIntervalObservation,
  reference: KilometerIntervalObservation,
): boolean {
  if (
    candidate.recovery.kind !== reference.recovery.kind ||
    Math.abs(candidate.repetitions - reference.repetitions) > 1
  ) {
    return false;
  }
  const referenceRecovery = stageValue(reference.recovery);
  return (
    referenceRecovery === 0 ||
    Math.abs(stageValue(candidate.recovery) - referenceRecovery) / referenceRecovery <= 0.2
  );
}

function kilometerIntervalInsight(
  currentWorkouts: ReadonlyArray<Workout>,
  previousWorkouts: ReadonlyArray<Workout>,
): KilometerIntervalInsight | null {
  const currentObservations = currentWorkouts
    .flatMap((workout) => {
      const observation = kilometerIntervalObservation(workout);
      return observation === null ? [] : [observation];
    })
    .sort((left, right) => right.workout.performedAt.localeCompare(left.workout.performedAt));
  const reference = currentObservations[0];
  if (!reference) return null;
  const current = currentObservations.filter((observation) =>
    sameIntervalFingerprint(observation, reference),
  );
  const previous = previousWorkouts.flatMap((workout) => {
    const observation = kilometerIntervalObservation(workout);
    return observation !== null && sameIntervalFingerprint(observation, reference)
      ? [observation]
      : [];
  });
  return {
    secondsPerKilometer: median(current.map((observation) => observation.secondsPerKilometer)),
    repetitions: reference.repetitions,
    recovery: reference.recovery,
    sessionCount: current.length,
    repetitionVariationPercent: reference.repetitionVariationPercent,
    evidence: evidenceStrength(current.length),
    trend: trendFromPaces(
      current.map((observation) => observation.secondsPerKilometer),
      previous.map((observation) => observation.secondsPerKilometer),
    ),
  };
}

function workoutWindows(workouts: ReadonlyArray<Workout>): WorkoutWindow {
  const latestTimestamp = Math.max(...workouts.map((workout) => Date.parse(workout.performedAt)));
  const currentStart = latestTimestamp - CONDITION_WINDOW_DAYS * DAY_MILLISECONDS;
  const previousStart = currentStart - CONDITION_WINDOW_DAYS * DAY_MILLISECONDS;
  return {
    current: workouts.filter((workout) => {
      const timestamp = Date.parse(workout.performedAt);
      return timestamp > currentStart && timestamp <= latestTimestamp;
    }),
    previous: workouts.filter((workout) => {
      const timestamp = Date.parse(workout.performedAt);
      return timestamp > previousStart && timestamp <= currentStart;
    }),
  };
}

function weeklyVolumeInsight(windows: WorkoutWindow): WeeklyVolumeInsight {
  const distanceMeters = windows.current.reduce((sum, workout) => sum + workout.distanceMeters, 0);
  const previousDistanceMeters = windows.previous.reduce(
    (sum, workout) => sum + workout.distanceMeters,
    0,
  );
  return {
    distanceMeters,
    durationSeconds: windows.current.reduce((sum, workout) => sum + workout.durationSeconds, 0),
    workoutCount: windows.current.length,
    averageWeeklyDistanceMeters: distanceMeters / (CONDITION_WINDOW_DAYS / 7),
    trend: trendFromTotals(distanceMeters, previousDistanceMeters),
  };
}

function trainingMixInsight(workouts: ReadonlyArray<Workout>): TrainingMixInsight {
  let low = 0;
  let moderate = 0;
  let high = 0;
  let unknown = 0;
  for (const workout of workouts) {
    if (workout.type === "race") {
      high += 1;
      continue;
    }
    switch (workout.structure.kind) {
      case "free-run":
      case "steady-structured-run":
        low += 1;
        break;
      case "progressive":
      case "tempo":
        moderate += 1;
        break;
      case "intervals":
      case "repeated-hills":
        high += 1;
        break;
      case "unknown":
        unknown += 1;
        break;
    }
  }
  const classified = low + moderate + high;
  return {
    low,
    moderate,
    high,
    unknown,
    lowSharePercent: classified === 0 ? null : (low / classified) * 100,
    classifiedSharePercent: workouts.length === 0 ? 0 : (classified / workouts.length) * 100,
  };
}

export function createTrainingDashboard(
  workouts: ReadonlyArray<Workout>,
): TrainingDashboard | null {
  if (workouts.length === 0) return null;
  const windows = workoutWindows(workouts);
  const latest = [...workouts].sort((left, right) =>
    right.performedAt.localeCompare(left.performedAt),
  )[0];
  return {
    windowDays: CONDITION_WINDOW_DAYS,
    through: latest.performedAt,
    workoutCount: windows.current.length,
    easyPace: easyPaceInsight(windows.current, windows.previous),
    kilometerIntervals: kilometerIntervalInsight(windows.current, windows.previous),
    weeklyVolume: weeklyVolumeInsight(windows),
    trainingMix: trainingMixInsight(windows.current),
  };
}
