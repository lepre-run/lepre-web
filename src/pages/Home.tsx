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
      <main>
        <h1>lepre</h1>
        <p>Opening your local workouts…</p>
      </main>
    );
  }

  if (screen.kind === "disconnected") {
    return (
      <main>
        <h1>lepre</h1>
        <p>Connect your Strava account to keep a local list of your runs.</p>
        <a href={STRAVA_START_URL}>Connect with Strava</a>
      </main>
    );
  }

  return (
    <main>
      <h1>lepre</h1>
      <p>
        {screen.user.firstName} {screen.user.lastName} · {screen.user.connection.provider}
      </p>
      {screen.availability === "offline" && (
        <p>You are offline. Showing workouts stored on this device.</p>
      )}
      {screen.availability === "reauthorization-required" && (
        <p>Reconnect Strava to synchronize. Local workouts remain available.</p>
      )}
      {notice.kind === "error" && <p role="alert">{notice.message}</p>}
      <p>{workouts.length} workouts stored on this device.</p>
      <p>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={syncing || screen.availability !== "online"}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>{" "}
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={syncing || screen.availability === "offline"}
        >
          Disconnect Strava
        </button>
      </p>
      {workouts.length === 0 ? (
        <p>No workouts found.</p>
      ) : (
        <ol>
          {workouts.map((workout) => (
            <li key={workout.id}>
              <time dateTime={workout.performedAt}>
                {new Date(workout.performedAt).toLocaleDateString()}
              </time>
              {" — "}
              {workout.name} · {(workout.distanceMeters / 1000).toFixed(2)} km ·{" "}
              {duration(workout.durationSeconds)}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
