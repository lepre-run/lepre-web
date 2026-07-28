import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import { appearanceForLap, type LapAppearance } from "../../domain/lap-appearance";
import type { Lap, Workout } from "../../domain/workout";
import {
  formatClassification,
  formatDistance,
  formatDuration,
  formatHeartRate,
  formatLapRole,
  formatPace,
  formatWorkoutDate,
} from "../../i18n/formatters";
import { Card } from "../ui";
import { type SourceLapData, SourceLapEvidence } from "./SourceLapEvidence";
import { type NonEmptyReadonlyArray, recordedOrUnavailable } from "./workoutCardData";

type Translate = ReturnType<typeof useTranslation>["t"];
type Repetition = Readonly<{ work: Lap; recovery?: Lap }>;

function lapsForRole(
  workout: Workout,
  role: keyof Workout["structure"]["lapRoles"],
): ReadonlyArray<Lap> {
  const indexes = new Set(workout.structure.lapRoles[role]);
  return workout.laps.filter((lap) => indexes.has(lap.index));
}

function pairedRepetitions(workout: Workout): ReadonlyArray<Repetition> {
  const workLaps = lapsForRole(workout, "work");
  const recoveryLaps = lapsForRole(workout, "recovery");

  return workLaps.map((work, index) => {
    const nextWork = workLaps[index + 1]?.index ?? Number.POSITIVE_INFINITY;
    const recovery = recoveryLaps.find((lap) => lap.index > work.index && lap.index < nextWork);
    return recovery ? { work, recovery } : { work };
  });
}

function repetitionCell(lap: Lap, label: string, language: string): JSX.Element {
  return (
    <div className="repetition-cell">
      <span className="repetition-cell__label">{label}</span>
      <strong>{formatPace(lap.movingDurationSeconds, lap.distanceMeters)}</strong>
      <span>
        {formatDistance(lap.distanceMeters, language)} · {formatDuration(lap.movingDurationSeconds)}
      </span>
    </div>
  );
}

function missingRecoveryCell(t: Translate): JSX.Element {
  return (
    <div className="repetition-cell repetition-cell--recovery repetition-cell--missing">
      <span className="repetition-cell__label">{t("lapRole.recovery")}</span>
      <strong>—</strong>
      <span>{t("workout.noRecoveryLap")}</span>
    </div>
  );
}

function repeatedHillsExecution(workout: Workout, language: string, t: Translate): JSX.Element {
  return (
    <section className="execution-section" aria-label={t("workout.mainSetExecution")}>
      <div className="execution-section__heading">
        <h3>{t("workout.mainSetExecution")}</h3>
      </div>
      <ol className="repetition-matrix">
        {pairedRepetitions(workout).map(({ work, recovery }, index) => (
          <li className="repetition-row" key={work.index}>
            <div className="repetition-row__identity">
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span>
                {recovery
                  ? t("workout.lapPair", { work: work.index, recovery: recovery.index })
                  : t("workout.lapNumber", { number: work.index })}
              </span>
            </div>
            {repetitionCell(work, t("lapRole.work"), language)}
            {recovery
              ? repetitionCell(recovery, t("lapRole.recovery"), language)
              : missingRecoveryCell(t)}
          </li>
        ))}
      </ol>
    </section>
  );
}

function stageExecution(workout: Workout, language: string, t: Translate): JSX.Element {
  const coreIndexes = new Set(workout.structure.coreLapIndexes);
  const coreLaps = workout.laps.filter((lap) => coreIndexes.has(lap.index));

  return (
    <section className="execution-section" aria-label={t("workout.stageExecution")}>
      <div className="execution-section__heading">
        <h3>{t("workout.stageExecution")}</h3>
      </div>
      <ol className="stage-matrix">
        {coreLaps.map((lap) => {
          const appearance = appearanceForLap(workout, lap);
          return (
            <li className="stage-row" key={lap.index}>
              <div className="stage-row__identity">
                <span>{formatLapRole(appearance, t)}</span>
                <small>{t("workout.lapNumber", { number: lap.index })}</small>
              </div>
              <div className="stage-row__pace">
                <strong>{formatPace(lap.movingDurationSeconds, lap.distanceMeters)}</strong>
                <span className="stage-row__bar" aria-hidden="true" />
              </div>
              <span>
                {formatDistance(lap.distanceMeters, language)} ·{" "}
                {formatDuration(lap.movingDurationSeconds)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function workoutHeader(workout: Workout, language: string, t: Translate): JSX.Element {
  return (
    <header className="workout-card__header">
      <div className="workout-card__topline">
        <time dateTime={workout.performedAt}>
          {formatWorkoutDate(workout.performedAt, language)}
        </time>
      </div>
      <h2>{workout.name}</h2>
      <p className="workout-classification">
        {formatClassification(workout.structure, t, language)}
      </p>
      <dl className="workout-summary">
        <div>
          <dt>{t("workout.distance")}</dt>
          <dd>{formatDistance(workout.distanceMeters, language)}</dd>
        </div>
        <div>
          <dt>{t("workout.movingTime")}</dt>
          <dd>{formatDuration(workout.durationSeconds)}</dd>
        </div>
        {workout.averageHeartRateBpm !== null && (
          <div className="workout-summary__secondary">
            <dt>{t("workout.averageHeartRate")}</dt>
            <dd>{formatHeartRate(workout.averageHeartRateBpm)}</dd>
          </div>
        )}
      </dl>
      {workout.description.trim().length > 0 && (
        <p className="workout-description">{workout.description}</p>
      )}
    </header>
  );
}

function sourceEvidence(workout: Workout, language: string): JSX.Element | null {
  const mappedLaps = workout.laps.map((lap) => ({
    number: lap.index,
    name: lap.name,
    role: appearanceForLap(workout, lap),
    distance: lap.distanceMeters as DistanceMeters,
    movingTime: lap.movingDurationSeconds as DurationSeconds,
    elapsedTime: lap.elapsedDurationSeconds as DurationSeconds,
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
    maximumHeartRate: recordedOrUnavailable(lap.maxHeartRateBpm),
  }));
  const [first, ...rest] = mappedLaps;
  if (!first) return null;
  const sourceLaps: NonEmptyReadonlyArray<SourceLapData<LapAppearance>> = [first, ...rest];
  return (
    <SourceLapEvidence
      sourceLaps={sourceLaps}
      language={language}
      roleLabel={(role, t) => formatLapRole(role, t)}
      dataRole={(role) => role.role}
    />
  );
}

export function StructuredWorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <Card
      className={`workout-card workout-card--${workout.structure.kind}`}
      data-workout-type={workout.type}
    >
      {workoutHeader(workout, language, t)}
      {workout.laps.length === 0 ? (
        <p className="no-laps">{t("workout.noLaps")}</p>
      ) : (
        <div className="workout-card__structure">
          {workout.structure.kind !== "unknown" &&
            (workout.structure.kind === "repeated-hills"
              ? repeatedHillsExecution(workout, language, t)
              : stageExecution(workout, language, t))}
          {sourceEvidence(workout, language)}
        </div>
      )}
    </Card>
  );
}
