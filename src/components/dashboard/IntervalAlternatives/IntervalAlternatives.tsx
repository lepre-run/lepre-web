import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { IntervalFormatInsight } from "../../../domain/training-dashboard";
import { formatStageMeasure } from "../../../i18n/formatters";
import { intervalProtocol, paceValue } from "../dashboardFormatters";

export function IntervalAlternatives({
  formats,
  language,
}: Readonly<{
  formats: ReadonlyArray<IntervalFormatInsight>;
  language: string;
}>): JSX.Element | null {
  const { t } = useTranslation();
  if (formats.length === 0) return null;
  return (
    <details className="interval-alternatives">
      <summary>{t("dashboard.intervals.alternatives", { count: formats.length })}</summary>
      <ul>
        {formats.map((format) => (
          <li
            key={`${format.work.kind}-${formatStageMeasure(format.work, language)}-${format.recovery.kind}-${formatStageMeasure(format.recovery, language)}`}
          >
            <strong>{intervalProtocol(format, language, t)}</strong>
            <span>
              {paceValue(format.secondsPerKilometer)} /km ·{" "}
              {t("dashboard.intervals.sessions", { count: format.sessionCount })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
