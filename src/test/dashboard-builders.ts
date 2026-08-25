import type {
  EasyPaceInsight,
  IntervalBenchmarkInsight,
  IntervalFormatInsight,
  TrainingMixInsight,
  WeeklyVolumeInsight,
} from "../domain/training-dashboard";

export const easyPaceInsight: EasyPaceInsight = {
  secondsPerKilometer: 330,
  fastestSecondsPerKilometer: 315,
  slowestSecondsPerKilometer: 345,
  medianHeartRateBpm: 141,
  workoutCount: 4,
  evidence: "growing",
  trend: { direction: "up", percent: 2.4 },
};

const intervalFormatInsight: IntervalFormatInsight = {
  work: { kind: "distance", meters: 1_000 },
  recovery: { kind: "duration", seconds: 120 },
  secondsPerKilometer: 240,
  repetitions: 5,
  sessionCount: 3,
  recentSessionCount: 2,
  repetitionVariationPercent: 1.8,
  evidence: "growing",
  trend: { direction: "steady", percent: 0.2 },
};

export const intervalBenchmarkInsight: IntervalBenchmarkInsight = {
  primary: intervalFormatInsight,
  alternatives: [
    {
      ...intervalFormatInsight,
      repetitions: 8,
      work: { kind: "distance", meters: 400 },
    },
  ],
};

export const weeklyVolumeInsight: WeeklyVolumeInsight = {
  distanceMeters: 120_000,
  durationSeconds: 42_000,
  workoutCount: 12,
  averageWeeklyDistanceMeters: 20_000,
  trend: { direction: "down", percent: -10 },
};

export const trainingMixInsight: TrainingMixInsight = {
  low: 8,
  moderate: 1,
  high: 1,
  unknown: 0,
  lowSharePercent: 80,
  classifiedSharePercent: 100,
};
