import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Connected } from "./Connected";

const synchronizeWorkouts = vi.hoisted(() => vi.fn());

const workout = vi.hoisted(() => ({
  id: "strava:7",
  performedAt: "2026-07-15T06:00:00.000Z",
  name: "Morning Run",
  description: "Track session",
  type: "race",
  sport: "Run",
  durationSeconds: 2_400,
  elapsedDurationSeconds: 2_450,
  distanceMeters: 8_000,
  averageHeartRateBpm: 148.2,
  maxHeartRateBpm: 176,
  laps: [
    {
      index: 1,
      name: "Warm up",
      movingDurationSeconds: 2_400,
      elapsedDurationSeconds: 2_450,
      distanceMeters: 8_000,
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
    synchronizeWorkouts,
  },
}));

describe("Connected", () => {
  beforeEach(() => {
    synchronizeWorkouts.mockImplementation(async (afterBatch: () => Promise<void>) => {
      await afterBatch();
      return { kind: "synchronized" };
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders a race with its own card and visible splits", async () => {
    render(<Connected />);
    const workoutButton = await screen.findByRole("button", {
      name: /Open Morning Run, Race/,
    });
    const overview = screen.getByRole("region", { name: "Weekly training overview" });
    const dashboard = screen.getByRole("region", { name: "Your running condition" });
    expect(dashboard).toHaveTextContent("Easy pace");
    expect(dashboard).toHaveTextContent("Reference intervals");
    expect(dashboard).toHaveTextContent("Training mix");
    expect(overview).toHaveTextContent("1 run");
    expect(overview).toHaveTextContent("8.00 km");
    expect(overview).toHaveTextContent("40m");
    expect(overview.querySelectorAll(".weekly-cadence > li")).toHaveLength(7);
    expect(overview.querySelectorAll('.weekly-cadence > li[data-active="true"]')).toHaveLength(1);
    expect(overview.querySelector(".weekly-day__heading")).toHaveTextContent("Wed");
    expect(workoutButton).toHaveTextContent("5:00 /km");
    expect(screen.queryByRole("heading", { name: "Morning Run" })).not.toBeInTheDocument();
    const selectedWeek = workoutButton.closest(".weekly-grid__week");

    fireEvent.click(workoutButton);

    const detail = screen.getByRole("region", { name: "Workout details" });
    expect(selectedWeek).toContainElement(detail);
    const cardHeading = screen.getByRole("heading", { name: "Morning Run" });
    const card = cardHeading.closest("article");
    expect(card).toHaveTextContent("8.00 km");
    expect(card).toHaveTextContent("40:00");
    expect(screen.getByText(/1 stored locally/i)).toBeInTheDocument();
    expect(card).toHaveClass("workout-card--race");
    expect(screen.getByText("Track session")).toBeInTheDocument();
    expect(screen.getAllByText("Race")).toHaveLength(2);
    expect(screen.queryByText("Free run")).not.toBeInTheDocument();
    expect(screen.queryByTestId("training-rhythm")).not.toBeInTheDocument();
    expect(card).toHaveAttribute("data-workout-type", "race");
    expect(card).toHaveTextContent("148 bpm");
    expect(screen.getAllByText("Warm up")).toHaveLength(2);
    expect(screen.getAllByTestId("race-split-row")).toHaveLength(1);
    expect(screen.getAllByText("Source-lap evidence")).toHaveLength(2);
    expect(card?.querySelector(".race-badge")).toBeNull();
  });

  it("shows a retryable pause when Strava reaches its request limit", async () => {
    synchronizeWorkouts.mockResolvedValue({ kind: "rate-limited", retryAfterSeconds: 900 });

    render(<Connected />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Import paused and will resume automatically in about 15 minutes",
    );
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
  });

  it("does not show a layout-shifting notice while synchronization waits its turn", async () => {
    synchronizeWorkouts.mockResolvedValue({ kind: "queued", retryAfterSeconds: 60 });

    render(<Connected />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Waiting for a fair synchronization turn…",
    );
    expect(screen.queryByText("Updates paused")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
  });

  it("offers an LLM-ready JSON download for the stored date range", async () => {
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:workouts");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<Connected />);

    fireEvent.click(await screen.findByRole("button", { name: "Download" }));

    expect(screen.getByRole("dialog", { name: "Download workout history" })).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toHaveValue("2026-07-15");
    expect(screen.getByLabelText("To")).toHaveValue("2026-07-15");
    expect(screen.getByText("1 workout will be included")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:workouts");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
