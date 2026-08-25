import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { weeklyVolumeInsight } from "../../../test/dashboard-builders";
import { VolumeCard } from "../VolumeCard/VolumeCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("VolumeCard", () => {
  it("summarizes weekly volume and comparison", () => {
    render(<VolumeCard insight={weeklyVolumeInsight} language="en" windowDays={42} />);
    expect(screen.getByRole("article")).toHaveTextContent("20.0km");
    expect(screen.getByText("10% less distance")).toBeInTheDocument();
    expect(screen.getByText("6-week average")).toBeInTheDocument();
  });
});
