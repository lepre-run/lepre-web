import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyWorkoutFeed } from "./EmptyWorkoutFeed";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("EmptyWorkoutFeed", () => {
  it("invites the runner out when there are no runs yet", async () => {
    await i18n.changeLanguage("en");
    const { container } = render(<EmptyWorkoutFeed syncing={false} />);

    expect(screen.getByRole("heading", { name: "No tracks here yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Head out for a run: completed workouts hop in here as soon as their laps have been classified.",
      ),
    ).toBeInTheDocument();
    expect(container.querySelector(".hare-loader")).toBeNull();
  });

  it("shows the hopping hare while the first import runs", async () => {
    await i18n.changeLanguage("en");
    const { container } = render(<EmptyWorkoutFeed syncing />);

    expect(
      screen.getByRole("heading", { name: "The hare is fetching your recent runs…" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".hare-loader")).toHaveAttribute("aria-hidden", "true");
  });

  it("speaks Italian when the interface is Italian", async () => {
    await i18n.changeLanguage("it");
    render(<EmptyWorkoutFeed syncing={false} />);

    expect(screen.getByRole("heading", { name: "Ancora nessuna traccia" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Esci a correre: gli allenamenti completati arrivano qui di corsa, appena classificati i lap.",
      ),
    ).toBeInTheDocument();
  });
});
