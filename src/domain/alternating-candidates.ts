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

function alternatingScore(
  input: AlternatingLaps,
): Readonly<{ score: number; workIsFaster: boolean }> | undefined {
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
  const separation = Math.abs(recoveryPace - workPace) / Math.max(workPace, recoveryPace);
  if (separation < 0.12) return undefined;
  const consistencyScore = 1 - Math.min(1, workConsistency + workStageConsistency / 2);
  return {
    score: Math.min(0.98, 0.67 + separation + consistencyScore * 0.12),
    workIsFaster: workPace < recoveryPace,
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

function alternatingCandidate(input: AlternatingLaps): Candidate | undefined {
  const assessment = alternatingScore(input);
  if (!assessment) return undefined;
  if (!assessment.workIsFaster) return repeatedHillsCandidate(input, assessment.score);
  return startsWithWork(input) ? intervalCandidate(input, assessment.score) : undefined;
}

export function alternatingCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start <= laps.length - 5; start += 1) {
    for (let end = start + 4; end < laps.length; end += 1) {
      for (const workParity of [0, 1]) {
        const alternating = alternatingLaps(laps, start, end, workParity);
        if (!alternating) continue;
        const candidate = alternatingCandidate(alternating);
        if (candidate) candidates.push(candidate);
      }
    }
  }
  return candidates;
}
