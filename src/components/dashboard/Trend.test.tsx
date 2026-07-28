import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../i18n/i18n";
import { Trend } from "./DashboardCardParts";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("Trend", () => {
  it("describes a pace comparison", () => {
    render(<Trend trend={{ direction: "up", percent: 2.5 }} language="en" kind="pace" />);
    expect(screen.getByText("2.5% faster than prior 6 weeks")).toBeInTheDocument();
  });

  it("explains when a comparison is not available", () => {
    render(<Trend trend={null} language="en" kind="volume" />);
    expect(screen.getByText("First volume baseline")).toBeInTheDocument();
  });
});
