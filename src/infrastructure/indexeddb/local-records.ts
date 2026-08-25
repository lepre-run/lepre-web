import { createProviderConnection } from "../../domain/provider-connection";
import { createUser, type User } from "../../domain/user";
import { createWorkout, type Workout, type WorkoutInput } from "../../domain/workout";

export type StoredUserRecord = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  connection: Readonly<{ id: string; provider: string; externalAccountId: string }>;
}>;
export type StoredWorkoutRecord = WorkoutInput;

export function userFromRecord(record: StoredUserRecord): User {
  const connection = createProviderConnection(record.connection);
  if (connection.kind !== "created") throw new Error("invalid stored provider connection");
  const user = createUser({ ...record, connection: connection.connection });
  if (user.kind !== "created") throw new Error("invalid stored user");
  return user.user;
}

export function workoutFromRecord(record: StoredWorkoutRecord): Workout {
  const result = createWorkout(record);
  if (result.kind !== "created") throw new Error("invalid stored workout");
  return result.workout;
}

export function userRecord(user: User): StoredUserRecord {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    connection: {
      id: user.connection.id,
      provider: user.connection.provider,
      externalAccountId: user.connection.externalAccountId,
    },
  };
}

export function workoutRecord(workout: Workout): StoredWorkoutRecord {
  return {
    id: workout.id,
    performedAt: workout.performedAt,
    name: workout.name,
    description: workout.description,
    type: workout.type,
    sport: workout.sport,
    durationSeconds: workout.durationSeconds,
    elapsedDurationSeconds: workout.elapsedDurationSeconds,
    distanceMeters: workout.distanceMeters,
    averageHeartRateBpm: workout.averageHeartRateBpm,
    maxHeartRateBpm: workout.maxHeartRateBpm,
    laps: workout.laps,
    structure: workout.structure,
  };
}
