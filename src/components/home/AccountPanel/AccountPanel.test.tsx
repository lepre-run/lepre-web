import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountPanel } from "./AccountPanel";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("AccountPanel", () => {
  it("asks for confirmation before disconnecting", async () => {
    const onDisconnect = vi.fn().mockResolvedValue(undefined);
    render(<AccountPanel syncing={false} offline={false} onDisconnect={onDisconnect} />);

    fireEvent.click(screen.getByRole("button", { name: "Disconnect Strava" }));
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect and remove data" }));
    await waitFor(() => expect(onDisconnect).toHaveBeenCalledOnce());
  });

  it("prevents disconnecting while the provider is unavailable", () => {
    render(<AccountPanel syncing={false} offline={true} onDisconnect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Disconnect Strava" })).toBeDisabled();
  });
});
