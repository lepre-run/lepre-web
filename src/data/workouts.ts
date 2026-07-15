export interface Workout {
  id: number;
  date: string;
  name: string;
}

export interface SyncState {
  after: number;
  cursor: number;
}

export interface SyncPayload {
  workouts: Workout[];
  deletedIds: number[];
  syncedAt: number;
  cursor: number;
  snapshot: number;
  nextPage: number | null;
}

const DATABASE_NAME = "lepre";
const DATABASE_VERSION = 1;
const WORKOUTS_STORE = "workouts";
const META_STORE = "meta";
const SYNC_KEY = "sync";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
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
      if (!database.objectStoreNames.contains(WORKOUTS_STORE)) {
        database.createObjectStore(WORKOUTS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open local workout database"));
  });
}

export async function listWorkouts(): Promise<Workout[]> {
  const database = await openDatabase();
  const transaction = database.transaction(WORKOUTS_STORE, "readonly");
  const done = transactionDone(transaction);
  const workouts = await requestResult(
    transaction.objectStore(WORKOUTS_STORE).getAll() as IDBRequest<Workout[]>,
  );
  await done;
  database.close();
  return workouts.sort((left, right) => right.date.localeCompare(left.date));
}

export async function syncState(): Promise<SyncState> {
  const database = await openDatabase();
  const transaction = database.transaction(META_STORE, "readonly");
  const done = transactionDone(transaction);
  const state = await requestResult(
    transaction.objectStore(META_STORE).get(SYNC_KEY) as IDBRequest<SyncState | undefined>,
  );
  await done;
  database.close();
  return state ?? { after: 0, cursor: 0 };
}

export async function applySync(payload: SyncPayload): Promise<Workout[]> {
  const database = await openDatabase();
  const transaction = database.transaction([WORKOUTS_STORE, META_STORE], "readwrite");
  const done = transactionDone(transaction);
  const workoutStore = transaction.objectStore(WORKOUTS_STORE);
  for (const workout of payload.workouts) {
    workoutStore.put({ id: workout.id, date: workout.date, name: workout.name });
  }
  for (const id of payload.deletedIds) {
    workoutStore.delete(id);
  }
  if (payload.nextPage === null) {
    transaction
      .objectStore(META_STORE)
      .put({ after: payload.syncedAt, cursor: payload.cursor } satisfies SyncState, SYNC_KEY);
  }
  await done;
  database.close();
  return listWorkouts();
}

export async function clearWorkouts(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([WORKOUTS_STORE, META_STORE], "readwrite");
  const done = transactionDone(transaction);
  transaction.objectStore(WORKOUTS_STORE).clear();
  transaction.objectStore(META_STORE).clear();
  await done;
  database.close();
}
