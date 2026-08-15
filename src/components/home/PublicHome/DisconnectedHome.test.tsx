import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { DisconnectedHome } from "./PublicHome";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("DisconnectedHome", () => {
  it("offers authorization and language selection", () => {
    render(<DisconnectedHome />);
    expect(screen.getByRole("link", { name: "Connect with Strava" })).toHaveAttribute(
      "href",
      "https://api.lepre.run/v1/auth/strava/start",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lepre has reached its current Strava athlete limit. More spots coming later.",
    );
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });
});
