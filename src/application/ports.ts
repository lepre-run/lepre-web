import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";
import type {
  RemoteSession,
  StoredUser,
  SynchronizationBatch,
  SynchronizationContinuationRequest,
  SynchronizationState,
} from "./model";

export type LocalStore = Readonly<{
  loadUser: () => Promise<StoredUser>;
  listWorkouts: () => Promise<ReadonlyArray<Workout>>;
  synchronizationState: () => Promise<SynchronizationState>;
  applySynchronizationBatch: (batch: SynchronizationBatch) => Promise<void>;
  reconcileUser: (user: User) => Promise<void>;
  clear: () => Promise<void>;
}>;

export type WorkoutSourceResult =
  | Readonly<{ kind: "received"; batch: SynchronizationBatch }>
  | Readonly<{ kind: "rate-limited"; retryAfterSeconds: number }>
  | Readonly<{ kind: "reauthorization-required" }>
  | Readonly<{ kind: "unavailable" }>;

export type BackendGateway = Readonly<{
  session: () => Promise<RemoteSession>;
  fetchWorkoutBatch: (
    state: SynchronizationState,
    continuation: SynchronizationContinuationRequest,
  ) => Promise<WorkoutSourceResult>;
  disconnect: () => Promise<"disconnected" | "unavailable">;
}>;
