import { describe, expect, it } from "vitest";

import { createProviderConnection } from "./provider-connection";
import { createUser } from "./user";
import { createWorkout } from "./workout";

describe("domain entities", () => {
  it("creates the minimal connected user", () => {
    const connection = createProviderConnection({
      id: "connection-1",
      provider: "strava",
      externalAccountId: "athlete-1",
    });
    expect(connection.kind).toBe("created");
    if (connection.kind !== "created") throw new Error("expected connection");
    const user = createUser({
      id: "user-1",
      firstName: "Francesco",
      lastName: "Barbera",
      connection: connection.connection,
    });
    expect(user.kind).toBe("created");
  });

  it("creates a workout using seconds and meters", () => {
    const result = createWorkout({
      id: "strava:7",
      performedAt: "2026-07-15T06:00:00Z",
      name: "Morning Run",
      durationSeconds: 3_601,
      distanceMeters: 10_050.5,
    });
    expect(result).toEqual({
      kind: "created",
      workout: {
        id: "strava:7",
        performedAt: "2026-07-15T06:00:00.000Z",
        name: "Morning Run",
        durationSeconds: 3_601,
        distanceMeters: 10_050.5,
      },
    });
  });

  it("rejects incomplete or negative workout data", () => {
    expect(
      createWorkout({
        id: "",
        performedAt: "invalid",
        name: "",
        durationSeconds: -1,
        distanceMeters: -1,
      }),
    ).toEqual({ kind: "invalid-workout" });
  });
});
