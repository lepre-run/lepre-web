export type MockLap = Readonly<{
  index: number;
  name: string;
  movingDurationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
}>;

export type MockWorkout = Readonly<{
  id: string;
  performedAt: string;
  name: string;
  description: string;
  type: "workout" | "race";
  sport: "Run" | "TrailRun" | "VirtualRun";
  durationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  laps: ReadonlyArray<MockLap>;
}>;

type DetailedLap = Readonly<{
  index: number;
  name: string;
  distanceMeters: number;
  movingDurationSeconds: number;
  stoppedDurationSeconds?: number;
  averageHeartRateBpm?: number | null;
  maxHeartRateBpm?: number | null;
}>;

export function detailedLap({
  index,
  name,
  distanceMeters,
  movingDurationSeconds,
  stoppedDurationSeconds = 0,
  averageHeartRateBpm = 134 + index * 3,
  maxHeartRateBpm = averageHeartRateBpm === null ? null : averageHeartRateBpm + 12,
}: DetailedLap): MockLap {
  return {
    index,
    name,
    movingDurationSeconds,
    elapsedDurationSeconds: movingDurationSeconds + stoppedDurationSeconds,
    distanceMeters,
    averageHeartRateBpm,
    maxHeartRateBpm,
  };
}

export function lap(
  index: number,
  name: string,
  distanceMeters: number,
  movingDurationSeconds: number,
): MockLap {
  return detailedLap({ index, name, distanceMeters, movingDurationSeconds });
}

export function workout(input: {
  id: string;
  performedAt: string;
  name: string;
  description: string;
  type?: MockWorkout["type"];
  sport?: MockWorkout["sport"];
  laps: ReadonlyArray<MockLap>;
}): MockWorkout {
  const recordedHeartRates = input.laps.flatMap((value) =>
    value.averageHeartRateBpm === null ? [] : [value.averageHeartRateBpm],
  );
  const recordedMaximums = input.laps.flatMap((value) =>
    value.maxHeartRateBpm === null ? [] : [value.maxHeartRateBpm],
  );
  return {
    id: input.id,
    performedAt: input.performedAt,
    name: input.name,
    description: input.description,
    type: input.type ?? "workout",
    sport: input.sport ?? "Run",
    durationSeconds: input.laps.reduce((total, value) => total + value.movingDurationSeconds, 0),
    elapsedDurationSeconds: input.laps.reduce(
      (total, value) => total + value.elapsedDurationSeconds,
      0,
    ),
    distanceMeters: input.laps.reduce((total, value) => total + value.distanceMeters, 0),
    averageHeartRateBpm:
      recordedHeartRates.length === 0
        ? null
        : recordedHeartRates.reduce((total, value) => total + value, 0) / recordedHeartRates.length,
    maxHeartRateBpm: recordedMaximums.length === 0 ? null : Math.max(...recordedMaximums),
    laps: input.laps,
  };
}

export function distanceIntervals(input: {
  id: string;
  performedAt: string;
  name: string;
  workMeters: number;
  recoveryMeters: number;
  repetitionSeconds: ReadonlyArray<number>;
  recoverySeconds?: number;
  description?: string;
}): MockWorkout {
  return workout({
    id: input.id,
    performedAt: input.performedAt,
    name: input.name,
    description: input.description ?? "A repeatable interval session for longitudinal comparison.",
    laps: intervalLaps(input),
  });
}

type DistanceIntervalInput = Parameters<typeof distanceIntervals>[0];

function intervalLaps(input: DistanceIntervalInput): ReadonlyArray<MockLap> {
  return [
    intervalBoundaryLap("warmup", 1),
    ...intervalCoreLaps(input),
    intervalBoundaryLap("cooldown", 1 + input.repetitionSeconds.length * 2),
  ];
}

function intervalCoreLaps(input: DistanceIntervalInput): ReadonlyArray<MockLap> {
  return input.repetitionSeconds.flatMap((seconds, offset) => {
    const work = lap(2 + offset * 2, `Rep ${offset + 1}`, input.workMeters, seconds);
    if (offset === input.repetitionSeconds.length - 1) return [work];
    const recovery = lap(
      3 + offset * 2,
      `Recovery ${offset + 1}`,
      input.recoveryMeters,
      input.recoverySeconds ?? 150,
    );
    return [work, recovery];
  });
}

function intervalBoundaryLap(kind: "warmup" | "cooldown", index: number): MockLap {
  return detailedLap({
    index,
    name: kind === "warmup" ? "Warm up" : "Cool down",
    distanceMeters: kind === "warmup" ? 2_500 : 1_800,
    movingDurationSeconds: kind === "warmup" ? 840 : 630,
    averageHeartRateBpm: kind === "warmup" ? 136 : 139,
    maxHeartRateBpm: kind === "warmup" ? 151 : 153,
  });
}

export function kilometerIntervals(input: {
  id: string;
  performedAt: string;
  name: string;
  repetitionSeconds: ReadonlyArray<number>;
}): MockWorkout {
  return distanceIntervals({
    ...input,
    workMeters: 1_000,
    recoveryMeters: 400,
    description: "A repeatable six-by-one-kilometre session for longitudinal comparison.",
  });
}
