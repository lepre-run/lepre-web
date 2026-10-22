import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import { formatDistance, formatDuration, formatPace } from "../../../i18n/formatters";
import type { SourceLapData } from "../SourceLapEvidence/SourceLapEvidence";
import { measurementText } from "../sourceLapData";

type RowProps<Role> = Readonly<{
  lap: SourceLapData<Role>;
  language: string;
  label: string;
  detail: string;
  className: string;
  testId: string;
  style?: CSSProperties;
  dataRole?: string;
}>;

function LapExecutionRow<Role>(props: RowProps<Role>): JSX.Element {
  const { t } = useTranslation();
  const { lap, language, label, detail, className, testId, style, dataRole } = props;
  return (
    <li className={className} data-role={dataRole} data-testid={testId} style={style}>
      <div className="stage-row__identity">
        <span>{label}</span>
        <small>{detail}</small>
      </div>
      <div className="stage-row__pace">
        <strong>{formatPace(lap.movingTime, lap.distance)}</strong>
        <span className="stage-row__bar" aria-hidden="true" />
      </div>
      <span>
        {formatDistance(lap.distance, language)} · {formatDuration(lap.movingTime)}
      </span>
      <span className="stage-row__heart-rate">
        {t("workout.averageHeartRateShort")} {measurementText(lap.averageHeartRate)}
      </span>
    </li>
  );
}

export function LapExecutionRows<Role>({
  laps,
  language,
  styles,
  label,
  detail,
  testId,
  rowClassName = "stage-row",
  listClassName = "stage-matrix",
  dataRole,
}: Readonly<{
  laps: ReadonlyArray<SourceLapData<Role>>;
  language: string;
  styles: ReadonlyArray<CSSProperties>;
  label: (lap: SourceLapData<Role>, index: number) => string;
  detail: (lap: SourceLapData<Role>, index: number) => string;
  testId: string;
  rowClassName?: string;
  listClassName?: string;
  dataRole?: (lap: SourceLapData<Role>) => string;
}>): JSX.Element {
  return (
    <ol className={listClassName}>
      {laps.map((lap, index) => (
        <LapExecutionRow
          key={lap.number}
          lap={lap}
          language={language}
          label={label(lap, index)}
          detail={detail(lap, index)}
          className={rowClassName}
          testId={testId}
          style={{ ...styles[index], "--stage-order": index } as CSSProperties}
          dataRole={dataRole?.(lap)}
        />
      ))}
    </ol>
  );
}
