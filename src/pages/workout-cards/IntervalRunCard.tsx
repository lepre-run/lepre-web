import type { TFunction } from "i18next";
import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import type { LapRoles } from "../../domain/actual-workout-structure";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import type { Workout } from "../../domain/workout";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatWorkoutDate,
} from "../../i18n/formatters";
import { journalCardShape, journalCardShapeSeed } from "./journalCardShape";
import { type SourceLapData, SourceLapEvidence } from "./SourceLapEvidence";
import { WorkoutCardSummary } from "./WorkoutCardSummary";
import {
  type CommonWorkoutCardProps,
  commonWorkoutCardPropsFromWorkout,
  type Measurement,
  type NonEmptyReadonlyArray,
  recordedOrUnavailable,
} from "./workoutCardData";

export type IntervalLapProps = Readonly<{
  sourceLapNumber: number;
  distance: DistanceMeters;
  time: DurationSeconds;
  averageHeartRate: Measurement<number>;
}>;

export type IntervalRepetitionProps =
  | Readonly<{
      kind: "work-and-recovery";
      number: number;
      work: IntervalLapProps;
      recovery: IntervalLapProps;
    }>
  | Readonly<{
      kind: "work-only";
      number: number;
      work: IntervalLapProps;
    }>;

export type IntervalSourceLapRole =
  | Readonly<{ kind: "warmup" }>
  | Readonly<{ kind: "work"; repetitionNumber: number }>
  | Readonly<{ kind: "recovery"; repetitionNumber: number }>
  | Readonly<{ kind: "cooldown" }>
  | Readonly<{ kind: "unknown" }>;

export type IntervalSourceLapProps = SourceLapData<IntervalSourceLapRole>;

export type IntervalRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    repetitions: NonEmptyReadonlyArray<IntervalRepetitionProps>;
    sourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>;
    shapeSeed: number;
  }>;

type LapRole = keyof LapRoles;
type IntervalLapStyle = CSSProperties & Readonly<{ "--stage-progress": string }>;

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
  const lapIndexes = workout.laps.map((lap) => lap.index);
  if (new Set(lapIndexes).size !== lapIndexes.length) {
    throw new Error("an interval workout cannot repeat a source-lap index");
  }

  const existingLapIndexes = new Set(lapIndexes);
  const roles = new Map<number, LapRole>();

  for (const role of LAP_ROLES) {
    for (const lapIndex of workout.structure.lapRoles[role]) {
      if (!existingLapIndexes.has(lapIndex)) {
        throw new Error(`interval workout role references missing lap ${lapIndex}`);
      }
      if (roles.has(lapIndex)) {
        throw new Error(`interval workout assigns multiple roles to lap ${lapIndex}`);
      }
      roles.set(lapIndex, role);
    }
  }

  for (const lap of workout.laps) {
    if (!roles.has(lap.index)) {
      throw new Error(`interval workout does not assign a role to lap ${lap.index}`);
    }
  }

  return roles;
}

function intervalLap(lap: Workout["laps"][number]): IntervalLapProps {
  if (lap.distanceMeters <= 0 || lap.movingDurationSeconds <= 0) {
    throw new Error(`interval lap ${lap.index} requires distance and moving time`);
  }
  return {
    sourceLapNumber: lap.index,
    distance: asDistance(lap.distanceMeters),
    time: asDuration(lap.movingDurationSeconds),
    averageHeartRate: recordedOrUnavailable(lap.averageHeartRateBpm),
  };
}

