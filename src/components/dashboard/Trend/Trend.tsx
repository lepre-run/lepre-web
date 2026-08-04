import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { RelativeTrend } from "../../../domain/training-dashboard";
import { decimal } from "../dashboardFormatters";

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
  if (trend === null) {
    const label =
      kind === "volume"
        ? t("dashboard.trend.noVolumeComparison")
        : kind === "intervals"
          ? t("dashboard.intervals.noComparison")
          : t("dashboard.trend.noComparison");
    return <span className="condition-card__trend">{label}</span>;
  }
  const value = decimal(Math.abs(trend.percent), language, kind === "volume" ? 0 : 1);
  const label =
    kind === "volume"
      ? trend.direction === "steady"
        ? t("dashboard.trend.volumeSteady")
        : t(trend.direction === "up" ? "dashboard.trend.volumeUp" : "dashboard.trend.volumeDown", {
            value,
          })
      : kind === "intervals"
        ? trend.direction === "steady"
          ? t("dashboard.intervals.steady")
          : t(trend.direction === "up" ? "dashboard.intervals.up" : "dashboard.intervals.down", {
              value,
            })
        : trend.direction === "steady"
          ? t("dashboard.trend.steady")
          : t(trend.direction === "up" ? "dashboard.trend.up" : "dashboard.trend.down", { value });
  return (
    <span className="condition-card__trend" data-direction={trend.direction}>
      {label}
    </span>
  );
}
