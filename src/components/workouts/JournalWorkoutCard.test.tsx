import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { DistanceMeters, DurationSeconds, Instant } from "../../domain/identity";
import { i18n } from "../../i18n/i18n";
import { JournalWorkoutCard } from "./JournalWorkoutCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("JournalWorkoutCard", () => {
  it("composes the shared frame without owning feature content", () => {
    render(
      <JournalWorkoutCard
        kind="free-run"
        category="workout"
        badge="Free run"
        performedAt={"2026-07-20T06:00:00Z" as Instant}
        language="en"
        shapeSeed={42}
        compact
        summary={{
          title: "Sunday run",
          description: null,
          privateDescription: null,
          distance: 10_000 as DistanceMeters,
          time: 3_000 as DurationSeconds,
          elevation: { kind: "unavailable" },
          averageHeartRate: { kind: "recorded", value: 144 },
        }}
      >
        <p>Feature-owned detail</p>
      </JournalWorkoutCard>,
    );
    const card = screen.getByRole("article");
    expect(card).toHaveClass("workout-card--free-run", "workout-card--compact");
    expect(card).toHaveTextContent("Free run");
    expect(card).toHaveTextContent("Sunday run");
    expect(card).toHaveTextContent("Feature-owned detail");
  });
});
