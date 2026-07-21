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

  it("reclassifies a legacy cached workout once and persists the current structure", async () => {
    const created = createWorkout({
      id: "strava:legacy",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Legacy Run",
      description: "",
      sport: "Run",
      durationSeconds: 1_200,
      elapsedDurationSeconds: 1_200,
      distanceMeters: 4_000,
      laps: [
        {
          index: 1,
          name: "Run",
          movingDurationSeconds: 1_200,
          elapsedDurationSeconds: 1_200,
          distanceMeters: 4_000,
        },
      ],
    });
    if (created.kind !== "created") throw new Error("expected workout");
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [created.workout],
      removed: [],
      continuation: { kind: "complete", checkpoint: "complete" as SynchronizationCheckpoint },
    });

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("lepre");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const downgrade = database.transaction("workouts", "readwrite");
    const store = downgrade.objectStore("workouts");
    const record = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = store.get("strava:legacy");
      request.onsuccess = () => resolve(request.result as Record<string, unknown>);
      request.onerror = () => reject(request.error);
    });
    store.put({ ...record, structure: { classifierVersion: 0 } });
    await new Promise<void>((resolve, reject) => {
      downgrade.oncomplete = () => resolve();
      downgrade.onerror = () => reject(downgrade.error);
    });
    database.close();

    const loaded = await indexedDbLocalStore.listWorkouts();
    expect(loaded[0].structure).toEqual(created.workout.structure);

    const verificationDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("lepre");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const verification = verificationDatabase.transaction("workouts", "readonly");
    const migrated = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = verification.objectStore("workouts").get("strava:legacy");
      request.onsuccess = () => resolve(request.result as Record<string, unknown>);
      request.onerror = () => reject(request.error);
    });
    expect(migrated.structure).toEqual(created.workout.structure);
    verificationDatabase.close();
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
