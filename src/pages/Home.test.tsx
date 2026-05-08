import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Home, STRAVA_START_URL } from "./Home";

describe("Home", () => {
  it("renders the join button as an anchor pointing at the Lambda /start route", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: /join with strava/i });
    expect(link).toHaveAttribute("href", STRAVA_START_URL);
    expect(STRAVA_START_URL).toBe("https://api.lepre.run/v1/auth/strava/start");
  });
});
