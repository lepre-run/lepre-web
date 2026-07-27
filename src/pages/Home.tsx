import { type FormEvent, type JSX, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { application } from "../composition/application";
import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";
import {
  createWorkoutHistoryExport,
  localWorkoutDate,
  workoutHistoryFilename,
  workoutsInRange,
} from "../domain/workout-history-export";
import { LanguageSelector } from "../i18n/LanguageSelector";
import { STRAVA_START_URL } from "../infrastructure/api/lepre-backend";
import { downloadJson } from "../infrastructure/browser/download-json";
import { ConditionDashboard } from "./condition-dashboard/ConditionDashboard";
import { WeeklyOverview } from "./weekly-overview/WeeklyOverview";

export { STRAVA_START_URL };

type ScreenState =
  | Readonly<{ kind: "checking" }>
  | Readonly<{ kind: "disconnected" }>
  | Readonly<{
      kind: "ready";
      user: User;
      availability: "online" | "offline" | "reauthorization-required";
    }>;

type Notice =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "paused"; reason: "queued" }>
  | Readonly<{ kind: "paused"; reason: "rate-limited"; minutes: number }>
  | Readonly<{
      kind: "error";
      reason: "synchronization" | "disconnect";
      retryable: boolean;
    }>;

type SynchronizationStatus = "checking" | "syncing" | "current" | "paused" | "failed";

