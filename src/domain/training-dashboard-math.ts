import type { EvidenceStrength, RelativeTrend } from "./training-dashboard-types";

export function median(values: ReadonlyArray<number>): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function evidenceStrength(count: number): EvidenceStrength {
  if (count >= 6) return "strong";
  if (count >= 3) return "growing";
  return "early";
}

function trend(percent: number): RelativeTrend {
  return { percent, direction: percent > 0.75 ? "up" : percent < -0.75 ? "down" : "steady" };
}

export function trendFromPaces(
  current: ReadonlyArray<number>,
  previous: ReadonlyArray<number>,
  minimum = 2,
): RelativeTrend | null {
  if (current.length < minimum || previous.length < minimum) return null;
  const currentSpeed = 1_000 / median(current);
  const previousSpeed = 1_000 / median(previous);
  return trend(((currentSpeed - previousSpeed) / previousSpeed) * 100);
}

export function trendFromTotals(current: number, previous: number): RelativeTrend | null {
  return previous <= 0 ? null : trend(((current - previous) / previous) * 100);
}
