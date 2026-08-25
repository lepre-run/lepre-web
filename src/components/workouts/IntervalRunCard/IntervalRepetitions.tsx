import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { formatDistance, formatDuration, formatPace } from "../../../i18n/formatters";
import { measurementText } from "../sourceLapData";
import type { IntervalLapProps, IntervalRepetitionProps } from "./intervalRunCardTypes";

function IntervalRoleIcon({ kind }: Readonly<{ kind: "work" | "recovery" }>): JSX.Element {
  return (
    <svg
      className="interval-cell__role-icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      {kind === "work" ? (
        <path d="M 11.5 1.5 L 4.8 10.5 L 9.2 10.2 L 7.7 18.3 L 15.2 8.3 L 10.7 8.6 Z" />
      ) : (
        <>
          <path d="M 6.3 3.2 C 6 7.6, 6.5 12.1, 6.1 16.8" />
          <path d="M 13.6 3 C 13.9 7.4, 13.4 12.3, 13.8 16.6" />
        </>
      )}
    </svg>
  );
}

function IntervalCell({
  lap,
  label,
  language,
  kind,
}: Readonly<{
  lap: IntervalLapProps;
  label: string;
  language: string;
  kind: "work" | "recovery";
}>): JSX.Element {
  const { t } = useTranslation();
  const stroke =
    kind === "work"
      ? "M 2 6 C 39 2, 78 9, 158 5"
      : "M 2 6 C 18 1, 31 11, 47 6 S 76 1, 92 6 S 121 11, 145 5";
  return (
    <div className={`repetition-cell repetition-cell--${kind}`}>
      <span className="repetition-cell__label">
        <IntervalRoleIcon kind={kind} />
        <span>{label}</span>
        <small>· {t("workout.lapNumber", { number: lap.sourceLapNumber })}</small>
      </span>
      <strong>{formatPace(lap.time, lap.distance)}</strong>
      <svg
        className="interval-cell__stroke"
        viewBox="0 0 160 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={stroke} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="interval-cell__details">
        {formatDistance(lap.distance, language)} · {formatDuration(lap.time)}
      </span>
      <span className="repetition-cell__heart-rate">
        {t("workout.averageHeartRateShort")} {measurementText(lap.averageHeartRate)}
      </span>
    </div>
  );
}

function MissingRecovery({ number }: Readonly<{ number: number }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="repetition-cell repetition-cell--recovery repetition-cell--missing">
      <span className="repetition-cell__label">
        <IntervalRoleIcon kind="recovery" />
        <span>{t("lapRole.recoveryNumber", { repetition: number })}</span>
      </span>
      <strong>—</strong>
      <span>{t("workout.noRecoveryLap")}</span>
    </div>
  );
}

function lapReference(
  repetition: IntervalRepetitionProps,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  return repetition.kind === "work-and-recovery"
    ? t("workout.lapPair", {
        work: repetition.work.sourceLapNumber,
        recovery: repetition.recovery.sourceLapNumber,
      })
    : t("workout.lapNumber", { number: repetition.work.sourceLapNumber });
}

export function IntervalRepetitionRow({
  repetition,
  language,
}: Readonly<{
  repetition: IntervalRepetitionProps;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <li className="repetition-row" data-testid="interval-repetition-row">
      <div className="repetition-row__identity">
        <strong>{String(repetition.number).padStart(2, "0")}</strong>
        <span>{lapReference(repetition, t)}</span>
      </div>
      <IntervalCell
        lap={repetition.work}
        label={t("lapRole.interval", { repetition: repetition.number })}
        language={language}
        kind="work"
      />
      {repetition.kind === "work-and-recovery" ? (
        <IntervalCell
          lap={repetition.recovery}
          label={t("lapRole.recoveryNumber", { repetition: repetition.number })}
          language={language}
          kind="recovery"
        />
      ) : (
        <MissingRecovery number={repetition.number} />
      )}
    </li>
  );
}
