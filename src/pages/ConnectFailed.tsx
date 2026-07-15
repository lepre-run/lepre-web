import type { JSX } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * `GET /connect-failed?reason=<slug>&id=<correlation_id>` — the Lambda's
 * failure exit. The set of recognised reason slugs is closed; an
 * unrecognised value renders a generic fallback so adding a new slug on
 * the Lambda before the frontend update doesn't crash the page.
 */
const REASON_MESSAGES: Readonly<Record<string, string>> = {
  user_denied: "You declined the Strava authorization.",
  state_invalid: "The link expired or didn't match. Please try again.",
  missing_code: "Strava didn't return an authorization code.",
  strava_exchange_failed: "We couldn't reach Strava. Please try again.",
  strava_not_configured: "The Strava connection is not configured yet.",
  scope_insufficient: "We need all three permissions to connect your account.",
  db_failure: "Something went wrong on our side. Please try again.",
  unknown: "Something went wrong. Please try again.",
} as const;

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export function ConnectFailed(): JSX.Element {
  const [params] = useSearchParams();
  const reason = params.get("reason") ?? "unknown";
  const id = params.get("id");
  const message = REASON_MESSAGES[reason] ?? FALLBACK_MESSAGE;

  return (
    <main>
      <h1>Connect failed</h1>
      <p>{message}</p>
      <p>
        <Link to="/">Try again</Link>
      </p>
      {id !== null && id.length > 0 && <p data-testid="ref-id">ref: {id}</p>}
    </main>
  );
}
