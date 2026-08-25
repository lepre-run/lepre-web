import type { TFunction } from "i18next";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { JournalWorkoutCard } from "../JournalWorkoutCard/JournalWorkoutCard";
import { LapExecutionRows } from "../LapExecutionRows/LapExecutionRows";
import { SourceLapEvidence } from "../SourceLapEvidence/SourceLapEvidence";
import { relativePaceStyles } from "../sourceLapData";
import type { NonEmptyReadonlyArray } from "../workoutCardData";
import {
  type ProgressiveRunCardProps,
  type ProgressiveSourceLapProps,
  type ProgressiveSourceLapRole,
  progressiveRunCardPropsFromWorkout,
} from "./progressiveRunCardData";

export { progressiveRunCardPropsFromWorkout };

function roleLabel(role: ProgressiveSourceLapRole, t: TFunction): string {
  return role.kind === "stage"
    ? t("lapRole.stage", { stage: role.stageNumber })
    : t(`lapRole.${role.kind}`);
}

function ProgressiveLaps({
  sourceLaps,
  language,
  stageCount,
}: Readonly<{
  sourceLaps: NonEmptyReadonlyArray<ProgressiveSourceLapProps>;
  language: string;
  stageCount: number;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <section
      className="execution-section"
      aria-label={t("classification.progressive", { stageCount })}
    >
      <LapExecutionRows
        laps={sourceLaps}
        language={language}
        styles={relativePaceStyles(sourceLaps)}
        label={(lap) => roleLabel(lap.role, t)}
        detail={(lap) => t("workout.lapNumber", { number: lap.number })}
        testId="progressive-lap-row"
      />
    </section>
  );
}

export function ProgressiveRunCard(props: ProgressiveRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, sourceLaps, shapeSeed, stages, ...summary } = props;
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
        <ProgressiveLaps sourceLaps={sourceLaps} language={language} stageCount={stages.length} />
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
