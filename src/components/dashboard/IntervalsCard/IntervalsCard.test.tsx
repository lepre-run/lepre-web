import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { intervalBenchmarkInsight } from "../../../test/dashboard-builders";
import { IntervalsCard } from "../IntervalsCard/IntervalsCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("IntervalsCard", () => {
  it("shows the selected protocol, alternatives, and trend", () => {
    render(<IntervalsCard insight={intervalBenchmarkInsight} language="en" />);
    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("5 × 1 km");
    expect(card).toHaveTextContent("3 comparable sessions");
    expect(card).toHaveTextContent("Stable across recent matched sessions");
  });

  it("explains the evidence required for a benchmark", () => {
    render(<IntervalsCard insight={null} language="en" />);
    expect(screen.getByText(/repeated work laps/i)).toBeInTheDocument();
  });
});
