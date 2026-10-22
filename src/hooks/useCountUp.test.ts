import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { preferReducedMotion, stubAnimationFrames } from "../test/motion";
import { useCountUp } from "./useCountUp";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderCountUp(initial: number) {
  return renderHook(({ value }) => useCountUp(value, { duration: 400 }), {
    initialProps: { value: initial },
  });
}

describe("useCountUp", () => {
  it("shows the first value immediately without animating", () => {
    const frames = stubAnimationFrames();
    const { result } = renderCountUp(42);

    expect(result.current).toBe(42);
    expect(frames.pending()).toBe(0);
  });

  it("interpolates from the previous value and ends exactly on the new one", () => {
    const frames = stubAnimationFrames();
    const { result, rerender } = renderCountUp(10);

    rerender({ value: 20 });
    expect(result.current).toBe(10);
    act(() => frames.runFrame(1_000));
    expect(result.current).toBe(10);
    act(() => frames.runFrame(1_200));
    expect(result.current).toBeGreaterThan(10);
    expect(result.current).toBeLessThan(20);
    act(() => frames.runFrame(1_400));
    expect(result.current).toBe(20);
    expect(frames.pending()).toBe(0);
  });

  it("continues from the displayed value when the target changes mid-animation", () => {
    const frames = stubAnimationFrames();
    const { result, rerender } = renderCountUp(0);

    rerender({ value: 100 });
    act(() => frames.runFrame(0));
    act(() => frames.runFrame(200));
    const interrupted = result.current;
    rerender({ value: 50 });
    expect(result.current).toBe(interrupted);
    act(() => frames.runFrame(300));
    act(() => frames.runFrame(700));
    expect(result.current).toBe(50);
  });

  it("jumps to the final value when reduced motion is preferred", () => {
    preferReducedMotion();
    const frames = stubAnimationFrames();
    const { result, rerender } = renderCountUp(10);

    rerender({ value: 20 });

    expect(result.current).toBe(20);
    expect(frames.pending()).toBe(0);
  });

  it("cancels the pending frame when unmounted mid-animation", () => {
    const frames = stubAnimationFrames();
    const errors = vi.spyOn(console, "error");
    const { rerender, unmount } = renderCountUp(10);

    rerender({ value: 20 });
    act(() => frames.runFrame(0));
    act(() => frames.runFrame(100));
    expect(frames.pending()).toBe(1);
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(frames.pending()).toBe(0);
    expect(() => frames.runFrame(400)).not.toThrow();
    expect(errors).not.toHaveBeenCalled();
  });
});
