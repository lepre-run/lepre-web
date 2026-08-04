import type { TFunction } from "i18next";
import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import {
  formatDistance,
  formatDuration,
  formatHeartRate,
  formatPace,
} from "../../../i18n/formatters";
import { Table } from "../../ui";
import type { Measurement, NonEmptyReadonlyArray } from "../workoutCardData";

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
      <Table
        containerClassName="evidence-table-scroll"
        className="evidence-table"
        headerRowClassName="evidence-table__header"
        caption={t("workout.sourceLapEvidence")}
        columns={[
          { id: "lap", label: t("workout.lap") },
          { id: "role", label: t("workout.role") },
          { id: "distance", label: t("workout.distance") },
          { id: "time", label: t("workout.time") },
          { id: "pace", label: t("workout.pace") },
          { id: "heart-rate", label: t("workout.heartRateEvidence") },
        ]}
      >
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
      </Table>
    </details>
  );
}
