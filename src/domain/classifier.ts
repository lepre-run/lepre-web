import type { Lap } from "./workout";

export type WorkoutType =
  | "progressive"
  | "intervals"
  | "tempo"
  | "repeated-hills"
  | "steady-structured-run"
  | "free-run"
  | "unknown";

type ClassificationBase = Readonly<{ coreLapIndexes: ReadonlyArray<number> }>;

export type StageMeasure =
  | Readonly<{ kind: "distance"; meters: number }>
  | Readonly<{ kind: "duration"; seconds: number }>;

export type WorkoutClassification =
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
  | (ClassificationBase & Readonly<{ kind: "steady-structured-run" }>)
  | (ClassificationBase & Readonly<{ kind: "free-run" }>)
  | (ClassificationBase & Readonly<{ kind: "unknown" }>);

type Candidate = Exclude<WorkoutClassification, { kind: "free-run" | "unknown" }> &
  Readonly<{ score: number }>;

const STRUCTURED_THRESHOLD = 0.72;

function pace(lap: Lap): number {
  return lap.distanceMeters > 0
    ? lap.movingDurationSeconds / lap.distanceMeters
    : Number.POSITIVE_INFINITY;
}

function mean(values: ReadonlyArray<number>): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coefficientOfVariation(values: ReadonlyArray<number>): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  if (!Number.isFinite(average) || average === 0) return Number.POSITIVE_INFINITY;
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance) / average;
}

function range(start: number, end: number): ReadonlyArray<number> {
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}

function repeatedStage(laps: ReadonlyArray<Lap>): StageMeasure {
  const distances = laps.map((lap) => lap.distanceMeters);
  if (coefficientOfVariation(distances) <= 0.12) {
    return { kind: "distance", meters: mean(distances) };
  }
  return { kind: "duration", seconds: mean(laps.map((lap) => lap.movingDurationSeconds)) };
}

function alternatingCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start <= laps.length - 5; start += 1) {
    for (let end = start + 4; end < laps.length; end += 1) {
      const indexes = range(start, end);
      for (const workParity of [0, 1]) {
        const workIndexes = indexes.filter((index) => (index - start) % 2 === workParity);
        const recoveryIndexes = indexes.filter((index) => (index - start) % 2 !== workParity);
        if (workIndexes.length < 3 || recoveryIndexes.length < 2) continue;
        const work = workIndexes.map((index) => laps[index]);
        const recovery = recoveryIndexes.map((index) => laps[index]);
        const workPaces = work.map(pace);
        const recoveryPaces = recovery.map(pace);
        const workConsistency = coefficientOfVariation(workPaces);
        const recoveryConsistency = Math.min(
          coefficientOfVariation(recovery.map((lap) => lap.distanceMeters)),
          coefficientOfVariation(recovery.map((lap) => lap.movingDurationSeconds)),
        );
        const workStageConsistency = Math.min(
          coefficientOfVariation(work.map((lap) => lap.distanceMeters)),
          coefficientOfVariation(work.map((lap) => lap.movingDurationSeconds)),
        );
        if (workConsistency > 0.14 || workStageConsistency > 0.18 || recoveryConsistency > 0.3) {
          continue;
        }
        const workPace = mean(workPaces);
        const recoveryPace = mean(recoveryPaces);
        const separation = Math.abs(recoveryPace - workPace) / Math.max(workPace, recoveryPace);
        if (separation < 0.12) continue;
        const consistencyScore = 1 - Math.min(1, workConsistency + workStageConsistency / 2);
        const score = Math.min(0.98, 0.67 + separation + consistencyScore * 0.12);
        if (workPace < recoveryPace) {
          candidates.push({
            kind: "intervals",
            repetitions: work.length,
            work: repeatedStage(work),
            recovery: repeatedStage(recovery),
            coreLapIndexes: indexes.map((index) => laps[index].index),
            score,
          });
        } else {
          const equalOutAndBackDistance =
            coefficientOfVariation([...work, ...recovery].map((lap) => lap.distanceMeters)) <= 0.16;
          if (!equalOutAndBackDistance) continue;
          candidates.push({
            kind: "repeated-hills",
            repetitions: work.length,
            coreLapIndexes: indexes.map((index) => laps[index].index),
            score: score - 0.04,
          });
        }
      }
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
        score: Math.min(0.94, 0.7 + improvement + stages.length * 0.01),
      });
    }
  }
  return candidates;
}

function tempoCandidates(laps: ReadonlyArray<Lap>): ReadonlyArray<Candidate> {
  const candidates: Candidate[] = [];
  for (let start = 0; start < laps.length; start += 1) {
    for (let end = start; end < laps.length; end += 1) {
      if (start === 0 && end === laps.length - 1) continue;
      const core = laps.slice(start, end + 1);
      const coreDistance = core.reduce((sum, lap) => sum + lap.distanceMeters, 0);
      const coreDuration = core.reduce((sum, lap) => sum + lap.movingDurationSeconds, 0);
      if (coreDistance < 1_500 && coreDuration < 8 * 60) continue;
      const corePaces = core.map(pace);
      if (coefficientOfVariation(corePaces) > 0.08) continue;
      const outside = [...laps.slice(0, start), ...laps.slice(end + 1)];
      const separation = (mean(outside.map(pace)) - mean(corePaces)) / mean(corePaces);
      if (separation < 0.12) continue;
      candidates.push({
        kind: "tempo",
        distanceMeters: coreDistance,
        coreLapIndexes: core.map((lap) => lap.index),
        score: Math.min(0.91, 0.68 + separation + Math.min(core.length, 4) * 0.01),
      });
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
    score: 0.74 + Math.min(0.08, distanceVariation / 5),
  };
}

export function classifyWorkout(laps: ReadonlyArray<Lap>): WorkoutClassification {
  if (laps.length <= 1) return { kind: "free-run", coreLapIndexes: [] };
  const validLaps = laps.filter(
    (lap) => lap.distanceMeters > 0 && lap.movingDurationSeconds > 0 && Number.isFinite(pace(lap)),
  );
  if (validLaps.length !== laps.length) {
    return { kind: "unknown", coreLapIndexes: [] };
  }
  const candidates = [
    ...alternatingCandidates(laps),
    ...progressiveCandidates(laps),
    ...tempoCandidates(laps),
  ];
  const steady = steadyStructuredCandidate(laps);
  if (steady) candidates.push(steady);
  const best = candidates.sort(
    (left, right) =>
      right.score - left.score || right.coreLapIndexes.length - left.coreLapIndexes.length,
  )[0];
  if (best && best.score >= STRUCTURED_THRESHOLD) {
    const { score: _score, ...classification } = best;
    return classification;
  }
  if (coefficientOfVariation(laps.map(pace)) <= 0.1) {
    return { kind: "free-run", coreLapIndexes: [] };
  }
  return { kind: "unknown", coreLapIndexes: [] };
}
