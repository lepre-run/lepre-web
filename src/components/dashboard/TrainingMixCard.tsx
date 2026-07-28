import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { TrainingMixInsight } from "../../domain/training-dashboard";
import { DashboardCard } from "./DashboardCardParts";

export function TrainingMixCard({ mix }: Readonly<{ mix: TrainingMixInsight }>): JSX.Element {
  const { t } = useTranslation();
  const classified = mix.low + mix.moderate + mix.high;
  const width = (value: number): string => `${classified === 0 ? 0 : (value / classified) * 100}%`;
  return (
    <DashboardCard
      kind="mix"
      title={t("dashboard.mix.title")}
      badge={<span className="condition-card__period">{t("dashboard.mix.sessionPurpose")}</span>}
    >
      <p className="condition-card__metric">
        {mix.lowSharePercent === null ? "—" : Math.round(mix.lowSharePercent)}
        <small>% {t("dashboard.mix.low")}</small>
      </p>
      <div
        className="training-mix"
        role="img"
        aria-label={t("dashboard.mix.ariaLabel", {
          low: mix.low,
          moderate: mix.moderate,
          high: mix.high,
        })}
      >
        <span className="training-mix__low" style={{ width: width(mix.low) }} />
        <span className="training-mix__moderate" style={{ width: width(mix.moderate) }} />
        <span className="training-mix__high" style={{ width: width(mix.high) }} />
        <i aria-hidden="true" title={t("dashboard.mix.reference")} />
      </div>
      <p className="condition-card__context condition-card__context--legend">
        <span>{t("dashboard.mix.lowCount", { count: mix.low })}</span>
        <span>{t("dashboard.mix.moderateCount", { count: mix.moderate })}</span>
        <span>{t("dashboard.mix.highCount", { count: mix.high })}</span>
      </p>
      <footer>
        <span>
          {t("dashboard.mix.coverage", { value: Math.round(mix.classifiedSharePercent) })}
        </span>
        <span className="condition-card__trend">{t("dashboard.mix.reference")}</span>
      </footer>
    </DashboardCard>
  );
}
