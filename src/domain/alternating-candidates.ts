import {
  type Candidate,
  coefficientOfVariation,
  mean,
  pace,
  repeatedStage,
} from "./classifier-model";
import type { Lap } from "./workout";

type AlternatingLaps = Readonly<{
  core: ReadonlyArray<Lap>;
  work: ReadonlyArray<Lap>;
  recovery: ReadonlyArray<Lap>;
}>;

function alternatingLaps(
  laps: ReadonlyArray<Lap>,
  start: number,
  end: number,
  workParity: number,
): AlternatingLaps | undefined {
  const core = laps.slice(start, end + 1);
  const work = core.filter((_, index) => index % 2 === workParity);
  const recovery = core.filter((_, index) => index % 2 !== workParity);
  return work.length >= 3 && recovery.length >= 2 ? { core, work, recovery } : undefined;
}

const MIN_PACE_SEPARATION = 0.12;
const MIN_HEART_RATE_SEPARATION = 0.05;

type Assessment = Readonly<{
  score: number;
  workIsFaster: boolean;
  workHasHigherHeartRate: boolean | undefined;
}>;

function relativeSeparation(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(left, right);
}

function averageHeartRate(laps: ReadonlyArray<Lap>): number | undefined {
  const heartRates = laps.map((lap) => lap.averageHeartRateBpm);
  if (!heartRates.every((value): value is number => value !== null && value > 0)) {
    return undefined;
  }
  return mean(heartRates);
}

function heartRateContrast(
  input: AlternatingLaps,
): Readonly<{ separation: number; workHasHigherHeartRate: boolean }> | undefined {
  const workHeartRate = averageHeartRate(input.work);
  const recoveryHeartRate = averageHeartRate(input.recovery);
  if (workHeartRate === undefined || recoveryHeartRate === undefined) return undefined;
  const separation = relativeSeparation(workHeartRate, recoveryHeartRate);
  if (separation < MIN_HEART_RATE_SEPARATION) return undefined;
  return { separation, workHasHigherHeartRate: workHeartRate > recoveryHeartRate };
}

function alternatingScore(input: AlternatingLaps): Assessment | undefined {
  const workPaces = input.work.map(pace);
  const recoveryPaces = input.recovery.map(pace);
  const workConsistency = coefficientOfVariation(workPaces);
  const recoveryConsistency = Math.min(
    coefficientOfVariation(input.recovery.map((lap) => lap.distanceMeters)),
    coefficientOfVariation(input.recovery.map((lap) => lap.movingDurationSeconds)),
  );
  const workStageConsistency = Math.min(
    coefficientOfVariation(input.work.map((lap) => lap.distanceMeters)),
    coefficientOfVariation(input.work.map((lap) => lap.movingDurationSeconds)),
  );
  if (workConsistency > 0.14 || workStageConsistency > 0.18 || recoveryConsistency > 0.3)
    return undefined;
  const workPace = mean(workPaces);
  const recoveryPace = mean(recoveryPaces);
  const paceSeparation = relativeSeparation(workPace, recoveryPace);
  const heartRate = heartRateContrast(input);
  if (paceSeparation < MIN_PACE_SEPARATION && !heartRate) return undefined;
  const separation = Math.max(paceSeparation, heartRate?.separation ?? 0);
  const consistencyScore = 1 - Math.min(1, workConsistency + workStageConsistency / 2);
  return {
    score: Math.min(0.98, 0.67 + separation + consistencyScore * 0.12),
    workIsFaster: workPace < recoveryPace,
    workHasHigherHeartRate: heartRate?.workHasHigherHeartRate,
  };
}

function intervalCandidate(input: AlternatingLaps, score: number): Candidate {
  return {
    kind: "intervals",
    repetitions: input.work.length,
    work: repeatedStage(input.work),
    recovery: repeatedStage(input.recovery),
    coreLapIndexes: input.core.map((lap) => lap.index),
    workLapIndexes: input.work.map((lap) => lap.index),
    recoveryLapIndexes: input.recovery.map((lap) => lap.index),
    score,
  };
}

function repeatedHillsCandidate(input: AlternatingLaps, score: number): Candidate | undefined {
  const allDistances = [...input.work, ...input.recovery].map((lap) => lap.distanceMeters);
  if (coefficientOfVariation(allDistances) > 0.16) return undefined;
  return {
    kind: "repeated-hills",
    repetitions: input.work.length,
    coreLapIndexes: input.core.map((lap) => lap.index),
    workLapIndexes: input.work.map((lap) => lap.index),
    recoveryLapIndexes: input.recovery.map((lap) => lap.index),
    score: score - 0.04,
  };
}

function startsWithWork(input: AlternatingLaps): boolean {
  const [firstCoreLap] = input.core;
  return input.work.includes(firstCoreLap);
}

function paceOnlyCandidate(input: AlternatingLaps, assessment: Assessment): Candidate | undefined {
  if (!assessment.workIsFaster) return repeatedHillsCandidate(input, assessment.score);
  return startsWithWork(input) ? intervalCandidate(input, assessment.score) : undefined;
}

function effortLedAlternatingCandidate(input: AlternatingLaps): Candidate | undefined {
  const assessment = alternatingScore(input);
  if (!assessment) return undefined;
  if (assessment.workHasHigherHeartRate === undefined) return paceOnlyCandidate(input, assessment);
  if (!assessment.workHasHigherHeartRate) return undefined;
  if (assessment.workIsFaster || !startsWithWork(input)) {
    return paceOnlyCandidate(input, assessment);
  }
  return (
    repeatedHillsCandidate(input, assessment.score) ?? intervalCandidate(input, assessment.score)
  );
}

function addsTrailingRecovery(longer: Candidate, shorter: Candidate): boolean {
  return (
    longer.kind === "intervals" &&
    longer.coreLapIndexes.length === shorter.coreLapIndexes.length + 1 &&
    longer.coreLapIndexes[0] === shorter.coreLapIndexes[0] &&
    longer.workLapIndexes.join() === shorter.workLapIndexes.join()
  );
}

function withoutTruncatedRecoveries(candidates: ReadonlyArray<Candidate>): Candidate[] {
  return candidates.filter(
    (candidate) =>
      candidate.kind !== "intervals" ||
      !candidates.some((other) => addsTrailingRecovery(other, candidate)),
  );
}

export function alternatingCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start <= laps.length - 5; start += 1) {
    for (let end = start + 4; end < laps.length; end += 1) {
      for (const workParity of [0, 1]) {
        const alternating = alternatingLaps(laps, start, end, workParity);
        if (!alternating) continue;
        const candidate = effortLedAlternatingCandidate(alternating);
        if (candidate) candidates.push(candidate);
      }
    }
  }
  return withoutTruncatedRecoveries(candidates);
}
