import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { readyScreen } from "../../../test/home-builders";
import { HomeNotices } from "./HomeNotices";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("HomeNotices", () => {
  it("offers retry only for retryable errors", () => {
    const onRetry = vi.fn();
    render(
      <HomeNotices
        screen={readyScreen}
        notice={{ kind: "error", reason: "synchronization", retryable: true }}
        syncing={false}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Could not synchronize workouts");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("directs expired authorization back to Strava", () => {
    render(
      <HomeNotices
        screen={{ ...readyScreen, availability: "reauthorization-required" }}
        notice={{ kind: "none" }}
        syncing={false}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "Reconnect Strava" })).toHaveAttribute(
      "href",
      "https://api.lepre.run/v1/auth/strava/start",
    );
  });
});
