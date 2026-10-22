import { type JSX, type RefObject, useEffect, useRef, useState } from "react";
import type { Workout } from "../../../domain/workout";
import { MOTION_DURATION_BASE_MS } from "../../../hooks/motionDurations";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { WeeklyDetail } from "./WeeklyDetail";

function useDetailFocus(
  workoutId: string | null,
  panelRef: RefObject<HTMLElement | null>,
  detailRef: RefObject<HTMLElement | null>,
): void {
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const focused = document.activeElement;
    const focusInPanel = focused === document.body || panelRef.current?.contains(focused);
    if (workoutId !== null) {
      if (focused instanceof HTMLElement && !focusInPanel) openerRef.current = focused;
      detailRef.current?.focus({ preventScroll: true });
    } else if (focusInPanel) {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [workoutId, panelRef, detailRef]);
}

export function WeeklyDetailPanel({
  workout,
  onClose,
}: Readonly<{ workout: Workout | null; onClose: () => void }>): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const [lastWorkout, setLastWorkout] = useState(workout);
  if (workout !== null && workout !== lastWorkout) setLastWorkout(workout);
  const workoutId = workout?.id ?? null;
  const open = workoutId !== null;
  const shown = workout ?? lastWorkout;

  useDetailFocus(workoutId, panelRef, detailRef);

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
    <div className="weekly-detail-panel" data-open={open} inert={!open} ref={panelRef}>
      <div className="weekly-detail-panel__clip">
        {shown && <WeeklyDetail workout={shown} onClose={onClose} active={open} ref={detailRef} />}
      </div>
    </div>
  );
}
