import type { TFunction } from "i18next";
import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import type { Workout } from "../../../domain/workout";
import { formatDistance, formatDuration, formatPace } from "../../../i18n/formatters";
import { JournalWorkoutCard } from "../JournalWorkoutCard/JournalWorkoutCard";
import { journalCardShapeSeed } from "../journalCardShape";
import { type SourceLapData, SourceLapEvidence } from "../SourceLapEvidence/SourceLapEvidence";
import {
  type CommonWorkoutCardProps,
  commonWorkoutCardPropsFromWorkout,
  type Measurement,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "../workoutCardData";

export type FreeRunLapRole = Readonly<{ kind: "main" }>;
export type FreeRunLapProps = SourceLapData<FreeRunLapRole>;

export type FreeRunLapData =
  | Readonly<{ kind: "available"; laps: NonEmptyReadonlyArray<FreeRunLapProps> }>
  | Readonly<{ kind: "unavailable" }>;

export type FreeRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    lapData: FreeRunLapData;
    shapeSeed: number;
  }>;

type LapStyle = CSSProperties & Readonly<{ "--stage-progress": string }>;

function asDistance(value: number): DistanceMeters {
  return value as DistanceMeters;
}

function asDuration(value: number): DurationSeconds {
  return value as DurationSeconds;
}

export function freeRunCardPropsFromWorkout(workout: Workout): FreeRunCardProps {
  if (workout.structure.kind !== "free-run") {
    throw new Error("a free-run card requires a free-run workout");
  }

  const mappedLaps = workout.laps.map(
    (lap): FreeRunLapProps => ({
      number: lap.index,
      name: lap.name,
      role: { kind: "main" },
      distance: asDistance(lap.distanceMeters),
      movingTime: asDuration(lap.movingDurationSeconds),
      elapsedTime: asDuration(lap.elapsedDurationSeconds),
      averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
      maximumHeartRate: recordedOrUnavailable(lap.maxHeartRateBpm),
    }),
  );
  const [firstLap, ...remainingLaps] = mappedLaps;
  const lapData: FreeRunLapData =
    firstLap === undefined
      ? { kind: "unavailable" }
      : { kind: "available", laps: [firstLap, ...remainingLaps] };

  return {
    ...commonWorkoutCardPropsFromWorkout(workout),
    lapData,
    shapeSeed: journalCardShapeSeed(workout.id),
  };
}

function measurementText(measurement: Measurement<number>): string {
  return measurement.kind === "recorded" ? Math.round(measurement.value).toString() : "—";
}

function paceSecondsPerKilometer(lap: FreeRunLapProps): number {
  return lap.distance > 0 ? (lap.movingTime / lap.distance) * 1_000 : Number.POSITIVE_INFINITY;
}

function lapStyles(laps: NonEmptyReadonlyArray<FreeRunLapProps>): ReadonlyArray<LapStyle> {
  const distinctPaces = [...new Set(laps.map(paceSecondsPerKilometer))].sort(
    (left, right) => right - left,
  );
  return laps.map((lap) => {
    const rank = distinctPaces.indexOf(paceSecondsPerKilometer(lap));
    const intensity = distinctPaces.length <= 1 ? 0.5 : rank / (distinctPaces.length - 1);
    return { "--stage-progress": `${35 + intensity * 65}%` };
  });
}

function roleLabel(_role: FreeRunLapRole, t: TFunction): string {
  return t("lapRole.main");
}

function FreeRunLaps({
  laps,
  language,
}: Readonly<{
  laps: NonEmptyReadonlyArray<FreeRunLapProps>;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const styles = lapStyles(laps);
  return (
    <section className="execution-section" aria-label={t("workout.lapExecution")}>
      <ol className="stage-matrix">
        {laps.map((lap, index) => (
          <li
            className="stage-row"
            data-testid="free-run-lap-row"
            key={lap.number}
            style={styles[index]}
          >
            <div className="stage-row__identity">
              <span>{roleLabel(lap.role, t)}</span>
              <small>{t("workout.lapNumber", { number: lap.number })}</small>
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
        ))}
      </ol>
    </section>
  );
}

export function FreeRunCard({
  performedAt,
  category,
  lapData,
  shapeSeed,
  ...summary
}: FreeRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <JournalWorkoutCard
      kind="free-run"
      category={category}
      badge={t("classification.freeRun")}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
      compact
    >
      {lapData.kind === "available" ? (
        <div className="workout-card__structure">
          <FreeRunLaps laps={lapData.laps} language={language} />
          <SourceLapEvidence
            sourceLaps={lapData.laps}
            language={language}
            roleLabel={roleLabel}
            dataRole={() => "main"}
          />
        </div>
      ) : (
        <p className="no-laps">{t("workout.noLaps")}</p>
      )}
    </JournalWorkoutCard>
  );
}
