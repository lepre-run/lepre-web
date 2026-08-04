import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import { i18n } from "../../../i18n/i18n";
import { WorkoutCardSummary } from "../WorkoutCardSummary/WorkoutCardSummary";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("WorkoutCardSummary", () => {
  it("shows available measurements and explains private notes", () => {
    render(
      <WorkoutCardSummary
        title="Evening run"
        description="Relaxed progression."
        privateDescription="Left calf felt settled."
        distance={8_000 as DistanceMeters}
        time={2_400 as DurationSeconds}
        elevation={{ kind: "recorded", value: 76 }}
        averageHeartRate={{ kind: "recorded", value: 147 }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Evening run" })).toBeInTheDocument();
    expect(screen.getByText("8.00 km")).toBeInTheDocument();
    expect(screen.getByText("Private note")).toBeInTheDocument();
    expect(screen.getByText("Left calf felt settled.")).toBeInTheDocument();
  });

  it("uses a clear placeholder for unavailable measurements", () => {
    render(
      <WorkoutCardSummary
        title="Imported run"
        description={null}
        privateDescription={null}
        distance={5_000 as DistanceMeters}
        time={1_800 as DurationSeconds}
        elevation={{ kind: "unavailable" }}
        averageHeartRate={{ kind: "unavailable" }}
      />,
    );
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("Private note")).not.toBeInTheDocument();
  });
});
