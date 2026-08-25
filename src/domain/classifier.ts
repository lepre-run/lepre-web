import {
  ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
  type ActualWorkoutStructure,
  type LapRoles,
  WORKOUT_CLASSIFIER_VERSION,
} from "./actual-workout-structure";
import { alternatingCandidates } from "./alternating-candidates";
import { type Candidate, coefficientOfVariation, pace } from "./classifier-model";
import { candidateGroups } from "./structured-candidates";
import type { Lap } from "./workout";

const STRUCTURED_THRESHOLD = 0.72;

function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}

function emptyLapRoles(): LapRoles {
  return { warmup: [], work: [], recovery: [], cooldown: [], main: [], unknown: [] };
}

function unstructuredWorkout(
  laps: ReadonlyArray<Lap>,
  kind: "free-run" | "unknown",
  confidence: number,
): ActualWorkoutStructure {
  const roles = emptyLapRoles();
  return {
    schemaVersion: ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
    classifierVersion: WORKOUT_CLASSIFIER_VERSION,
    source: "inferred_from_strava_laps",
    confidence,
    kind,
    coreLapIndexes: [],
    lapRoles: {
      ...roles,
      [kind === "free-run" ? "main" : "unknown"]: laps.map((lap) => lap.index),
    },
  };
}

function rolesForCandidate(laps: ReadonlyArray<Lap>, candidate: Candidate): LapRoles {
  const core = new Set(candidate.coreLapIndexes);
  const firstCorePosition = laps.findIndex((lap) => core.has(lap.index));
  let lastCorePosition = -1;
  for (let index = laps.length - 1; index >= 0; index -= 1) {
    if (core.has(laps[index].index)) {
      lastCorePosition = index;
      break;
    }
  }
  return {
    warmup: laps.slice(0, Math.max(0, firstCorePosition)).map((lap) => lap.index),
    work: candidate.workLapIndexes,
    recovery: candidate.recoveryLapIndexes,
    cooldown: laps.slice(lastCorePosition + 1).map((lap) => lap.index),
    main: [],
    unknown: [],
  };
}

function structuredWorkout(laps: ReadonlyArray<Lap>, candidate: Candidate): ActualWorkoutStructure {
  const {
    score,
    workLapIndexes: _work,
    recoveryLapIndexes: _recovery,
    ...classification
  } = candidate;
  return {
    schemaVersion: ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION,
    classifierVersion: WORKOUT_CLASSIFIER_VERSION,
    source: "inferred_from_strava_laps",
    confidence: roundConfidence(score),
    ...classification,
    lapRoles: rolesForCandidate(laps, candidate),
  };
}

export function classifyWorkout(laps: ReadonlyArray<Lap>): ActualWorkoutStructure {
  if (laps.length <= 1) return unstructuredWorkout(laps, "free-run", 1);
  const validLaps = laps.filter(
    (lap) => lap.distanceMeters > 0 && lap.movingDurationSeconds > 0 && Number.isFinite(pace(lap)),
  );
  if (validLaps.length !== laps.length) {
    return unstructuredWorkout(laps, "unknown", 0);
  }
  const groups = candidateGroups(laps);
  const candidates = [
    ...groups.beforeAlternating,
    ...alternatingCandidates(laps),
    ...groups.afterAlternating,
  ];
  const best = candidates.sort(
    (left, right) =>
      right.score - left.score || right.coreLapIndexes.length - left.coreLapIndexes.length,
  )[0];
  if (best && best.score >= STRUCTURED_THRESHOLD) {
    return structuredWorkout(laps, best);
  }
  if (coefficientOfVariation(laps.map(pace)) <= 0.1) {
    return unstructuredWorkout(laps, "free-run", 0.9);
  }
  return unstructuredWorkout(laps, "unknown", 0);
}
