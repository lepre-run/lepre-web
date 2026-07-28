import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { WeeklyVolumeInsight } from "../../domain/training-dashboard";
import { DashboardCard, Trend } from "./DashboardCardParts";
import { decimal } from "./dashboardFormatters";

export function VolumeCard({
  insight,
  language,
  windowDays,
}: Readonly<{ insight: WeeklyVolumeInsight; language: string; windowDays: number }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <DashboardCard
      kind="volume"
      title={t("dashboard.volume.title")}
      badge={<span className="condition-card__period">{t("dashboard.perWeek")}</span>}
    >
      <p className="condition-card__metric">
        {decimal(insight.averageWeeklyDistanceMeters / 1_000, language)}
        <small>km</small>
      </p>
      <p className="condition-card__context">
        {t("dashboard.volume.total", {
          distance: decimal(insight.distanceMeters / 1_000, language),
          count: insight.workoutCount,
        })}
      </p>
      <footer>
        <span>{t("dashboard.volume.window", { count: windowDays / 7 })}</span>
        <Trend trend={insight.trend} language={language} kind="volume" />
      </footer>
    </DashboardCard>
  );
}
