import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { Workout } from "../../domain/workout";
import { Button } from "../ui";
import { WorkoutCard } from "../workouts/WorkoutCard";

export function WeeklyDetail({
  workout,
  onClose,
}: Readonly<{ workout: Workout; onClose: () => void }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <section
      className="weekly-detail"
      id="weekly-workout-detail"
      aria-labelledby="weekly-detail-title"
    >
      <header>
        <div>
          <p className="eyebrow">{t("weekly.selectedEyebrow")}</p>
          <h2 id="weekly-detail-title">{t("weekly.selectedTitle")}</h2>
        </div>
        <Button variant="quiet" onClick={onClose}>
          {t("weekly.closeDetails")}
        </Button>
      </header>
      <WorkoutCard workout={workout} />
    </section>
  );
}
