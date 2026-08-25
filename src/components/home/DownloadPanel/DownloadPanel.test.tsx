import { fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadPanel } from "./DownloadPanel";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("DownloadPanel", () => {
  it("edits the date range and submits the selected export", () => {
    const onFromChange = vi.fn();
    const onToChange = vi.fn();
    const onDownload = vi.fn();
    render(
      <DownloadPanel
        from="2026-07-01"
        to="2026-07-20"
        earliest="2026-06-01"
        latest="2026-07-20"
        workoutCount={4}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onDownload={onDownload}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Download workout history" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-07-05" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-07-19" } });
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(onFromChange).toHaveBeenCalledWith("2026-07-05");
    expect(onToChange).toHaveBeenCalledWith("2026-07-19");
    expect(onDownload).toHaveBeenCalledOnce();
  });
});
