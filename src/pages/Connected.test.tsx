import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Connected } from "./Connected";

const workout = vi.hoisted(() => ({
  id: "strava:7",
  performedAt: "2026-07-15T06:00:00.000Z",
  name: "Morning Run",
  description: "Track session",
  sport: "Run",
  durationSeconds: 2_400,
  elapsedDurationSeconds: 2_450,
  distanceMeters: 8_000,
  laps: [
    {
      index: 1,
      name: "Warm up",
      movingDurationSeconds: 2_400,
      elapsedDurationSeconds: 2_450,
      distanceMeters: 8_000,
    },
  ],
  classification: { kind: "free-run", label: "Free run", coreLapIndexes: [] },
}));

vi.mock("../composition/application", () => ({
  application: {
    disconnectProvider: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    loadUser: vi.fn().mockResolvedValue({
      kind: "connected",
      user: {
        id: "user-1",
        firstName: "Francesco",
        lastName: "Barbera",
        connection: { id: "connection-1", provider: "strava", externalAccountId: "athlete-1" },
      },
    }),
    listWorkouts: vi.fn().mockResolvedValue({ kind: "loaded", workouts: [workout] }),
    synchronizeWorkouts: vi.fn().mockImplementation(async (afterBatch: () => Promise<void>) => {
      await afterBatch();
      return { kind: "synchronized" };
    }),
  },
}));

describe("Connected", () => {
  it("renders the complete local workout entity", async () => {
    render(<Connected />);
    const cardHeading = await screen.findByRole("heading", { name: "Morning Run" });
    const card = cardHeading.closest("article");
    expect(card).toHaveTextContent("8.00 km");
    expect(card).toHaveTextContent("40:00");
    expect(screen.getByText(/1 stored locally/i)).toBeInTheDocument();
    expect(screen.getByText("Free run")).toBeInTheDocument();
    expect(screen.getByText("Track session")).toBeInTheDocument();
  });
});
