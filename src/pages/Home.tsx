import { type JSX, useCallback, useEffect, useState } from "react";
import { disconnect, hasSession, synchronize } from "../api";
import { type Workout, clearWorkouts, listWorkouts } from "../data/workouts";

export const STRAVA_START_URL = "https://api.lepre.run/v1/auth/strava/start";

type ConnectionState = "checking" | "connected" | "disconnected" | "offline";

export function Home(): JSX.Element {
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async (): Promise<void> => {
    setSyncing(true);
    setError(null);
    try {
      setWorkouts(await synchronize(setWorkouts));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not synchronize workouts");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const local = await listWorkouts().catch(() => []);
      if (!active) return;
      setWorkouts(local);
      try {
        const connected = await hasSession();
        if (!active) return;
        setConnection(connected ? "connected" : "disconnected");
        if (connected) await sync();
      } catch {
        if (active) setConnection(local.length > 0 ? "offline" : "disconnected");
      }
    })();
    return () => {
      active = false;
    };
  }, [sync]);

  async function handleDisconnect(): Promise<void> {
    setError(null);
    try {
      await disconnect();
      await clearWorkouts();
      setWorkouts([]);
      setConnection("disconnected");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not disconnect Strava");
    }
  }

  if (connection === "checking") {
    return (
      <main>
        <h1>lepre</h1>
        <p>Opening your local workouts…</p>
      </main>
    );
  }

  if (connection === "disconnected") {
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
      {connection === "offline" && <p>You are offline. Showing workouts stored on this device.</p>}
      {error !== null && <p role="alert">{error}</p>}
      <p>{workouts.length} workouts stored on this device.</p>
      <p>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={syncing || connection === "offline"}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>{" "}
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={syncing || connection === "offline"}
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
              <time dateTime={workout.date}>{new Date(workout.date).toLocaleDateString()}</time>
              {" — "}
              {workout.name}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