export function Home(): JSX.Element {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [synchronizationStatus, setSynchronizationStatus] =
    useState<SynchronizationStatus>("checking");
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [disconnectConfirmationOpen, setDisconnectConfirmationOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFrom, setDownloadFrom] = useState("");
  const [downloadTo, setDownloadTo] = useState("");

  const storedDateBounds = useMemo(() => {
    const dates = workouts.map((workout) => localWorkoutDate(workout.performedAt)).sort();
    return { earliest: dates[0] ?? "", latest: dates[dates.length - 1] ?? "" };
  }, [workouts]);
  const downloadRange = { from: downloadFrom, to: downloadTo };
  const selectedWorkouts = useMemo(
    () =>
      downloadFrom.length > 0 && downloadTo.length > 0 && downloadFrom <= downloadTo
        ? workoutsInRange(workouts, { from: downloadFrom, to: downloadTo })
        : [],
    [downloadFrom, downloadTo, workouts],
  );

  const refreshWorkouts = useCallback(async (): Promise<void> => {
    const result = await application.listWorkouts();
    if (result.kind === "loaded") setWorkouts(result.workouts);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    setSyncing(true);
    setSynchronizationStatus("syncing");
    setNotice({ kind: "none" });
    const result = await application.synchronizeWorkouts(refreshWorkouts);
    if (result.kind === "reauthorization-required") {
      setScreen((current) =>
        current.kind === "ready"
          ? { ...current, availability: "reauthorization-required" }
          : current,
      );
      setSynchronizationStatus("failed");
    }
    if (result.kind === "provider-unavailable") {
      setSynchronizationStatus("failed");
      setNotice({
        kind: "error",
        reason: "synchronization",
        retryable: true,
      });
    }
    if (result.kind === "queued") {
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setSynchronizationStatus("paused");
      setNotice({ kind: "paused", reason: "queued" });
    }
    if (result.kind === "rate-limited") {
      const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setSynchronizationStatus("paused");
      setNotice({
        kind: "paused",
        reason: "rate-limited",
        minutes,
      });
    }
    if (result.kind === "synchronized") setSynchronizationStatus("current");
    setSyncing(false);
  }, [refreshWorkouts]);

  useEffect(() => {
    if (retryAt === null) return;
    const timeout = window.setTimeout(
      () => {
        setRetryAt(null);
        void sync();
      },
      Math.max(0, retryAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [retryAt, sync]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await refreshWorkouts();
      if (!active) return;
      const user = await application.loadUser();
      if (!active) return;
      if (user.kind === "disconnected") {
        setScreen({ kind: "disconnected" });
        return;
      }
      setScreen({
        kind: "ready",
        user: user.user,
        availability:
          user.kind === "connected"
            ? "online"
            : user.kind === "offline"
              ? "offline"
              : "reauthorization-required",
      });
      if (user.kind === "connected") {
        await sync();
      } else {
        setSynchronizationStatus("failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshWorkouts, sync]);

  async function handleDisconnect(): Promise<void> {
    setNotice({ kind: "none" });
    setDisconnecting(true);
    const result = await application.disconnectProvider();
    if (result.kind === "disconnected") {
      setWorkouts([]);
      setScreen({ kind: "disconnected" });
      setAccountOpen(false);
      setDisconnectConfirmationOpen(false);
    } else {
      setNotice({
        kind: "error",
        reason: "disconnect",
        retryable: false,
      });
    }
    setDisconnecting(false);
  }

  function synchronizationLabel(): string {
    if (screen.kind === "ready" && screen.availability === "offline") {
      return t("syncStatus.offline");
    }
    if (screen.kind === "ready" && screen.availability === "reauthorization-required") {
      return t("syncStatus.attention");
    }
    if (synchronizationStatus === "syncing") return t("syncStatus.updating");
    if (synchronizationStatus === "paused") return t("syncStatus.paused");
    if (synchronizationStatus === "failed") return t("syncStatus.failed");
    if (synchronizationStatus === "current") return t("syncStatus.current");
    return t("syncStatus.checking");
  }

  function synchronizationState(): SynchronizationStatus | ScreenState["kind"] | "offline" {
    if (screen.kind !== "ready") return screen.kind;
    if (screen.availability === "offline") return "offline";
    if (screen.availability === "reauthorization-required") return "failed";
    return synchronizationStatus;
  }

  function noticeMessage(): string {
    if (notice.kind === "none") return "";
    if (notice.kind === "paused" && notice.reason === "queued") return t("notices.queued");
    if (notice.kind === "paused") {
      return t("notices.rateLimited", { count: notice.minutes });
    }
    return notice.reason === "disconnect"
      ? t("notices.disconnectError")
      : t("notices.synchronizationError");
  }

  function openDownload(): void {
    setDownloadFrom(storedDateBounds.earliest);
    setDownloadTo(storedDateBounds.latest);
    setDownloadOpen(true);
  }

  function handleDownload(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (selectedWorkouts.length === 0) return;
    const exportDocument = createWorkoutHistoryExport(workouts, downloadRange);
    downloadJson(workoutHistoryFilename(downloadRange), exportDocument);
    setDownloadOpen(false);
  }

  if (screen.kind === "checking") {
    return (
      <main className="shell shell--centered">
        <h1>lepre</h1>
        <p>{t("home.opening")}</p>
      </main>
    );
  }

  if (screen.kind === "disconnected") {
    return (
      <main className="shell shell--centered">
        <div className="public-settings">
          <p className="wordmark">lepre</p>
          <LanguageSelector />
        </div>
        <h1>{t("home.heroTitle")}</h1>
        <p className="lede">{t("home.heroDescription")}</p>
        <a className="primary-action" href={STRAVA_START_URL}>
          {t("home.connectStrava")}
        </a>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="app-header">
        <div>
          <p className="wordmark">lepre</p>
          <p className="runner-name">
            {screen.user.firstName} {screen.user.lastName}
          </p>
        </div>
        <div className="header-controls">
          <p className="sync-status" data-state={synchronizationState()} aria-live="polite">
            <span aria-hidden="true" />
            {synchronizationLabel()}
          </p>
          <button
            className="quiet-action"
            type="button"
            aria-expanded={accountOpen}
            aria-controls="account-panel"
            onClick={() => {
              setAccountOpen((open) => !open);
              setDisconnectConfirmationOpen(false);
            }}
          >
            {t("actions.account")}
          </button>
        </div>
      </header>
      {accountOpen && (
        <section
          className="account-panel"
          id="account-panel"
          aria-labelledby={disconnectConfirmationOpen ? "disconnect-title" : "account-title"}
        >
          {!disconnectConfirmationOpen ? (
            <>
              <div>
                <p className="eyebrow">{t("account.eyebrow")}</p>
                <h2 id="account-title">{t("account.title")}</h2>
                <p>{t("account.description")}</p>
              </div>
              <div className="account-panel__controls">
                <LanguageSelector />
                <button
                  className="danger-action"
                  type="button"
                  onClick={() => setDisconnectConfirmationOpen(true)}
                  disabled={syncing || screen.availability === "offline"}
                >
                  {t("actions.disconnectStrava")}
                </button>
              </div>
            </>
          ) : (
            <div
              className="disconnect-confirmation"
              role="alertdialog"
              aria-labelledby="disconnect-title"
            >
              <div>
                <p className="eyebrow">{t("account.eyebrow")}</p>
                <h3 id="disconnect-title">{t("account.disconnectTitle")}</h3>
                <p>{t("account.disconnectWarning")}</p>
              </div>
              <div className="disconnect-actions">
                <button
                  className="danger-action danger-action--solid"
                  type="button"
                  onClick={() => void handleDisconnect()}
                  disabled={disconnecting}
                >
                  {disconnecting ? t("actions.disconnecting") : t("actions.confirmDisconnect")}
                </button>
                <button
                  className="quiet-action"
                  type="button"
                  onClick={() => setDisconnectConfirmationOpen(false)}
                  disabled={disconnecting}
                >
                  {t("actions.cancel")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {screen.availability === "offline" && <p className="notice">{t("notices.offline")}</p>}
      {screen.availability === "reauthorization-required" && (
        <div className="notice notice--action">
          <p>{t("notices.reauthorization")}</p>
          <a className="notice-action" href={STRAVA_START_URL}>
            {t("actions.reconnectStrava")}
          </a>
        </div>
      )}
      {notice.kind === "error" && (
        <div className="notice notice--error notice--action" role="alert">
          <p>{noticeMessage()}</p>
          {notice.retryable && (
            <button type="button" onClick={() => void sync()} disabled={syncing}>
              {t("actions.tryAgain")}
            </button>
          )}
        </div>
      )}
      {notice.kind === "paused" && <output className="notice">{noticeMessage()}</output>}
      {workouts.length > 0 && <ConditionDashboard workouts={workouts} />}
      <div className="feed-heading">
        <div>
          <p className="eyebrow">{t("feed.eyebrow")}</p>
          <h1>{t("feed.title")}</h1>
        </div>
        <div className="feed-actions">
          <p className="workout-count">{t("feed.storedCount", { count: workouts.length })}</p>
          <button
            className="quiet-action"
            type="button"
            onClick={openDownload}
            disabled={workouts.length === 0}
          >
            {t("actions.download")}
          </button>
        </div>
      </div>
      {downloadOpen && (
        <section className="download-panel" role="dialog" aria-labelledby="download-title">
          <div className="download-panel__heading">
            <div>
              <p className="eyebrow">{t("download.eyebrow")}</p>
              <h2 id="download-title">{t("download.title")}</h2>
            </div>
            <p>{t("download.description")}</p>
          </div>
          <form onSubmit={handleDownload}>
            <div className="download-fields">
              <label>
                <span>{t("download.from")}</span>
                <input
                  type="date"
                  value={downloadFrom}
                  min={storedDateBounds.earliest}
                  max={downloadTo || storedDateBounds.latest}
                  onChange={(event) => setDownloadFrom(event.target.value)}
                />
              </label>
              <label>
                <span>{t("download.to")}</span>
                <input
                  type="date"
                  value={downloadTo}
                  min={downloadFrom || storedDateBounds.earliest}
                  max={storedDateBounds.latest}
                  onChange={(event) => setDownloadTo(event.target.value)}
                />
              </label>
            </div>
            <output className="download-count">
              {t("download.workoutCount", { count: selectedWorkouts.length })}
            </output>
            <div className="download-actions">
              <button type="submit" disabled={selectedWorkouts.length === 0}>
                {t("download.downloadJson")}
              </button>
              <button className="quiet-action" type="button" onClick={() => setDownloadOpen(false)}>
                {t("download.cancel")}
              </button>
            </div>
          </form>
        </section>
      )}
      {workouts.length === 0 ? (
        <div className="empty-state">
          <h2>{syncing ? t("feed.importing") : t("feed.emptyTitle")}</h2>
          <p>{t("feed.emptyDescription")}</p>
        </div>
      ) : (
        <WeeklyOverview workouts={workouts} />
      )}
    </main>
  );
}
