import { act, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimationFrames } from "../../../test/motion";
import { FeedHeader } from "./FeedHeader";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  vi.unstubAllGlobals();
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

  it("counts up to a newly stored total while announcing only the final count", () => {
    const frames = stubAnimationFrames();
    const { rerender } = render(<FeedHeader workoutCount={3} onDownload={vi.fn()} />);

    rerender(<FeedHeader workoutCount={12} onDownload={vi.fn()} />);
    act(() => frames.runFrame(0));
    act(() => frames.runFrame(80));

    expect(screen.getByText("12 stored locally")).toHaveClass("visually-hidden");
    expect(document.querySelector(".count-up")).toHaveAttribute("aria-hidden", "true");
    act(() => frames.runFrame(400));
    expect(screen.getByText("12 stored locally")).not.toHaveClass("visually-hidden");
  });
});
