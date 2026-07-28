import { useMemo, useState } from "react";
import type { Workout } from "../domain/workout";
import {
  createWorkoutHistoryExport,
  localWorkoutDate,
  workoutHistoryFilename,
  workoutsInRange,
} from "../domain/workout-history-export";
import { downloadJson } from "../infrastructure/browser/download-json";

export function useWorkoutExport(workouts: ReadonlyArray<Workout>) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const bounds = useMemo(() => {
    const dates = workouts.map((workout) => localWorkoutDate(workout.performedAt)).sort();
    return { earliest: dates[0] ?? "", latest: dates[dates.length - 1] ?? "" };
  }, [workouts]);
  const selected = useMemo(
    () =>
      from.length > 0 && to.length > 0 && from <= to ? workoutsInRange(workouts, { from, to }) : [],
    [from, to, workouts],
  );
  const show = (): void => {
    setFrom(bounds.earliest);
    setTo(bounds.latest);
    setOpen(true);
  };
  const download = (): void => {
    if (selected.length === 0) return;
    const range = { from, to };
    downloadJson(workoutHistoryFilename(range), createWorkoutHistoryExport(workouts, range));
    setOpen(false);
  };
  return {
    open,
    from,
    to,
    bounds,
    selectedCount: selected.length,
    show,
    close: () => setOpen(false),
    setFrom,
    setTo,
    download,
  };
}
