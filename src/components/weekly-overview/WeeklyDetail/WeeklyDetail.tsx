import type { JSX, Ref } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../../domain/workout";
import { Button } from "../../ui";
import { WorkoutCard } from "../../workouts/WorkoutCard/WorkoutCard";

export function WeeklyDetail({
  workout,
  onClose,
  active = true,
  ref,
}: Readonly<{
  workout: Workout;
  onClose: () => void;
  active?: boolean;
  ref?: Ref<HTMLElement>;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <section
      className="weekly-detail"
      id={active ? "weekly-workout-detail" : undefined}
      aria-labelledby={active ? "weekly-detail-title" : undefined}
      tabIndex={-1}
      ref={ref}
    >
      <header>
        <div>
          <p className="eyebrow">{t("weekly.selectedEyebrow")}</p>
          <h2 id={active ? "weekly-detail-title" : undefined}>{t("weekly.selectedTitle")}</h2>
        </div>
        <Button variant="quiet" onClick={onClose}>
          {t("weekly.closeDetails")}
        </Button>
      </header>
      <WorkoutCard workout={workout} />
    </section>
  );
}
