import type { ComponentType, JSX, SVGProps } from "react";
import { HeartBeatIcon } from "react-doodle-icons/icons/HeartBeatIcon";
import { LockIcon } from "react-doodle-icons/icons/LockIcon";
import { MapIcon } from "react-doodle-icons/icons/MapIcon";
import { StopwatchIcon } from "react-doodle-icons/icons/StopwatchIcon";
import { TrendUpIcon } from "react-doodle-icons/icons/TrendUpIcon";
import { useTranslation } from "react-i18next";
import type { DistanceMeters, DurationSeconds } from "../../domain/identity";
import { formatDistance, formatDuration, formatHeartRate } from "../../i18n/formatters";

export type Measurement<Value> =
  | Readonly<{ kind: "recorded"; value: Value }>
  | Readonly<{ kind: "unavailable" }>;

export type CommonWorkoutCardProps = Readonly<{
  title: string;
  description: string | null;
  privateDescription: string | null;
  distance: DistanceMeters;
  time: DurationSeconds;
  elevation: Measurement<number>;
  averageHeartRate: Measurement<number>;
}>;

function formattedMeasurement<Value>(
  measurement: Measurement<Value>,
  format: (value: Value) => string,
): string {
  return measurement.kind === "recorded" ? format(measurement.value) : "—";
}

type DoodleIcon = ComponentType<
  SVGProps<SVGSVGElement> & Readonly<{ size?: number | string; color?: string }>
>;

function WorkoutMetric({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: DoodleIcon; label: string; value: string }>): JSX.Element {
  return (
    <div className="workout-metric">
      <dt>
        <Icon size={34} aria-hidden="true" focusable="false" />
        <span className="visually-hidden">{label}</span>
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export function WorkoutCardSummary({
  title,
  description,
  privateDescription,
  distance,
  time,
  elevation,
  averageHeartRate,
}: CommonWorkoutCardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <>
      <h2>{title}</h2>

      <dl className="workout-summary workout-summary--complete">
        <WorkoutMetric
          icon={MapIcon}
          label={t("workout.distance")}
          value={formatDistance(distance, language)}
        />
        <WorkoutMetric
          icon={HeartBeatIcon}
          label={t("workout.averageHeartRate")}
          value={formattedMeasurement(averageHeartRate, formatHeartRate)}
        />
        <WorkoutMetric
          icon={StopwatchIcon}
          label={t("workout.movingTime")}
          value={formatDuration(time)}
        />
        <WorkoutMetric
          icon={TrendUpIcon}
          label={t("workout.elevation")}
          value={formattedMeasurement(elevation, (meters) => `${Math.round(meters)} m`)}
        />
      </dl>

      {description !== null && <p className="workout-description">{description}</p>}
      {privateDescription !== null && (
        <aside className="workout-private-description">
          <span>
            <LockIcon size={17} aria-hidden="true" focusable="false" />
            {t("workout.privateDescription")}
          </span>
          <p>{privateDescription}</p>
        </aside>
      )}
    </>
  );
}
