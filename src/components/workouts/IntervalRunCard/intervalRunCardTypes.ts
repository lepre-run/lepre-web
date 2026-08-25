import type { DistanceMeters, DurationSeconds } from "../../../domain/identity";
import type { SourceLapData } from "../SourceLapEvidence/SourceLapEvidence";
import type {
  CommonWorkoutCardProps,
  Measurement,
  NonEmptyReadonlyArray,
} from "../workoutCardData";

export type IntervalLapProps = Readonly<{
  sourceLapNumber: number;
  distance: DistanceMeters;
  time: DurationSeconds;
  averageHeartRate: Measurement<number>;
}>;
export type IntervalRepetitionProps =
  | Readonly<{
      kind: "work-and-recovery";
      number: number;
      work: IntervalLapProps;
      recovery: IntervalLapProps;
    }>
  | Readonly<{ kind: "work-only"; number: number; work: IntervalLapProps }>;
export type IntervalSourceLapRole =
  | Readonly<{ kind: "warmup" }>
  | Readonly<{ kind: "work"; repetitionNumber: number }>
  | Readonly<{ kind: "recovery"; repetitionNumber: number }>
  | Readonly<{ kind: "cooldown" }>
  | Readonly<{ kind: "unknown" }>;
export type IntervalSourceLapProps = SourceLapData<IntervalSourceLapRole>;
export type IntervalRunCardProps = CommonWorkoutCardProps &
  Readonly<{
    repetitions: NonEmptyReadonlyArray<IntervalRepetitionProps>;
    sourceLaps: NonEmptyReadonlyArray<IntervalSourceLapProps>;
    shapeSeed: number;
  }>;
