import { type Candidate, coefficientOfVariation, mean, pace } from "./classifier-model";
import type { Lap } from "./workout";

function hillCircuitCandidate(stages: ReadonlyArray<Lap>): Candidate | undefined {
  const work = stages.filter((_, index) => index % 2 === 0);
  const recovery = stages.filter((_, index) => index % 2 === 1);
  if (work.length < 4 || work.length % 2 !== 0) return undefined;
  const uphill = work.filter((_, index) => index % 2 === 0);
  const downhill = work.filter((_, index) => index % 2 === 1);
  const variations = [
    coefficientOfVariation(work.map((lap) => lap.distanceMeters)) / 0.16,
    Math.min(
      coefficientOfVariation(recovery.map((lap) => lap.distanceMeters)),
      coefficientOfVariation(recovery.map((lap) => lap.movingDurationSeconds)),
    ) / 0.3,
    coefficientOfVariation(uphill.map(pace)) / 0.14,
    coefficientOfVariation(downhill.map(pace)) / 0.14,
  ];
  if (variations.some((variation) => variation > 1)) return undefined;
  const uphillPace = mean(uphill.map(pace));
  const separation = (uphillPace - mean(downhill.map(pace))) / uphillPace;
  if (separation < 0.18) return undefined;
  return {
    kind: "hill-circuit",
    repetitions: work.length / 2,
    coreLapIndexes: stages.map((lap) => lap.index),
    workLapIndexes: work.map((lap) => lap.index),
    recoveryLapIndexes: recovery.map((lap) => lap.index),
    score: Math.min(0.98, 0.78 + separation / 2),
  };
}

function hillCircuitCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start <= laps.length - 7; start += 1) {
    for (let end = start + 6; end < laps.length; end += 2) {
      const candidate = hillCircuitCandidate(laps.slice(start, end + 1));
      if (candidate) candidates.push(candidate);
    }
  }
  return candidates;
}

function progressiveCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start <= laps.length - 3; start += 1) {
    for (let end = start + 2; end < laps.length; end += 1) {
      const stages = laps.slice(start, end + 1);
      const paces = stages.map(pace);
      const improvement = (paces[0] - paces[paces.length - 1]) / paces[0];
      const regressions = paces
        .slice(1)
        .filter((value, index) => value > paces[index] * 1.04).length;
      const meaningfulSteps = paces
        .slice(1)
        .filter((value, index) => value < paces[index] * 0.98).length;
      if (improvement < 0.1 || regressions > 0 || meaningfulSteps < stages.length - 1) continue;
      candidates.push({
        kind: "progressive",
        stageCount: stages.length,
        coreLapIndexes: stages.map((lap) => lap.index),
        workLapIndexes: stages.map((lap) => lap.index),
        recoveryLapIndexes: [],
        score: Math.min(0.94, 0.7 + improvement + stages.length * 0.01),
      });
    }
  }
  return candidates;
}

function tempoCandidate(
  laps: ReadonlyArray<Lap>,
  start: number,
  end: number,
): Candidate | undefined {
  if (start === 0 && end === laps.length - 1) return undefined;
  const core = laps.slice(start, end + 1);
  const coreDistance = core.reduce((sum, lap) => sum + lap.distanceMeters, 0);
  const coreDuration = core.reduce((sum, lap) => sum + lap.movingDurationSeconds, 0);
  if (coreDistance < 1_500 && coreDuration < 8 * 60) return undefined;
  const corePaces = core.map(pace);
  if (coefficientOfVariation(corePaces) > 0.08) return undefined;
  const outside = [...laps.slice(0, start), ...laps.slice(end + 1)];
  const separation = (mean(outside.map(pace)) - mean(corePaces)) / mean(corePaces);
  if (separation < 0.12) return undefined;
  return {
    kind: "tempo",
    distanceMeters: coreDistance,
    coreLapIndexes: core.map((lap) => lap.index),
    workLapIndexes: core.map((lap) => lap.index),
    recoveryLapIndexes: [],
    score: Math.min(0.91, 0.68 + separation + Math.min(core.length, 4) * 0.01),
  };
}

function tempoCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start < laps.length; start += 1) {
    for (let end = start; end < laps.length; end += 1) {
      const candidate = tempoCandidate(laps, start, end);
      if (candidate) candidates.push(candidate);
    }
  }
  return candidates;
}

function steadyStructuredCandidate(laps: ReadonlyArray<Lap>): Candidate | undefined {
  if (laps.length < 3) return undefined;
  const paceVariation = coefficientOfVariation(laps.map(pace));
  const distanceVariation = coefficientOfVariation(laps.map((lap) => lap.distanceMeters));
  if (paceVariation > 0.07 || distanceVariation < 0.18) return undefined;
  return {
    kind: "steady-structured-run",
    coreLapIndexes: laps.map((lap) => lap.index),
    workLapIndexes: laps.map((lap) => lap.index),
    recoveryLapIndexes: [],
    score: 0.74 + Math.min(0.08, distanceVariation / 5),
  };
}

export function candidateGroups(laps: ReadonlyArray<Lap>): Readonly<{
  beforeAlternating: ReadonlyArray<Candidate>;
  afterAlternating: ReadonlyArray<Candidate>;
}> {
  const candidates = [...progressiveCandidates(laps), ...tempoCandidates(laps)];
  const steady = steadyStructuredCandidate(laps);
  return {
    beforeAlternating: hillCircuitCandidates(laps),
    afterAlternating: steady ? [...candidates, steady] : candidates,
  };
}
