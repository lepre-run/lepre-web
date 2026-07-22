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
    id: "mock-intervals-8x400",
    performedAt: "2026-07-21T05:50:00.000Z",
    name: "Sunrise 400s",
    description:
      "Eight light, quick repetitions before the city woke up. Finished with room to spare.",
    laps: [
      lap(1, "Warm up", 2_400, 820),
      lap(2, "Rep 1", 400, 88),
      lap(3, "Recovery 1", 200, 80),
      lap(4, "Rep 2", 400, 87),
      lap(5, "Recovery 2", 200, 79),
      lap(6, "Rep 3", 400, 87),
      lap(7, "Recovery 3", 200, 81),
      lap(8, "Rep 4", 400, 86),
      lap(9, "Recovery 4", 200, 80),
      lap(10, "Rep 5", 400, 86),
      lap(11, "Recovery 5", 200, 82),
      lap(12, "Rep 6", 400, 85),
      lap(13, "Recovery 6", 200, 80),
      lap(14, "Rep 7", 400, 84),
      lap(15, "Recovery 7", 200, 81),
      lap(16, "Rep 8", 400, 82),
      lap(17, "Cool down", 1_800, 620),
    ],
  }),
  workout({
    id: "mock-long-run-coast",
    performedAt: "2026-07-19T06:15:00.000Z",
    name: "Sunday along the coast",
    description: "A patient long run with an easy first half and a quiet finish by the water.",
    laps: [lap(1, "Run", 17_360, 5_412, 0, 136, 151)],
  }),
  workout({
    id: "mock-hills-5x300",
    performedAt: "2026-07-18T05:55:00.000Z",
    name: "Five climbs before breakfast",
    description:
      "Controlled effort uphill, relaxed on every return. The final climb felt the smoothest.",
    sport: "TrailRun",
    laps: [
      lap(1, "Warm up", 2_200, 760),
      lap(2, "Climb 1", 300, 126),
      lap(3, "Return 1", 300, 75),
      lap(4, "Climb 2", 300, 124),
      lap(5, "Return 2", 300, 110),
      lap(6, "Climb 3", 300, 123),
      lap(7, "Return 3", 300, 80),
      lap(8, "Climb 4", 300, 121),
      lap(9, "Return 4", 300, 115),
      lap(10, "Climb 5", 300, 120),
      lap(11, "Cool down", 1_600, 570),
    ],
  }),
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
  workout({
    id: "mock-steady-canal",
    performedAt: "2026-07-01T05:45:00.000Z",
    name: "Steady blocks by the canal",
    description: "Four differently sized blocks at the same calm effort, with no pressure on pace.",
    laps: [
      lap(1, "Block 1", 1_200, 360),
      lap(2, "Block 2", 2_800, 840),
      lap(3, "Block 3", 1_600, 480),
      lap(4, "Block 4", 3_400, 1_020),
    ],
  }),
  workout({
    id: "mock-trail-long-run",
    performedAt: "2026-06-28T06:35:00.000Z",
    name: "Long trail to the ridge",
    description: "Unhurried climbing, shaded forest, and a long descent home.",
    sport: "TrailRun",
    laps: [lap(1, "Trail run", 18_700, 6_880, 90, 143, 169)],
  }),
  workout({
    id: "mock-progressive-five",
    performedAt: "2026-06-24T16:50:00.000Z",
    name: "Negative-split five",
    description: "Started conversational and let each stage become a little sharper than the last.",
    laps: [
      lap(1, "Stage 1", 1_500, 510),
      lap(2, "Stage 2", 1_500, 492),
      lap(3, "Stage 3", 1_500, 474),
      lap(4, "Stage 4", 1_500, 456),
      lap(5, "Stage 5", 1_500, 438),
    ],
  }),
  workout({
    id: "mock-treadmill-recovery",
    performedAt: "2026-06-20T17:40:00.000Z",
    name: "Rainy-day recovery",
    description: "Easy treadmill kilometres while the summer storm passed outside.",
    sport: "VirtualRun",
    laps: [lap(1, "Treadmill run", 7_200, 2_520, 0, null, null)],
  }),
];
