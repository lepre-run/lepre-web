import type {
  RemoteSession,
  SynchronizationContinuationRequest,
  SynchronizationState,
} from "../../application/model";
import type { BackendGateway, WorkoutSourceResult } from "../../application/ports";
import { type BatchDto, batchFromDto, type UserDto, userFromDto } from "./lepre-backend-dto";
import { retryAfterSeconds } from "./retry-after";

export const API_BASE_URL = "https://api.lepre.run/v1";
export const STRAVA_START_URL = `${API_BASE_URL}/auth/strava/start`;

async function session(request: typeof fetch): Promise<RemoteSession> {
  const response = await request(`${API_BASE_URL}/session`, { credentials: "include" });
  if (response.status === 401) return { kind: "disconnected" };
  if (!response.ok) throw new Error("could not load backend session");
  return { kind: "connected", user: userFromDto((await response.json()) as UserDto) };
}

async function fetchWorkoutBatch(
  request: typeof fetch,
  state: SynchronizationState,
  continuation: SynchronizationContinuationRequest,
): Promise<WorkoutSourceResult> {
  const query = new URLSearchParams();
  if (continuation.kind === "next") {
    query.set("continuation", continuation.token);
  } else if (state.kind === "incremental") {
    query.set("checkpoint", state.checkpoint);
  }
  const serializedQuery = query.toString();
  const url = `${API_BASE_URL}/workouts${serializedQuery ? `?${serializedQuery}` : ""}`;
  let response: Response;
  try {
    response = await request(url, { credentials: "include" });
  } catch {
    return { kind: "unavailable" };
  }
  if (response.status === 401) return { kind: "reauthorization-required" };
  if (response.status === 202) {
    return { kind: "queued", retryAfterSeconds: await retryAfterSeconds(response, 2) };
  }
  if (response.status === 429) {
    return {
      kind: "rate-limited",
      retryAfterSeconds: await retryAfterSeconds(response, 15 * 60),
    };
  }
  if (!response.ok) return { kind: "unavailable" };
  try {
    return { kind: "received", batch: batchFromDto((await response.json()) as BatchDto) };
  } catch {
    return { kind: "unavailable" };
  }
}

async function disconnect(request: typeof fetch): Promise<"disconnected" | "unavailable"> {
  try {
    const response = await request(`${API_BASE_URL}/disconnect`, {
      method: "POST",
      credentials: "include",
    });
    return response.ok ? "disconnected" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export function createLepreBackend(request: typeof fetch): BackendGateway {
  return {
    session: () => session(request),
    fetchWorkoutBatch: (state, continuation) => fetchWorkoutBatch(request, state, continuation),
    disconnect: () => disconnect(request),
  };
}

export const lepreBackend = createLepreBackend(fetch);
