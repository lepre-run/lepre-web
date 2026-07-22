import type { TFunction } from "i18next";
import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import { formatDistance, formatDuration, formatHeartRate, formatPace } from "../../i18n/formatters";
import type { Measurement, NonEmptyReadonlyArray } from "./workoutCardData";

export type SourceLapData<Role> = Readonly<{
  number: number;
  name: string;
  role: Role;
  distance: DistanceMeters;
  movingTime: DurationSeconds;
  elapsedTime: DurationSeconds;
  averageHeartRate: Measurement<number>;
  maximumHeartRate: Measurement<number>;
}>;

function measurementText(
  measurement: Measurement<number>,
  format: (value: number) => string,
): string {
  return measurement.kind === "recorded" ? format(measurement.value) : "—";
}

export function SourceLapEvidence<Role>({
  sourceLaps,
  language,
  roleLabel,
  dataRole,
}: Readonly<{
  sourceLaps: NonEmptyReadonlyArray<SourceLapData<Role>>;
  language: string;
  roleLabel: (role: Role, t: TFunction) => string;
  dataRole: (role: Role) => string;
}>): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <details
      className="source-evidence"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <span>{t("workout.sourceLapEvidence")}</span>
        <span className="source-evidence__summary-meta">
          <span className="source-evidence__lap-count">
            {t("workout.lapCount", { count: sourceLaps.length })}
          </span>
          <span className="source-evidence__action">
            {t(expanded ? "workout.collapseEvidence" : "workout.expandEvidence")}
            <span className="source-evidence__chevron" aria-hidden="true" />
          </span>
        </span>
      </summary>
      <div className="evidence-table-scroll">
        <table className="evidence-table">
          <caption className="visually-hidden">{t("workout.sourceLapEvidence")}</caption>
          <thead>
            <tr className="evidence-table__header">
              <th scope="col">{t("workout.lap")}</th>
              <th scope="col">{t("workout.role")}</th>
              <th scope="col">{t("workout.distance")}</th>
              <th scope="col">{t("workout.time")}</th>
              <th scope="col">{t("workout.pace")}</th>
              <th scope="col">{t("workout.heartRateEvidence")}</th>
            </tr>
          </thead>
          <tbody>
            {sourceLaps.map((lap) => (
              <tr className="evidence-row" key={lap.number} data-role={dataRole(lap.role)}>
                <td data-label={t("workout.lap")}>
                  <span className="evidence-row__lap">
                    <small>{String(lap.number).padStart(2, "0")}</small>
                    <strong>{lap.name}</strong>
                  </span>
                </td>
                <td data-label={t("workout.role")}>{roleLabel(lap.role, t)}</td>
                <td data-label={t("workout.distance")}>{formatDistance(lap.distance, language)}</td>
                <td data-label={t("workout.time")}>{formatDuration(lap.movingTime)}</td>
                <td data-label={t("workout.pace")}>
                  <strong>{formatPace(lap.movingTime, lap.distance)}</strong>
                </td>
                <td data-label={t("workout.heartRateEvidence")}>
                  {measurementText(lap.averageHeartRate, (value) => Math.round(value).toString())} /{" "}
                  {measurementText(lap.maximumHeartRate, formatHeartRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
