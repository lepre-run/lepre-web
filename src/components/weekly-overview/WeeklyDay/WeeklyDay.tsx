import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { localeFor } from "../../../i18n/i18n";
import { WorkoutButton } from "../WorkoutButton/WorkoutButton";
import type { WorkoutDay } from "../weeklyOverview";

export function WeeklyDay({
  day,
  language,
  selectedWorkoutId,
  onSelect,
}: Readonly<{
  day: WorkoutDay;
  language: string;
  selectedWorkoutId: string | null;
  onSelect: (workoutId: string) => void;
}>): JSX.Element {
  const { t } = useTranslation();
  const weekday = new Intl.DateTimeFormat(localeFor(language), { weekday: "short" });
  const mobileDate = new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
  });
  return (
    <div className="weekly-day" data-empty={day.workouts.length === 0}>
      <time className="visually-hidden" dateTime={day.dateKey}>
        {new Intl.DateTimeFormat(localeFor(language), { dateStyle: "full" }).format(day.date)}
      </time>
      {day.workouts.length > 0 && (
        <div className="weekly-day__heading" aria-hidden="true">
          <span>{weekday.format(day.date)}</span>
          <time>{mobileDate.format(day.date)}</time>
        </div>
      )}
      {day.workouts.length === 0 ? (
        <span className="weekly-day__empty">
          <span aria-hidden="true">—</span>
          <span className="visually-hidden">{t("weekly.restDay")}</span>
        </span>
      ) : (
        day.workouts.map((workout) => (
          <WorkoutButton
            workout={workout}
            selected={workout.id === selectedWorkoutId}
            language={language}
            onSelect={() => onSelect(workout.id)}
            key={workout.id}
          />
        ))
      )}
    </div>
  );
}
