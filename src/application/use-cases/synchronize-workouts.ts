import type { SynchronizationContinuationRequest } from "../model";
import type { BackendGateway, LocalStore } from "../ports";

export type SynchronizeWorkoutsResult =
  | Readonly<{ kind: "synchronized" }>
  | Readonly<{ kind: "backfill-paused"; retryAfterSeconds: number }>
  | Readonly<{ kind: "queued"; retryAfterSeconds: number }>
  | Readonly<{ kind: "rate-limited"; retryAfterSeconds: number }>
  | Readonly<{ kind: "reauthorization-required" }>
  | Readonly<{ kind: "provider-unavailable" }>;

const BACKFILL_RETRY_SECONDS = 15 * 60;

export type SynchronizeWorkouts = (
  afterBatch: () => Promise<void>,
) => Promise<SynchronizeWorkoutsResult>;

export function createSynchronizeWorkouts(
  store: LocalStore,
  backend: BackendGateway,
): SynchronizeWorkouts {
  return async (afterBatch) => {
    const state = await store.synchronizationState();
    const continuation: SynchronizationContinuationRequest =
      state.kind === "importing" ? { kind: "next", token: state.token } : { kind: "first" };
    const result = await backend.fetchWorkoutBatch(state, continuation);
    if (result.kind === "reauthorization-required") return result;
    if (result.kind === "queued") return result;
    if (result.kind === "rate-limited") return result;
    if (result.kind === "unavailable") return { kind: "provider-unavailable" };
    await store.applySynchronizationBatch(result.batch);
    await afterBatch();
    if (result.batch.continuation.kind === "complete") {
      return { kind: "synchronized" };
    }
    return { kind: "backfill-paused", retryAfterSeconds: BACKFILL_RETRY_SECONDS };
  };
}
