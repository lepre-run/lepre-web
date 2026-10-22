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
