import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../i18n/i18n";
import { buildWorkout } from "../../test/builders";
import { ConditionDashboard } from "./ConditionDashboard";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("ConditionDashboard", () => {
  it("stays absent without workouts", () => {
    const { container } = render(<ConditionDashboard workouts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("assembles the condition cards from workout history", () => {
    render(<ConditionDashboard workouts={[buildWorkout()]} />);
    const dashboard = screen.getByRole("region", { name: "Your running condition" });
    expect(within(dashboard).getByRole("heading", { name: "Easy pace" })).toBeInTheDocument();
    expect(within(dashboard).getByRole("heading", { name: "Running volume" })).toBeInTheDocument();
    expect(within(dashboard).getByRole("heading", { name: "Training mix" })).toBeInTheDocument();
  });
});
