import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { application } from "../composition/application";
import type { User } from "../domain/user";
import { STRAVA_START_URL } from "../infrastructure/api/lepre-backend";
import { mockUser } from "../mocks/fixtures";
import { buildWeeklyWorkout } from "../test/weekly-builders";
import { Home } from "./Home";

const LANGUAGE_STORAGE_KEY = "lepre.language";

vi.mock("../composition/application", () => ({
  application: {
    disconnectProvider: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    loadUser: vi.fn().mockResolvedValue({ kind: "disconnected" }),
    listWorkouts: vi.fn().mockResolvedValue({ kind: "loaded", workouts: [] }),
    synchronizeWorkouts: vi.fn().mockResolvedValue({ kind: "synchronized" }),
  },
}));

const user = mockUser as unknown as User;

beforeEach(async () => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage("en");
  vi.mocked(application.disconnectProvider).mockReset().mockResolvedValue({ kind: "disconnected" });
  vi.mocked(application.loadUser).mockReset().mockResolvedValue({ kind: "disconnected" });
  vi.mocked(application.listWorkouts)
    .mockReset()
    .mockResolvedValue({ kind: "loaded", workouts: [] });
  vi.mocked(application.synchronizeWorkouts)
    .mockReset()
    .mockResolvedValue({ kind: "synchronized" });
});

afterEach(async () => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage("en");
});

describe("Home", () => {
  it("offers Strava authorization when there is no Lepre session", async () => {
    render(<Home />);
    const links = await screen.findAllByRole("link", { name: /connect with strava/i });
    expect(links[0]).toHaveAttribute("href", STRAVA_START_URL);
    expect(STRAVA_START_URL).toBe("https://api.lepre.run/v1/auth/strava/start");
  });

  it("updates automatically instead of presenting a manual sync action", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });

    render(<Home />);

    expect(await screen.findByText("Up to date")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
    expect(application.synchronizeWorkouts).toHaveBeenCalledOnce();
  });

  it("shows that older history will be imported gradually without fetching it immediately", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });
    vi.mocked(application.synchronizeWorkouts).mockResolvedValue({
      kind: "backfill-paused",
      retryAfterSeconds: 900,
    });

    render(<Home />);

    expect(
      await screen.findByText(
        "Your recent reports are ready. Older runs will be imported gradually.",
      ),
    ).toBeInTheDocument();
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

    expect(await screen.findAllByRole("link", { name: "Connect with Strava" })).toHaveLength(2);
    expect(application.disconnectProvider).toHaveBeenCalledOnce();
  });

  it("lets the runner override and persist the interface language", async () => {
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });

    render(<Home />);
    await screen.findByText("Up to date");
    const synchronizationCalls = vi.mocked(application.synchronizeWorkouts).mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Italiano" }));

    expect(await screen.findByText("Tutto aggiornato")).toBeInTheDocument();
    expect(screen.getByText("Lingua")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italiano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
    expect(document.documentElement).toHaveAttribute("lang", "it");
    expect(application.synchronizeWorkouts).toHaveBeenCalledTimes(synchronizationCalls);
  });
});

describe("Home workout arrivals", () => {
  it("animates only workouts that arrive after the initial local load", async () => {
    const stored = buildWeeklyWorkout("workout:stored", "2026-07-20T06:00:00Z", "Stored run");
    const arrived = buildWeeklyWorkout("workout:arrived", "2026-07-21T06:00:00Z", "Arrived run");
    vi.mocked(application.loadUser).mockResolvedValue({ kind: "connected", user });
    vi.mocked(application.listWorkouts)
      .mockResolvedValueOnce({ kind: "loaded", workouts: [stored] })
      .mockResolvedValue({ kind: "loaded", workouts: [arrived, stored] });
    vi.mocked(application.synchronizeWorkouts).mockImplementation(async (refreshWorkouts) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await refreshWorkouts();
      return { kind: "synchronized" };
    });

    render(<Home />);
    await screen.findByText("Up to date");

    expect(screen.getByRole("button", { name: /Open Arrived run/ })).toHaveAttribute(
      "data-new",
      "true",
    );
    expect(screen.getByRole("button", { name: /Open Stored run/ })).not.toHaveAttribute("data-new");
  });
});
