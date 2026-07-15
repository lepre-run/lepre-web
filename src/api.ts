import { type SyncPayload, type Workout, applySync, syncState } from "./data/workouts";

export const API_BASE_URL = "https://api.lepre.run/v1";

export async function hasSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/session`, { credentials: "include" });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error("Could not check the Lepre session");
  return true;
}

export async function synchronize(onProgress?: (workouts: Workout[]) => void): Promise<Workout[]> {
  const state = await syncState();
  let page = 1;
  let snapshot: number | undefined;

  while (true) {
    const query = new URLSearchParams({
      after: state.after.toString(),
      cursor: state.cursor.toString(),
      page: page.toString(),
    });
    if (snapshot !== undefined) query.set("snapshot", snapshot.toString());

    const response = await fetch(`${API_BASE_URL}/workouts?${query}`, {
      credentials: "include",
    });
    if (response.status === 401) throw new Error("Your Lepre session expired");
    if (!response.ok) throw new Error("Could not synchronize workouts with Strava");

    const payload = (await response.json()) as SyncPayload;
    const workouts = await applySync(payload);
    onProgress?.(workouts);
    if (payload.nextPage === null) return workouts;

    page = payload.nextPage;
    snapshot = payload.snapshot;
  }
}

export async function disconnect(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/disconnect`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Could not disconnect Strava");
}
