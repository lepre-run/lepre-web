import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders an article by default and supports another semantic surface", () => {
    const { rerender } = render(<Card aria-label="Workout">Summary</Card>);
    expect(screen.getByRole("article", { name: "Workout" })).toHaveTextContent("Summary");

    rerender(
      <Card as="section" tone="warning" className="notice" aria-label="Warning">
        Check connection
      </Card>,
    );
    expect(screen.getByRole("region", { name: "Warning" })).toHaveClass(
      "card",
      "card--warning",
      "notice",
    );
  });
});
