import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preferReducedMotion, stubMediaQuery } from "../test/motion";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePrefersReducedMotion", () => {
  it("allows motion when the runner has no reduced-motion preference", () => {
    stubMediaQuery(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reports the reduced-motion preference and follows later changes", () => {
    const query = preferReducedMotion();
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(result.current).toBe(true);

    act(() => {
      Object.assign(query, { matches: false });
      query.dispatchEvent(new Event("change"));
    });
    expect(result.current).toBe(false);
  });

  it("falls back to allowing motion when matchMedia is unavailable", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", { configurable: true, value: undefined });
    try {
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });
});
