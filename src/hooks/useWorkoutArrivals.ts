import { useEffect, useState } from "react";
import {
  arrivalOrder,
  NO_ARRIVALS,
  newWorkoutIds,
  type WorkoutArrivals,
} from "../components/weekly-overview/workoutArrivals";
import type { Workout } from "../domain/workout";
import { MOTION_DURATION_SLOW_MS } from "./motionDurations";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type ArrivalTracking = Readonly<{
  workouts: ReadonlyArray<Workout> | null;
  hydrated: boolean;
  knownIds: ReadonlySet<string> | null;
  arrivals: WorkoutArrivals;
}>;

const UNTRACKED: ArrivalTracking = {
  workouts: null,
  hydrated: false,
  knownIds: null,
  arrivals: NO_ARRIVALS,
};

function trackArrivals(
  previous: ArrivalTracking,
  workouts: ReadonlyArray<Workout>,
  hydrated: boolean,
): ArrivalTracking {
  if (!hydrated) return { ...UNTRACKED, workouts };
  const arrived = newWorkoutIds(previous.knownIds, workouts);
  return {
    workouts,
    hydrated,
    knownIds: new Set(workouts.map((workout) => workout.id)),
    arrivals: arrived.size === 0 ? previous.arrivals : arrivalOrder(arrived, workouts),
  };
}

export function useWorkoutArrivals(
  workouts: ReadonlyArray<Workout>,
  hydrated: boolean,
): WorkoutArrivals {
  const reducedMotion = usePrefersReducedMotion();
  const [tracking, setTracking] = useState(() => trackArrivals(UNTRACKED, workouts, hydrated));
  const changed = tracking.workouts !== workouts || tracking.hydrated !== hydrated;
  const current = changed ? trackArrivals(tracking, workouts, hydrated) : tracking;
  if (changed) setTracking(current);
  useEffect(() => {
    if (current.arrivals.size === 0) return;
    const settled = current.arrivals;
    const timeout = window.setTimeout(
      () => setTracking((latest) => settleArrivals(latest, settled)),
      MOTION_DURATION_SLOW_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [current.arrivals]);
  return reducedMotion ? NO_ARRIVALS : current.arrivals;
}

function settleArrivals(tracking: ArrivalTracking, settled: WorkoutArrivals): ArrivalTracking {
  return tracking.arrivals === settled ? { ...tracking, arrivals: NO_ARRIVALS } : tracking;
}
