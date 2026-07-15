import { type Workout, applySync, syncState } from "./data/workouts";

export const API_BASE_URL = "https://api.lepre.run/v1";

export async function hasSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/session`, { credentials: "include" });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error("Could not check the Lepre session");
  return true;
}

export async function synchronize(): Promise<Workout[]> {
  const state = await syncState();
  const query = new URLSearchParams({
    after: state.after.toString(),
    cursor: state.cursor.toString(),
  });
  const response = await fetch(`${API_BASE_URL}/workouts?${query}`, { credentials: "include" });
  if (response.status === 401) throw new Error("Your Lepre session expired");
  if (!response.ok) throw new Error("Could not synchronize workouts with Strava");
  return applySync(await response.json());
}

export async function disconnect(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/disconnect`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Could not disconnect Strava");
}
