import type { CSSProperties } from "react";
import type { LapRoles } from "../../domain/actual-workout-structure";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import type { Lap, Workout } from "../../domain/workout";
import type { SourceLapData } from "./SourceLapEvidence/SourceLapEvidence";
import {
  type Measurement,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "./workoutCardData";

export type LapRole = keyof LapRoles;
export type PaceStyle = CSSProperties & Readonly<{ "--stage-progress": string }>;

const LAP_ROLES: ReadonlyArray<LapRole> = [
  "warmup",
  "work",
  "recovery",
  "cooldown",
  "main",
  "unknown",
];

export function requireNonEmpty<Value>(
  values: ReadonlyArray<Value>,
  message: string,
): NonEmptyReadonlyArray<Value> {
  if (values.length === 0) throw new Error(message);
  return values as NonEmptyReadonlyArray<Value>;
}

export function sourceLapData<Role>(lap: Lap, role: Role): SourceLapData<Role> {
  return {
    number: lap.index,
    name: lap.name,
    role,
    distance: lap.distanceMeters as DistanceMeters,
    movingTime: lap.movingDurationSeconds as DurationSeconds,
    elapsedTime: lap.elapsedDurationSeconds as DurationSeconds,
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
    maximumHeartRate: recordedOrUnavailable(lap.maxHeartRateBpm),
  };
}

export function validatedLapRoles(
  workout: Workout,
  workoutLabel: string,
): ReadonlyMap<number, LapRole> {
  const indexes = workout.laps.map((lap) => lap.index);
  if (new Set(indexes).size !== indexes.length) {
    throw new Error(`${workoutLabel} cannot repeat a source-lap index`);
  }
  const existing = new Set(indexes);
  const roles = new Map<number, LapRole>();
  const assignment = { workout, label: workoutLabel, existing, roles };
  for (const role of LAP_ROLES) assignRoleIndexes(assignment, role);
  for (const lap of workout.laps) {
    if (!roles.has(lap.index))
      throw new Error(`${workoutLabel} does not assign a role to lap ${lap.index}`);
  }
  return roles;
}

type RoleAssignment = Readonly<{
  workout: Workout;
  label: string;
  existing: ReadonlySet<number>;
  roles: Map<number, LapRole>;
}>;

function assignRoleIndexes(assignment: RoleAssignment, role: LapRole): void {
  for (const index of assignment.workout.structure.lapRoles[role]) {
    if (!assignment.existing.has(index)) {
      throw new Error(`${assignment.label} role references missing lap ${index}`);
    }
    if (assignment.roles.has(index)) {
      throw new Error(`${assignment.label} assigns multiple roles to lap ${index}`);
    }
    assignment.roles.set(index, role);
  }
}

export function measurementText(measurement: Measurement<number>): string {
  return measurement.kind === "recorded" ? Math.round(measurement.value).toString() : "—";
}

export function relativePaceStyles(
  laps: NonEmptyReadonlyArray<SourceLapData<unknown>>,
  minimumPercent = 35,
): ReadonlyArray<PaceStyle> {
  const pace = (lap: SourceLapData<unknown>) =>
    lap.distance > 0 ? (lap.movingTime / lap.distance) * 1_000 : Number.POSITIVE_INFINITY;
  const distinct = [...new Set(laps.map(pace))].sort((left, right) => right - left);
  return laps.map((lap) => {
    const rank = distinct.indexOf(pace(lap));
    const intensity = distinct.length <= 1 ? 0.5 : rank / (distinct.length - 1);
    return { "--stage-progress": `${minimumPercent + intensity * (100 - minimumPercent)}%` };
  });
}
