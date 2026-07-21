type MockLap = Readonly<{
  index: number;
  name: string;
  movingDurationSeconds: number;
  elapsedDurationSeconds: number;
  distanceMeters: number;
  averageHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
}>;

type MockWorkout = Readonly<{
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

function lap(
  index: number,
  name: string,
  distanceMeters: number,
  movingDurationSeconds: number,
  stoppedDurationSeconds = 0,
  averageHeartRateBpm: number | null = 134 + index * 3,
  maxHeartRateBpm: number | null = averageHeartRateBpm === null ? null : averageHeartRateBpm + 12,
): MockLap {
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

function workout(input: {
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

export const mockUser = {
  id: "mock-user-ada",
  firstName: "Ada",
  lastName: "Runner",
  connection: {
    id: "mock-connection-strava",
    provider: "strava",
    externalAccountId: "mock-athlete-42",
  },
} as const;

export const mockWorkouts: ReadonlyArray<MockWorkout> = [
  workout({
    id: "mock-intervals-6x1k",
    performedAt: "2026-07-16T05:42:00.000Z",
    name: "Thursday track",
    description: "Six controlled repetitions. Kept the final two honest without forcing the pace.",
    laps: [
      lap(1, "Warm up", 2_500, 840),
      lap(2, "Rep 1", 1_000, 226),
      lap(3, "Recovery 1", 400, 150),
      lap(4, "Rep 2", 1_000, 224),
      lap(5, "Recovery 2", 400, 149),
      lap(6, "Rep 3", 1_000, 223),
      lap(7, "Recovery 3", 400, 151),
      lap(8, "Rep 4", 1_000, 222),
      lap(9, "Recovery 4", 400, 148),
      lap(10, "Rep 5", 1_000, 220),
      lap(11, "Recovery 5", 400, 152),
      lap(12, "Rep 6", 1_000, 219),
      lap(13, "Cool down", 1_800, 630),
    ],
  }),
  workout({
    id: "mock-progressive-8k",
    performedAt: "2026-07-13T06:10:00.000Z",
    name: "City 8K race",
    description: "Four even stages, moving from comfortable to threshold effort.",
    type: "race",
    laps: [
      lap(1, "Stage 1", 2_000, 650),
      lap(2, "Stage 2", 2_000, 620),
      lap(3, "Stage 3", 2_000, 588),
      lap(4, "Stage 4", 2_000, 550),
    ],
  }),
  workout({
    id: "mock-tempo-6k",
    performedAt: "2026-07-10T16:35:00.000Z",
    name: "Tempo before dinner",
    description: "Relaxed opening, six kilometres at a stable working rhythm, easy finish.",
    laps: [
      lap(1, "Warm up", 2_200, 770),
      lap(2, "Tempo 1", 2_000, 570),
      lap(3, "Tempo 2", 2_000, 565),
      lap(4, "Tempo 3", 2_000, 572),
      lap(5, "Cool down", 1_800, 650),
    ],
  }),
  workout({
    id: "mock-unknown-fartlek",
    performedAt: "2026-07-07T05:58:00.000Z",
    name: "Unstructured fartlek",
    description: "Changed effort by feel; the automatic laps do not reveal a reliable pattern.",
    sport: "TrailRun",
    laps: [
      lap(1, "Lap 1", 1_000, 300),
      lap(2, "Lap 2", 1_000, 440),
      lap(3, "Lap 3", 1_000, 280),
      lap(4, "Lap 4", 1_000, 410),
    ],
  }),
  workout({
    id: "mock-free-run",
    performedAt: "2026-07-04T07:20:00.000Z",
    name: "Easy river loop",
    description: "No workout target. Just an easy aerobic hour on tired legs.",
    laps: [lap(1, "Run", 10_250, 3_660)],
  }),
];
