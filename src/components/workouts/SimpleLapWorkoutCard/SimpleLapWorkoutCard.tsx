import type { TFunction } from "i18next";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { WorkoutCategory } from "../../../domain/workout";
import { JournalWorkoutCard } from "../JournalWorkoutCard/JournalWorkoutCard";
import { LapExecutionRows } from "../LapExecutionRows/LapExecutionRows";
import { type SourceLapData, SourceLapEvidence } from "../SourceLapEvidence/SourceLapEvidence";
import { relativePaceStyles } from "../sourceLapData";
import type { CommonWorkoutCardProps, NonEmptyReadonlyArray } from "../workoutCardData";

export type SimpleLapData<Role> =
  | Readonly<{ kind: "available"; laps: NonEmptyReadonlyArray<SourceLapData<Role>> }>
  | Readonly<{ kind: "unavailable" }>;
export type SimpleLapCardProps<Role> = Omit<CommonWorkoutCardProps, "category"> &
  Readonly<{
    category: WorkoutCategory;
    lapData: SimpleLapData<Role>;
    shapeSeed: number;
  }>;

export function SimpleLapExecution<Role>({
  laps,
  language,
  ariaLabel,
  minimumPercent,
  label,
  detail,
  testId,
  rowClassName,
  listClassName,
}: Readonly<{
  laps: NonEmptyReadonlyArray<SourceLapData<Role>>;
  language: string;
  ariaLabel: string;
  minimumPercent?: number;
  label: (lap: SourceLapData<Role>, index: number) => string;
  detail: (lap: SourceLapData<Role>, index: number) => string;
  testId: string;
  rowClassName?: string;
  listClassName?: string;
}>): JSX.Element {
  return (
    <section className="execution-section" aria-label={ariaLabel}>
      <LapExecutionRows
        laps={laps}
        language={language}
        styles={relativePaceStyles(laps, minimumPercent)}
        label={label}
        detail={detail}
        testId={testId}
        rowClassName={rowClassName}
        listClassName={listClassName}
      />
    </section>
  );
}

export function SimpleLapWorkoutCard<Role>({
  props,
  kind,
  badge,
  compact,
  execution,
  roleLabel,
}: Readonly<{
  props: SimpleLapCardProps<Role>;
  kind: string;
  badge: string;
  compact?: boolean;
  execution: (laps: NonEmptyReadonlyArray<SourceLapData<Role>>, language: string) => JSX.Element;
  roleLabel: (role: Role, t: TFunction) => string;
}>): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, lapData, shapeSeed, ...summary } = props;
  const content =
    lapData.kind === "available" ? (
      <div className="workout-card__structure">
        {execution(lapData.laps, language)}
        <SourceLapEvidence
          sourceLaps={lapData.laps}
          language={language}
          roleLabel={roleLabel}
          dataRole={() => "main"}
        />
      </div>
    ) : (
      <p className="no-laps">{t("workout.noLaps")}</p>
    );
  return (
    <JournalWorkoutCard
      kind={kind}
      category={category}
      badge={badge}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
      compact={compact}
    >
      {content}
    </JournalWorkoutCard>
  );
}
