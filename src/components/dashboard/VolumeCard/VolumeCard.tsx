import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { WeeklyVolumeInsight } from "../../../domain/training-dashboard";
import { CountUp } from "../../ui";
import { DashboardCard } from "../DashboardCard/DashboardCard";
import { decimal } from "../dashboardFormatters";
import { Trend } from "../Trend/Trend";

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
        <CountUp
          value={insight.averageWeeklyDistanceMeters / 1_000}
          format={(kilometers) => decimal(kilometers, language)}
        />
        <small>km</small>
      </p>
      <p className="condition-card__context">
        <CountUp
          value={insight.distanceMeters / 1_000}
          format={(kilometers) =>
            t("dashboard.volume.total", {
              distance: decimal(kilometers, language),
              count: insight.workoutCount,
            })
          }
        />
      </p>
      <footer>
        <span>{t("dashboard.volume.window", { count: windowDays / 7 })}</span>
        <Trend trend={insight.trend} language={language} kind="volume" />
      </footer>
    </DashboardCard>
  );
}
