import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../i18n/i18n";
import { readyScreen } from "../../test/home-builders";
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
        accountOpen={false}
        onToggleAccount={onToggleAccount}
      />,
    );

    expect(screen.getByText("Ada Runner")).toBeInTheDocument();
    expect(screen.getByText("Up to date")).toHaveAttribute("data-state", "current");
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(onToggleAccount).toHaveBeenCalledOnce();
  });
});
