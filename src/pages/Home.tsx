import { type JSX, useCallback, useEffect, useState } from "react";
import { application } from "../composition/application";
import type { User } from "../domain/user";
import type { Workout } from "../domain/workout";
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

type Notice = Readonly<{ kind: "none" }> | Readonly<{ kind: "error"; message: string }>;

function duration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
    : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function distance(meters: number): string {
  return meters >= 1_000 ? `${(meters / 1_000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function pace(seconds: number, meters: number): string {
  if (seconds <= 0 || meters <= 0) return "—";
  const secondsPerKilometer = Math.round((seconds / meters) * 1_000);
  const minutes = Math.floor(secondsPerKilometer / 60);
  const remainder = secondsPerKilometer % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")} /km`;
}

export function Home(): JSX.Element {
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });

  const refreshWorkouts = useCallback(async (): Promise<void> => {
    const result = await application.listWorkouts();
    if (result.kind === "loaded") setWorkouts(result.workouts);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    setSyncing(true);
    setNotice({ kind: "none" });
    const result = await application.synchronizeWorkouts(refreshWorkouts);
    if (result.kind === "reauthorization-required") {
      setNotice({ kind: "error", message: "Reconnect Strava to synchronize workouts." });
    }
    if (result.kind === "provider-unavailable") {
      setNotice({ kind: "error", message: "Could not synchronize workouts right now." });
    }
    setSyncing(false);
  }, [refreshWorkouts]);

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
      setNotice({ kind: "error", message: "Could not disconnect Strava." });
    }
  }

  if (screen.kind === "checking") {
    return (
      <main className="shell shell--centered">
        <h1>lepre</h1>
        <p>Opening your local workouts…</p>
      </main>
    );
  }

  if (screen.kind === "disconnected") {
    return (
      <main className="shell shell--centered">
        <p className="wordmark">lepre</p>
        <h1>Train with direction.</h1>
        <p className="lede">See the structure inside every run, not just its average.</p>
        <a className="primary-action" href={STRAVA_START_URL}>
          Connect with Strava
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
            disabled={syncing || screen.availability !== "online"}
          >
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <button
            className="quiet-action"
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={syncing || screen.availability === "offline"}
          >
            Disconnect
          </button>
        </div>
      </header>
      {screen.availability === "offline" && (
        <p className="notice">You are offline. Showing workouts stored on this device.</p>
      )}
      {screen.availability === "reauthorization-required" && (
        <p className="notice">Reconnect Strava to synchronize. Local workouts remain available.</p>
      )}
      {notice.kind === "error" && (
        <p className="notice notice--error" role="alert">
          {notice.message}
        </p>
      )}
      <div className="feed-heading">
        <div>
          <p className="eyebrow">Workout feed</p>
          <h1>Your training, stage by stage.</h1>
        </div>
        <p className="workout-count">{workouts.length} stored locally</p>
      </div>
      {workouts.length === 0 ? (
        <div className="empty-state">
          <h2>{syncing ? "Importing your recent runs…" : "No runs found"}</h2>
          <p>Completed workouts will appear here after their laps have been classified.</p>
        </div>
      ) : (
        <ol className="workout-feed">
          {workouts.map((workout) => (
            <li className="workout-feed__item" key={workout.id}>
              <article className="workout-card">
                <header className="workout-card__header">
                  <div>
                    <p className={`workout-type workout-type--${workout.classification.kind}`}>
                      {workout.classification.label}
                    </p>
                    <h2>{workout.name}</h2>
                  </div>
                  <dl className="workout-summary">
                    <div>
                      <dt>Date</dt>
                      <dd>
                        <time dateTime={workout.performedAt}>
                          {new Date(workout.performedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>Distance</dt>
                      <dd>{distance(workout.distanceMeters)}</dd>
                    </div>
                  </dl>
                </header>
                {workout.description.trim().length > 0 && (
                  <p className="workout-description">{workout.description}</p>
                )}
                <div className="lap-section">
                  <div className="lap-section__heading">
                    <h3>Lap structure</h3>
                    <span>{duration(workout.durationSeconds)} moving</span>
                  </div>
                  {workout.laps.length === 0 ? (
                    <p className="no-laps">Strava did not provide lap data for this run.</p>
                  ) : (
                    <ol className="lap-list">
                      {workout.laps.map((lap) => {
                        const isCore = workout.classification.coreLapIndexes.includes(lap.index);
                        return (
                          <li className={isCore ? "lap lap--core" : "lap"} key={lap.index}>
                            <span className="lap__index">{lap.index}</span>
                            <span className="lap__name">{lap.name}</span>
                            <span>{distance(lap.distanceMeters)}</span>
                            <span>{duration(lap.movingDurationSeconds)}</span>
                            <strong>{pace(lap.movingDurationSeconds, lap.distanceMeters)}</strong>
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
