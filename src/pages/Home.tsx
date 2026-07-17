import { type JSX, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { application } from "../composition/application";
import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";
import {
  formatClassification,
  formatDistance,
  formatDuration,
  formatPace,
  formatWorkoutDate,
} from "../i18n/formatters";
import { STRAVA_START_URL } from "../infrastructure/api/lepre-backend";

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

export function Home(): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [retryAt, setRetryAt] = useState<number | null>(null);

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
        <p className="workout-count">{t("feed.storedCount", { count: workouts.length })}</p>
      </div>
      {workouts.length === 0 ? (
        <div className="empty-state">
          <h2>{syncing ? t("feed.importing") : t("feed.emptyTitle")}</h2>
          <p>{t("feed.emptyDescription")}</p>
        </div>
      ) : (
        <ol className="workout-feed">
          {workouts.map((workout) => (
            <li className="workout-feed__item" key={workout.id}>
              <article className="workout-card">
                <header className="workout-card__header">
                  <div>
                    <p className={`workout-type workout-type--${workout.classification.kind}`}>
                      {formatClassification(workout.classification, t, language)}
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
                    <ol className="lap-list">
                      {workout.laps.map((lap) => {
                        const isCore = workout.classification.coreLapIndexes.includes(lap.index);
                        return (
                          <li className={isCore ? "lap lap--core" : "lap"} key={lap.index}>
                            <span className="lap__index">{lap.index}</span>
                            <span className="lap__name">{lap.name}</span>
                            <span>{formatDistance(lap.distanceMeters, language)}</span>
                            <span>{formatDuration(lap.movingDurationSeconds)}</span>
                            <strong>
                              {formatPace(lap.movingDurationSeconds, lap.distanceMeters)}
                            </strong>
                          </li>
                        );
                      })}
                    </ol>
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
