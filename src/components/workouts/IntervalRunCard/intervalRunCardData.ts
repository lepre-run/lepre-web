import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import type { Workout } from "../../../domain/workout";
import { journalCardShapeSeed } from "../journalCardShape";
import { type LapRole, requireNonEmpty, sourceLapData, validatedLapRoles } from "../sourceLapData";
import {
  commonWorkoutCardPropsFromWorkout,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "../workoutCardData";
import type {
  IntervalLapProps,
  IntervalRepetitionProps,
  IntervalRunCardProps,
  IntervalSourceLapProps,
  IntervalSourceLapRole,
} from "./intervalRunCardTypes";

type IntervalWorkout = Workout &
  Readonly<{ structure: Extract<Workout["structure"], { kind: "intervals" }> }>;
function intervalLap(lap: Workout["laps"][number]): IntervalLapProps {
  if (lap.distanceMeters <= 0 || lap.movingDurationSeconds <= 0) {
    throw new Error(`interval lap ${lap.index} requires distance and moving time`);
  }
  return {
    sourceLapNumber: lap.index,
    distance: lap.distanceMeters as DistanceMeters,
    time: lap.movingDurationSeconds as DurationSeconds,
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
  };
}

function validateCoreOrder(
  workout: IntervalWorkout,
  roles: ReadonlyMap<number, LapRole>,
): ReadonlyArray<number> {
  const { coreLapIndexes, lapRoles, repetitions } = workout.structure;
  if (new Set(coreLapIndexes).size !== coreLapIndexes.length) {
    throw new Error("an interval workout cannot repeat a core lap");
  }
  if (lapRoles.work.length !== repetitions) {
    throw new Error("interval repetition metadata does not match its work laps");
  }
  const chronologicalCore = workout.laps
    .filter((lap) => roles.get(lap.index) === "work" || roles.get(lap.index) === "recovery")
    .map((lap) => lap.index);
  const sameOrder =
    coreLapIndexes.length === chronologicalCore.length &&
    coreLapIndexes.every((value, index) => value === chronologicalCore[index]);
  if (!sameOrder) {
    throw new Error("interval core laps are not in chronological work/recovery order");
  }
  return coreLapIndexes;
}

type RepetitionMapping = Readonly<{
  repetition: IntervalRepetitionProps;
  consumedLaps: number;
  lapNumbers: ReadonlyArray<number>;
}>;

function mappedRepetition(
  coreLapIndexes: ReadonlyArray<number>,
  index: number,
  roles: ReadonlyMap<number, LapRole>,
  lapsByIndex: ReadonlyMap<number, Workout["laps"][number]>,
): RepetitionMapping {
  const workLapIndex = coreLapIndexes[index];
  if (roles.get(workLapIndex) !== "work") {
    throw new Error(`interval core lap ${workLapIndex} must be a work lap`);
  }
  const workLap = lapsByIndex.get(workLapIndex);
  if (!workLap) throw new Error(`interval workout is missing work lap ${workLapIndex}`);
  const number = Math.floor(index / 2) + 1;
  const work = intervalLap(workLap);
  const recoveryIndex = coreLapIndexes[index + 1];
  if (recoveryIndex === undefined || roles.get(recoveryIndex) !== "recovery") {
    if (index + 1 < coreLapIndexes.length) {
      throw new Error(`interval ${number} is missing a recovery before the next work lap`);
    }
    return {
      repetition: { kind: "work-only", number, work },
      consumedLaps: 1,
      lapNumbers: [workLapIndex],
    };
  }
  const recoveryLap = lapsByIndex.get(recoveryIndex);
  if (!recoveryLap) throw new Error(`interval workout is missing recovery lap ${recoveryIndex}`);
  return {
    repetition: {
      kind: "work-and-recovery",
      number,
      work,
      recovery: intervalLap(recoveryLap),
    },
    consumedLaps: 2,
    lapNumbers: [workLapIndex, recoveryIndex],
  };
}

function mappedRepetitions(
  workout: IntervalWorkout,
  roles: ReadonlyMap<number, LapRole>,
  coreLapIndexes: ReadonlyArray<number>,
): Readonly<{
  repetitions: NonEmptyReadonlyArray<IntervalRepetitionProps>;
  repetitionNumberByLap: ReadonlyMap<number, number>;
}> {
  const lapsByIndex = new Map(workout.laps.map((lap) => [lap.index, lap]));
  const repetitionNumberByLap = new Map<number, number>();
  const repetitions: IntervalRepetitionProps[] = [];
  for (let index = 0; index < coreLapIndexes.length; ) {
    const mapping = mappedRepetition(coreLapIndexes, index, roles, lapsByIndex);
    repetitions.push(mapping.repetition);
    for (const lapNumber of mapping.lapNumbers) {
      repetitionNumberByLap.set(lapNumber, mapping.repetition.number);
    }
    index += mapping.consumedLaps;
  }
  if (repetitions.length !== workout.structure.repetitions) {
    throw new Error("interval repetition metadata does not match its ordered laps");
  }
  return {
    repetitions: requireNonEmpty(
      repetitions,
      "an interval workout requires at least one repetition",
    ),
    repetitionNumberByLap,
  };
}

function sourceRole(
  role: LapRole,
  lapIndex: number,
  repetitionNumberByLap: ReadonlyMap<number, number>,
): IntervalSourceLapRole {
  if (role === "main") throw new Error(`interval workout cannot assign main to lap ${lapIndex}`);
  if (role !== "work" && role !== "recovery") return { kind: role };
  const repetitionNumber = repetitionNumberByLap.get(lapIndex);
  if (repetitionNumber === undefined) {
    throw new Error(`interval ${role} lap ${lapIndex} is not part of a repetition`);
  }
  return { kind: role, repetitionNumber };
}

function mappedSourceLaps(
  workout: Workout,
  roles: ReadonlyMap<number, LapRole>,
  repetitionNumberByLap: ReadonlyMap<number, number>,
): NonEmptyReadonlyArray<IntervalSourceLapProps> {
  const sourceLaps = workout.laps.map((lap): IntervalSourceLapProps => {
    const role = roles.get(lap.index);
    if (!role) throw new Error(`interval workout is missing the role for lap ${lap.index}`);
    return sourceLapData(lap, sourceRole(role, lap.index, repetitionNumberByLap));
  });
  return requireNonEmpty(sourceLaps, "an interval workout requires source laps");
}

export function intervalRunCardPropsFromWorkout(workout: Workout): IntervalRunCardProps {
  if (workout.structure.kind !== "intervals") {
    throw new Error("an interval-run card requires an interval workout");
  }
  const intervalWorkout = workout as IntervalWorkout;
  const roles = validatedLapRoles(intervalWorkout, "an interval workout");
  const coreLapIndexes = validateCoreOrder(intervalWorkout, roles);
  const { repetitions, repetitionNumberByLap } = mappedRepetitions(
    intervalWorkout,
    roles,
    coreLapIndexes,
  );
  return {
    ...commonWorkoutCardPropsFromWorkout(intervalWorkout),
    repetitions,
    sourceLaps: mappedSourceLaps(intervalWorkout, roles, repetitionNumberByLap),
    shapeSeed: journalCardShapeSeed(intervalWorkout.id),
  };
}
