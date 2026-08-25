import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { JournalWorkoutCard } from "../JournalWorkoutCard/JournalWorkoutCard";
import { SourceLapEvidence } from "../SourceLapEvidence/SourceLapEvidence";
import { IntervalRunExecution, intervalRoleLabel } from "./IntervalRunExecution";
import { intervalRunCardPropsFromWorkout } from "./intervalRunCardData";
import type { IntervalRunCardProps } from "./intervalRunCardTypes";

export { intervalRunCardPropsFromWorkout };

export function IntervalRunCard(props: IntervalRunCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { performedAt, category, repetitions, sourceLaps, shapeSeed, ...summary } = props;
  return (
    <JournalWorkoutCard
      kind="intervals"
      category={category}
      badge={t("classification.intervalsBadge")}
      performedAt={performedAt}
      language={language}
      shapeSeed={shapeSeed}
      summary={summary}
    >
      <div className="workout-card__structure">
        <IntervalRunExecution
          repetitions={repetitions}
          sourceLaps={sourceLaps}
          language={language}
        />
        <SourceLapEvidence
          sourceLaps={sourceLaps}
          language={language}
          roleLabel={intervalRoleLabel}
          dataRole={(role) => role.kind}
        />
      </div>
    </JournalWorkoutCard>
  );
}
