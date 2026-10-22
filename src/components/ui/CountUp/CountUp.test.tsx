import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preferReducedMotion, stubAnimationFrames } from "../../../test/motion";
import { CountUp } from "./CountUp";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const runs = (value: number): string => `${Math.round(value)} runs`;

function renderCount(value: number) {
  const view = render(
    <p>
      <CountUp value={value} format={runs} />
    </p>,
  );
  return (next: number) =>
    view.rerender(
      <p>
        <CountUp value={next} format={runs} />
      </p>,
    );
}

describe("CountUp", () => {
  it("renders the formatted value as plain text when nothing is counting", () => {
    stubAnimationFrames();
    renderCount(3);
    expect(screen.getByText("3 runs")).not.toHaveAttribute("aria-hidden");
  });

  it("hides intermediate frames from assistive technology and exposes only the final value", () => {
    const frames = stubAnimationFrames();
    const update = renderCount(3);

    update(30);
    act(() => frames.runFrame(0));
    act(() => frames.runFrame(100));

    const animated = document.querySelector(".count-up");
    expect(animated).toHaveAttribute("aria-hidden", "true");
    expect(animated?.textContent).not.toBe("30 runs");
    expect(screen.getByText("30 runs")).toHaveClass("visually-hidden");

    act(() => frames.runFrame(400));
    expect(document.querySelector(".count-up")).toBeNull();
    expect(screen.getByText("30 runs")).not.toHaveClass("visually-hidden");
  });

  it("shows the final value at once when reduced motion is preferred", () => {
    preferReducedMotion();
    stubAnimationFrames();
    const update = renderCount(3);

    update(30);

    expect(document.querySelector(".count-up")).toBeNull();
    expect(screen.getByText("30 runs")).toBeInTheDocument();
  });
});
