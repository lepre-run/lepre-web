import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { DisconnectedHome } from "./PublicHome";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("DisconnectedHome", () => {
  it("explains the product and offers Strava authorization", () => {
    render(<DisconnectedHome />);
    expect(
      screen.getByRole("heading", { name: "Understand the training behind your runs." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Strava records the activity. Lepre explains the workout."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "6 × 1 km · 400 m recovery" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "From running history to training insight." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your running history belongs to you." }),
    ).toBeInTheDocument();
    const connectLinks = screen.getAllByRole("link", { name: "Connect with Strava" });
    expect(connectLinks[0]).toHaveAttribute("href", "https://api.lepre.run/v1/auth/strava/start");
    expect(connectLinks).toHaveLength(2);
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });
});
