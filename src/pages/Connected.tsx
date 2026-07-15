import type { JSX } from "react";
import { Home } from "./Home";

/**
 * `GET /connected` — the Lambda redirects here on a successful Strava
 * connection. It renders the same local-first home screen, which verifies
 * the new session and performs the first import.
 */
export function Connected(): JSX.Element {
  return <Home />;
}