export function intervalRunCardPropsFromWorkout(workout: Workout): IntervalRunCardProps {
  if (workout.structure.kind !== "intervals") {
    throw new Error("an interval-run card requires an interval workout");
  }

  const { coreLapIndexes, lapRoles, repetitions: repetitionCount } = workout.structure;
  if (new Set(coreLapIndexes).size !== coreLapIndexes.length) {
    throw new Error("an interval workout cannot repeat a core lap");
  }
  if (lapRoles.work.length !== repetitionCount) {
    throw new Error("interval repetition metadata does not match its work laps");
  }

  const roles = validatedRoles(workout);
  const chronologicalCore = workout.laps
    .filter((lap) => {
      const role = roles.get(lap.index);
      return role === "work" || role === "recovery";
    })
    .map((lap) => lap.index);
  if (!sameIndexes(coreLapIndexes, chronologicalCore)) {
    throw new Error("interval core laps are not in chronological work/recovery order");
  }

  const lapsByIndex = new Map(workout.laps.map((lap) => [lap.index, lap]));
  const repetitionNumberByLap = new Map<number, number>();
  const mappedRepetitions: IntervalRepetitionProps[] = [];

  for (let index = 0; index < coreLapIndexes.length; ) {
    const workLapIndex = coreLapIndexes[index];
    if (roles.get(workLapIndex) !== "work") {
      throw new Error(`interval core lap ${workLapIndex} must be a work lap`);
    }
    const workLap = lapsByIndex.get(workLapIndex);
    if (!workLap) throw new Error(`interval workout is missing work lap ${workLapIndex}`);

    const number = mappedRepetitions.length + 1;
    repetitionNumberByLap.set(workLapIndex, number);
    const work = intervalLap(workLap);
    const possibleRecoveryIndex = coreLapIndexes[index + 1];

    if (possibleRecoveryIndex !== undefined && roles.get(possibleRecoveryIndex) === "recovery") {
      const recoveryLap = lapsByIndex.get(possibleRecoveryIndex);
      if (!recoveryLap) {
        throw new Error(`interval workout is missing recovery lap ${possibleRecoveryIndex}`);
      }
      repetitionNumberByLap.set(possibleRecoveryIndex, number);
      mappedRepetitions.push({
        kind: "work-and-recovery",
        number,
        work,
        recovery: intervalLap(recoveryLap),
      });
      index += 2;
    } else {
      mappedRepetitions.push({ kind: "work-only", number, work });
      index += 1;
      if (index < coreLapIndexes.length) {
        throw new Error(`interval ${number} is missing a recovery before the next work lap`);
      }
    }
  }

  if (mappedRepetitions.length !== repetitionCount) {
    throw new Error("interval repetition metadata does not match its ordered laps");
  }

  const repetitions = requireNonEmpty(
    mappedRepetitions,
    "an interval workout requires at least one repetition",
  );
  const sourceLaps = requireNonEmpty(
    workout.laps.map((lap): IntervalSourceLapProps => {
      const role = roles.get(lap.index);
      if (!role) throw new Error(`interval workout is missing the role for lap ${lap.index}`);

      let cardRole: IntervalSourceLapRole;
      switch (role) {
        case "work":
        case "recovery": {
          const repetitionNumber = repetitionNumberByLap.get(lap.index);
          if (repetitionNumber === undefined) {
            throw new Error(`interval ${role} lap ${lap.index} is not part of a repetition`);
          }
          cardRole = { kind: role, repetitionNumber };
          break;
        }
        case "warmup":
        case "cooldown":
        case "unknown":
          cardRole = { kind: role };
          break;
        case "main":
          throw new Error(`interval workout cannot assign main to lap ${lap.index}`);
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
    "an interval workout requires source laps",
  );

  return {
    ...commonWorkoutCardPropsFromWorkout(workout),
    repetitions,
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

function paceSecondsPerKilometer(lap: IntervalSourceLapProps): number {
  return lap.distance > 0 ? (lap.movingTime / lap.distance) * 1_000 : Number.POSITIVE_INFINITY;
}

function lapStyles(
  laps: NonEmptyReadonlyArray<IntervalSourceLapProps>,
): ReadonlyArray<IntervalLapStyle> {
  const distinctPaces = [...new Set(laps.map(paceSecondsPerKilometer))].sort(
    (left, right) => right - left,
  );

  return laps.map((lap) => {
    const rank = distinctPaces.indexOf(paceSecondsPerKilometer(lap));
    const intensity = distinctPaces.length <= 1 ? 0.5 : rank / (distinctPaces.length - 1);
    return { "--stage-progress": `${35 + intensity * 65}%` };
  });
}

function roleLabel(role: IntervalSourceLapRole, t: TFunction): string {
  switch (role.kind) {
    case "work":
      return t("lapRole.interval", { repetition: role.repetitionNumber });
    case "recovery":
      return t("lapRole.recoveryNumber", { repetition: role.repetitionNumber });
    case "warmup":
    case "cooldown":
    case "unknown":
      return t(`lapRole.${role.kind}`);
  }
}

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
        <path
          d={
            kind === "work"
              ? "M 2 6 C 39 2, 78 9, 158 5"
              : "M 2 6 C 18 1, 31 11, 47 6 S 76 1, 92 6 S 121 11, 145 5"
          }
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="interval-cell__details">
        {formatDistance(lap.distance, language)} · {formatDuration(lap.time)}
      </span>
      <span className="repetition-cell__heart-rate">
        {t("workout.averageHeartRateShort")}{" "}
        {measurementText(lap.averageHeartRate, (value) => Math.round(value).toString())}
      </span>
    </div>
  );
}

function MissingRecovery({
  repetitionNumber,
}: Readonly<{ repetitionNumber: number }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="repetition-cell repetition-cell--recovery repetition-cell--missing">
      <span className="repetition-cell__label">
        <IntervalRoleIcon kind="recovery" />
        <span>{t("lapRole.recoveryNumber", { repetition: repetitionNumber })}</span>
      </span>
      <strong>—</strong>
      <span>{t("workout.noRecoveryLap")}</span>
    </div>
  );
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

  const styles = lapStyles(allSourceLaps);
  const stylesByLap = new Map(allSourceLaps.map((lap, index) => [lap.number, styles[index]]));

  return (
    <ol className="stage-matrix interval-boundary-laps">
      {sourceLaps.map((lap) => (
        <li
          className="stage-row interval-lap-row"
          data-role={lap.role.kind}
          data-testid="interval-boundary-lap-row"
          key={lap.number}
          style={stylesByLap.get(lap.number)}
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
  );
}

function IntervalLaps({
  repetitions,
  sourceLaps,
  language,
}: Readonly<{
  repetitions: NonEmptyReadonlyArray<IntervalRepetitionProps>;
  sourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>;
  language: string;
}>): JSX.Element {
  const { t } = useTranslation();
  const firstCorePosition = sourceLaps.findIndex(
    (lap) => lap.role.kind === "work" || lap.role.kind === "recovery",
  );
  let lastCorePosition = sourceLaps.length - 1;
  while (
    lastCorePosition >= 0 &&
    sourceLaps[lastCorePosition].role.kind !== "work" &&
    sourceLaps[lastCorePosition].role.kind !== "recovery"
  ) {
    lastCorePosition -= 1;
  }
  const leadingLaps = sourceLaps.slice(0, firstCorePosition);
  const trailingLaps = sourceLaps.slice(lastCorePosition + 1);

  return (
    <section
      className="execution-section"
      aria-label={t("classification.intervalsBadgeWithCount", { count: repetitions.length })}
    >
      <BoundaryLaps sourceLaps={leadingLaps} allSourceLaps={sourceLaps} language={language} />

      <ol className="repetition-matrix interval-repetition-matrix">
        {repetitions.map((repetition) => (
          <li
            className="repetition-row"
            data-testid="interval-repetition-row"
            key={repetition.number}
          >
            <div className="repetition-row__identity">
              <strong>{String(repetition.number).padStart(2, "0")}</strong>
              <span>
                {repetition.kind === "work-and-recovery"
                  ? t("workout.lapPair", {
                      work: repetition.work.sourceLapNumber,
                      recovery: repetition.recovery.sourceLapNumber,
                    })
                  : t("workout.lapNumber", { number: repetition.work.sourceLapNumber })}
              </span>
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
              <MissingRecovery repetitionNumber={repetition.number} />
            )}
          </li>
        ))}
      </ol>

      <BoundaryLaps sourceLaps={trailingLaps} allSourceLaps={sourceLaps} language={language} />
    </section>
  );
}

export function IntervalRunCard(props: IntervalRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, repetitions, sourceLaps, shapeSeed, ...summary } = props;
  const shape = journalCardShape(shapeSeed);

  return (
    <article
      className="workout-card workout-card--journal workout-card--intervals"
      data-workout-type={category}
    >
      <svg
        className="journal-card__outline"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={shape.outlinePath} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="journal-card__type">
        <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true">
          <path d={shape.badgePath} />
        </svg>
        <span>{t("classification.intervalsBadge")}</span>
      </div>
      <header className="workout-card__header">
        <div className="workout-card__topline">
          <time dateTime={performedAt}>{formatWorkoutDate(performedAt, language)}</time>
          {category === "race" && (
            <span className="race-badge">
              <span aria-hidden="true">🏁</span>
              {t("workout.race")}
            </span>
          )}
        </div>

        <WorkoutCardSummary {...summary} />
      </header>

      <div className="workout-card__structure">
        <IntervalLaps repetitions={repetitions} sourceLaps={sourceLaps} language={language} />
        <SourceLapEvidence
          sourceLaps={sourceLaps}
          language={language}
          roleLabel={roleLabel}
          dataRole={(role) => role.kind}
        />
      </div>
    </article>
  );
}
