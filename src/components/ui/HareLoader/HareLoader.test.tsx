import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HareLoader } from "./HareLoader";

describe("HareLoader", () => {
  it("draws a decorative hare that stays out of the accessibility tree", () => {
    const { container } = render(<HareLoader className="sync-status__hare" />);
    const hare = container.querySelector("svg");
    expect(hare).toHaveClass("hare-loader", "sync-status__hare");
    expect(hare).toHaveAttribute("aria-hidden", "true");
    expect(hare).toHaveAttribute("focusable", "false");
  });
});
