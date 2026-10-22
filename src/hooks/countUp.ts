export const MOTION_DURATION_SLOW_MS = 400;

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

export function countUpValue(
  from: number,
  to: number,
  elapsedMs: number,
  durationMs: number,
): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return to;
  return from + (to - from) * easeOutCubic(Math.max(0, elapsedMs) / durationMs);
}
