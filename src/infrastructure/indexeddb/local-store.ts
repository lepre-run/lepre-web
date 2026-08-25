import type {
  StoredUser,
  SynchronizationBatch,
  SynchronizationState,
} from "../../application/model";
import type { LocalStore } from "../../application/ports";
import { isCurrentActualWorkoutStructure } from "../../domain/actual-workout-structure";
import type { ContinuationToken, SynchronizationCheckpoint } from "../../domain/identity";
import type { User } from "../../domain/user";
import type { Workout } from "../../domain/workout";
import {
  type StoredUserRecord,
  type StoredWorkoutRecord,
  userFromRecord,
  userRecord,
  workoutFromRecord,
  workoutRecord,
} from "./local-records";

const DATABASE_NAME = "lepre";
const DATABASE_VERSION = 5;
const USER_STORE = "user";
const WORKOUT_STORE = "workouts";
const META_STORE = "meta";
const USER_KEY = "current";
const SYNC_KEY = "synchronization";

type StoredSynchronizationRecord =
  | Readonly<{ kind: "importing"; token: string }>
  | Readonly<{ kind: "incremental"; checkpoint: string }>;

function requestResult<Value>(request: IDBRequest<Value>): Promise<Value> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of Array.from(database.objectStoreNames)) {
        database.deleteObjectStore(storeName);
      }
      database.createObjectStore(USER_STORE);
      database.createObjectStore(WORKOUT_STORE, { keyPath: "id" });
      database.createObjectStore(META_STORE);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open local application database"));
    request.onblocked = () => reject(new Error("Local application database upgrade was blocked"));
  });
}

async function loadUser(): Promise<StoredUser> {
  const database = await openDatabase();
  const transaction = database.transaction(USER_STORE, "readonly");
  const done = transactionDone(transaction);
  const record = await requestResult(
    transaction.objectStore(USER_STORE).get(USER_KEY) as IDBRequest<StoredUserRecord | undefined>,
  );
  await done;
  database.close();
  return record === undefined
    ? { kind: "not-found" }
    : { kind: "found", user: userFromRecord(record) };
}

async function listWorkouts(): Promise<ReadonlyArray<Workout>> {
  const database = await openDatabase();
  const transaction = database.transaction(WORKOUT_STORE, "readonly");
  const done = transactionDone(transaction);
  const records = await requestResult(
    transaction.objectStore(WORKOUT_STORE).getAll() as IDBRequest<StoredWorkoutRecord[]>,
  );
  await done;
  const workouts = records.map(workoutFromRecord);
  const staleStructureIds = new Set(
    records
      .filter((record) => !isCurrentActualWorkoutStructure(record.structure))
      .map(({ id }) => id),
  );
  if (staleStructureIds.size > 0) {
    const updateTransaction = database.transaction(WORKOUT_STORE, "readwrite");
    const updatesDone = transactionDone(updateTransaction);
    const store = updateTransaction.objectStore(WORKOUT_STORE);
    for (const workout of workouts) {
      if (staleStructureIds.has(workout.id)) store.put(workoutRecord(workout));
    }
    await updatesDone;
  }
  database.close();
  return workouts.sort((left, right) => right.performedAt.localeCompare(left.performedAt));
}

async function synchronizationState(): Promise<SynchronizationState> {
  const database = await openDatabase();
  const transaction = database.transaction(META_STORE, "readonly");
  const done = transactionDone(transaction);
  const record = await requestResult(
    transaction.objectStore(META_STORE).get(SYNC_KEY) as IDBRequest<
      StoredSynchronizationRecord | undefined
    >,
  );
  await done;
  database.close();
  return record === undefined
    ? { kind: "initial" }
    : record.kind === "importing"
      ? { kind: "importing", token: record.token as ContinuationToken }
      : {
          kind: "incremental",
          checkpoint: record.checkpoint as SynchronizationCheckpoint,
        };
}

async function applySynchronizationBatch(batch: SynchronizationBatch): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([WORKOUT_STORE, META_STORE], "readwrite");
  const done = transactionDone(transaction);
  const workouts = transaction.objectStore(WORKOUT_STORE);
  for (const workout of batch.upserted) workouts.put(workoutRecord(workout));
  for (const id of batch.removed) workouts.delete(id);
  const synchronizationRecord: StoredSynchronizationRecord =
    batch.continuation.kind === "complete"
      ? { kind: "incremental", checkpoint: batch.continuation.checkpoint }
      : { kind: "importing", token: batch.continuation.token };
  transaction.objectStore(META_STORE).put(synchronizationRecord, SYNC_KEY);
  await done;
  database.close();
}

async function reconcileUser(user: User): Promise<void> {
  const existing = await loadUser();
  const sameUser = existing.kind === "found" && existing.user.id === user.id;
  const sameConnection =
    sameUser &&
    existing.user.connection.id === user.connection.id &&
    existing.user.connection.provider === user.connection.provider &&
    existing.user.connection.externalAccountId === user.connection.externalAccountId;
  const reconciled = sameUser
    ? { ...user, firstName: existing.user.firstName, lastName: existing.user.lastName }
    : user;
  const stores = sameConnection ? [USER_STORE] : [USER_STORE, WORKOUT_STORE, META_STORE];
  const database = await openDatabase();
  const transaction = database.transaction(stores, "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(USER_STORE).put(userRecord(reconciled), USER_KEY);
  if (!sameConnection) {
    transaction.objectStore(WORKOUT_STORE).clear();
    transaction.objectStore(META_STORE).clear();
  }
  await done;
  database.close();
}

async function clear(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([USER_STORE, WORKOUT_STORE, META_STORE], "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(USER_STORE).clear();
  transaction.objectStore(WORKOUT_STORE).clear();
  transaction.objectStore(META_STORE).clear();
  await done;
  database.close();
}

export const indexedDbLocalStore: LocalStore = {
  loadUser,
  listWorkouts,
  synchronizationState,
  applySynchronizationBatch,
  reconcileUser,
  clear,
};
