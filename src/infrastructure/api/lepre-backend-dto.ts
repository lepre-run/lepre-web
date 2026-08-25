import type { SynchronizationBatch } from "../../application/model";
import type {
  ContinuationToken,
  SynchronizationCheckpoint,
  WorkoutId,
} from "../../domain/identity";
import { createProviderConnection } from "../../domain/provider-connection";
import { createUser, type User } from "../../domain/user";
import { createWorkout, type Workout, type WorkoutInput } from "../../domain/workout";

export type UserDto = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  connection: Readonly<{
    id: string;
    provider: string;
    externalAccountId: string;
  }>;
}>;

type WorkoutDto = WorkoutInput;

export type BatchDto = Readonly<{
  upserted: ReadonlyArray<WorkoutDto>;
  removed: ReadonlyArray<string>;
  continuation:
    | Readonly<{ kind: "more"; token: string }>
    | Readonly<{ kind: "complete"; checkpoint: string }>;
}>;

export function userFromDto(dto: UserDto): User {
  const connection = createProviderConnection(dto.connection);
  if (connection.kind !== "created") throw new Error("invalid provider connection response");
  const user = createUser({ ...dto, connection: connection.connection });
  if (user.kind !== "created") throw new Error("invalid user response");
  return user.user;
}

function workoutFromDto(dto: WorkoutDto): Workout {
  const result = createWorkout(dto);
  if (result.kind !== "created") throw new Error("invalid workout response");
  return result.workout;
}

export function batchFromDto(dto: BatchDto): SynchronizationBatch {
  return {
    upserted: dto.upserted.map(workoutFromDto),
    removed: dto.removed.map((id) => id as WorkoutId),
    continuation:
      dto.continuation.kind === "more"
        ? { kind: "more", token: dto.continuation.token as ContinuationToken }
        : {
            kind: "complete",
            checkpoint: dto.continuation.checkpoint as SynchronizationCheckpoint,
          },
  };
}
