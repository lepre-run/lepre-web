import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import type { SynchronizationCheckpoint } from "../../domain/identity";
import { createProviderConnection } from "../../domain/provider-connection";
import { createUser } from "../../domain/user";
import { createWorkout } from "../../domain/workout";
import { indexedDbLocalStore } from "./local-store";

function connectedUser(id: string, connectionId: string) {
  const connection = createProviderConnection({
    id: connectionId,
    provider: "strava",
    externalAccountId: `external-${id}`,
  });
  if (connection.kind !== "created") throw new Error("expected connection");
  const user = createUser({
    id,
    firstName: "Francesco",
    lastName: "Barbera",
    connection: connection.connection,
  });
  if (user.kind !== "created") throw new Error("expected user");
  return user.user;
}

describe("IndexedDB local store", () => {
  afterEach(async () => indexedDbLocalStore.clear());

  it("stores the user and complete workout entity", async () => {
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
    await indexedDbLocalStore.reconcileUser(connectedUser("user-1", "connection-1"));
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [workout.workout],
      removed: [],
      continuation: {
        kind: "complete",
        checkpoint: "complete" as SynchronizationCheckpoint,
      },
    });

    await expect(indexedDbLocalStore.listWorkouts()).resolves.toEqual([workout.workout]);
    await expect(indexedDbLocalStore.synchronizationState()).resolves.toEqual({
      kind: "incremental",
      checkpoint: "complete",
    });
  });

  it("clears workouts when the singleton user changes", async () => {
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
    await indexedDbLocalStore.reconcileUser(connectedUser("user-1", "connection-1"));
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [workout.workout],
      removed: [],
      continuation: { kind: "more", token: "next" as never },
    });
    await expect(indexedDbLocalStore.synchronizationState()).resolves.toEqual({
      kind: "importing",
      token: "next",
    });
    await indexedDbLocalStore.reconcileUser(connectedUser("user-2", "connection-2"));

    await expect(indexedDbLocalStore.listWorkouts()).resolves.toEqual([]);
    await expect(indexedDbLocalStore.synchronizationState()).resolves.toEqual({ kind: "initial" });
  });
});
