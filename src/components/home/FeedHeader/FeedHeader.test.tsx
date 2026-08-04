import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n/i18n";
import { FeedHeader } from "./FeedHeader";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("FeedHeader", () => {
  it("reports the stored count and delegates downloads", () => {
    const onDownload = vi.fn();
    render(<FeedHeader workoutCount={3} onDownload={onDownload} />);
    expect(screen.getByText("3 stored locally")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("disables download when there is no data", () => {
    render(<FeedHeader workoutCount={0} onDownload={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });
});
