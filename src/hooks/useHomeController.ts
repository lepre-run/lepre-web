import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Notice, ScreenState, SynchronizationStatus } from "../components/home/homeTypes";
import { application } from "../composition/application";
import type { Workout } from "../domain/workout";

type SyncResult = Awaited<ReturnType<typeof application.synchronizeWorkouts>>;

type ControllerState = Readonly<{
  screen: ScreenState;
  workouts: ReadonlyArray<Workout>;
  syncing: boolean;
  status: SynchronizationStatus;
  notice: Notice;
  retryAt: number | null;
}>;

type ControllerSetters = Readonly<{
  setScreen: Dispatch<SetStateAction<ScreenState>>;
  setWorkouts: Dispatch<SetStateAction<ReadonlyArray<Workout>>>;
  setSyncing: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<SynchronizationStatus>>;
  setNotice: Dispatch<SetStateAction<Notice>>;
  setRetryAt: Dispatch<SetStateAction<number | null>>;
}>;

function useControllerState(): readonly [ControllerState, ControllerSetters] {
  const [screen, setScreen] = useState<ScreenState>({ kind: "checking" });
  const [workouts, setWorkouts] = useState<ReadonlyArray<Workout>>([]);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SynchronizationStatus>("checking");
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const setters = useMemo(
    () => ({ setScreen, setWorkouts, setSyncing, setStatus, setNotice, setRetryAt }),
    [],
  );
  return [{ screen, workouts, syncing, status, notice, retryAt }, setters];
}

function pauseSynchronization(
  result: Extract<SyncResult, { retryAfterSeconds: number }>,
  setters: ControllerSetters,
): void {
  setters.setRetryAt(Date.now() + result.retryAfterSeconds * 1_000);
  setters.setStatus("paused");
  if (result.kind === "backfill-paused") {
    setters.setNotice({ kind: "paused", reason: "backfill" });
    return;
  }
  setters.setNotice(
    result.kind === "queued"
      ? { kind: "paused", reason: "queued" }
      : {
          kind: "paused",
          reason: "rate-limited",
          minutes: Math.max(1, Math.ceil(result.retryAfterSeconds / 60)),
        },
  );
}

function applySynchronizationResult(result: SyncResult, setters: ControllerSetters): void {
  if (result.kind === "reauthorization-required") {
    setters.setScreen((current) =>
      current.kind === "ready" ? { ...current, availability: "reauthorization-required" } : current,
    );
    setters.setStatus("failed");
    return;
  }
  if (result.kind === "provider-unavailable") {
    setters.setStatus("failed");
    setters.setNotice({ kind: "error", reason: "synchronization", retryable: true });
    return;
  }
  if (result.kind !== "synchronized") {
    pauseSynchronization(result, setters);
    return;
  }
  setters.setStatus("current");
}

function useSynchronization(
  refreshWorkouts: () => Promise<void>,
  retryAt: number | null,
  setters: ControllerSetters,
): () => Promise<void> {
  const sync = useCallback(async (): Promise<void> => {
    setters.setSyncing(true);
    setters.setStatus("syncing");
    setters.setNotice({ kind: "none" });
    const result = await application.synchronizeWorkouts(refreshWorkouts);
    applySynchronizationResult(result, setters);
    setters.setSyncing(false);
  }, [refreshWorkouts, setters]);

  useEffect(() => {
    if (retryAt === null) return;
    const timeout = window.setTimeout(
      () => {
        setters.setRetryAt(null);
        void sync();
      },
      Math.max(0, retryAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [retryAt, setters, sync]);
  return sync;
}

function availability(
  user: Awaited<ReturnType<typeof application.loadUser>>,
): "online" | "offline" | "reauthorization-required" {
  if (user.kind === "connected") return "online";
  return user.kind === "offline" ? "offline" : "reauthorization-required";
}

function useInitialLoad(
  refreshWorkouts: () => Promise<void>,
  sync: () => Promise<void>,
  setters: ControllerSetters,
): void {
  useEffect(() => {
    let active = true;
    void (async () => {
      await refreshWorkouts();
      if (!active) return;
      const user = await application.loadUser();
      if (!active) return;
      if (user.kind === "disconnected") {
        setters.setScreen({ kind: "disconnected" });
        return;
      }
      setters.setScreen({ kind: "ready", user: user.user, availability: availability(user) });
      if (user.kind === "connected") await sync();
      else setters.setStatus("failed");
    })();
    return () => {
      active = false;
    };
  }, [refreshWorkouts, setters, sync]);
}

function useDisconnect(setters: ControllerSetters): () => Promise<boolean> {
  return useCallback(async (): Promise<boolean> => {
    setters.setNotice({ kind: "none" });
    const result = await application.disconnectProvider();
    if (result.kind !== "disconnected") {
      setters.setNotice({ kind: "error", reason: "disconnect", retryable: false });
      return false;
    }
    setters.setWorkouts([]);
    setters.setScreen({ kind: "disconnected" });
    return true;
  }, [setters]);
}

export function useHomeController() {
  const [state, setters] = useControllerState();
  const refreshWorkouts = useCallback(async (): Promise<void> => {
    const result = await application.listWorkouts();
    if (result.kind === "loaded") setters.setWorkouts(result.workouts);
  }, [setters]);
  const sync = useSynchronization(refreshWorkouts, state.retryAt, setters);
  useInitialLoad(refreshWorkouts, sync, setters);
  const disconnect = useDisconnect(setters);
  return { ...state, sync, disconnect };
}
