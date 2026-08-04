import type { User } from "../../domain/user";

export type ScreenState =
  | Readonly<{ kind: "checking" }>
  | Readonly<{ kind: "disconnected" }>
  | Readonly<{
      kind: "ready";
      user: User;
      availability: "online" | "offline" | "reauthorization-required";
    }>;

export type ReadyScreen = Extract<ScreenState, { kind: "ready" }>;

export type Notice =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "paused"; reason: "backfill" }>
  | Readonly<{ kind: "paused"; reason: "queued" }>
  | Readonly<{ kind: "paused"; reason: "rate-limited"; minutes: number }>
  | Readonly<{
      kind: "error";
      reason: "synchronization" | "disconnect";
      retryable: boolean;
    }>;

export type SynchronizationStatus = "checking" | "syncing" | "current" | "paused" | "failed";
