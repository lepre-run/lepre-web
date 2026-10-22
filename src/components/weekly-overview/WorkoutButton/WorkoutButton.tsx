import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../../domain/workout";
import { formatDistance, formatDuration } from "../../../i18n/formatters";
import { localeFor } from "../../../i18n/i18n";
import { workoutDetail, workoutKind, workoutType } from "../weeklyFormatters";

export function WorkoutButton({
  workout,
  selected,
  language,
  onSelect,
  arrivalOrder,
}: Readonly<{
  workout: Workout;
  selected: boolean;
  language: string;
  onSelect: () => void;
  arrivalOrder?: number;
}>): JSX.Element {
  const { t } = useTranslation();
  const type = workoutType(workout, t);
  const date = new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(workout.performedAt));
  return (
    <button
      className="weekly-workout"
      data-kind={workoutKind(workout)}
      data-new={arrivalOrder === undefined ? undefined : "true"}
      style={arrivalOrder === undefined ? undefined : arrivalStyle(arrivalOrder)}
      type="button"
      aria-expanded={selected}
      aria-controls={selected ? "weekly-workout-detail" : undefined}
      aria-label={t("weekly.openWorkout", { name: workout.name, type, date })}
      onClick={onSelect}
    >
      <span className="weekly-workout__type">{type}</span>
      <strong>{workout.name}</strong>
      <span className="weekly-workout__metrics">
        <b>{formatDistance(workout.distanceMeters, language)}</b>
        <b>{formatDuration(workout.durationSeconds)}</b>
      </span>
      <small>{workoutDetail(workout, t, language)}</small>
    </button>
  );
}

function arrivalStyle(order: number): CSSProperties {
  return { "--arrival-order": order } as CSSProperties;
}
