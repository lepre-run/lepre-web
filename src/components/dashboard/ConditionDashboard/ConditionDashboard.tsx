import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { createTrainingDashboard } from "../../../domain/training-dashboard";
import type { Workout } from "../../../domain/workout";
import { localeFor } from "../../../i18n/i18n";
import { EasyPaceCard } from "../EasyPaceCard/EasyPaceCard";
import { IntervalsCard } from "../IntervalsCard/IntervalsCard";
import { TrainingMixCard } from "../TrainingMixCard/TrainingMixCard";
import { VolumeCard } from "../VolumeCard/VolumeCard";

export function ConditionDashboard({
  workouts,
}: Readonly<{ workouts: ReadonlyArray<Workout> }>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const dashboard = createTrainingDashboard(workouts);
  if (dashboard === null) return null;
  const through = new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dashboard.through));

  return (
    <section className="condition-dashboard" aria-labelledby="condition-dashboard-title">
      <header className="condition-dashboard__header">
        <div>
          <p className="eyebrow">{t("dashboard.eyebrow")}</p>
          <h1 id="condition-dashboard-title">{t("dashboard.title")}</h1>
          <p className="condition-dashboard__summary">
            {t("dashboard.summary", { count: dashboard.workoutCount })}
          </p>
        </div>
        <div className="condition-dashboard__window">
          <strong>{t("dashboard.window")}</strong>
          <span>{t("dashboard.through", { date: through })}</span>
        </div>
      </header>
      <div className="condition-dashboard__grid">
        <EasyPaceCard insight={dashboard.easyPace} language={language} />
        <IntervalsCard insight={dashboard.referenceIntervals} language={language} />
        <VolumeCard
          insight={dashboard.weeklyVolume}
          language={language}
          windowDays={dashboard.windowDays}
        />
        <TrainingMixCard mix={dashboard.trainingMix} />
      </div>
      <p className="condition-dashboard__method">{t("dashboard.method")}</p>
    </section>
  );
}
