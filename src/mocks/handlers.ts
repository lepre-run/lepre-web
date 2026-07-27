import { delay, HttpResponse, http } from "msw";
import { API_BASE_URL } from "../infrastructure/api/lepre-backend";
import { mockUser, mockWorkouts } from "./fixtures";

const CHECKPOINT = "mock-checkpoint-2026-07-27-condition-dashboard";
let connected = true;

export const handlers = [
  http.get(`${API_BASE_URL}/session`, async () => {
    await delay(120);
    return connected ? HttpResponse.json(mockUser) : new HttpResponse(null, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/workouts`, async ({ request }) => {
    await delay(180);
    if (!connected) return new HttpResponse(null, { status: 401 });

    const url = new URL(request.url);
    const checkpoint = url.searchParams.get("checkpoint");

    if (checkpoint === CHECKPOINT) {
      return HttpResponse.json({
        upserted: [],
        removed: [],
        continuation: { kind: "complete", checkpoint: CHECKPOINT },
      });
    }

    return HttpResponse.json({
      upserted: mockWorkouts,
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
