import type { TFunction } from "i18next";
import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import type { LapRoles } from "../../domain/actual-workout-structure";
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

export type ProgressiveStageProps = Readonly<{
  sourceLapNumber: number;
  distance: DistanceMeters;
  time: DurationSeconds;
  averageHeartRate: Measurement<number>;
}>;

export type ProgressiveSourceLapRole =
  | Readonly<{ kind: "warmup" }>
  | Readonly<{ kind: "stage"; stageNumber: number }>
  | Readonly<{ kind: "cooldown" }>
  | Readonly<{ kind: "unknown" }>;

export type ProgressiveSourceLapProps = SourceLapData<ProgressiveSourceLapRole>;

export type ProgressiveRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    stages: NonEmptyReadonlyArray<ProgressiveStageProps>;
    sourceLaps: NonEmptyReadonlyArray<ProgressiveSourceLapProps>;
    shapeSeed: number;
  }>;

type StageStyle = CSSProperties & Readonly<{ "--stage-progress": string }>;
type LapRole = keyof LapRoles;

const LAP_ROLES: ReadonlyArray<LapRole> = [
  "warmup",
  "work",
  "recovery",
  "cooldown",
  "main",
  "unknown",
];

function asDistance(value: number): DistanceMeters {
  return value as DistanceMeters;
}

function asDuration(value: number): DurationSeconds {
  return value as DurationSeconds;
}

function requireNonEmpty<Value>(
  values: ReadonlyArray<Value>,
  message: string,
): NonEmptyReadonlyArray<Value> {
  if (values.length === 0) throw new Error(message);
  return values as NonEmptyReadonlyArray<Value>;
}

function sameIndexes(left: ReadonlyArray<number>, right: ReadonlyArray<number>): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validatedRoles(workout: Workout): ReadonlyMap<number, LapRole> {
  const lapIndexes = new Set(workout.laps.map((lap) => lap.index));
  const roles = new Map<number, LapRole>();

  for (const role of LAP_ROLES) {
    for (const lapIndex of workout.structure.lapRoles[role]) {
      if (!lapIndexes.has(lapIndex)) {
        throw new Error(`progressive workout role references missing lap ${lapIndex}`);
      }
      if (roles.has(lapIndex)) {
        throw new Error(`progressive workout assigns multiple roles to lap ${lapIndex}`);
      }
      roles.set(lapIndex, role);
    }
  }

  for (const lap of workout.laps) {
    if (!roles.has(lap.index)) {
      throw new Error(`progressive workout does not assign a role to lap ${lap.index}`);
    }
  }

  return roles;
}

