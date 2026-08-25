import { useMemo, useState } from "react";
import type { Workout } from "../domain/workout";
import {
  createWorkoutHistoryExport,
  localWorkoutDate,
  workoutHistoryFilename,
  workoutsInRange,
} from "../domain/workout-history-export";
import { downloadJson } from "../infrastructure/browser/download-json";

function useExportSelection(workouts: ReadonlyArray<Workout>) {
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
  return { open, setOpen, from, setFrom, to, setTo, bounds, selected };
}

export function useWorkoutExport(workouts: ReadonlyArray<Workout>) {
  const state = useExportSelection(workouts);
  const show = (): void => {
    state.setFrom(state.bounds.earliest);
    state.setTo(state.bounds.latest);
    state.setOpen(true);
  };
  const download = (): void => {
    if (state.selected.length === 0) return;
    const range = { from: state.from, to: state.to };
    downloadJson(workoutHistoryFilename(range), createWorkoutHistoryExport(workouts, range));
    state.setOpen(false);
  };
  return {
    open: state.open,
    from: state.from,
    to: state.to,
    bounds: state.bounds,
    selectedCount: state.selected.length,
    show,
    close: () => state.setOpen(false),
    setFrom: state.setFrom,
    setTo: state.setTo,
    download,
  };
}
