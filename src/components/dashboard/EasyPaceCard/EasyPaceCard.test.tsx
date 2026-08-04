import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { easyPaceInsight } from "../../../test/dashboard-builders";
import { EasyPaceCard } from "../EasyPaceCard/EasyPaceCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("EasyPaceCard", () => {
  it("shows the estimate and supporting evidence", () => {
    render(<EasyPaceCard insight={easyPaceInsight} language="en" />);
    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("5:30");
    expect(card).toHaveTextContent("141 bpm median");
    expect(card).toHaveTextContent("4 supporting runs");
  });

  it("explains how to establish a missing baseline", () => {
    render(<EasyPaceCard insight={null} language="en" />);
    expect(screen.getByText("Not enough data yet")).toBeInTheDocument();
    expect(screen.getByText(/free run over 20 minutes/i)).toBeInTheDocument();
  });
});
