import type {
  RemoteSession,
  SynchronizationBatch,
  SynchronizationContinuationRequest,
  SynchronizationState,
} from "../../application/model";
import type { BackendGateway, WorkoutSourceResult } from "../../application/ports";
import type {
  ContinuationToken,
  SynchronizationCheckpoint,
  WorkoutId,
} from "../../domain/identity";
import { createProviderConnection } from "../../domain/provider-connection";
import { createUser, type User } from "../../domain/user";
import { createWorkout, type Workout } from "../../domain/workout";

export const API_BASE_URL = "https://api.lepre.run/v1";
export const STRAVA_START_URL = `${API_BASE_URL}/auth/strava/start`;

type ConnectionDto = Readonly<{
  id: string;
  provider: string;
  externalAccountId: string;
}>;

type UserDto = Readonly<{
  id: string;
  firstName: string;
  lastName: string;
  connection: ConnectionDto;
}>;

type WorkoutDto = Readonly<{
  id: string;
  performedAt: string;
  name: string;
  description: string;
  type: string;
  sport: string;
  durationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  laps: ReadonlyArray<{
    index: number;
    name: string;
    movingDurationSeconds: number;
    elapsedDurationSeconds: number;
    distanceMeters: number;
    averageHeartRateBpm: number | null;
    maxHeartRateBpm: number | null;
  }>;
}>;

type BatchDto = Readonly<{
  upserted: ReadonlyArray<WorkoutDto>;
  removed: ReadonlyArray<string>;
  continuation:
    | Readonly<{ kind: "more"; token: string }>
    | Readonly<{ kind: "complete"; checkpoint: string }>;
}>;

type RateLimitDto = Readonly<{
  retryAfterSeconds?: number;
}>;

function userFromDto(dto: UserDto): User {
  const connection = createProviderConnection(dto.connection);
  if (connection.kind !== "created") throw new Error("invalid provider connection response");
  const user = createUser({ ...dto, connection: connection.connection });
  if (user.kind !== "created") throw new Error("invalid user response");
  return user.user;
}

function workoutFromDto(dto: WorkoutDto): Workout {
  const result = createWorkout(dto);
  if (result.kind !== "created") throw new Error("invalid workout response");
  return result.workout;
}

function batchFromDto(dto: BatchDto): SynchronizationBatch {
  return {
    upserted: dto.upserted.map(workoutFromDto),
    removed: dto.removed.map((id) => id as WorkoutId),
    continuation:
      dto.continuation.kind === "more"
        ? { kind: "more", token: dto.continuation.token as ContinuationToken }
        : {
            kind: "complete",
            checkpoint: dto.continuation.checkpoint as SynchronizationCheckpoint,
          },
  };
}

async function session(): Promise<RemoteSession> {
  const response = await fetch(`${API_BASE_URL}/session`, { credentials: "include" });
  if (response.status === 401) return { kind: "disconnected" };
  if (!response.ok) throw new Error("could not load backend session");
  return { kind: "connected", user: userFromDto((await response.json()) as UserDto) };
}

async function fetchWorkoutBatch(
  state: SynchronizationState,
  continuation: SynchronizationContinuationRequest,
): Promise<WorkoutSourceResult> {
  const query = new URLSearchParams();
  if (continuation.kind === "next") {
    query.set("continuation", continuation.token);
  } else if (state.kind === "incremental") {
    query.set("checkpoint", state.checkpoint);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/workouts?${query}`, { credentials: "include" });
  } catch {
    return { kind: "unavailable" };
  }
  if (response.status === 401) return { kind: "reauthorization-required" };
  if (response.status === 429) {
    const headerSeconds = Number(response.headers.get("Retry-After"));
    let bodySeconds = Number.NaN;
    try {
      bodySeconds = Number(((await response.json()) as RateLimitDto).retryAfterSeconds);
    } catch {
      // The Retry-After header remains the fallback for a malformed error body.
    }
    const retryAfterSeconds = Number.isFinite(bodySeconds)
      ? bodySeconds
      : Number.isFinite(headerSeconds) && headerSeconds > 0
        ? headerSeconds
        : 15 * 60;
    return { kind: "rate-limited", retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  if (!response.ok) return { kind: "unavailable" };
  try {
    return { kind: "received", batch: batchFromDto((await response.json()) as BatchDto) };
  } catch {
    return { kind: "unavailable" };
  }
}

async function disconnect(): Promise<"disconnected" | "unavailable"> {
  try {
    const response = await fetch(`${API_BASE_URL}/disconnect`, {
      method: "POST",
      credentials: "include",
    });
    return response.ok ? "disconnected" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export const lepreBackend: BackendGateway = { session, fetchWorkoutBatch, disconnect };
