import type { LapRoles } from "./actual-workout-structure";
import type { Lap, Workout } from "./workout";

type LapRole = keyof LapRoles;

export type LapAppearance = Readonly<{
  role: LapRole;
  progressiveStage?: number;
  progressiveIntensity?: number;
}>;

const ROLE_PRIORITY: ReadonlyArray<LapRole> = [
  "work",
  "recovery",
  "warmup",
  "cooldown",
  "main",
  "unknown",
];

function roleForLap(workout: Workout, lapIndex: number): LapRole {
  return (
    ROLE_PRIORITY.find((role) => workout.structure.lapRoles[role].includes(lapIndex)) ?? "unknown"
  );
}

function pace(lap: Lap): number {
  return lap.distanceMeters > 0
    ? lap.movingDurationSeconds / lap.distanceMeters
    : Number.POSITIVE_INFINITY;
}

function progressiveIntensity(workout: Workout, lap: Lap): number {
  const workLapIndexes = new Set(workout.structure.lapRoles.work);
  const distinctPaces = [
    ...new Set(
      workout.laps
        .filter((candidate) => workLapIndexes.has(candidate.index))
        .map(pace)
        .filter(Number.isFinite),
    ),
  ].sort((left, right) => right - left);
  if (distinctPaces.length <= 1) return 0.5;
  const rank = distinctPaces.indexOf(pace(lap));
  return rank < 0 ? 0.5 : rank / (distinctPaces.length - 1);
}

export function appearanceForLap(workout: Workout, lap: Lap): LapAppearance {
  const role = roleForLap(workout, lap.index);
  if (workout.structure.kind !== "progressive" || role !== "work") return { role };
  return {
    role,
    progressiveStage: workout.structure.lapRoles.work.indexOf(lap.index) + 1,
    progressiveIntensity: progressiveIntensity(workout, lap),
  };
}
