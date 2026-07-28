import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../i18n/i18n";
import { intervalBenchmarkInsight } from "../../test/dashboard-builders";
import { IntervalAlternatives } from "./IntervalAlternatives";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("IntervalAlternatives", () => {
  it("stays absent without alternatives", () => {
    const { container } = render(<IntervalAlternatives formats={[]} language="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reveals comparable protocols supplied by the dashboard", () => {
    render(<IntervalAlternatives formats={intervalBenchmarkInsight.alternatives} language="en" />);
    expect(screen.getByText("1 other matched format")).toBeInTheDocument();
    expect(screen.getByText(/8 × 400 m/)).toBeInTheDocument();
  });
});
