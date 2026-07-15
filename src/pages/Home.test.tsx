import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home, STRAVA_START_URL } from "./Home";

vi.mock("../composition/application", () => ({
  application: {
    disconnectProvider: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    loadUser: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    listWorkouts: vi.fn().mockResolvedValue({ kind: "loaded", workouts: [] }),
    synchronizeWorkouts: vi.fn().mockResolvedValue({ kind: "synchronized" }),
  },
}));

describe("Home", () => {
  it("offers Strava authorization when there is no Lepre session", async () => {
    render(<Home />);
    const link = await screen.findByRole("link", { name: /connect with strava/i });
    expect(link).toHaveAttribute("href", STRAVA_START_URL);
    expect(STRAVA_START_URL).toBe("https://api.lepre.run/v1/auth/strava/start");
  });
});
