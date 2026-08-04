import { useCallback, useEffect, useState } from "react";
import type { Notice, ScreenState, SynchronizationStatus } from "../components/home/homeTypes";
import { application } from "../composition/application";
import type { Workout } from "../domain/workout";

export function useHomeController() {
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SynchronizationStatus>("checking");
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [retryAt, setRetryAt] = useState<number | null>(null);

  const refreshWorkouts = useCallback(async (): Promise<void> => {
    const result = await application.listWorkouts();
    if (result.kind === "loaded") setWorkouts(result.workouts);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    setSyncing(true);
    setStatus("syncing");
    setNotice({ kind: "none" });
    const result = await application.synchronizeWorkouts(refreshWorkouts);
    if (result.kind === "reauthorization-required") {
      setScreen((current) =>
        current.kind === "ready"
          ? { ...current, availability: "reauthorization-required" }
          : current,
      );
      setStatus("failed");
    } else if (result.kind === "provider-unavailable") {
      setStatus("failed");
      setNotice({ kind: "error", reason: "synchronization", retryable: true });
    } else if (result.kind === "backfill-paused") {
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setStatus("paused");
      setNotice({ kind: "paused", reason: "backfill" });
    } else if (result.kind === "queued" || result.kind === "rate-limited") {
      setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
      setStatus("paused");
      setNotice(
        result.kind === "queued"
          ? { kind: "paused", reason: "queued" }
          : {
              kind: "paused",
              reason: "rate-limited",
              minutes: Math.max(1, Math.ceil(result.retryAfterSeconds / 60)),
            },
      );
    } else {
      setStatus("current");
    }
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
      if (user.kind === "connected") await sync();
      else setStatus("failed");
    })();
    return () => {
      active = false;
    };
  }, [refreshWorkouts, sync]);

  const disconnect = async (): Promise<boolean> => {
    setNotice({ kind: "none" });
    const result = await application.disconnectProvider();
    if (result.kind !== "disconnected") {
      setNotice({ kind: "error", reason: "disconnect", retryable: false });
      return false;
    }
    setWorkouts([]);
    setScreen({ kind: "disconnected" });
    return true;
  };

  return { screen, workouts, syncing, status, notice, sync, disconnect };
}
