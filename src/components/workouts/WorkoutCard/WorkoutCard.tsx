import { type JSX, useMemo } from "react";
import type { Workout } from "../../../domain/workout";
import { FreeRunCard, freeRunCardPropsFromWorkout } from "../FreeRunCard/FreeRunCard";
import type { FreeRunCardProps } from "../FreeRunCard/freeRunCardData";
import {
  IntervalRunCard,
  intervalRunCardPropsFromWorkout,
} from "../IntervalRunCard/IntervalRunCard";
import type { IntervalRunCardProps } from "../IntervalRunCard/intervalRunCardTypes";
import {
  ProgressiveRunCard,
  progressiveRunCardPropsFromWorkout,
} from "../ProgressiveRunCard/ProgressiveRunCard";
import type { ProgressiveRunCardProps } from "../ProgressiveRunCard/progressiveRunCardData";
import { RaceCard, raceCardPropsFromWorkout } from "../RaceCard/RaceCard";
import type { RaceCardProps } from "../RaceCard/raceCardData";
import { StructuredWorkoutCard } from "../StructuredWorkoutCard/StructuredWorkoutCard";

function cardPropsOrFallback<Props>(
  workout: Workout,
  card: string,
  build: (workout: Workout) => Props,
): Props | undefined {
  try {
    return build(workout);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Workout ${workout.id} has inconsistent ${card} data; ` +
        `showing the structured workout card instead: ${reason}`,
    );
    return undefined;
  }
}

type CardSelection =
  | Readonly<{ kind: "race"; props: RaceCardProps }>
  | Readonly<{ kind: "free-run"; props: FreeRunCardProps }>
  | Readonly<{ kind: "progressive"; props: ProgressiveRunCardProps }>
  | Readonly<{ kind: "intervals"; props: IntervalRunCardProps }>
  | Readonly<{ kind: "structured" }>;

function selectCard(workout: Workout): CardSelection {
  if (workout.type === "race") {
    const props = cardPropsOrFallback(workout, "race", raceCardPropsFromWorkout);
    if (props) return { kind: "race", props };
  } else if (workout.structure.kind === "free-run") {
    const props = cardPropsOrFallback(workout, "free-run", freeRunCardPropsFromWorkout);
    if (props) return { kind: "free-run", props };
  } else if (workout.structure.kind === "progressive") {
    const props = cardPropsOrFallback(workout, "progressive", progressiveRunCardPropsFromWorkout);
    if (props) return { kind: "progressive", props };
  } else if (workout.structure.kind === "intervals") {
    const props = cardPropsOrFallback(workout, "intervals", intervalRunCardPropsFromWorkout);
    if (props) return { kind: "intervals", props };
  }
  return { kind: "structured" };
}

export function WorkoutCard({ workout }: Readonly<{ workout: Workout }>): JSX.Element {
  const card = useMemo(() => selectCard(workout), [workout]);

  switch (card.kind) {
    case "race":
      return <RaceCard {...card.props} />;
    case "free-run":
      return <FreeRunCard {...card.props} />;
    case "progressive":
      return <ProgressiveRunCard {...card.props} />;
    case "intervals":
      return <IntervalRunCard {...card.props} />;
    case "structured":
      return <StructuredWorkoutCard workout={workout} />;
  }
}
