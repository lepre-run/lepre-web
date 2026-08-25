import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import type { Workout } from "../../../domain/workout";
import { journalCardShapeSeed } from "../journalCardShape";
import type { SourceLapData } from "../SourceLapEvidence/SourceLapEvidence";
import { type LapRole, requireNonEmpty, sourceLapData, validatedLapRoles } from "../sourceLapData";
import {
  type CommonWorkoutCardProps,
  commonWorkoutCardPropsFromWorkout,
  type Measurement,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "../workoutCardData";

type ProgressiveStageProps = Readonly<{
  sourceLapNumber: number;
  distance: DistanceMeters;
  time: DurationSeconds;
  averageHeartRate: Measurement<number>;
}>;
export type ProgressiveSourceLapRole =
  | Readonly<{ kind: "warmup" }>
  | Readonly<{ kind: "stage"; stageNumber: number }>
  | Readonly<{ kind: "cooldown" }>
  | Readonly<{ kind: "unknown" }>;
export type ProgressiveSourceLapProps = SourceLapData<ProgressiveSourceLapRole>;
export type ProgressiveRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    stages: NonEmptyReadonlyArray<ProgressiveStageProps>;
    sourceLaps: NonEmptyReadonlyArray<ProgressiveSourceLapProps>;
    shapeSeed: number;
  }>;

type ProgressiveWorkout = Workout &
  Readonly<{ structure: Extract<Workout["structure"], { kind: "progressive" }> }>;

function stageLaps(workout: ProgressiveWorkout): ReadonlyArray<Workout["laps"][number]> {
  const { coreLapIndexes, stageCount, lapRoles } = workout.structure;
  const unique = new Set(coreLapIndexes).size === coreLapIndexes.length;
  const matchesWork =
    lapRoles.work.length === coreLapIndexes.length &&
    coreLapIndexes.every((value, index) => value === lapRoles.work[index]);
  if (!unique) throw new Error("a progressive workout cannot repeat a core lap");
  if (stageCount !== coreLapIndexes.length || !matchesWork) {
    throw new Error("progressive stage metadata does not match its work laps");
  }
  const byIndex = new Map(workout.laps.map((lap) => [lap.index, lap]));
  return coreLapIndexes.map((index) => requiredStageLap(byIndex.get(index), index));
}

function requiredStageLap(lap: Workout["laps"][number] | undefined, index: number) {
  if (!lap) throw new Error(`progressive workout is missing stage lap ${index}`);
  if (lap.distanceMeters <= 0 || lap.movingDurationSeconds <= 0) {
    throw new Error(`progressive stage lap ${index} requires distance and moving time`);
  }
  return lap;
}

function stage(lap: Workout["laps"][number]): ProgressiveStageProps {
  return {
    sourceLapNumber: lap.index,
    distance: lap.distanceMeters as DistanceMeters,
    time: lap.movingDurationSeconds as DurationSeconds,
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
  };
}

function progressiveRole(
  role: LapRole,
  lapIndex: number,
  stageNumberByLap: ReadonlyMap<number, number>,
): ProgressiveSourceLapRole {
  if (role === "work") {
    const stageNumber = stageNumberByLap.get(lapIndex);
    if (stageNumber === undefined)
      throw new Error(`progressive work lap ${lapIndex} is not a stage`);
    return { kind: "stage", stageNumber };
  }
  if (role === "recovery" || role === "main") {
    throw new Error(`progressive workout cannot assign ${role} to lap ${lapIndex}`);
  }
  return { kind: role };
}

export function progressiveRunCardPropsFromWorkout(workout: Workout): ProgressiveRunCardProps {
  if (workout.structure.kind !== "progressive") {
    throw new Error("a progressive-run card requires a progressive workout");
  }
  const progressive = workout as ProgressiveWorkout;
  const laps = stageLaps(progressive);
  const roles = validatedLapRoles(progressive, "progressive workout");
  const numbers = new Map(laps.map((lap, index) => [lap.index, index + 1]));
  const sourceLaps = progressive.laps.map((lap) => {
    const role = roles.get(lap.index);
    if (!role) throw new Error(`progressive workout is missing the role for lap ${lap.index}`);
    return sourceLapData(lap, progressiveRole(role, lap.index, numbers));
  });
  return {
    ...commonWorkoutCardPropsFromWorkout(progressive),
    stages: requireNonEmpty(laps.map(stage), "a progressive workout requires at least one stage"),
    sourceLaps: requireNonEmpty(sourceLaps, "a progressive workout requires source laps"),
    shapeSeed: journalCardShapeSeed(progressive.id),
  };
}
