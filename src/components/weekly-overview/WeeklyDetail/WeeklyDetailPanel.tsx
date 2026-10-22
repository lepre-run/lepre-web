import { type JSX, useEffect, useRef, useState } from "react";
import type { Workout } from "../../../domain/workout";
import { MOTION_DURATION_BASE_MS } from "../../../hooks/motionDurations";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { WeeklyDetail } from "./WeeklyDetail";

export function WeeklyDetailPanel({
  workout,
  onClose,
}: Readonly<{ workout: Workout | null; onClose: () => void }>): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const detailRef = useRef<HTMLElement>(null);
  const [lastWorkout, setLastWorkout] = useState(workout);
  if (workout !== null && workout !== lastWorkout) setLastWorkout(workout);
  const workoutId = workout?.id ?? null;
  const open = workoutId !== null;
  const shown = workout ?? lastWorkout;

  useEffect(() => {
    if (workoutId !== null) detailRef.current?.focus({ preventScroll: true });
  }, [workoutId]);

  useEffect(() => {
    const settle = () => {
      if (workoutId !== null) {
        detailRef.current?.scrollIntoView({
          block: "nearest",
          behavior: reducedMotion ? "auto" : "smooth",
        });
      } else {
        setLastWorkout(null);
      }
    };
    const timer = window.setTimeout(settle, reducedMotion ? 0 : MOTION_DURATION_BASE_MS);
    return () => window.clearTimeout(timer);
  }, [workoutId, reducedMotion]);

  return (
    <div className="weekly-detail-panel" data-open={open} inert={!open}>
      <div className="weekly-detail-panel__clip">
        {shown && <WeeklyDetail workout={shown} onClose={onClose} active={open} ref={detailRef} />}
      </div>
    </div>
  );
}
