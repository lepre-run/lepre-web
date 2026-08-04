import type { JSX, ReactNode } from "react";
import type { Instant } from "../../../domain/identity";
import type { WorkoutCategory } from "../../../domain/workout";
import { formatWorkoutDate } from "../../../i18n/formatters";
import { Card } from "../../ui";
import { journalCardShape } from "../journalCardShape";
import {
  WorkoutCardSummary,
  type WorkoutCardSummaryProps,
} from "../WorkoutCardSummary/WorkoutCardSummary";

export function JournalWorkoutCard({
  kind,
  category,
  badge,
  performedAt,
  language,
  shapeSeed,
  summary,
  compact = false,
  children,
}: Readonly<{
  kind: string;
  category: WorkoutCategory;
  badge: string;
  performedAt: Instant;
  language: string;
  shapeSeed: number;
  summary: WorkoutCardSummaryProps;
  compact?: boolean;
  children?: ReactNode;
}>): JSX.Element {
  const shape = journalCardShape(shapeSeed);
  const classes = [
    "workout-card",
    "workout-card--journal",
    `workout-card--${kind}`,
    compact && "workout-card--compact",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Card className={classes} data-workout-type={category}>
      <svg
        className="journal-card__outline"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={shape.outlinePath} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="journal-card__type">
        <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
          <path d={shape.badgePath} />
        </svg>
        <span>{badge}</span>
      </div>
      <header className="workout-card__header">
        <div className="workout-card__topline">
          <time dateTime={performedAt}>{formatWorkoutDate(performedAt, language)}</time>
        </div>
        <WorkoutCardSummary {...summary} />
      </header>
      {children}
    </Card>
  );
}
