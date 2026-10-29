export const ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION = 1 as const;
export const WORKOUT_CLASSIFIER_VERSION = 4 as const;

export type StageMeasure =
  | Readonly<{ kind: "distance"; meters: number }>
  | Readonly<{ kind: "duration"; seconds: number }>;

export type LapRoles = Readonly<{
  warmup: ReadonlyArray<number>;
  work: ReadonlyArray<number>;
  recovery: ReadonlyArray<number>;
  cooldown: ReadonlyArray<number>;
  main: ReadonlyArray<number>;
  unknown: ReadonlyArray<number>;
}>;

type StructureBase = Readonly<{
  schemaVersion: typeof ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION;
  classifierVersion: typeof WORKOUT_CLASSIFIER_VERSION;
  source: "inferred_from_strava_laps";
  confidence: number;
  coreLapIndexes: ReadonlyArray<number>;
  lapRoles: LapRoles;
}>;

export type ActualWorkoutStructure = StructureBase &
  (
    | Readonly<{
        kind: "intervals";
        repetitions: number;
        work: StageMeasure;
        recovery: StageMeasure;
      }>
    | Readonly<{ kind: "progressive"; stageCount: number }>
    | Readonly<{ kind: "tempo"; distanceMeters: number }>
    | Readonly<{ kind: "repeated-hills"; repetitions: number }>
    | Readonly<{ kind: "hill-circuit"; repetitions: number }>
    | Readonly<{ kind: "steady-structured-run" }>
    | Readonly<{ kind: "free-run" }>
    | Readonly<{ kind: "unknown" }>
  );

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isLapIndexes(value: unknown): value is ReadonlyArray<number> {
  return Array.isArray(value) && value.every(isPositiveInteger);
}

function isStageMeasure(value: unknown): value is StageMeasure {
  if (!isRecord(value)) return false;
  return (
    (value.kind === "distance" && isFiniteNonNegative(value.meters)) ||
    (value.kind === "duration" && isFiniteNonNegative(value.seconds))
  );
}

function isLapRoles(value: unknown): value is LapRoles {
  if (!isRecord(value)) return false;
  return ["warmup", "work", "recovery", "cooldown", "main", "unknown"].every((role) =>
    isLapIndexes(value[role]),
  );
}

export function isCurrentActualWorkoutStructure(value: unknown): value is ActualWorkoutStructure {
  return isStructureBase(value) && isStructureVariant(value);
}

function isStructureBase(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    value.schemaVersion === ACTUAL_WORKOUT_STRUCTURE_SCHEMA_VERSION &&
    value.classifierVersion === WORKOUT_CLASSIFIER_VERSION &&
    value.source === "inferred_from_strava_laps" &&
    isFiniteNonNegative(value.confidence) &&
    value.confidence <= 1 &&
    isLapIndexes(value.coreLapIndexes) &&
    isLapRoles(value.lapRoles)
  );
}

function isStructureVariant(value: Record<string, unknown>): boolean {
  switch (value.kind) {
    case "intervals":
      return (
        isPositiveInteger(value.repetitions) &&
        isStageMeasure(value.work) &&
        isStageMeasure(value.recovery)
      );
    case "progressive":
      return isPositiveInteger(value.stageCount);
    case "tempo":
      return isFiniteNonNegative(value.distanceMeters);
    case "repeated-hills":
    case "hill-circuit":
      return isPositiveInteger(value.repetitions);
    case "steady-structured-run":
    case "free-run":
    case "unknown":
      return true;
    default:
      return false;
  }
}
