import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { IntervalBenchmarkInsight } from "../../../domain/training-dashboard";
import { DashboardCard } from "../DashboardCard/DashboardCard";
import { intervalProtocol, paceValue } from "../dashboardFormatters";
import { EvidenceBadge } from "../EvidenceBadge/EvidenceBadge";
import { IntervalAlternatives } from "../IntervalAlternatives/IntervalAlternatives";
import { Trend } from "../Trend/Trend";

export function IntervalsCard({
  insight,
  language,
}: Readonly<{ insight: IntervalBenchmarkInsight | null; language: string }>): JSX.Element {
  const { t } = useTranslation();
  const primary = insight?.primary;
  return (
    <DashboardCard
      kind="intervals"
      title={t("dashboard.intervals.title")}
      badge={primary && <EvidenceBadge strength={primary.evidence} />}
    >
      {primary ? (
        <>
          <p className="condition-card__metric">
            {paceValue(primary.secondsPerKilometer)}
            <small>/km</small>
          </p>
          <p className="condition-card__context condition-card__context--intervals">
            <strong>{intervalProtocol(primary, language, t)}</strong>
            <span>{t("dashboard.intervals.selectedReason", { count: primary.sessionCount })}</span>
          </p>
          <IntervalAlternatives formats={insight.alternatives} language={language} />
          <footer>
            <span>{t("dashboard.intervals.sessions", { count: primary.sessionCount })}</span>
            <Trend trend={primary.trend} language={language} kind="intervals" />
          </footer>
        </>
      ) : (
        <div className="condition-card__empty">
          <strong>{t("dashboard.notEnoughData")}</strong>
          <p>{t("dashboard.intervals.empty")}</p>
        </div>
      )}
    </DashboardCard>
  );
}
