import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { RelativeTrend } from "../../../domain/training-dashboard";
import { decimal } from "../dashboardFormatters";

const TREND_KEYS = {
  pace: {
    none: "dashboard.trend.noComparison",
    steady: "dashboard.trend.steady",
    up: "dashboard.trend.up",
    down: "dashboard.trend.down",
  },
  volume: {
    none: "dashboard.trend.noVolumeComparison",
    steady: "dashboard.trend.volumeSteady",
    up: "dashboard.trend.volumeUp",
    down: "dashboard.trend.volumeDown",
  },
  intervals: {
    none: "dashboard.intervals.noComparison",
    steady: "dashboard.intervals.steady",
    up: "dashboard.intervals.up",
    down: "dashboard.intervals.down",
  },
} as const;

export function Trend({
  trend,
  language,
  kind,
}: Readonly<{
  trend: RelativeTrend | null;
  language: string;
  kind: "pace" | "volume" | "intervals";
}>): JSX.Element {
  const { t } = useTranslation();
  const keys = TREND_KEYS[kind];
  if (trend === null) {
    return <span className="condition-card__trend">{t(keys.none)}</span>;
  }
  const value = decimal(Math.abs(trend.percent), language, kind === "volume" ? 0 : 1);
  const label = trend.direction === "steady" ? t(keys.steady) : t(keys[trend.direction], { value });
  return (
    <span className="condition-card__trend" data-direction={trend.direction}>
      {label}
    </span>
  );
}
