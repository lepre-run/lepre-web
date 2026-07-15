import { beforeEach, describe, expect, it, vi } from "vitest";

const data = vi.hoisted(() => ({
  applySync: vi.fn(),
  syncState: vi.fn(),
}));

vi.mock("./data/workouts", () => data);

import { synchronize } from "./api";

describe("synchronize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    data.syncState.mockResolvedValue({ after: 0, cursor: 0 });
  });

  it("imports bounded pages and keeps one stable snapshot", async () => {
    const first = [{ id: 2, date: "2026-07-15T06:00:00Z", name: "Recent Run" }];
    const complete = [...first, { id: 1, date: "2016-07-15T06:00:00Z", name: "Old Run" }];
    data.applySync.mockResolvedValueOnce(first).mockResolvedValueOnce(complete);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          workouts: first,
          deletedIds: [],
          syncedAt: 123,
          cursor: 123_456,
          snapshot: 123_456,
          nextPage: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          workouts: complete.slice(1),
          deletedIds: [],
          syncedAt: 123,
          cursor: 123_456,
          snapshot: 123_456,
          nextPage: null,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const progress = vi.fn();

    await expect(synchronize(progress)).resolves.toEqual(complete);
    expect(progress).toHaveBeenNthCalledWith(1, first);
    expect(progress).toHaveBeenNthCalledWith(2, complete);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("page=1");
    expect(fetchMock.mock.calls[0][0]).not.toContain("snapshot=");
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
    expect(fetchMock.mock.calls[1][0]).toContain("snapshot=123456");
  });
});
