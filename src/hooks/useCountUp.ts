import { useEffect, useRef, useState } from "react";
import { COUNT_UP_DURATION_MS, countUpValue } from "./countUp";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type CountUpOptions = Readonly<{ duration?: number }>;

function animateCountUp(
  from: number,
  to: number,
  duration: number,
  onFrame: (value: number) => void,
): () => void {
  const animation = { frame: 0, start: -1 };
  const step = (now: number): void => {
    if (animation.start < 0) animation.start = now;
    const value = countUpValue(from, to, now - animation.start, duration);
    onFrame(value);
    if (value !== to) animation.frame = requestAnimationFrame(step);
  };
  animation.frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(animation.frame);
}

export function useCountUp(
  value: number,
  { duration = COUNT_UP_DURATION_MS }: CountUpOptions = {},
): number {
  const reducedMotion = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);

  useEffect(() => {
    const show = (next: number): void => {
      displayedRef.current = next;
      setDisplayed(next);
    };
    if (reducedMotion || displayedRef.current === value) {
      show(value);
      return;
    }
    return animateCountUp(displayedRef.current, value, duration, show);
  }, [value, duration, reducedMotion]);

  return reducedMotion ? value : displayed;
}