export function progressiveRunCardPropsFromWorkout(workout: Workout): ProgressiveRunCardProps {
  if (workout.structure.kind !== "progressive") {
    throw new Error("a progressive-run card requires a progressive workout");
  }

  const { coreLapIndexes, stageCount, lapRoles } = workout.structure;
  if (new Set(coreLapIndexes).size !== coreLapIndexes.length) {
    throw new Error("a progressive workout cannot repeat a core lap");
  }
  if (stageCount !== coreLapIndexes.length || !sameIndexes(coreLapIndexes, lapRoles.work)) {
    throw new Error("progressive stage metadata does not match its work laps");
  }

  const lapsByIndex = new Map(workout.laps.map((lap) => [lap.index, lap]));
  const stageLaps = coreLapIndexes.map((lapIndex) => {
    const lap = lapsByIndex.get(lapIndex);
    if (!lap) throw new Error(`progressive workout is missing stage lap ${lapIndex}`);
    if (lap.distanceMeters <= 0 || lap.movingDurationSeconds <= 0) {
      throw new Error(`progressive stage lap ${lapIndex} requires distance and moving time`);
    }
    return lap;
  });
  const roles = validatedRoles(workout);
  const stageNumberByLap = new Map(coreLapIndexes.map((lapIndex, index) => [lapIndex, index + 1]));

  const stages = requireNonEmpty(
    stageLaps.map((lap) => ({
      sourceLapNumber: lap.index,
      distance: asDistance(lap.distanceMeters),
      time: asDuration(lap.movingDurationSeconds),
      averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
    })),
    "a progressive workout requires at least one stage",
  );

  const sourceLaps = requireNonEmpty(
    workout.laps.map((lap): ProgressiveSourceLapProps => {
      const role = roles.get(lap.index);
      if (!role) throw new Error(`progressive workout is missing the role for lap ${lap.index}`);

      let cardRole: ProgressiveSourceLapRole;
      switch (role) {
        case "work": {
          const stageNumber = stageNumberByLap.get(lap.index);
          if (stageNumber === undefined) {
            throw new Error(`progressive work lap ${lap.index} is not a stage`);
          }
          cardRole = { kind: "stage", stageNumber };
          break;
        }
        case "warmup":
        case "cooldown":
        case "unknown":
          cardRole = { kind: role };
          break;
        case "recovery":
        case "main":
          throw new Error(`progressive workout cannot assign ${role} to lap ${lap.index}`);
      }

      return {
        number: lap.index,
        name: lap.name,
        role: cardRole,
        distance: asDistance(lap.distanceMeters),
        movingTime: asDuration(lap.movingDurationSeconds),
        elapsedTime: asDuration(lap.elapsedDurationSeconds),
        averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
        maximumHeartRate: recordedOrUnavailable(lap.maxHeartRateBpm),
      };
    }),
    "a progressive workout requires source laps",
  );

  return {
    ...commonWorkoutCardPropsFromWorkout(workout),
    stages,
    sourceLaps,
    shapeSeed: journalCardShapeSeed(workout.id),
  };
}

function measurementText(
  measurement: Measurement<number>,
  format: (value: number) => string,
): string {
  return measurement.kind === "recorded" ? format(measurement.value) : "—";
}

function paceSecondsPerKilometer(lap: ProgressiveSourceLapProps): number {
  return (lap.movingTime / lap.distance) * 1_000;
}

function lapStyles(
  laps: NonEmptyReadonlyArray<ProgressiveSourceLapProps>,
): ReadonlyArray<StageStyle> {
  const distinctPaces = [...new Set(laps.map(paceSecondsPerKilometer))].sort(
    (left, right) => right - left,
  );

  return laps.map((lap) => {
    const rank = distinctPaces.indexOf(paceSecondsPerKilometer(lap));
    const intensity = distinctPaces.length <= 1 ? 0.5 : rank / (distinctPaces.length - 1);
    return { "--stage-progress": `${35 + intensity * 65}%` };
  });
}

function ProgressiveLaps({
  stages,
  sourceLaps,
  language,
}: Readonly<{
  stages: NonEmptyReadonlyArray<ProgressiveStageProps>;
  sourceLaps: NonEmptyReadonlyArray<ProgressiveSourceLapProps>;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const styles = lapStyles(sourceLaps);

  return (
    <section
      className="execution-section"
      aria-label={t("classification.progressive", { stageCount: stages.length })}
    >
      <ol className="stage-matrix">
        {sourceLaps.map((lap, index) => (
          <li
            className="stage-row"
            data-testid="progressive-lap-row"
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
              {t("workout.averageHeartRateShort")}{" "}
              {measurementText(lap.averageHeartRate, (value) => Math.round(value).toString())}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function roleLabel(role: ProgressiveSourceLapRole, t: TFunction): string {
  return role.kind === "stage"
    ? t("lapRole.stage", { stage: role.stageNumber })
    : t(`lapRole.${role.kind}`);
}

export function ProgressiveRunCard(props: ProgressiveRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, stages, sourceLaps, shapeSeed, ...summary } = props;

  return (
    <JournalWorkoutCard
      kind="progressive"
      category={category}
      badge={t("classification.progressiveBadge")}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
    >
      <div className="workout-card__structure">
        <ProgressiveLaps stages={stages} sourceLaps={sourceLaps} language={language} />
        <SourceLapEvidence
          sourceLaps={sourceLaps}
          language={language}
          roleLabel={roleLabel}
          dataRole={(role) => (role.kind === "stage" ? "work" : role.kind)}
        />
      </div>
    </JournalWorkoutCard>
  );
}
