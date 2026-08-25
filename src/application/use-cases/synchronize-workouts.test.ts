import { describe, expect, it, vi } from "vitest";

import type { ContinuationToken } from "../../domain/identity";
import { buildWorkout } from "../../test/builders";
import type { BackendGateway, LocalStore } from "../ports";
import { createSynchronizeWorkouts } from "./synchronize-workouts";

describe("SynchronizeWorkouts", () => {
  it("applies one page and pauses before continuing the historical backfill", async () => {
    const workout = buildWorkout({
      id: "strava:7",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Morning Run",
      description: "",
      type: "workout",
      sport: "Run",
      durationSeconds: 2_400,
      elapsedDurationSeconds: 2_450,
      distanceMeters: 8_000,
      laps: [
        {
          index: 1,
          name: "Lap 1",
          movingDurationSeconds: 2_400,
          elapsedDurationSeconds: 2_450,
          distanceMeters: 8_000,
        },
      ],
    });
    const first = {
      upserted: [workout],
      removed: [],
      continuation: { kind: "more", token: "next" as ContinuationToken },
    } as const;
    const applySynchronizationBatch = vi.fn().mockResolvedValue(undefined);
    const store = {
      synchronizationState: vi.fn().mockResolvedValue({ kind: "initial" }),
      applySynchronizationBatch,
    } as unknown as LocalStore;
    const fetchWorkoutBatch = vi.fn().mockResolvedValue({ kind: "received", batch: first });
    const backend = { fetchWorkoutBatch } as unknown as BackendGateway;
    const afterBatch = vi.fn().mockResolvedValue(undefined);

    await expect(createSynchronizeWorkouts(store, backend)(afterBatch)).resolves.toEqual({
      kind: "backfill-paused",
      retryAfterSeconds: 900,
    });
    expect(applySynchronizationBatch).toHaveBeenNthCalledWith(1, first);
    expect(fetchWorkoutBatch).toHaveBeenCalledOnce();
    expect(afterBatch).toHaveBeenCalledOnce();
  });

  it("resumes an interrupted import from its stored continuation", async () => {
    const store = {
      synchronizationState: vi.fn().mockResolvedValue({ kind: "importing", token: "resume" }),
      applySynchronizationBatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as LocalStore;
    const fetchWorkoutBatch = vi.fn().mockResolvedValue({
      kind: "received",
      batch: {
        upserted: [],
        removed: [],
        continuation: { kind: "complete", checkpoint: "done" },
      },
    });
    const backend = { fetchWorkoutBatch } as unknown as BackendGateway;

    await createSynchronizeWorkouts(store, backend)(async () => undefined);

    expect(fetchWorkoutBatch).toHaveBeenCalledWith(
      { kind: "importing", token: "resume" },
      { kind: "next", token: "resume" },
    );
  });

  it("returns a retryable pause without changing the checkpoint", async () => {
    await expectSynchronizationPause("rate-limited", 900);
  });

  it("preserves the local checkpoint while waiting for a fair turn", async () => {
    await expectSynchronizationPause("queued", 5);
  });
});

async function expectSynchronizationPause(kind: "rate-limited" | "queued", seconds: number) {
  const applySynchronizationBatch = vi.fn();
  const store = {
    synchronizationState: vi.fn().mockResolvedValue({ kind: "initial" }),
    applySynchronizationBatch,
  } as unknown as LocalStore;
  const backend = {
    fetchWorkoutBatch: vi.fn().mockResolvedValue({ kind, retryAfterSeconds: seconds }),
  } as unknown as BackendGateway;
  await expect(createSynchronizeWorkouts(store, backend)(async () => undefined)).resolves.toEqual({
    kind,
    retryAfterSeconds: seconds,
  });
  expect(applySynchronizationBatch).not.toHaveBeenCalled();
}
