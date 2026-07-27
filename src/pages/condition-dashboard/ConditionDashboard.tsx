import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  createTrainingDashboard,
  type EvidenceStrength,
  type IntervalFormatInsight,
  type RelativeTrend,
} from "../../domain/training-dashboard";
import type { Workout } from "../../domain/workout";
import { formatStageMeasure } from "../../i18n/formatters";
import { localeFor } from "../../i18n/i18n";

function paceValue(secondsPerKilometer: number): string {
  const rounded = Math.round(secondsPerKilometer);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${(rounded % 60).toString().padStart(2, "0")}`;
}

function decimal(value: number, language: string, digits = 1): string {
  return new Intl.NumberFormat(localeFor(language), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function EvidenceBadge({ strength }: Readonly<{ strength: EvidenceStrength }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <span className="condition-card__evidence" data-strength={strength}>
      {t(`dashboard.evidence.${strength}`)}
    </span>
  );
}

function PaceTrend({
  trend,
  language,
}: Readonly<{ trend: RelativeTrend | null; language: string }>): JSX.Element {
  const { t } = useTranslation();
  if (trend === null) {
    return <span className="condition-card__trend">{t("dashboard.trend.noComparison")}</span>;
  }
  return (
    <span className="condition-card__trend" data-direction={trend.direction}>
      {trend.direction === "steady"
        ? t("dashboard.trend.steady")
        : t(`dashboard.trend.${trend.direction}`, {
            value: decimal(Math.abs(trend.percent), language),
          })}
    </span>
  );
}

function VolumeTrend({
  trend,
  language,
}: Readonly<{ trend: RelativeTrend | null; language: string }>): JSX.Element {
  const { t } = useTranslation();
  if (trend === null) {
    return <span className="condition-card__trend">{t("dashboard.trend.noVolumeComparison")}</span>;
  }
  return (
    <span className="condition-card__trend" data-direction={trend.direction}>
      {trend.direction === "steady"
        ? t("dashboard.trend.volumeSteady")
        : t(`dashboard.trend.volume${trend.direction === "up" ? "Up" : "Down"}`, {
            value: decimal(Math.abs(trend.percent), language, 0),
          })}
    </span>
  );
}

function IntervalTrend({
  trend,
  language,
}: Readonly<{ trend: RelativeTrend | null; language: string }>): JSX.Element {
  const { t } = useTranslation();
  if (trend === null) {
    return <span className="condition-card__trend">{t("dashboard.intervals.noComparison")}</span>;
  }
  return (
    <span className="condition-card__trend" data-direction={trend.direction}>
      {trend.direction === "steady"
        ? t("dashboard.intervals.steady")
        : t(`dashboard.intervals.${trend.direction}`, {
            value: decimal(Math.abs(trend.percent), language),
          })}
    </span>
  );
}

function intervalProtocol(
  format: IntervalFormatInsight,
  language: string,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  return t("dashboard.intervals.protocol", {
    repetitions: format.repetitions,
    work: formatStageMeasure(format.work, language),
    recovery: formatStageMeasure(format.recovery, language),
    variation: decimal(format.repetitionVariationPercent, language),
  });
}

export function ConditionDashboard({
  workouts,
}: Readonly<{ workouts: ReadonlyArray<Workout> }>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const dashboard = createTrainingDashboard(workouts);
  if (dashboard === null) return null;

  const mix = dashboard.trainingMix;
  const classified = mix.low + mix.moderate + mix.high;
  const lowWidth = classified === 0 ? 0 : (mix.low / classified) * 100;
  const moderateWidth = classified === 0 ? 0 : (mix.moderate / classified) * 100;
  const highWidth = classified === 0 ? 0 : (mix.high / classified) * 100;
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
        <article className="condition-card condition-card--pace">
          <header>
            <h2>{t("dashboard.easyPace.title")}</h2>
            {dashboard.easyPace && <EvidenceBadge strength={dashboard.easyPace.evidence} />}
          </header>
          {dashboard.easyPace ? (
            <>
              <p className="condition-card__metric">
                {paceValue(dashboard.easyPace.secondsPerKilometer)}
                <small>/km</small>
              </p>
              <p className="condition-card__context">
                {dashboard.easyPace.medianHeartRateBpm === null
                  ? t("dashboard.easyPace.range", {
                      fastest: paceValue(dashboard.easyPace.fastestSecondsPerKilometer),
                      slowest: paceValue(dashboard.easyPace.slowestSecondsPerKilometer),
                    })
                  : t("dashboard.easyPace.rangeWithHeartRate", {
                      fastest: paceValue(dashboard.easyPace.fastestSecondsPerKilometer),
                      slowest: paceValue(dashboard.easyPace.slowestSecondsPerKilometer),
                      heartRate: Math.round(dashboard.easyPace.medianHeartRateBpm),
                    })}
              </p>
              <footer>
                <span>
                  {t("dashboard.easyPace.runs", { count: dashboard.easyPace.workoutCount })}
                </span>
                <PaceTrend trend={dashboard.easyPace.trend} language={language} />
              </footer>
            </>
          ) : (
            <div className="condition-card__empty">
              <strong>{t("dashboard.notEnoughData")}</strong>
              <p>{t("dashboard.easyPace.empty")}</p>
            </div>
          )}
        </article>

        <article className="condition-card condition-card--intervals">
          <header>
            <h2>{t("dashboard.intervals.title")}</h2>
            {dashboard.referenceIntervals && (
              <EvidenceBadge strength={dashboard.referenceIntervals.primary.evidence} />
            )}
          </header>
          {dashboard.referenceIntervals ? (
            <>
              <p className="condition-card__metric">
                {paceValue(dashboard.referenceIntervals.primary.secondsPerKilometer)}
                <small>/km</small>
              </p>
              <p className="condition-card__context condition-card__context--intervals">
                <strong>
                  {intervalProtocol(dashboard.referenceIntervals.primary, language, t)}
                </strong>
                <span>
                  {t("dashboard.intervals.selectedReason", {
                    count: dashboard.referenceIntervals.primary.sessionCount,
                  })}
                </span>
              </p>
              {dashboard.referenceIntervals.alternatives.length > 0 && (
                <details className="interval-alternatives">
                  <summary>
                    {t("dashboard.intervals.alternatives", {
                      count: dashboard.referenceIntervals.alternatives.length,
                    })}
                  </summary>
                  <ul>
                    {dashboard.referenceIntervals.alternatives.map((format) => (
                      <li
                        key={`${format.work.kind}-${formatStageMeasure(format.work, language)}-${format.recovery.kind}-${formatStageMeasure(format.recovery, language)}`}
                      >
                        <strong>{intervalProtocol(format, language, t)}</strong>
                        <span>
                          {paceValue(format.secondsPerKilometer)} /km ·{" "}
                          {t("dashboard.intervals.sessions", {
                            count: format.sessionCount,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <footer>
                <span>
                  {t("dashboard.intervals.sessions", {
                    count: dashboard.referenceIntervals.primary.sessionCount,
                  })}
                </span>
                <IntervalTrend
                  trend={dashboard.referenceIntervals.primary.trend}
                  language={language}
                />
              </footer>
            </>
          ) : (
            <div className="condition-card__empty">
              <strong>{t("dashboard.notEnoughData")}</strong>
              <p>{t("dashboard.intervals.empty")}</p>
            </div>
          )}
        </article>

        <article className="condition-card condition-card--volume">
          <header>
            <h2>{t("dashboard.volume.title")}</h2>
            <span className="condition-card__period">{t("dashboard.perWeek")}</span>
          </header>
          <p className="condition-card__metric">
            {decimal(dashboard.weeklyVolume.averageWeeklyDistanceMeters / 1_000, language)}
            <small>km</small>
          </p>
          <p className="condition-card__context">
            {t("dashboard.volume.total", {
              distance: decimal(dashboard.weeklyVolume.distanceMeters / 1_000, language),
              count: dashboard.weeklyVolume.workoutCount,
            })}
          </p>
          <footer>
            <span>{t("dashboard.volume.window", { count: dashboard.windowDays / 7 })}</span>
            <VolumeTrend trend={dashboard.weeklyVolume.trend} language={language} />
          </footer>
        </article>

        <article className="condition-card condition-card--mix">
          <header>
            <h2>{t("dashboard.mix.title")}</h2>
            <span className="condition-card__period">{t("dashboard.mix.sessionPurpose")}</span>
          </header>
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
            <span className="training-mix__low" style={{ width: `${lowWidth}%` }} />
            <span className="training-mix__moderate" style={{ width: `${moderateWidth}%` }} />
            <span className="training-mix__high" style={{ width: `${highWidth}%` }} />
            <i aria-hidden="true" title={t("dashboard.mix.reference")} />
          </div>
          <p className="condition-card__context condition-card__context--legend">
            <span>{t("dashboard.mix.lowCount", { count: mix.low })}</span>
            <span>{t("dashboard.mix.moderateCount", { count: mix.moderate })}</span>
            <span>{t("dashboard.mix.highCount", { count: mix.high })}</span>
          </p>
          <footer>
            <span>
              {t("dashboard.mix.coverage", {
                value: Math.round(mix.classifiedSharePercent),
              })}
            </span>
            <span className="condition-card__trend">{t("dashboard.mix.reference")}</span>
          </footer>
        </article>
      </div>

      <p className="condition-dashboard__method">{t("dashboard.method")}</p>
    </section>
  );
}
