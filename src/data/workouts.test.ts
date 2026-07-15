import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import { applySync, clearWorkouts, listWorkouts, syncState } from "./workouts";

describe("local workout storage", () => {
  afterEach(async () => {
    await clearWorkouts();
  });

  it("resolves an empty sync state before the first network request", async () => {
    await expect(syncState()).resolves.toEqual({ after: 0, cursor: 0 });
  });

  it("persists only the minimum workout record and completed sync state", async () => {
    await applySync({
      workouts: [{ id: 7, date: "2026-07-15T06:00:00Z", name: "Morning Run" }],
      deletedIds: [],
      syncedAt: 123,
      cursor: 123_456,
      snapshot: 123_456,
      nextPage: null,
    });

    await expect(listWorkouts()).resolves.toEqual([
      { id: 7, date: "2026-07-15T06:00:00Z", name: "Morning Run" },
    ]);
    await expect(syncState()).resolves.toEqual({ after: 123, cursor: 123_456 });
  });
});
