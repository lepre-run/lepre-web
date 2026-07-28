import type { TFunction } from "i18next";
import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import type { Workout } from "../../domain/workout";
import { formatDistance, formatDuration, formatPace } from "../../i18n/formatters";
import { JournalWorkoutCard } from "./JournalWorkoutCard";
import { journalCardShapeSeed } from "./journalCardShape";
import { type SourceLapData, SourceLapEvidence } from "./SourceLapEvidence";
import {
  type CommonWorkoutCardProps,
  commonWorkoutCardPropsFromWorkout,
  type Measurement,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "./workoutCardData";

export type RaceLapRole = Readonly<{ kind: "race"; splitNumber: number }>;
export type RaceLapProps = SourceLapData<RaceLapRole>;

export type RaceLapData =
  | Readonly<{ kind: "available"; laps: NonEmptyReadonlyArray<RaceLapProps> }>
  | Readonly<{ kind: "unavailable" }>;

export type RaceCardProps = Omit<CommonWorkoutCardProps, "category"> &
  Readonly<{
    category: "race";
    lapData: RaceLapData;
    shapeSeed: number;
  }>;

type SplitStyle = CSSProperties & Readonly<{ "--stage-progress": string }>;

function asDistance(value: number): DistanceMeters {
  return value as DistanceMeters;
}

function asDuration(value: number): DurationSeconds {
  return value as DurationSeconds;
}

export function raceCardPropsFromWorkout(workout: Workout): RaceCardProps {
  if (workout.type !== "race") throw new Error("a race card requires a race workout");

  const common = commonWorkoutCardPropsFromWorkout(workout);
  const raceLap = (lap: Workout["laps"][number], index: number): RaceLapProps => ({
    number: lap.index,
    name: lap.name,
    role: { kind: "race", splitNumber: index + 1 },
    distance: asDistance(lap.distanceMeters),
    movingTime: asDuration(lap.movingDurationSeconds),
    elapsedTime: asDuration(lap.elapsedDurationSeconds),
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
    maximumHeartRate: recordedOrUnavailable(lap.maxHeartRateBpm),
  });
  const lapData: RaceLapData =
    workout.laps.length === 0
      ? { kind: "unavailable" }
      : {
          kind: "available",
          laps: [
            raceLap(workout.laps[0], 0),
            ...workout.laps.slice(1).map((lap, index) => raceLap(lap, index + 1)),
          ],
        };

  return {
    ...common,
    category: "race",
    lapData,
    shapeSeed: journalCardShapeSeed(workout.id),
  };
}

function measurementText(measurement: Measurement<number>): string {
  return measurement.kind === "recorded" ? Math.round(measurement.value).toString() : "—";
}

function paceSecondsPerKilometer(lap: RaceLapProps): number {
  return lap.distance > 0 ? (lap.movingTime / lap.distance) * 1_000 : Number.POSITIVE_INFINITY;
}

function splitStyles(laps: NonEmptyReadonlyArray<RaceLapProps>): ReadonlyArray<SplitStyle> {
  const distinctPaces = [...new Set(laps.map(paceSecondsPerKilometer))].sort(
    (left, right) => right - left,
  );

  return laps.map((lap) => {
    const rank = distinctPaces.indexOf(paceSecondsPerKilometer(lap));
    const intensity = distinctPaces.length <= 1 ? 0.5 : rank / (distinctPaces.length - 1);
    return { "--stage-progress": `${42 + intensity * 58}%` };
  });
}

function roleLabel(role: RaceLapRole, t: TFunction): string {
  return t("workout.lapNumber", { number: role.splitNumber });
}

function RaceSplits({
  laps,
  language,
}: Readonly<{
  laps: NonEmptyReadonlyArray<RaceLapProps>;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const styles = splitStyles(laps);

  return (
    <section className="execution-section" aria-label={t("workout.raceSplits")}>
      <ol className="stage-matrix race-splits">
        {laps.map((lap, index) => (
          <li
            className="stage-row race-split-row"
            data-testid="race-split-row"
            key={lap.number}
            style={styles[index]}
          >
            <div className="stage-row__identity">
              <span>{t("workout.lapNumber", { number: index + 1 })}</span>
              <small>{lap.name}</small>
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

export function RaceCard(props: RaceCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, lapData, shapeSeed, ...summary } = props;

  return (
    <JournalWorkoutCard
      kind="race"
      category={category}
      badge={t("workout.race")}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
    >
      {lapData.kind === "available" ? (
        <div className="workout-card__structure">
          <RaceSplits laps={lapData.laps} language={language} />
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
