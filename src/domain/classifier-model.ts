import type { StageMeasure } from "./actual-workout-structure";
import type { Lap } from "./workout";

type ClassificationBase = Readonly<{ coreLapIndexes: ReadonlyArray<number> }>;

type Classification =
  | (ClassificationBase & Readonly<{ kind: "progressive"; stageCount: number }>)
  | (ClassificationBase &
      Readonly<{
        kind: "intervals";
        repetitions: number;
        work: StageMeasure;
        recovery: StageMeasure;
      }>)
  | (ClassificationBase & Readonly<{ kind: "tempo"; distanceMeters: number }>)
  | (ClassificationBase & Readonly<{ kind: "repeated-hills"; repetitions: number }>)
  | (ClassificationBase & Readonly<{ kind: "hill-circuit"; repetitions: number }>)
  | (ClassificationBase & Readonly<{ kind: "steady-structured-run" }>)
  | (ClassificationBase & Readonly<{ kind: "free-run" }>)
  | (ClassificationBase & Readonly<{ kind: "unknown" }>);

export type Candidate = Exclude<Classification, { kind: "free-run" | "unknown" }> &
  Readonly<{
    score: number;
    workLapIndexes: ReadonlyArray<number>;
    recoveryLapIndexes: ReadonlyArray<number>;
  }>;

export function pace(lap: Lap): number {
  return lap.distanceMeters > 0
    ? lap.movingDurationSeconds / lap.distanceMeters
    : Number.POSITIVE_INFINITY;
}

export function mean(values: ReadonlyArray<number>): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function coefficientOfVariation(values: ReadonlyArray<number>): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  if (!Number.isFinite(average) || average === 0) return Number.POSITIVE_INFINITY;
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance) / average;
}

export function repeatedStage(laps: ReadonlyArray<Lap>): StageMeasure {
  const distances = laps.map((lap) => lap.distanceMeters);
  if (coefficientOfVariation(distances) <= 0.12) {
    return { kind: "distance", meters: mean(distances) };
  }
  return { kind: "duration", seconds: mean(laps.map((lap) => lap.movingDurationSeconds)) };
}
