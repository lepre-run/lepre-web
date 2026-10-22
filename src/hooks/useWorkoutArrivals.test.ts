import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Workout } from "../domain/workout";
import { preferReducedMotion } from "../test/motion";
import { buildWeeklyWorkout } from "../test/weekly-builders";
import { ARRIVAL_EXPIRY_MS } from "./motionDurations";
import { useWorkoutArrivals } from "./useWorkoutArrivals";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const first = buildWeeklyWorkout("workout:first", "2026-07-20T06:00:00Z");
const second = buildWeeklyWorkout("workout:second", "2026-07-21T06:00:00Z");
const third = buildWeeklyWorkout("workout:third", "2026-07-22T06:00:00Z");

function renderArrivals(workouts: ReadonlyArray<Workout>, hydrated: boolean) {
  return renderHook((props) => useWorkoutArrivals(props.workouts, props.hydrated), {
    initialProps: { workouts, hydrated },
  });
}

describe("useWorkoutArrivals", () => {
  it("does not animate workouts from the initial IndexedDB load", () => {
    const { result, rerender } = renderArrivals([], false);
    rerender({ workouts: [first, second], hydrated: false });
    rerender({ workouts: [first, second], hydrated: true });

    expect(result.current.size).toBe(0);
  });

  it("marks workouts added by a later synchronization batch", () => {
    const { result, rerender } = renderArrivals([first], true);

    rerender({ workouts: [first, second, third], hydrated: true });

    expect(Array.from(result.current)).toEqual([
      ["workout:third", 0],
      ["workout:second", 1],
    ]);
  });

  it("animates the first batch for a runner whose local store was empty", () => {
    const { result, rerender } = renderArrivals([], true);

    rerender({ workouts: [first], hydrated: true });

    expect(result.current.get("workout:first")).toBe(0);
  });

  it("keeps settled arrivals stable across re-renders without new workouts", () => {
    const { result, rerender } = renderArrivals([first], true);
    const synchronized = [first, second];
    rerender({ workouts: synchronized, hydrated: true });
    const arrivals = result.current;

    rerender({ workouts: synchronized, hydrated: true });
    rerender({ workouts: [...synchronized], hydrated: true });

    expect(result.current).toBe(arrivals);
  });

  it("does not mark arrivals when reduced motion is preferred", () => {
    preferReducedMotion();
    const { result, rerender } = renderArrivals([first], true);

    rerender({ workouts: [first, second], hydrated: true });

    expect(result.current.size).toBe(0);
  });

  it("clears arrival marks once the entrance animation has finished", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderArrivals([first], true);
    rerender({ workouts: [first, second], hydrated: true });
    expect(result.current.size).toBe(1);

    act(() => vi.advanceTimersByTime(ARRIVAL_EXPIRY_MS - 1));
    expect(result.current.size).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.size).toBe(0);
  });
});

describe("useWorkoutArrivals expiry", () => {
  it("leaves no pending timer or late state update when unmounted before expiry", () => {
    vi.useFakeTimers();
    const errors = vi.spyOn(console, "error");
    const { result, rerender, unmount } = renderArrivals([first], true);
    rerender({ workouts: [first, second], hydrated: true });
    expect(result.current.size).toBe(1);
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(ARRIVAL_EXPIRY_MS));
    expect(errors).not.toHaveBeenCalled();
  });

  it("restarts expiry for a second batch that arrives before the first expires", () => {
    vi.useFakeTimers();
    const halfway = Math.floor(ARRIVAL_EXPIRY_MS / 2);
    const { result, rerender } = renderArrivals([first], true);
    rerender({ workouts: [first, second], hydrated: true });
    act(() => vi.advanceTimersByTime(halfway));

    rerender({ workouts: [first, second, third], hydrated: true });
    expect(Array.from(result.current)).toEqual([["workout:third", 0]]);
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(ARRIVAL_EXPIRY_MS - halfway));
    expect(Array.from(result.current)).toEqual([["workout:third", 0]]);

    act(() => vi.advanceTimersByTime(halfway - 1));
    expect(result.current.size).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
