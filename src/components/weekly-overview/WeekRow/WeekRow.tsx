import type { JSX } from "react";
import { WeeklyDay } from "../WeeklyDay/WeeklyDay";
import { WeeklyDetailPanel } from "../WeeklyDetail/WeeklyDetailPanel";
import { WeeklySummary } from "../WeeklySummary/WeeklySummary";
import type { WorkoutWeek } from "../weeklyOverview";
import { NO_ARRIVALS, type WorkoutArrivals } from "../workoutArrivals";

export function WeekRow({
  week,
  language,
  selectedWorkoutId,
  onSelect,
  onClose,
  weekdayFormatter,
  arrivals = NO_ARRIVALS,
}: Readonly<{
  week: WorkoutWeek;
  language: string;
  selectedWorkoutId: string | null;
  onSelect: (workoutId: string) => void;
  onClose: () => void;
  weekdayFormatter: Intl.DateTimeFormat;
  arrivals?: WorkoutArrivals;
}>): JSX.Element {
  const selectedWorkout = week.workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  return (
    <li className="weekly-grid__week" data-resting={week.workouts.length === 0} key={week.dateKey}>
      <WeeklySummary week={week} language={language} weekdayFormatter={weekdayFormatter} />
      {week.days.map((day) => (
        <WeeklyDay
          day={day}
          language={language}
          selectedWorkoutId={selectedWorkoutId}
          onSelect={onSelect}
          arrivals={arrivals}
          key={day.dateKey}
        />
      ))}
      <WeeklyDetailPanel workout={selectedWorkout} onClose={onClose} />
    </li>
  );
}
