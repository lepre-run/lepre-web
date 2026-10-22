import type { TFunction } from "i18next";
import type { Notice, ReadyScreen, SynchronizationStatus } from "./homeTypes";

type SynchronizationLabelId =
  | "offline"
  | "reauthorization"
  | "checking"
  | "updating"
  | "current"
  | "paused"
  | "failed"
  | "synchronizationError"
  | "disconnectError"
  | "backfill"
  | "queued"
  | "rateLimited";

type FullLabel = (t: TFunction, minutes: number) => string;

const FULL_LABELS: Record<SynchronizationLabelId, FullLabel> = {
  offline: (t) => t("notices.offline"),
  reauthorization: (t) => t("notices.reauthorization"),
  checking: (t) => t("syncStatus.checking"),
  updating: (t) => t("syncStatus.updating"),
  current: (t) => t("syncStatus.current"),
  paused: (t) => t("syncStatus.paused"),
  failed: (t) => t("syncStatus.failed"),
  synchronizationError: (t) => t("notices.synchronizationError"),
  disconnectError: (t) => t("notices.disconnectError"),
  backfill: (t) => t("notices.backfill"),
  queued: (t) => t("notices.queued"),
  rateLimited: (t, minutes) => t("notices.rateLimited", { count: minutes }),
};

export function synchronizationLabels(
  screen: ReadyScreen,
  status: SynchronizationStatus,
  notice: Notice,
  t: TFunction,
): Readonly<{ full: string; short: string }> {
  const id = synchronizationLabelId(screen, status, notice);
  const minutes = notice.kind === "paused" && notice.reason === "rate-limited" ? notice.minutes : 0;
  return {
    full: FULL_LABELS[id](t, minutes),
    short: t(`syncStatusShort.${id}`, { count: minutes }),
  };
}

export function synchronizationState(
  screen: ReadyScreen,
  status: SynchronizationStatus,
): SynchronizationStatus | "offline" {
  if (screen.availability === "offline") return "offline";
  return screen.availability === "reauthorization-required" ? "failed" : status;
}

function synchronizationLabelId(
  screen: ReadyScreen,
  status: SynchronizationStatus,
  notice: Notice,
): SynchronizationLabelId {
  if (screen.availability === "offline") return "offline";
  if (screen.availability === "reauthorization-required") return "reauthorization";
  if (notice.kind !== "none") return noticeLabelId(notice);
  return status === "syncing" ? "updating" : status;
}

function noticeLabelId(notice: Exclude<Notice, { kind: "none" }>): SynchronizationLabelId {
  if (notice.kind === "error") {
    return notice.reason === "disconnect" ? "disconnectError" : "synchronizationError";
  }
  if (notice.reason === "backfill") return "backfill";
  return notice.reason === "queued" ? "queued" : "rateLimited";
}
