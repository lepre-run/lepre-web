import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import type { SynchronizationCheckpoint } from "../../domain/identity";
import { createProviderConnection } from "../../domain/provider-connection";
import { createUser } from "../../domain/user";
import { createWorkout } from "../../domain/workout";
import { buildWorkout } from "../../test/builders";
import {
  recoveryFirstIntervalWorkout,
  storedV2RecoveryFirstStructure,
} from "../../test/fixtures/recovery-first-interval-core";
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

function storedWorkout(type: "workout" | "race" = "workout") {
  return buildWorkout({
    id: "strava:7",
    performedAt: "2026-07-15T06:00:00Z",
    name: "Morning Run",
    description: "",
    type,
    sport: "Run",
    durationSeconds: 2_400,
    elapsedDurationSeconds: 2_450,
    distanceMeters: 8_000,
    averageHeartRateBpm: 148.2,
    maxHeartRateBpm: 176,
    laps: [
      {
        index: 1,
        name: "Lap 1",
        movingDurationSeconds: 2_400,
        elapsedDurationSeconds: 2_450,
        distanceMeters: 8_000,
        averageHeartRateBpm: 148.2,
        maxHeartRateBpm: 176,
      },
    ],
  });
}

function openTestDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("lepre");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readWorkoutRecord(store: IDBObjectStore, id: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as Record<string, unknown>);
    request.onerror = () => reject(request.error);
  });
}

async function replaceStoredStructure(id: string, structure: unknown): Promise<void> {
  const database = await openTestDatabase();
  const downgrade = database.transaction("workouts", "readwrite");
  const store = downgrade.objectStore("workouts");
  const record = await readWorkoutRecord(store, id);
  store.put({ ...record, structure });
  await new Promise<void>((resolve, reject) => {
    downgrade.oncomplete = () => resolve();
    downgrade.onerror = () => reject(downgrade.error);
  });
  database.close();
}

describe("IndexedDB local store", () => {
  afterEach(async () => indexedDbLocalStore.clear());

  it("stores the user and complete workout entity", async () => {
    const workout = storedWorkout("race");
    await indexedDbLocalStore.reconcileUser(connectedUser("user-1", "connection-1"));
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [workout],
      removed: [],
      continuation: {
        kind: "complete",
        checkpoint: "complete" as SynchronizationCheckpoint,
      },
    });

    await expect(indexedDbLocalStore.listWorkouts()).resolves.toEqual([workout]);
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
      type: "workout",
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

    await replaceStoredStructure("strava:legacy", { classifierVersion: 0 });

    const loaded = await indexedDbLocalStore.listWorkouts();
    expect(loaded[0].structure).toEqual(created.workout.structure);

    const verificationDatabase = await openTestDatabase();
    const verification = verificationDatabase.transaction("workouts", "readonly");
    const migrated = await readWorkoutRecord(verification.objectStore("workouts"), "strava:legacy");
    expect(migrated.structure).toEqual(created.workout.structure);
    verificationDatabase.close();
  });

  it("reclassifies a cached v2 interval whose core starts with recovery", async () => {
    const workout = recoveryFirstIntervalWorkout();
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [workout],
      removed: [],
      continuation: { kind: "complete", checkpoint: "complete" as SynchronizationCheckpoint },
    });
    await replaceStoredStructure(workout.id, storedV2RecoveryFirstStructure);

    const [loaded] = await indexedDbLocalStore.listWorkouts();

    expect(loaded.structure).toEqual(workout.structure);
    expect(loaded.structure).toMatchObject({
      kind: "intervals",
      coreLapIndexes: [3, 4, 5, 6, 7],
      lapRoles: { warmup: [1, 2], recovery: [4, 6] },
    });
  });

  it("clears workouts when the singleton user changes", async () => {
    const workout = storedWorkout();
    await indexedDbLocalStore.reconcileUser(connectedUser("user-1", "connection-1"));
    await indexedDbLocalStore.applySynchronizationBatch({
      upserted: [workout],
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
