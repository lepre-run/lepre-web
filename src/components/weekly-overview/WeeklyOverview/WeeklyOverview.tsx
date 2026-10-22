import { type JSX, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../../domain/workout";
import { localeFor } from "../../../i18n/i18n";
import { Pagination } from "../../ui";
import { WeekRow } from "../WeekRow/WeekRow";
import { pageCount, weeksOnPage, workoutWeeks } from "../weeklyOverview";
import { NO_ARRIVALS, type WorkoutArrivals } from "../workoutArrivals";

export function WeeklyOverview({
  workouts,
  arrivals = NO_ARRIVALS,
}: Readonly<{ workouts: ReadonlyArray<Workout>; arrivals?: WorkoutArrivals }>): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const weeks = useMemo(() => workoutWeeks(workouts), [workouts]);
  const totalPages = pageCount(weeks);
  const [page, setPage] = useState(0);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const visibleWeeks = weeksOnPage(weeks, Math.min(page, totalPages - 1));
  const weekdays = new Intl.DateTimeFormat(localeFor(language), { weekday: "short" });
  const changePage = (next: number): void => {
    setPage(next);
    setSelectedWorkoutId(null);
  };
  const selectWorkout = (id: string): void =>
    setSelectedWorkoutId((current) => (current === id ? null : id));

  return (
    <section className="weekly-overview" aria-label={t("weekly.label")}>
      <div className="weekly-overview__scroll">
        <div className="weekly-grid">
          <div className="weekly-grid__header" aria-hidden="true">
            <span>{t("weekly.week")}</span>
            {visibleWeeks[0]?.days.map((day) => (
              <span key={day.dateKey}>{weekdays.format(day.date)}</span>
            ))}
          </div>
          <ol className="weekly-grid__weeks">
            {visibleWeeks.map((week) => (
              <WeekRow
                week={week}
                language={language}
                selectedWorkoutId={selectedWorkoutId}
                onSelect={selectWorkout}
                onClose={() => setSelectedWorkoutId(null)}
                weekdayFormatter={weekdays}
                arrivals={arrivals}
                key={week.dateKey}
              />
            ))}
          </ol>
        </div>
      </div>
      <Pagination
        className="weekly-pagination"
        ariaLabel={t("weekly.pagination")}
        previousLabel={`← ${t("weekly.newer")}`}
        nextLabel={`${t("weekly.older")} →`}
        pageLabel={t("weekly.page", { current: page + 1, total: totalPages })}
        previousDisabled={page === 0}
        nextDisabled={page >= totalPages - 1}
        onPrevious={() => changePage(page - 1)}
        onNext={() => changePage(page + 1)}
      />
    </section>
  );
}
