import type { TFunction } from "i18next";
import { type JSX, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../domain/workout";
import {
  formatClassification,
  formatDistance,
  formatDuration,
  formatPace,
} from "../../i18n/formatters";
import { localeFor } from "../../i18n/i18n";
import { WorkoutCard } from "../WorkoutCard";
import { pageCount, type WorkoutWeek, weeksOnPage, workoutWeeks } from "./weeklyOverview";

function weekRange(week: WorkoutWeek, language: string): string {
  const locale = localeFor(language);
  const sameYear = week.start.getFullYear() === week.end.getFullYear();
  const sameMonth = sameYear && week.start.getMonth() === week.end.getMonth();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const year = new Intl.DateTimeFormat(locale, { year: "numeric" });

  if (sameMonth) {
    return `${day.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
  }
  if (sameYear) {
    return `${day.format(week.start)} ${month.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
  }
  return `${day.format(week.start)} ${month.format(week.start)} ${year.format(week.start)}–${day.format(week.end)} ${month.format(week.end)} ${year.format(week.end)}`;
}

function compactDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function workoutKind(workout: Workout): string {
  return workout.type === "race" ? "race" : workout.structure.kind;
}

function workoutType(workout: Workout, t: TFunction): string {
  if (workout.type === "race") return t("workout.race");
  switch (workout.structure.kind) {
    case "intervals":
      return t("classification.intervalsBadge");
    case "progressive":
      return t("classification.progressiveBadge");
    case "tempo":
      return t("weekly.types.tempo");
    case "repeated-hills":
      return t("weekly.types.hills");
    case "steady-structured-run":
      return t("weekly.types.steady");
    case "free-run":
      return t("classification.freeRun");
    case "unknown":
      return t("weekly.types.run");
  }
}

function workoutDetail(workout: Workout, t: TFunction, language: string): string {
  if (
    workout.type === "race" ||
    workout.structure.kind === "free-run" ||
    workout.structure.kind === "steady-structured-run" ||
    workout.structure.kind === "unknown"
  ) {
    return formatPace(workout.durationSeconds, workout.distanceMeters);
  }
  return formatClassification(workout.structure, t, language);
}

function WorkoutButton({
  workout,
  selected,
  language,
  onSelect,
}: Readonly<{
  workout: Workout;
  selected: boolean;
  language: string;
  onSelect: () => void;
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

export function WeeklyOverview({
  workouts,
}: Readonly<{ workouts: ReadonlyArray<Workout> }>): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const weeks = useMemo(() => workoutWeeks(workouts), [workouts]);
  const totalPages = pageCount(weeks);
  const [page, setPage] = useState(0);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const visibleWeeks = weeksOnPage(weeks, Math.min(page, totalPages - 1));
  const selectedWorkout = workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const weekdayFormatter = new Intl.DateTimeFormat(localeFor(language), { weekday: "short" });

  function changePage(nextPage: number): void {
    setPage(nextPage);
    setSelectedWorkoutId(null);
  }

  return (
    <section className="weekly-overview" aria-label={t("weekly.label")}>
      <div className="weekly-overview__scroll">
        <div className="weekly-grid">
          <div className="weekly-grid__header" aria-hidden="true">
            <span>{t("weekly.week")}</span>
            {visibleWeeks[0]?.days.map((day) => (
              <span key={day.dateKey}>{weekdayFormatter.format(day.date)}</span>
            ))}
          </div>
          <ol className="weekly-grid__weeks">
            {visibleWeeks.map((week) => (
              <li className="weekly-grid__week" key={week.dateKey}>
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
                </header>
                {week.days.map((day) => (
                  <div
                    className="weekly-day"
                    data-empty={day.workouts.length === 0}
                    key={day.dateKey}
                  >
                    <time className="visually-hidden" dateTime={day.dateKey}>
                      {new Intl.DateTimeFormat(localeFor(language), { dateStyle: "full" }).format(
                        day.date,
                      )}
                    </time>
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
                          onSelect={() =>
                            setSelectedWorkoutId((current) =>
                              current === workout.id ? null : workout.id,
                            )
                          }
                          key={workout.id}
                        />
                      ))
                    )}
                  </div>
                ))}
                {selectedWorkout &&
                  week.workouts.some((workout) => workout.id === selectedWorkout.id) && (
                    <section
                      className="weekly-detail"
                      id="weekly-workout-detail"
                      aria-labelledby="weekly-detail-title"
                    >
                      <header>
                        <div>
                          <p className="eyebrow">{t("weekly.selectedEyebrow")}</p>
                          <h2 id="weekly-detail-title">{t("weekly.selectedTitle")}</h2>
                        </div>
                        <button
                          className="quiet-action"
                          type="button"
                          onClick={() => setSelectedWorkoutId(null)}
                        >
                          {t("weekly.closeDetails")}
                        </button>
                      </header>
                      <WorkoutCard workout={selectedWorkout} />
                    </section>
                  )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <nav className="weekly-pagination" aria-label={t("weekly.pagination")}>
        <button
          className="quiet-action"
          type="button"
          disabled={page === 0}
          onClick={() => changePage(page - 1)}
        >
          ← {t("weekly.newer")}
        </button>
        <span>{t("weekly.page", { current: page + 1, total: totalPages })}</span>
        <button
          className="quiet-action"
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => changePage(page + 1)}
        >
          {t("weekly.older")} →
        </button>
      </nav>
    </section>
  );
}
