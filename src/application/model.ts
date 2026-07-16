import type { ContinuationToken, SynchronizationCheckpoint, WorkoutId } from "../domain/identity";
import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";

export type StoredUser = Readonly<{ kind: "found"; user: User }> | Readonly<{ kind: "not-found" }>;

export type SynchronizationState =
  | Readonly<{ kind: "initial" }>
  | Readonly<{ kind: "importing"; token: ContinuationToken }>
  | Readonly<{ kind: "incremental"; checkpoint: SynchronizationCheckpoint }>;

export type SynchronizationContinuationRequest =
  | Readonly<{ kind: "first" }>
  | Readonly<{ kind: "next"; token: ContinuationToken }>;

export type SynchronizationContinuation =
  | Readonly<{ kind: "more"; token: ContinuationToken }>
  | Readonly<{ kind: "complete"; checkpoint: SynchronizationCheckpoint }>;

export type SynchronizationBatch = Readonly<{
  upserted: ReadonlyArray<Workout>;
  removed: ReadonlyArray<WorkoutId>;
  continuation: SynchronizationContinuation;
}>;

export type RemoteSession =
  | Readonly<{ kind: "connected"; user: User }>
  | Readonly<{ kind: "disconnected" }>;
