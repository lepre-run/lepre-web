import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home, STRAVA_START_URL } from "./Home";

vi.mock("../api", () => ({
  disconnect: vi.fn().mockResolvedValue(undefined),
  hasSession: vi.fn().mockResolvedValue(false),
  synchronize: vi.fn().mockResolvedValue([]),
}));

vi.mock("../data/workouts", () => ({
  clearWorkouts: vi.fn().mockResolvedValue(undefined),
  listWorkouts: vi.fn().mockResolvedValue([]),
}));

describe("Home", () => {
  it("offers Strava authorization when there is no Lepre session", async () => {
    render(<Home />);
    const link = await screen.findByRole("link", { name: /connect with strava/i });
    expect(link).toHaveAttribute("href", STRAVA_START_URL);
    expect(STRAVA_START_URL).toBe("https://api.lepre.run/v1/auth/strava/start");
  });
});
