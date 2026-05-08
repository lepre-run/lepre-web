import type { JSX } from "react";

/**
 * `GET /connected` — the Lambda redirects here on a successful Strava
 * connection. Slice 1 only renders a static success message; no name
 * lookup, no `/me` endpoint.
 */
export function Connected(): JSX.Element {
  return (
    <main>
      <h1>Connected ✓</h1>
      <p>Your Strava account is now linked.</p>
    </main>
  );
}
