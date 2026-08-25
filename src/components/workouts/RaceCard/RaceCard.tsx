import type { TFunction } from "i18next";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  SimpleLapExecution,
  SimpleLapWorkoutCard,
} from "../SimpleLapWorkoutCard/SimpleLapWorkoutCard";
import { type RaceCardProps, type RaceLapRole, raceCardPropsFromWorkout } from "./raceCardData";

export { raceCardPropsFromWorkout };

function roleLabel(role: RaceLapRole, t: TFunction): string {
  return t("workout.lapNumber", { number: role.splitNumber });
}

export function RaceCard(props: RaceCardProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <SimpleLapWorkoutCard
      props={props}
      kind="race"
      badge={t("workout.race")}
      roleLabel={roleLabel}
      execution={(laps, language) => (
        <SimpleLapExecution
          laps={laps}
          language={language}
          ariaLabel={t("workout.raceSplits")}
          minimumPercent={42}
          label={(_lap, index) => t("workout.lapNumber", { number: index + 1 })}
          detail={(lap) => lap.name}
          testId="race-split-row"
          rowClassName="stage-row race-split-row"
          listClassName="stage-matrix race-splits"
        />
      )}
    />
  );
}
