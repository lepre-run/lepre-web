import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preferReducedMotion, stubMediaQuery } from "../../../test/motion";
import { HareLoader } from "./HareLoader";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderHare() {
  const { container } = render(<HareLoader className="sync-status__hare" />);
  return container.querySelector("svg");
}

describe("HareLoader", () => {
  it("draws a decorative hare that stays out of the accessibility tree", () => {
    const hare = renderHare();
    expect(hare).toHaveClass("hare-loader", "sync-status__hare");
    expect(hare).toHaveAttribute("aria-hidden", "true");
    expect(hare).toHaveAttribute("focusable", "false");
  });

  it("hops when the runner allows motion", () => {
    stubMediaQuery(false);
    expect(renderHare()).toHaveAttribute("data-motion", "full");
  });

  it("stands still when reduced motion is preferred, including after a live change", () => {
    const query = stubMediaQuery(false);
    const hare = renderHare();

    act(() => {
      Object.assign(query, { matches: true });
      query.dispatchEvent(new Event("change"));
    });

    expect(hare).toHaveAttribute("data-motion", "reduced");
  });

  it("stands still from the first frame under reduced motion", () => {
    preferReducedMotion();
    expect(renderHare()).toHaveAttribute("data-motion", "reduced");
  });
});
