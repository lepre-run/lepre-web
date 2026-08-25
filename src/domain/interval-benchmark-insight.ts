import type { StageMeasure } from "./actual-workout-structure";
import { evidenceStrength, median, trendFromPaces } from "./training-dashboard-math";
import type {
  IntervalBenchmarkInsight,
  IntervalFormatInsight,
  RelativeTrend,
} from "./training-dashboard-types";
import type { Workout } from "./workout";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
const LOOKBACK_DAYS = 365;
const RECENCY_DAYS = 84;
type Observation = Readonly<{
  workout: Workout;
  work: StageMeasure;
  recovery: StageMeasure;
  secondsPerKilometer: number;
  repetitions: number;
  repetitionVariationPercent: number;
}>;
type Family = Readonly<{ insight: IntervalFormatInsight; score: number }>;

function variation(values: ReadonlyArray<number>): number {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return average === 0 ? 0 : Math.sqrt(variance) / average;
}

function observation(workout: Workout): Observation | null {
  if (workout.type !== "workout" || workout.structure.kind !== "intervals") return null;
  const indexes = new Set(workout.structure.lapRoles.work);
  const laps = workout.laps.filter(
    (lap) => indexes.has(lap.index) && lap.distanceMeters > 0 && lap.movingDurationSeconds > 0,
  );
  if (laps.length === 0) return null;
  const paces = laps.map((lap) => (lap.movingDurationSeconds / lap.distanceMeters) * 1_000);
  return {
    workout,
    work: workout.structure.work,
    recovery: workout.structure.recovery,
    secondsPerKilometer: median(paces),
    repetitions: laps.length,
    repetitionVariationPercent: variation(paces) * 100,
  };
}

function normalizedStage(stage: StageMeasure): StageMeasure {
  if (stage.kind === "duration")
    return { kind: "duration", seconds: Math.max(30, Math.round(stage.seconds / 30) * 30) };
  const step = stage.meters < 1_500 ? 100 : 250;
  return { kind: "distance", meters: Math.max(step, Math.round(stage.meters / step) * step) };
}

function stageFingerprint(stage: StageMeasure): string {
  const normalized = normalizedStage(stage);
  return normalized.kind === "distance"
    ? `distance:${normalized.meters}`
    : `duration:${normalized.seconds}`;
}

function fingerprint(value: Observation): string {
  return `${stageFingerprint(value.work)}|${stageFingerprint(value.recovery)}`;
}

function intervalTrend(values: ReadonlyArray<Observation>): RelativeTrend | null {
  if (values.length < 4) return null;
  const count = Math.min(3, Math.floor(values.length / 2));
  return trendFromPaces(
    values.slice(0, count).map((value) => value.secondsPerKilometer),
    values.slice(count, count * 2).map((value) => value.secondsPerKilometer),
  );
}

function family(observations: ReadonlyArray<Observation>, latestTimestamp: number): Family {
  const sorted = [...observations].sort((left, right) =>
    right.workout.performedAt.localeCompare(left.workout.performedAt),
  );
  const recent = sorted.slice(0, Math.min(3, sorted.length));
  const recentCount = sorted.filter(
    (value) =>
      Date.parse(value.workout.performedAt) > latestTimestamp - RECENCY_DAYS * DAY_MILLISECONDS,
  ).length;
  const daysSinceLast =
    (latestTimestamp - Date.parse(sorted[0].workout.performedAt)) / DAY_MILLISECONDS;
  return {
    insight: familyInsight(sorted, recent, recentCount),
    score: recentCount * 1_000 + sorted.length * 20 - daysSinceLast,
  };
}

function familyInsight(
  sorted: ReadonlyArray<Observation>,
  recent: ReadonlyArray<Observation>,
  recentCount: number,
): IntervalFormatInsight {
  return {
    work: normalizedStage(sorted[0].work),
    recovery: normalizedStage(sorted[0].recovery),
    secondsPerKilometer: median(recent.map((value) => value.secondsPerKilometer)),
    repetitions: Math.round(median(recent.map((value) => value.repetitions))),
    sessionCount: sorted.length,
    recentSessionCount: recentCount,
    repetitionVariationPercent: median(recent.map((value) => value.repetitionVariationPercent)),
    evidence: evidenceStrength(sorted.length),
    trend: intervalTrend(sorted),
  };
}

function observationGroups(
  workouts: ReadonlyArray<Workout>,
  latestTimestamp: number,
): ReadonlyArray<ReadonlyArray<Observation>> {
  const groups = new Map<string, Observation[]>();
  for (const workout of workouts) {
    if (Date.parse(workout.performedAt) <= latestTimestamp - LOOKBACK_DAYS * DAY_MILLISECONDS)
      continue;
    const value = observation(workout);
    if (!value) continue;
    const values = groups.get(fingerprint(value)) ?? [];
    values.push(value);
    groups.set(fingerprint(value), values);
  }
  return [...groups.values()];
}

export function intervalBenchmarkInsight(
  workouts: ReadonlyArray<Workout>,
  latestTimestamp: number,
): IntervalBenchmarkInsight | null {
  const families = observationGroups(workouts, latestTimestamp)
    .map((values) => family(values, latestTimestamp))
    .filter((value) => value.insight.recentSessionCount > 0)
    .sort((left, right) => right.score - left.score);
  if (!families[0]) return null;
  return {
    primary: families[0].insight,
    alternatives: families
      .slice(1)
      .filter((value) => value.insight.sessionCount >= 2)
      .slice(0, 2)
      .map((value) => value.insight),
  };
}
