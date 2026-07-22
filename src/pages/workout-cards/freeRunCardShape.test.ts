import { describe, expect, it } from "vitest";
import { freeRunCardShape, freeRunShapeSeed } from "./freeRunCardShape";

describe("freeRunCardShape", () => {
  it("keeps a workout's hand-drawn shape stable", () => {
    const seed = freeRunShapeSeed("strava:morning-run");

    expect(freeRunCardShape(seed)).toEqual(freeRunCardShape(seed));
  });

  it("gives different workouts subtly different shapes", () => {
    const morningShape = freeRunCardShape(freeRunShapeSeed("strava:morning-run"));
    const eveningShape = freeRunCardShape(freeRunShapeSeed("strava:evening-run"));

    expect(morningShape.outlinePath).not.toBe(eveningShape.outlinePath);
    expect(morningShape.badgePath).not.toBe(eveningShape.badgePath);
  });

  it("only emits finite SVG path coordinates", () => {
    const shape = freeRunCardShape(freeRunShapeSeed("strava:long-run"));

    expect(shape.outlinePath).not.toMatch(/NaN|Infinity/);
    expect(shape.badgePath).not.toMatch(/NaN|Infinity/);
  });
});
