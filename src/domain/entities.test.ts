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
      description: "Easy morning",
      type: "race",
      sport: "Run",
      durationSeconds: 3_601,
      elapsedDurationSeconds: 3_700,
      distanceMeters: 10_050.5,
      averageHeartRateBpm: 148.2,
      maxHeartRateBpm: 176,
      laps: [
        {
          index: 1,
          name: "Lap 1",
          movingDurationSeconds: 3_601,
          elapsedDurationSeconds: 3_700,
          distanceMeters: 10_050.5,
          averageHeartRateBpm: 148.2,
          maxHeartRateBpm: 176,
        },
      ],
    });
    expect(result).toEqual({
      kind: "created",
      workout: {
        id: "strava:7",
        performedAt: "2026-07-15T06:00:00Z",
        name: "Morning Run",
        description: "Easy morning",
        type: "race",
        sport: "Run",
        durationSeconds: 3_601,
        elapsedDurationSeconds: 3_700,
        distanceMeters: 10_050.5,
        averageHeartRateBpm: 148.2,
        maxHeartRateBpm: 176,
        laps: [
          {
            index: 1,
            name: "Lap 1",
            movingDurationSeconds: 3_601,
            elapsedDurationSeconds: 3_700,
            distanceMeters: 10_050.5,
            averageHeartRateBpm: 148.2,
            maxHeartRateBpm: 176,
          },
        ],
        structure: {
          schemaVersion: 1,
          classifierVersion: 2,
          source: "inferred_from_strava_laps",
          confidence: 1,
          kind: "free-run",
          coreLapIndexes: [],
          lapRoles: {
            warmup: [],
            work: [],
            recovery: [],
            cooldown: [],
            main: [1],
            unknown: [],
          },
        },
      },
    });
  });

  it("rejects incomplete or negative workout data", () => {
    expect(
      createWorkout({
        id: "",
        performedAt: "invalid",
        name: "",
        description: "",
        type: "training",
        sport: "Ride",
        durationSeconds: -1,
        elapsedDurationSeconds: -1,
        distanceMeters: -1,
        laps: [],
      }),
    ).toEqual({ kind: "invalid-workout" });
  });
});
