import { describe, expect, it } from "vitest";
import { countUpValue } from "./countUp";

describe("countUpValue", () => {
  it("starts on the previous value and ends exactly on the target", () => {
    expect(countUpValue(10, 20, 0, 400)).toBe(10);
    expect(countUpValue(10, 20, 400, 400)).toBe(20);
    expect(countUpValue(10, 20, 900, 400)).toBe(20);
  });

  it("eases out so most of the change happens early", () => {
    const halfway = countUpValue(0, 100, 200, 400);
    expect(halfway).toBeCloseTo(87.5);
    expect(countUpValue(0, 100, 100, 400)).toBeLessThan(halfway);
  });

  it("counts down as well as up", () => {
    expect(countUpValue(100, 0, 200, 400)).toBeCloseTo(12.5);
  });

  it("jumps to the target when there is no duration", () => {
    expect(countUpValue(3, 7, 0, 0)).toBe(7);
  });
});
