import type { StageMeasure } from "./actual-workout-structure";
import type { Workout } from "./workout";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
export const CONDITION_WINDOW_DAYS = 42;
export const INTERVAL_LOOKBACK_DAYS = 365;
const INTERVAL_RECENCY_DAYS = 84;

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

export type IntervalFormatInsight = Readonly<{
  work: StageMeasure;
  recovery: StageMeasure;
  secondsPerKilometer: number;
  repetitions: number;
  sessionCount: number;
  recentSessionCount: number;
  repetitionVariationPercent: number;
  evidence: EvidenceStrength;
  trend: RelativeTrend | null;
}>;

export type IntervalBenchmarkInsight = Readonly<{
  primary: IntervalFormatInsight;
  alternatives: ReadonlyArray<IntervalFormatInsight>;
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
  referenceIntervals: IntervalBenchmarkInsight | null;
  weeklyVolume: WeeklyVolumeInsight;
  trainingMix: TrainingMixInsight;
}>;

type WorkoutWindow = Readonly<{
  current: ReadonlyArray<Workout>;
  previous: ReadonlyArray<Workout>;
}>;

type IntervalObservation = Readonly<{
  workout: Workout;
  work: StageMeasure;
  recovery: StageMeasure;
  secondsPerKilometer: number;
  repetitions: number;
  repetitionVariationPercent: number;
}>;

type IntervalFamily = Readonly<{
  observations: ReadonlyArray<IntervalObservation>;
  insight: IntervalFormatInsight;
  score: number;
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

function intervalObservation(workout: Workout): IntervalObservation | null {
  if (workout.type !== "workout" || workout.structure.kind !== "intervals") {
    return null;
  }
  const workIndexes = new Set(workout.structure.lapRoles.work);
  const workLaps = workout.laps.filter(
    (lap) => workIndexes.has(lap.index) && lap.distanceMeters > 0 && lap.movingDurationSeconds > 0,
  );
  if (workLaps.length === 0) return null;
  const paces = workLaps.map((lap) => (lap.movingDurationSeconds / lap.distanceMeters) * 1_000);
  return {
    workout,
    work: workout.structure.work,
    recovery: workout.structure.recovery,
    secondsPerKilometer: median(paces),
    repetitions: workLaps.length,
    repetitionVariationPercent: coefficientOfVariation(paces) * 100,
  };
}

function stageValue(stage: StageMeasure): number {
  return stage.kind === "distance" ? stage.meters : stage.seconds;
}

function normalizedStage(stage: StageMeasure): StageMeasure {
  if (stage.kind === "duration") {
    return { kind: "duration", seconds: Math.max(30, Math.round(stage.seconds / 30) * 30) };
  }
  const step = stage.meters < 1_500 ? 100 : 250;
  return { kind: "distance", meters: Math.max(step, Math.round(stage.meters / step) * step) };
}

function intervalFingerprint(observation: IntervalObservation): string {
  const work = normalizedStage(observation.work);
  const recovery = normalizedStage(observation.recovery);
  return `${work.kind}:${stageValue(work)}|${recovery.kind}:${stageValue(recovery)}`;
}

function intervalTrend(observations: ReadonlyArray<IntervalObservation>): RelativeTrend | null {
  if (observations.length < 4) return null;
  const sorted = [...observations].sort((left, right) =>
    right.workout.performedAt.localeCompare(left.workout.performedAt),
  );
  const sampleSize = Math.min(3, Math.floor(sorted.length / 2));
  return trendFromPaces(
    sorted.slice(0, sampleSize).map((observation) => observation.secondsPerKilometer),
    sorted.slice(sampleSize, sampleSize * 2).map((observation) => observation.secondsPerKilometer),
  );
}

function intervalFamily(
  observations: ReadonlyArray<IntervalObservation>,
  latestTimestamp: number,
): IntervalFamily {
  const sorted = [...observations].sort((left, right) =>
    right.workout.performedAt.localeCompare(left.workout.performedAt),
  );
  const recent = sorted.slice(0, Math.min(3, sorted.length));
  const recencyStart = latestTimestamp - INTERVAL_RECENCY_DAYS * DAY_MILLISECONDS;
  const recentSessionCount = sorted.filter(
    (observation) => Date.parse(observation.workout.performedAt) > recencyStart,
  ).length;
  const daysSinceLast =
    (latestTimestamp - Date.parse(sorted[0].workout.performedAt)) / DAY_MILLISECONDS;
  const repetitions = Math.round(median(recent.map((observation) => observation.repetitions)));
  return {
    observations: sorted,
    insight: {
      work: normalizedStage(sorted[0].work),
      recovery: normalizedStage(sorted[0].recovery),
      secondsPerKilometer: median(recent.map((observation) => observation.secondsPerKilometer)),
      repetitions,
      sessionCount: sorted.length,
      recentSessionCount,
      repetitionVariationPercent: median(
        recent.map((observation) => observation.repetitionVariationPercent),
      ),
      evidence: evidenceStrength(sorted.length),
      trend: intervalTrend(sorted),
    },
    score: recentSessionCount * 1_000 + sorted.length * 20 - daysSinceLast,
  };
}

function intervalBenchmarkInsight(
  workouts: ReadonlyArray<Workout>,
  latestTimestamp: number,
): IntervalBenchmarkInsight | null {
  const lookbackStart = latestTimestamp - INTERVAL_LOOKBACK_DAYS * DAY_MILLISECONDS;
  const groups = new Map<string, IntervalObservation[]>();
  for (const workout of workouts) {
    if (Date.parse(workout.performedAt) <= lookbackStart) continue;
    const observation = intervalObservation(workout);
    if (observation === null) continue;
    const fingerprint = intervalFingerprint(observation);
    const group = groups.get(fingerprint) ?? [];
    group.push(observation);
    groups.set(fingerprint, group);
  }
  const families = [...groups.values()]
    .map((observations) => intervalFamily(observations, latestTimestamp))
    .filter((family) => family.insight.recentSessionCount > 0)
    .sort((left, right) => right.score - left.score);
  const primary = families[0];
  if (!primary) return null;
  return {
    primary: primary.insight,
    alternatives: families
      .slice(1)
      .filter((family) => family.insight.sessionCount >= 2)
      .slice(0, 2)
      .map((family) => family.insight),
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
      case "hill-circuit":
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
    referenceIntervals: intervalBenchmarkInsight(workouts, Date.parse(latest.performedAt)),
    weeklyVolume: weeklyVolumeInsight(windows),
    trainingMix: trainingMixInsight(windows.current),
  };
}
