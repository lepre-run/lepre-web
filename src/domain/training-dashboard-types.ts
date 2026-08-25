import type { StageMeasure } from "./actual-workout-structure";

export type EvidenceStrength = "early" | "growing" | "strong";
export type RelativeTrend = Readonly<{
  percent: number;
  direction: "up" | "steady" | "down";
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
  windowDays: 42;
  through: string;
  workoutCount: number;
  easyPace: EasyPaceInsight | null;
  referenceIntervals: IntervalBenchmarkInsight | null;
  weeklyVolume: WeeklyVolumeInsight;
  trainingMix: TrainingMixInsight;
}>;
