import type { JSX } from "react";

/**
 * `GET /` — the only page slice 1 visitors land on by default. The button
 * is a plain anchor pointing at the Lambda's `/start` route, which sets
 * the HttpOnly state cookie server-side and 302s to Strava.
 */
export const STRAVA_START_URL = "https://api.lepre.run/v1/auth/strava/start";

export function Home(): JSX.Element {
  return (
    <main>
      <h1>lepre</h1>
      <p>Connect your Strava account to get started.</p>
      <a href={STRAVA_START_URL}>Join with Strava</a>
    </main>
  );
}
