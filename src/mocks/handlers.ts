import { delay, HttpResponse, http } from "msw";
import { API_BASE_URL } from "../infrastructure/api/lepre-backend";
import { mockUser, mockWorkouts } from "./fixtures";

const SECOND_PAGE_TOKEN = "mock-page-2";
const CHECKPOINT = "mock-checkpoint-2026-07-22-personal-history";
const PERSONAL_WORKOUTS_PATH = "/lepre-personal-workouts.json";
const FIRST_PAGE_SIZE = 100;
const fakeWorkoutIds = mockWorkouts.map((workout) => workout.id);
let connected = true;
let personalWorkoutsPromise: Promise<ReadonlyArray<(typeof mockWorkouts)[number]>> | undefined;

function loadPersonalWorkouts(): Promise<ReadonlyArray<(typeof mockWorkouts)[number]>> {
  personalWorkoutsPromise ??= fetch(PERSONAL_WORKOUTS_PATH)
    .then(async (response) => {
      if (!response.ok) throw new Error("personal workout history is unavailable");
      const workouts: unknown = await response.json();
      if (!Array.isArray(workouts)) throw new Error("personal workout history is invalid");
      return workouts as ReadonlyArray<(typeof mockWorkouts)[number]>;
    })
    .catch(() => mockWorkouts);
  return personalWorkoutsPromise;
}

export const handlers = [
  http.get(`${API_BASE_URL}/session`, async () => {
    await delay(120);
    return connected ? HttpResponse.json(mockUser) : new HttpResponse(null, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/workouts`, async ({ request }) => {
    await delay(180);
    if (!connected) return new HttpResponse(null, { status: 401 });

    const url = new URL(request.url);
    const continuation = url.searchParams.get("continuation");
    const checkpoint = url.searchParams.get("checkpoint");
    const workouts = await loadPersonalWorkouts();

    if (checkpoint === CHECKPOINT) {
      return HttpResponse.json({
        upserted: [],
        removed: [],
        continuation: { kind: "complete", checkpoint: CHECKPOINT },
      });
    }

    if (checkpoint !== null) {
      return HttpResponse.json({
        upserted: workouts,
        removed: fakeWorkoutIds,
        continuation: { kind: "complete", checkpoint: CHECKPOINT },
      });
    }

    if (continuation === null) {
      return HttpResponse.json({
        upserted: workouts.slice(0, FIRST_PAGE_SIZE),
        removed: fakeWorkoutIds,
        continuation: { kind: "more", token: SECOND_PAGE_TOKEN },
      });
    }

    if (continuation !== SECOND_PAGE_TOKEN) {
      return HttpResponse.json({ error: "invalid_continuation" }, { status: 400 });
    }

    return HttpResponse.json({
      upserted: workouts.slice(FIRST_PAGE_SIZE),
      removed: [],
      continuation: { kind: "complete", checkpoint: CHECKPOINT },
    });
  }),

  http.post(`${API_BASE_URL}/disconnect`, async () => {
    await delay(100);
    connected = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
