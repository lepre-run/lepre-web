import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Connected } from "./Connected";

const workout = vi.hoisted(() => ({
  id: "strava:7",
  performedAt: "2026-07-15T06:00:00.000Z",
  name: "Morning Run",
  durationSeconds: 2_400,
  distanceMeters: 8_000,
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
    expect(await screen.findByRole("listitem")).toHaveTextContent("Morning Run");
    expect(screen.getByRole("listitem")).toHaveTextContent("8.00 km");
    expect(screen.getByRole("listitem")).toHaveTextContent("40:00");
    expect(screen.getByText(/1 workouts stored/i)).toBeInTheDocument();
  });
});
