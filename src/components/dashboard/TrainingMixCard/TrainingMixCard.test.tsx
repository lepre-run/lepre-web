import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { trainingMixInsight } from "../../../test/dashboard-builders";
import { TrainingMixCard } from "../TrainingMixCard/TrainingMixCard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("TrainingMixCard", () => {
  it("makes the distribution available as text and an accessible graphic", () => {
    render(<TrainingMixCard mix={trainingMixInsight} />);
    expect(
      screen.getByRole("img", { name: "8 low, 1 moderate and 1 high-intensity sessions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("100% classified")).toBeInTheDocument();
  });
});
