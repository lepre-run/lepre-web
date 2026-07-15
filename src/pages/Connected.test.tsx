import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Connected } from "./Connected";

vi.mock("../api", () => ({
  disconnect: vi.fn().mockResolvedValue(undefined),
  hasSession: vi.fn().mockResolvedValue(true),
  synchronize: vi
    .fn()
    .mockResolvedValue([{ id: 7, date: "2026-07-15T06:00:00Z", name: "Morning Run" }]),
}));

vi.mock("../data/workouts", () => ({
  clearWorkouts: vi.fn().mockResolvedValue(undefined),
  listWorkouts: vi.fn().mockResolvedValue([]),
}));

describe("Connected", () => {
  it("imports and renders the minimum workout record", async () => {
    render(<Connected />);
    expect(await screen.findByRole("listitem")).toHaveTextContent("Morning Run");
    expect(screen.getByText(/1 workouts stored/i)).toBeInTheDocument();
  });
});
