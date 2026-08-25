declare const brand: unique symbol;

type Branded<Value, Name extends string> = Value & {
  readonly [brand]: Name;
};

export type UserId = Branded<string, "UserId">;
export type ConnectionId = Branded<string, "ConnectionId">;
export type ExternalAccountId = Branded<string, "ExternalAccountId">;
export type WorkoutId = Branded<string, "WorkoutId">;
export type FirstName = Branded<string, "FirstName">;
export type LastName = Branded<string, "LastName">;
export type WorkoutName = Branded<string, "WorkoutName">;
export type Instant = Branded<string, "Instant">;
export type DurationSeconds = Branded<number, "DurationSeconds">;
export type DistanceMeters = Branded<number, "DistanceMeters">;
export type SynchronizationCheckpoint = Branded<string, "SynchronizationCheckpoint">;
export type ContinuationToken = Branded<string, "ContinuationToken">;
