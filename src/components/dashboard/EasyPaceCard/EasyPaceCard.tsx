import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { EasyPaceInsight } from "../../../domain/training-dashboard";
import { DashboardCard } from "../DashboardCard/DashboardCard";
import { paceValue } from "../dashboardFormatters";
import { EvidenceBadge } from "../EvidenceBadge/EvidenceBadge";
import { Trend } from "../Trend/Trend";

export function EasyPaceCard({
  insight,
  language,
}: Readonly<{ insight: EasyPaceInsight | null; language: string }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <DashboardCard
      kind="pace"
      title={t("dashboard.easyPace.title")}
      badge={insight && <EvidenceBadge strength={insight.evidence} />}
    >
      {insight ? (
        <>
          <p className="condition-card__metric">
            {paceValue(insight.secondsPerKilometer)}
            <small>/km</small>
          </p>
          <p className="condition-card__context">
            {t(
              insight.medianHeartRateBpm === null
                ? "dashboard.easyPace.range"
                : "dashboard.easyPace.rangeWithHeartRate",
              {
                fastest: paceValue(insight.fastestSecondsPerKilometer),
                slowest: paceValue(insight.slowestSecondsPerKilometer),
                heartRate: Math.round(insight.medianHeartRateBpm ?? 0),
              },
            )}
          </p>
          <footer>
            <span>{t("dashboard.easyPace.runs", { count: insight.workoutCount })}</span>
            <Trend trend={insight.trend} language={language} kind="pace" />
          </footer>
        </>
      ) : (
        <div className="condition-card__empty">
          <strong>{t("dashboard.notEnoughData")}</strong>
          <p>{t("dashboard.easyPace.empty")}</p>
        </div>
      )}
    </DashboardCard>
  );
}
