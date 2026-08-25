import type { TFunction } from "i18next";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { LapExecutionRows } from "../LapExecutionRows/LapExecutionRows";
import { relativePaceStyles } from "../sourceLapData";
import type { NonEmptyReadonlyArray } from "../workoutCardData";
import { IntervalRepetitionRow } from "./IntervalRepetitions";
import type {
  IntervalRepetitionProps,
  IntervalSourceLapProps,
  IntervalSourceLapRole,
} from "./intervalRunCardTypes";

export function intervalRoleLabel(role: IntervalSourceLapRole, t: TFunction): string {
  if (role.kind === "work") return t("lapRole.interval", { repetition: role.repetitionNumber });
  if (role.kind === "recovery")
    return t("lapRole.recoveryNumber", { repetition: role.repetitionNumber });
  return t(`lapRole.${role.kind}`);
}

function BoundaryLaps({
  sourceLaps,
  allSourceLaps,
  language,
}: Readonly<{
  sourceLaps: ReadonlyArray<IntervalSourceLapProps>;
  allSourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>;
  language: string;
}>): JSX.Element | null {
  const { t } = useTranslation();
  if (sourceLaps.length === 0) return null;
  const allStyles = relativePaceStyles(allSourceLaps);
  const styles = sourceLaps.map((lap) => allStyles[allSourceLaps.indexOf(lap)]);
  return (
    <LapExecutionRows
      laps={sourceLaps}
      language={language}
      styles={styles}
      label={(lap) => intervalRoleLabel(lap.role, t)}
      detail={(lap) => t("workout.lapNumber", { number: lap.number })}
      testId="interval-boundary-lap-row"
      rowClassName="stage-row interval-lap-row"
      listClassName="stage-matrix interval-boundary-laps"
      dataRole={(lap) => lap.role.kind}
    />
  );
}

function boundaryLaps(sourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>) {
  const isCore = (lap: IntervalSourceLapProps) =>
    lap.role.kind === "work" || lap.role.kind === "recovery";
  const first = sourceLaps.findIndex(isCore);
  const reversedLast = [...sourceLaps].reverse().findIndex(isCore);
  const last = reversedLast < 0 ? -1 : sourceLaps.length - reversedLast - 1;
  return { leading: sourceLaps.slice(0, first), trailing: sourceLaps.slice(last + 1) };
}

export function IntervalRunExecution({
  repetitions,
  sourceLaps,
  language,
}: Readonly<{
  repetitions: NonEmptyReadonlyArray<IntervalRepetitionProps>;
  sourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const boundary = boundaryLaps(sourceLaps);
  return (
    <section
      className="execution-section"
      aria-label={t("classification.intervalsBadgeWithCount", { count: repetitions.length })}
    >
      <BoundaryLaps sourceLaps={boundary.leading} allSourceLaps={sourceLaps} language={language} />
      <ol className="repetition-matrix interval-repetition-matrix">
        {repetitions.map((repetition) => (
          <IntervalRepetitionRow
            repetition={repetition}
            language={language}
            key={repetition.number}
          />
        ))}
      </ol>
      <BoundaryLaps sourceLaps={boundary.trailing} allSourceLaps={sourceLaps} language={language} />
    </section>
  );
}
