import { fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readyScreen } from "../../../test/home-builders";
import { AppHeader } from "./AppHeader";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("AppHeader", () => {
  it("shows synchronization state and opens the account", () => {
    const onToggleAccount = vi.fn();
    render(
      <AppHeader
        screen={readyScreen}
        status="current"
        notice={{ kind: "none" }}
        syncing={false}
        accountOpen={false}
        onRetry={vi.fn()}
        onToggleAccount={onToggleAccount}
      />,
    );

    expect(screen.getByText("Ada Runner")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-state", "current");
    expect(screen.getByRole("status")).toHaveTextContent("Up to date");
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(onToggleAccount).toHaveBeenCalledOnce();
  });

  it("shows the queued synchronization message in the status box", () => {
    render(
      <AppHeader
        screen={readyScreen}
        status="paused"
        notice={{ kind: "paused", reason: "queued" }}
        syncing={false}
        accountOpen={false}
        onRetry={vi.fn()}
        onToggleAccount={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("data-state", "paused");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for a fair synchronization turn…",
    );
    expect(screen.queryByText("Updates paused")).not.toBeInTheDocument();
  });

  it("keeps synchronization recovery actions beside the account", () => {
    const onRetry = vi.fn();
    render(
      <AppHeader
        screen={readyScreen}
        status="failed"
        notice={{ kind: "error", reason: "synchronization", retryable: true }}
        syncing={false}
        accountOpen={false}
        onRetry={onRetry}
        onToggleAccount={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Could not synchronize workouts");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("keeps the reconnect action beside the account", () => {
    render(
      <AppHeader
        screen={{ ...readyScreen, availability: "reauthorization-required" }}
        status="failed"
        notice={{ kind: "none" }}
        syncing={false}
        accountOpen={false}
        onRetry={vi.fn()}
        onToggleAccount={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "Reconnect Strava" })).toHaveAttribute(
      "href",
      "https://api.lepre.run/v1/auth/strava/start",
    );
  });

  it.each(["checking", "syncing"] as const)(
    "shows the hopping hare while synchronization is %s",
    (status) => {
      const { container } = render(
        <AppHeader
          screen={readyScreen}
          status={status}
          notice={{ kind: "none" }}
          syncing={status === "syncing"}
          accountOpen={false}
          onRetry={vi.fn()}
          onToggleAccount={vi.fn()}
        />,
      );

      const region = screen.getByRole("status");
      expect(region).toHaveAttribute("aria-live", "polite");
      expect(region).toHaveTextContent(status === "syncing" ? "Updating" : "Checking");
      expect(region.querySelector(".hare-loader")).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelector(".sync-status__indicator")).toBeNull();
    },
  );

  it("keeps the coloured dot once synchronization settles", () => {
    const { container } = render(
      <AppHeader
        screen={readyScreen}
        status="current"
        notice={{ kind: "none" }}
        syncing={false}
        accountOpen={false}
        onRetry={vi.fn()}
        onToggleAccount={vi.fn()}
      />,
    );

    expect(container.querySelector(".sync-status__indicator")).toBeInTheDocument();
    expect(container.querySelector(".hare-loader")).toBeNull();
  });
});
