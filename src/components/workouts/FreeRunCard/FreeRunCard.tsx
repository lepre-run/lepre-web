import type { TFunction } from "i18next";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  SimpleLapExecution,
  SimpleLapWorkoutCard,
} from "../SimpleLapWorkoutCard/SimpleLapWorkoutCard";
import {
  type FreeRunCardProps,
  type FreeRunLapRole,
  freeRunCardPropsFromWorkout,
} from "./freeRunCardData";

export { freeRunCardPropsFromWorkout };

function roleLabel(_role: FreeRunLapRole, t: TFunction): string {
  return t("lapRole.main");
}

export function FreeRunCard(props: FreeRunCardProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <SimpleLapWorkoutCard
      props={props}
      kind="free-run"
      badge={t("classification.freeRun")}
      compact
      roleLabel={roleLabel}
      execution={(laps, language) => (
        <SimpleLapExecution
          laps={laps}
          language={language}
          ariaLabel={t("workout.lapExecution")}
          label={(lap) => roleLabel(lap.role, t)}
          detail={(lap) => t("workout.lapNumber", { number: lap.number })}
          testId="free-run-lap-row"
        />
      )}
    />
  );
}
