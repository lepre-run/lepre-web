import { screen, within } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, describe, expect, it } from "vitest";
import { english } from "../../../i18n/locales/en";
import { italian } from "../../../i18n/locales/it";
import { renderHeader } from "../../../test/app-header";
import { readyScreen } from "../../../test/home-builders";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

function expectCompactLabel(full: string, short: string): void {
  const region = screen.getByRole("status");
  expect(within(region).getByText(full)).toHaveClass("sync-status__label--full");
  expect(within(region).getByText(full)).not.toHaveAttribute("aria-hidden");
  expect(within(region).getByText(short)).toHaveClass("sync-status__label--short");
  expect(within(region).getByText(short)).toHaveAttribute("aria-hidden", "true");
}

describe("AppHeader compact synchronization labels", () => {
  it("defines a short label for every state in both languages", () => {
    const keys = Object.keys(english.syncStatusShort).sort();
    expect(Object.keys(italian.syncStatusShort).sort()).toEqual(keys);
    for (const label of [
      ...Object.values(english.syncStatusShort),
      ...Object.values(italian.syncStatusShort),
    ]) {
      expect(label.trim()).not.toBe("");
    }
  });

  it.each([
    ["en", "syncing", "Updating workouts…", "Syncing…"],
    ["en", "current", "Up to date", "Synced"],
    ["en", "checking", "Checking for updates…", "Checking…"],
    ["it", "syncing", "Aggiornamento allenamenti…", "Aggiorno…"],
    ["it", "current", "Tutto aggiornato", "Aggiornato"],
    ["it", "failed", "Aggiornamento non riuscito", "Non riuscito"],
  ] as const)(
    "keeps the full %s %s label for assistive technology",
    async (language, status, full, short) => {
      await i18n.changeLanguage(language);
      renderHeader(status);
      expectCompactLabel(full, short);
    },
  );

  it("shortens notices and keeps their full wording available", () => {
    renderHeader("paused", { notice: { kind: "paused", reason: "rate-limited", minutes: 15 } });
    expectCompactLabel(
      "Strava’s request limit was reached. Import paused and will resume automatically in about 15 minutes.",
      "Paused 15m",
    );
  });

  it("shortens the offline notice to a hidden-from-readers badge", () => {
    renderHeader("current", { screen: { ...readyScreen, availability: "offline" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "You are offline. Showing workouts stored on this device.",
    );
    expect(screen.getByText("Offline")).toHaveAttribute("aria-hidden", "true");
  });
});
