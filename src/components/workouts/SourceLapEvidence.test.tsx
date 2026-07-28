import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import { i18n } from "../../i18n/i18n";
import { SourceLapEvidence } from "./SourceLapEvidence";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("SourceLapEvidence", () => {
  it("reveals a labeled evidence table on request", () => {
    render(
      <SourceLapEvidence
        sourceLaps={[
          {
            number: 1,
            name: "Warm up",
            role: "warmup",
            distance: 2_000 as DistanceMeters,
            movingTime: 660 as DurationSeconds,
            elapsedTime: 670 as DurationSeconds,
            averageHeartRate: { kind: "recorded", value: 135 },
            maximumHeartRate: { kind: "recorded", value: 148 },
          },
        ]}
        language="en"
        roleLabel={() => "Warm-up"}
        dataRole={(role) => role}
      />,
    );

    const summary = screen.getByText("Expand").closest("summary");
    if (!summary) throw new Error("expected evidence summary");
    fireEvent.click(summary);

    expect(within(summary).getByText("Collapse")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Source-lap evidence" });
    expect(within(table).getByRole("cell", { name: "Warm-up" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: /Warm up/ })).toBeInTheDocument();
  });
});
