import { describe, expect, it, vi } from "vitest";

import type { ContinuationToken, SynchronizationCheckpoint } from "../../domain/identity";
import { createWorkout } from "../../domain/workout";
import type { BackendGateway, LocalStore } from "../ports";
import { createSynchronizeWorkouts } from "./synchronize-workouts";

describe("SynchronizeWorkouts", () => {
  it("applies every page and commits the final checkpoint", async () => {
    const workout = createWorkout({
      id: "strava:7",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Morning Run",
      description: "",
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
    if (workout.kind !== "created") throw new Error("expected workout");
    const first = {
      upserted: [workout.workout],
      removed: [],
      continuation: { kind: "more", token: "next" as ContinuationToken },
    } as const;
    const last = {
      upserted: [],
      removed: [],
      continuation: {
        kind: "complete",
        checkpoint: "checkpoint" as SynchronizationCheckpoint,
      },
    } as const;
    const applySynchronizationBatch = vi.fn().mockResolvedValue(undefined);
    const store = {
      synchronizationState: vi.fn().mockResolvedValue({ kind: "initial" }),
      applySynchronizationBatch,
    } as unknown as LocalStore;
    const fetchWorkoutBatch = vi
      .fn()
      .mockResolvedValueOnce({ kind: "received", batch: first })
      .mockResolvedValueOnce({ kind: "received", batch: last });
    const backend = { fetchWorkoutBatch } as unknown as BackendGateway;
    const afterBatch = vi.fn().mockResolvedValue(undefined);

    await expect(createSynchronizeWorkouts(store, backend)(afterBatch)).resolves.toEqual({
      kind: "synchronized",
    });
    expect(applySynchronizationBatch).toHaveBeenNthCalledWith(1, first);
    expect(applySynchronizationBatch).toHaveBeenNthCalledWith(2, last);
    expect(fetchWorkoutBatch).toHaveBeenNthCalledWith(
      2,
      { kind: "initial" },
      {
        kind: "next",
        token: "next",
      },
    );
    expect(afterBatch).toHaveBeenCalledTimes(2);
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
});
