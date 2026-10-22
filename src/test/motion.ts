import { vi } from "vitest";

type MediaListener = (event: MediaQueryListEvent) => void;

export function stubMediaQuery(matches: boolean): MediaQueryList {
  const listeners = new Set<MediaListener>();
  const list = {
    matches,
    media: "",
    onchange: null,
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: (event: Event) => {
      for (const listener of listeners) listener(event as MediaQueryListEvent);
      return true;
    },
  } as unknown as MediaQueryList;
  vi.spyOn(window, "matchMedia").mockImplementation((query) =>
    Object.assign(list, { media: query }),
  );
  return list;
}

export function preferReducedMotion(): MediaQueryList {
  return stubMediaQuery(true);
}

export function stubAnimationFrames(): Readonly<{
  runFrame: (time: number) => void;
  pending: () => number;
}> {
  const callbacks = new Map<number, FrameRequestCallback>();
  const ids = { next: 1 };
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const id = ids.next++;
      callbacks.set(id, callback);
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => callbacks.delete(id)),
  );
  return {
    runFrame: (time) => {
      const due = Array.from(callbacks.entries());
      callbacks.clear();
      for (const [, callback] of due) callback(time);
    },
    pending: () => callbacks.size,
  };
}
