import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { formatDistance } from "../../../i18n/formatters";
import { compactDuration, weekRange, workoutKind } from "../weeklyFormatters";
import type { WorkoutWeek } from "../weeklyOverview";

export function WeeklySummary({
  week,
  language,
  weekdayFormatter,
}: Readonly<{
  week: WorkoutWeek;
  language: string;
  weekdayFormatter: Intl.DateTimeFormat;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <header className="weekly-summary">
      <time dateTime={week.dateKey}>{weekRange(week, language)}</time>
      <strong>{t("weekly.runCount", { count: week.workouts.length })}</strong>
      <dl>
        <div className="weekly-summary__metric">
          <dt>{t("workout.distance")}</dt>
          <dd>
            {week.distanceMeters === 0
              ? t("weekly.zeroDistance")
              : formatDistance(week.distanceMeters, language)}
          </dd>
        </div>
        <div className="weekly-summary__metric">
          <dt>{t("workout.movingTime")}</dt>
          <dd>{compactDuration(week.durationSeconds)}</dd>
        </div>
      </dl>
      <ol className="weekly-cadence" aria-hidden="true">
        {week.days.map((day) => (
          <li
            data-active={day.workouts.length > 0}
            data-kind={day.workouts[0] ? workoutKind(day.workouts[0]) : undefined}
            key={day.dateKey}
          >
            <span>{weekdayFormatter.format(day.date)}</span>
            <b>{day.date.getDate()}</b>
            <i>{day.workouts.length > 0 ? "●" : "·"}</i>
          </li>
        ))}
      </ol>
      {week.workouts.length === 0 && <p className="weekly-summary__rest">{t("weekly.restWeek")}</p>}
    </header>
  );
}
