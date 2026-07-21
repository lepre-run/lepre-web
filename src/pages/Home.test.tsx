import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { application } from "../composition/application";
import type { User } from "../domain/user";
import { mockUser } from "../mocks/fixtures";
import { Home, STRAVA_START_URL } from "./Home";

vi.mock("../composition/application", () => ({
  application: {
    disconnectProvider: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    loadUser: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    listWorkouts: vi.fn().mockResolvedValue({ kind: "loaded", workouts: [] }),
    synchronizeWorkouts: vi.fn().mockResolvedValue({ kind: "synchronized" }),
  },
}));

const user = mockUser as unknown as User;

beforeEach(() => {
  vi.mocked(application.disconnectProvider).mockReset().mockResolvedValue({ kind: "disconnected" });
  vi.mocked(application.loadUser).mockReset().mockResolvedValue({ kind: "disconnected" });
  vi.mocked(application.listWorkouts)
    .mockReset()
    .mockResolvedValue({ kind: "loaded", workouts: [] });
  vi.mocked(application.synchronizeWorkouts)
    .mockReset()
    .mockResolvedValue({ kind: "synchronized" });
});

describe("Home", () => {
  it("offers Strava authorization when there is no Lepre session", async () => {
    render(<Home />);
    const link = await screen.findByRole("link", { name: /connect with strava/i });
    expect(link).toHaveAttribute("href", STRAVA_START_URL);
    expect(STRAVA_START_URL).toBe("https://api.lepre.run/v1/auth/strava/start");
  });

  it("updates automatically instead of presenting a manual sync action", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });

    render(<Home />);

    expect(await screen.findByText("Up to date")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
    expect(application.synchronizeWorkouts).toHaveBeenCalledOnce();
  });

  it("offers a manual retry only when an automatic update fails", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });
    vi.mocked(application.synchronizeWorkouts).mockResolvedValue({
      kind: "provider-unavailable",
    });

    render(<Home />);

    const retry = await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(retry);

    await waitFor(() => expect(application.synchronizeWorkouts).toHaveBeenCalledTimes(2));
  });

  it("provides a direct reconnect action when Strava authorization expires", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({
      kind: "reauthorization-required",
      user,
    });

    render(<Home />);

    expect(await screen.findByRole("link", { name: "Reconnect Strava" })).toHaveAttribute(
      "href",
      STRAVA_START_URL,
    );
  });

  it("confirms the local data removal before disconnecting Strava", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });

    render(<Home />);
    await screen.findByText("Up to date");

    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    fireEvent.click(screen.getByRole("button", { name: "Disconnect Strava" }));

    expect(application.disconnectProvider).not.toHaveBeenCalled();
    expect(screen.getByText(/remove every workout downloaded to this device/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect and remove data" }));

    expect(await screen.findByRole("link", { name: "Connect with Strava" })).toBeInTheDocument();
    expect(application.disconnectProvider).toHaveBeenCalledOnce();
  });
});
