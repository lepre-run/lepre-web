import { API_BASE_URL, createLepreBackend } from "./lepre-backend-factory";

export { API_BASE_URL };
export const STRAVA_START_URL = `${API_BASE_URL}/auth/strava/start`;
export const lepreBackend = createLepreBackend(fetch);
