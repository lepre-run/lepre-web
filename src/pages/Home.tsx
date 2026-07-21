import {
  type CSSProperties,
  type FormEvent,
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { application } from "../composition/application";
import { appearanceForLap, type LapAppearance } from "../domain/lap-appearance";
import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";
import {
  createWorkoutHistoryExport,
  localWorkoutDate,
  workoutHistoryFilename,
  workoutsInRange,
} from "../domain/workout-history-export";
import {
  formatClassification,
  formatDistance,
  formatDuration,
  formatLapRole,
  formatPace,
  formatWorkoutDate,
} from "../i18n/formatters";
import { STRAVA_START_URL } from "../infrastructure/api/lepre-backend";
import { downloadJson } from "../infrastructure/browser/download-json";

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
  | Readonly<{ kind: "paused"; message: string }>
  | Readonly<{ kind: "error"; message: string }>;

type LapStyle = CSSProperties & Readonly<{ "--lap-progress"?: string }>;

function styleForLap(appearance: LapAppearance): LapStyle | undefined {
  return appearance.progressiveIntensity === undefined
    ? undefined
    : { "--lap-progress": `${appearance.progressiveIntensity * 100}%` };
}

export function Home(): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [retryAt, setRetryAt] = useState<number | null>(null);
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
    setNotice({ kind: "none" });
    const result = await application.synchronizeWorkouts(refreshWorkouts);
    if (result.kind === "reauthorization-required") {
      setNotice({ kind: "error", message: t("notices.reconnectError") });
    }
    if (result.kind === "provider-unavailable") {
      setNotice({ kind: "error", message: t("notices.synchronizationError") });
    }
    if (result.kind === "rate-limited") {
      const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setNotice({
        kind: "paused",
        message: t("notices.rateLimited", { count: minutes }),
      });
    }
    setSyncing(false);
  }, [refreshWorkouts, t]);

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
      if (user.kind === "connected") await sync();
    })();
    return () => {
      active = false;
    };
  }, [refreshWorkouts, sync]);

  async function handleDisconnect(): Promise<void> {
    setNotice({ kind: "none" });
    const result = await application.disconnectProvider();
    if (result.kind === "disconnected") {
      setWorkouts([]);
      setScreen({ kind: "disconnected" });
    } else {
      setNotice({ kind: "error", message: t("notices.disconnectError") });
    }
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
        <p className="wordmark">lepre</p>
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
        <div className="header-actions">
          <button
            type="button"
            onClick={() => void sync()}
            disabled={syncing || retryAt !== null || screen.availability !== "online"}
          >
            {syncing
              ? t("actions.syncing")
              : retryAt !== null
                ? t("actions.paused")
                : t("actions.sync")}
          </button>
          <button
            className="quiet-action"
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={syncing || screen.availability === "offline"}
          >
            {t("actions.disconnect")}
          </button>
        </div>
      </header>
      {screen.availability === "offline" && <p className="notice">{t("notices.offline")}</p>}
      {screen.availability === "reauthorization-required" && (
        <p className="notice">{t("notices.reauthorization")}</p>
      )}
      {notice.kind === "error" && (
        <p className="notice notice--error" role="alert">
          {notice.message}
        </p>
      )}
      {notice.kind === "paused" && <output className="notice">{notice.message}</output>}
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
        <ol className="workout-feed">
          {workouts.map((workout) => (
            <li className="workout-feed__item" key={workout.id}>
              <article
                className={`workout-card workout-card--${workout.type}`}
                data-workout-type={workout.type}
              >
                <header className="workout-card__header">
                  <div>
                    {workout.type === "race" && (
                      <p className="race-badge">
                        <span aria-hidden="true">🏁</span>
                        {t("workout.race")}
                      </p>
                    )}
                    <p className={`workout-type workout-type--${workout.structure.kind}`}>
                      {formatClassification(workout.structure, t, language)}
                    </p>
                    <h2>{workout.name}</h2>
                  </div>
                  <dl className="workout-summary">
                    <div>
                      <dt>{t("workout.date")}</dt>
                      <dd>
                        <time dateTime={workout.performedAt}>
                          {formatWorkoutDate(workout.performedAt, language)}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>{t("workout.distance")}</dt>
                      <dd>{formatDistance(workout.distanceMeters, language)}</dd>
                    </div>
                  </dl>
                </header>
                {workout.description.trim().length > 0 && (
                  <p className="workout-description">{workout.description}</p>
                )}
                <div className="lap-section">
                  <div className="lap-section__heading">
                    <h3>{t("workout.lapStructure")}</h3>
                    <span>
                      {formatDuration(workout.durationSeconds)} {t("workout.moving")}
                    </span>
                  </div>
                  {workout.laps.length === 0 ? (
                    <p className="no-laps">{t("workout.noLaps")}</p>
                  ) : (
                    <>
                      {workout.structure.kind === "progressive" && (
                        <p className="progressive-legend">{t("workout.progressiveLegend")}</p>
                      )}
                      <ol className="lap-list">
                        {workout.laps.map((lap) => {
                          const appearance = appearanceForLap(workout, lap);
                          const progressiveClass =
                            appearance.progressiveIntensity === undefined
                              ? ""
                              : " lap--progressive";
                          return (
                            <li
                              className={`lap lap--${appearance.role}${progressiveClass}`}
                              data-lap-role={appearance.role}
                              key={lap.index}
                              style={styleForLap(appearance)}
                            >
                              <span className="lap__index">{lap.index}</span>
                              <span className="lap__identity">
                                <span className="lap__name">{lap.name}</span>
                                <span className="lap__role">{formatLapRole(appearance, t)}</span>
                              </span>
                              <span>{formatDistance(lap.distanceMeters, language)}</span>
                              <span>{formatDuration(lap.movingDurationSeconds)}</span>
                              <strong>
                                {formatPace(lap.movingDurationSeconds, lap.distanceMeters)}
                              </strong>
                            </li>
                          );
                        })}
                      </ol>
                    </>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
