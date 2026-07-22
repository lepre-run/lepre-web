import { type CSSProperties, type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import { appearanceForLap, type LapAppearance } from "../domain/lap-appearance";
import type { Lap, Workout } from "../domain/workout";
import {
  formatClassification,
  formatDistance,
  formatDuration,
  formatHeartRate,
  formatHeartRateValue,
  formatLapRole,
  formatPace,
  formatWorkoutDate,
} from "../i18n/formatters";

type Repetition = Readonly<{ work: Lap; recovery?: Lap }>;
type StageStyle = CSSProperties & Readonly<{ "--stage-progress"?: string }>;

const STRUCTURED_KINDS = new Set<Workout["structure"]["kind"]>([
  "intervals",
  "progressive",
  "tempo",
  "repeated-hills",
  "steady-structured-run",
]);

function lapsForIndexes(workout: Workout, indexes: ReadonlyArray<number>): ReadonlyArray<Lap> {
  const selected = new Set(indexes);
  return workout.laps.filter((lap) => selected.has(lap.index));
}

function lapsForRole(
  workout: Workout,
  role: keyof Workout["structure"]["lapRoles"],
): ReadonlyArray<Lap> {
  return lapsForIndexes(workout, workout.structure.lapRoles[role]);
}

function distanceOf(laps: ReadonlyArray<Lap>): number {
  return laps.reduce((total, lap) => total + lap.distanceMeters, 0);
}

function durationOf(laps: ReadonlyArray<Lap>): number {
  return laps.reduce((total, lap) => total + lap.movingDurationSeconds, 0);
}

function pairedRepetitions(workout: Workout): ReadonlyArray<Repetition> {
  const work = lapsForRole(workout, "work");
  const recovery = lapsForRole(workout, "recovery");
  const positions = new Map(workout.laps.map((lap, position) => [lap.index, position]));
  const usedRecovery = new Set<number>();

  return work.map((workLap, index) => {
    const workPosition = positions.get(workLap.index) ?? -1;
    const nextWorkPosition =
      index + 1 < work.length
        ? (positions.get(work[index + 1].index) ?? Number.POSITIVE_INFINITY)
        : Number.POSITIVE_INFINITY;
    const recoveryLap = recovery.find((candidate) => {
      const position = positions.get(candidate.index) ?? -1;
      return (
        !usedRecovery.has(candidate.index) && position > workPosition && position < nextWorkPosition
      );
    });
    if (recoveryLap) usedRecovery.add(recoveryLap.index);
    return recoveryLap ? { work: workLap, recovery: recoveryLap } : { work: workLap };
  });
}

function paceSecondsPerKilometer(lap: Lap): number {
  return lap.distanceMeters > 0
    ? (lap.movingDurationSeconds / lap.distanceMeters) * 1_000
    : Number.POSITIVE_INFINITY;
}

function lapCountLabel(count: number, t: ReturnType<typeof useTranslation>["t"]): string {
  return t("workout.lapCount", { count });
}

function GroupMarks({
  laps,
  workout,
}: Readonly<{ laps: ReadonlyArray<Lap>; workout: Workout }>): JSX.Element {
  return (
    <span className="structure-block__marks" aria-hidden="true">
      {laps.map((lap) => (
        <span
          className="structure-block__mark"
          data-role={appearanceForLap(workout, lap).role}
          key={lap.index}
        />
      ))}
    </span>
  );
}

function StructureBlock({
  label,
  laps,
  workout,
  language,
  kind,
}: Readonly<{
  label: string;
  laps: ReadonlyArray<Lap>;
  workout: Workout;
  language: string;
  kind: "context" | "core";
}>): JSX.Element | null {
  const { t } = useTranslation();
  if (laps.length === 0) return null;
  return (
    <div
      className={`structure-block structure-block--${kind}`}
      style={{ flexGrow: Math.max(1, Math.sqrt(laps.length)) }}
    >
      <span className="structure-block__label">{label}</span>
      <strong>
        {formatDistance(distanceOf(laps), language)} · {formatDuration(durationOf(laps))}
      </strong>
      <span className="structure-block__count">{lapCountLabel(laps.length, t)}</span>
      <GroupMarks laps={laps} workout={workout} />
    </div>
  );
}

function SessionMap({ workout, language }: Readonly<{ workout: Workout; language: string }>) {
  const { t } = useTranslation();
  const preparation = lapsForRole(workout, "warmup");
  const core = lapsForIndexes(workout, workout.structure.coreLapIndexes);
  const afterCore = lapsForRole(workout, "cooldown");
  return (
    <div className="structure-overview">
      <div className="structure-overview__heading">
        <h3>{t("workout.sessionStructure")}</h3>
        <span>{lapCountLabel(workout.laps.length, t)}</span>
      </div>
      <div className="structure-overview__map">
        <StructureBlock
          label={t("workout.preparation")}
          laps={preparation}
          workout={workout}
          language={language}
          kind="context"
        />
        <StructureBlock
          label={t("workout.mainSet")}
          laps={core}
          workout={workout}
          language={language}
          kind="core"
        />
        <StructureBlock
          label={t("workout.afterCore")}
          laps={afterCore}
          workout={workout}
          language={language}
          kind="context"
        />
      </div>
    </div>
  );
}

function StageCell({
  lap,
  label,
  language,
  kind,
}: Readonly<{
  lap?: Lap;
  label: string;
  language: string;
  kind: "work" | "recovery";
}>): JSX.Element {
  const { t } = useTranslation();
  if (!lap) {
    return (
      <div className={`repetition-cell repetition-cell--${kind} repetition-cell--missing`}>
        <span className="repetition-cell__label">{label}</span>
        <strong>—</strong>
        <span>{t("workout.noRecoveryLap")}</span>
      </div>
    );
  }
  return (
    <div className={`repetition-cell repetition-cell--${kind}`}>
      <span className="repetition-cell__label">
        {label} · {t("workout.lapNumber", { number: lap.index })}
      </span>
      <strong>{formatPace(lap.movingDurationSeconds, lap.distanceMeters)}</strong>
      <span>
        {formatDistance(lap.distanceMeters, language)} · {formatDuration(lap.movingDurationSeconds)}
      </span>
      <span className="repetition-cell__heart-rate">
        {t("workout.averageHeartRateShort")} {formatHeartRate(lap.averageHeartRateBpm)}
      </span>
    </div>
  );
}

function RepetitionMatrix({
  workout,
  language,
}: Readonly<{ workout: Workout; language: string }>): JSX.Element {
  const { t } = useTranslation();
  const repetitions = pairedRepetitions(workout);
  const fastestPace = Math.min(...repetitions.map(({ work }) => paceSecondsPerKilometer(work)));

  return (
    <section className="execution-section" aria-labelledby={`execution-${workout.id}`}>
      <div className="execution-section__heading">
        <h3 id={`execution-${workout.id}`}>{t("workout.mainSetExecution")}</h3>
        <span>{t("workout.compareRepetitions")}</span>
      </div>
      <div className="repetition-matrix__labels" aria-hidden="true">
        <span>{t("workout.repetition")}</span>
        <span>{t("lapRole.work")}</span>
        <span>{t("lapRole.recovery")}</span>
      </div>
      <ol className="repetition-matrix">
        {repetitions.map(({ work, recovery }, index) => {
          const fastest = paceSecondsPerKilometer(work) === fastestPace;
          return (
            <li
              className="repetition-row"
              data-fastest={fastest ? "true" : undefined}
              data-testid="repetition-row"
              key={work.index}
            >
              <div className="repetition-row__identity">
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <span>
                  {recovery
                    ? t("workout.lapPair", { work: work.index, recovery: recovery.index })
                    : t("workout.lapNumber", { number: work.index })}
                </span>
                {fastest && <em>{t("workout.fastest")}</em>}
              </div>
              <StageCell lap={work} label={t("lapRole.work")} language={language} kind="work" />
              <StageCell
                lap={recovery}
                label={t("lapRole.recovery")}
                language={language}
                kind="recovery"
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function stageStyle(appearance: LapAppearance): StageStyle {
  const progress = appearance.progressiveIntensity;
  return { "--stage-progress": `${progress === undefined ? 70 : 35 + progress * 65}%` };
}

function StageMatrix({
  workout,
  language,
}: Readonly<{ workout: Workout; language: string }>): JSX.Element {
  const { t } = useTranslation();
  const core = lapsForIndexes(workout, workout.structure.coreLapIndexes);
  return (
    <section className="execution-section" aria-labelledby={`execution-${workout.id}`}>
      <div className="execution-section__heading">
        <h3 id={`execution-${workout.id}`}>{t("workout.stageExecution")}</h3>
        {workout.structure.kind === "progressive" && <span>{t("workout.progressiveLegend")}</span>}
      </div>
      <ol className="stage-matrix">
        {core.map((lap) => {
          const appearance = appearanceForLap(workout, lap);
          return (
            <li
              className="stage-row"
              data-testid="stage-row"
              key={lap.index}
              style={stageStyle(appearance)}
            >
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
              <span className="stage-row__heart-rate">
                {t("workout.averageHeartRateShort")} {formatHeartRate(lap.averageHeartRateBpm)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EvidenceTable({
  workout,
  language,
}: Readonly<{ workout: Workout; language: string }>): JSX.Element {
  const { t } = useTranslation();
  return (
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
          {workout.laps.map((lap) => {
            const appearance = appearanceForLap(workout, lap);
            return (
              <tr className="evidence-row" key={lap.index} data-role={appearance.role}>
                <td data-label={t("workout.lap")}>
                  <span className="evidence-row__lap">
                    <small>{String(lap.index).padStart(2, "0")}</small>
                    <strong>{lap.name}</strong>
                  </span>
                </td>
                <td data-label={t("workout.role")}>{formatLapRole(appearance, t)}</td>
                <td data-label={t("workout.distance")}>
                  {formatDistance(lap.distanceMeters, language)}
                </td>
                <td data-label={t("workout.time")}>{formatDuration(lap.movingDurationSeconds)}</td>
                <td data-label={t("workout.pace")}>
                  <strong>{formatPace(lap.movingDurationSeconds, lap.distanceMeters)}</strong>
                </td>
                <td data-label={t("workout.heartRateEvidence")}>
                  {formatHeartRateValue(lap.averageHeartRateBpm)} /{" "}
                  {formatHeartRate(lap.maxHeartRateBpm)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SourceEvidence({
  workout,
  language,
  alwaysVisible = false,
}: Readonly<{ workout: Workout; language: string; alwaysVisible?: boolean }>): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const title = t("workout.sourceLapEvidence");
  const lapCount = lapCountLabel(workout.laps.length, t);
  if (alwaysVisible) {
    return (
      <section className="source-evidence source-evidence--visible">
        <div className="source-evidence__heading">
          <span>{title}</span>
          <span>{lapCount}</span>
        </div>
        <EvidenceTable workout={workout} language={language} />
      </section>
    );
  }
  return (
    <details
      className="source-evidence"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <span>{title}</span>
        <span className="source-evidence__summary-meta">
          <span className="source-evidence__lap-count">{lapCount}</span>
          <span className="source-evidence__action">
            {t(expanded ? "workout.collapseEvidence" : "workout.expandEvidence")}
            <span className="source-evidence__chevron" aria-hidden="true" />
          </span>
        </span>
      </summary>
      <EvidenceTable workout={workout} language={language} />
    </details>
  );
}

function StructuredContent({
  workout,
  language,
}: Readonly<{ workout: Workout; language: string }>): JSX.Element {
  const paired =
    workout.structure.kind === "intervals" || workout.structure.kind === "repeated-hills";
  return (
    <div className="workout-card__structure">
      <SessionMap workout={workout} language={language} />
      {paired ? (
        <RepetitionMatrix workout={workout} language={language} />
      ) : (
        <StageMatrix workout={workout} language={language} />
      )}
      <SourceEvidence workout={workout} language={language} />
    </div>
  );
}

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const structured = STRUCTURED_KINDS.has(workout.structure.kind);
  const freeRun = workout.structure.kind === "free-run";
  const hasLaps = workout.laps.length > 0;
  const classification = formatClassification(workout.structure, t, language);

  return (
    <article
      className={`workout-card workout-card--${workout.structure.kind}${freeRun ? " workout-card--compact" : ""}`}
      data-workout-type={workout.type}
    >
      <header className="workout-card__header">
        <div className="workout-card__topline">
          <time dateTime={workout.performedAt}>
            {formatWorkoutDate(workout.performedAt, language)}
          </time>
          {workout.type === "race" && (
            <span className="race-badge">
              <span aria-hidden="true">🏁</span>
              {t("workout.race")}
            </span>
          )}
        </div>

        {freeRun ? (
          <>
            <p className="workout-kind">{classification}</p>
            <h2>{workout.name}</h2>
          </>
        ) : (
          <>
            <h2>{classification}</h2>
            <p className="source-activity">
              <span>{t("workout.sourceActivity")}</span>
              {workout.name}
            </p>
          </>
        )}

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

      {!hasLaps && <p className="no-laps">{t("workout.noLaps")}</p>}
      {structured && hasLaps && <StructuredContent workout={workout} language={language} />}
      {workout.structure.kind === "unknown" && hasLaps && (
        <SourceEvidence workout={workout} language={language} alwaysVisible />
      )}
    </article>
  );
}
