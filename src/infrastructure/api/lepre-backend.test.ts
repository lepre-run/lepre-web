import { afterEach, describe, expect, it, vi } from "vitest";
import type { ContinuationToken, SynchronizationCheckpoint } from "../../domain/identity";
import { API_BASE_URL, createLepreBackend } from "./lepre-backend";

const userDto = {
  id: "user:1",
  firstName: "Ada",
  lastName: "Lovelace",
  connection: {
    id: "connection:1",
    provider: "strava",
    externalAccountId: "athlete:1",
  },
};

const workoutDto = {
  id: "workout:1",
  performedAt: "2026-07-27T06:00:00Z",
  name: "Morning run",
  description: "Easy",
  type: "workout",
  sport: "Run",
  durationSeconds: 300,
  elapsedDurationSeconds: 310,
  distanceMeters: 1_000,
  averageHeartRateBpm: 140,
  maxHeartRateBpm: 155,
  laps: [
    {
      index: 1,
      name: "Lap 1",
      movingDurationSeconds: 300,
      elapsedDurationSeconds: 310,
      distanceMeters: 1_000,
      averageHeartRateBpm: 140,
      maxHeartRateBpm: 155,
    },
  ],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("createLepreBackend", () => {
  it("reports a disconnected session through the injected HTTP client", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }));
    const backend = createLepreBackend(request);

    await expect(backend.session()).resolves.toEqual({ kind: "disconnected" });
    expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/session`, {
      credentials: "include",
    });
  });

  it("maps a connected session into domain values", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(userDto));
    const backend = createLepreBackend(request);

    await expect(backend.session()).resolves.toEqual({
      kind: "connected",
      user: userDto,
    });
  });

  it("uses the clean workouts endpoint for an initial synchronization", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }));
    const backend = createLepreBackend(request);

    await expect(
      backend.fetchWorkoutBatch({ kind: "initial" }, { kind: "first" }),
    ).resolves.toEqual({ kind: "reauthorization-required" });
    expect(request).toHaveBeenCalledWith(`${API_BASE_URL}/workouts`, {
      credentials: "include",
    });
  });

  it("sends a continuation token instead of the previous checkpoint", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 }));
    const backend = createLepreBackend(request);

    await backend.fetchWorkoutBatch(
      {
        kind: "incremental",
        checkpoint: "checkpoint:old" as SynchronizationCheckpoint,
      },
      { kind: "next", token: "continuation:next" as ContinuationToken },
    );

    expect(request).toHaveBeenCalledWith(
      `${API_BASE_URL}/workouts?continuation=continuation%3Anext`,
      { credentials: "include" },
    );
  });

  it("maps a successful synchronization batch into domain values", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        upserted: [workoutDto],
        removed: ["workout:removed"],
        continuation: { kind: "complete", checkpoint: "checkpoint:new" },
      }),
    );
    const backend = createLepreBackend(request);

    const result = await backend.fetchWorkoutBatch(
      {
        kind: "incremental",
        checkpoint: "checkpoint:old" as SynchronizationCheckpoint,
      },
      { kind: "first" },
    );

    expect(result).toMatchObject({
      kind: "received",
      batch: {
        removed: ["workout:removed"],
        continuation: { kind: "complete", checkpoint: "checkpoint:new" },
      },
    });
    if (result.kind !== "received") throw new Error("expected a synchronization batch");
    expect(result.batch.upserted[0]).toMatchObject({
      id: "workout:1",
      name: "Morning run",
      structure: { kind: "free-run" },
    });
  });

  it("reports malformed and unreachable workout responses as unavailable", async () => {
    const malformedRequest = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ upserted: "not-an-array" }));
    const unreachableRequest = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));

    await expect(
      createLepreBackend(malformedRequest).fetchWorkoutBatch(
        { kind: "initial" },
        { kind: "first" },
      ),
    ).resolves.toEqual({ kind: "unavailable" });
    await expect(
      createLepreBackend(unreachableRequest).fetchWorkoutBatch(
        { kind: "initial" },
        { kind: "first" },
      ),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("honors an HTTP-date Retry-After response", async () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-07-27T10:00:00Z");
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {},
        {
          status: 429,
          headers: { "Retry-After": "Mon, 27 Jul 2026 10:00:30 GMT" },
        },
      ),
    );
    const backend = createLepreBackend(request);

    await expect(
      backend.fetchWorkoutBatch({ kind: "initial" }, { kind: "first" }),
    ).resolves.toEqual({ kind: "rate-limited", retryAfterSeconds: 30 });
  });

  it("uses the response body for a queued retry delay", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ retryAfterSeconds: 4 }, { status: 202 }));

    await expect(
      createLepreBackend(request).fetchWorkoutBatch({ kind: "initial" }, { kind: "first" }),
    ).resolves.toEqual({ kind: "queued", retryAfterSeconds: 4 });
  });

  it("posts a disconnect request and absorbs provider failures", async () => {
    const successfulRequest = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const failingRequest = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));

    await expect(createLepreBackend(successfulRequest).disconnect()).resolves.toBe("disconnected");
    await expect(createLepreBackend(failingRequest).disconnect()).resolves.toBe("unavailable");
    expect(successfulRequest).toHaveBeenCalledWith(`${API_BASE_URL}/disconnect`, {
      method: "POST",
      credentials: "include",
    });
  });
});
