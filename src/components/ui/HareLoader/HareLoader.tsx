import type { JSX } from "react";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";

export function HareLoader({ className }: Readonly<{ className?: string }>): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <svg
      className={["hare-loader", className].filter(Boolean).join(" ")}
      data-motion={reducedMotion ? "reduced" : "full"}
      viewBox="0 0 48 32"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="hare-loader__ground" cx="24" cy="30" rx="13" ry="1.4" />
      <g className="hare-loader__hare">
        <path d="M33 11C30 4 31 1 33 2s3 5 3 9" />
        <path d="M36 10c0-7 2-9 3.5-7.5S40 8 38.5 11" />
        <ellipse cx="25" cy="19" rx="11" ry="7" />
        <circle cx="38" cy="14.5" r="5" />
        <circle className="hare-loader__tail" cx="13.5" cy="15.5" r="2.5" />
        <path className="hare-loader__leg" d="M32 24l6 2.5M18 24c-4 1-6 2-9 2" />
        <circle className="hare-loader__eye" cx="39.6" cy="13.4" r="0.9" />
      </g>
    </svg>
  );
}
