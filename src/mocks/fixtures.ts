import { baselineWorkouts } from "./curated-baseline-workouts";
import { recentWorkouts } from "./curated-recent-workouts";
import { trainingYearWorkouts } from "./training-year-workouts";

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

export const mockWorkouts = trainingYearWorkouts([...recentWorkouts, ...baselineWorkouts]);
