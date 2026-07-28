import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardCard } from "./DashboardCardParts";

describe("DashboardCard", () => {
  it("composes a semantic card with caller-owned content", () => {
    render(
      <DashboardCard kind="pace" title="Easy pace" badge={<span>Reliable</span>}>
        <p>5:30 /km</p>
      </DashboardCard>,
    );
    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("Easy pace");
    expect(card).toHaveTextContent("Reliable");
    expect(card).toHaveTextContent("5:30 /km");
  });
});
