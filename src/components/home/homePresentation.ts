import type { TFunction } from "i18next";
import type { Notice, ReadyScreen, SynchronizationStatus } from "./homeTypes";

export function synchronizationLabel(
  screen: ReadyScreen,
  status: SynchronizationStatus,
  notice: Notice,
  t: TFunction,
): string {
  if (screen.availability === "offline") return t("notices.offline");
  if (screen.availability === "reauthorization-required") return t("notices.reauthorization");
  if (notice.kind !== "none") return noticeMessage(notice, t);
  if (status === "syncing") return t("syncStatus.updating");
  if (status === "paused") return t("syncStatus.paused");
  if (status === "failed") return t("syncStatus.failed");
  if (status === "current") return t("syncStatus.current");
  return t("syncStatus.checking");
}

export function synchronizationState(
  screen: ReadyScreen,
  status: SynchronizationStatus,
): SynchronizationStatus | "offline" {
  if (screen.availability === "offline") return "offline";
  return screen.availability === "reauthorization-required" ? "failed" : status;
}

export function noticeMessage(notice: Notice, t: TFunction): string {
  if (notice.kind === "none") return "";
  if (notice.kind === "paused" && notice.reason === "backfill") return t("notices.backfill");
  if (notice.kind === "paused" && notice.reason === "queued") return t("notices.queued");
  if (notice.kind === "paused") return t("notices.rateLimited", { count: notice.minutes });
  return t(
    notice.reason === "disconnect" ? "notices.disconnectError" : "notices.synchronizationError",
  );
}
