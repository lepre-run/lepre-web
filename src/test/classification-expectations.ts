export const INTERVAL_CORE_LAPS = [2, 3, 4, 5, 6, 7, 8] as const;
export const HILL_CIRCUIT_CORE_LAPS = [2, 3, 4, 5, 6, 7, 8] as const;
export const INTERVAL_LAP_ROLES = {
  warmup: [1],
  work: [2, 4, 6, 8],
  recovery: [3, 5, 7],
  cooldown: [9],
  main: [],
  unknown: [],
} as const;
export const HILL_CIRCUIT_LAP_ROLES = {
  warmup: [1],
  work: [2, 4, 6, 8],
  recovery: [3, 5, 7],
  cooldown: [9],
} as const;
