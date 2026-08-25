import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { LanguageSelector } from "../i18n/LanguageSelector";

const REASON_MESSAGE_KEYS = {
  user_denied: "connectFailed.reasons.userDenied",
  state_invalid: "connectFailed.reasons.stateInvalid",
  missing_code: "connectFailed.reasons.missingCode",
  strava_exchange_failed: "connectFailed.reasons.stravaExchangeFailed",
  strava_not_configured: "connectFailed.reasons.stravaNotConfigured",
  scope_insufficient: "connectFailed.reasons.scopeInsufficient",
  db_failure: "connectFailed.reasons.databaseFailure",
  unknown: "connectFailed.reasons.unknown",
} as const;

type KnownReason = keyof typeof REASON_MESSAGE_KEYS;

function messageKey(reason: string): (typeof REASON_MESSAGE_KEYS)[KnownReason] {
  return reason in REASON_MESSAGE_KEYS
    ? REASON_MESSAGE_KEYS[reason as KnownReason]
    : REASON_MESSAGE_KEYS.unknown;
}

export function ConnectFailed(): JSX.Element {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const reason = params.get("reason") ?? "unknown";
  const id = params.get("id");

  return (
    <main className="shell shell--centered">
      <div className="public-settings">
        <p className="wordmark">lepre</p>
        <LanguageSelector />
      </div>
      <h1>{t("connectFailed.title")}</h1>
      <p>{t(messageKey(reason))}</p>
      <p>
        <Link to="/">{t("connectFailed.tryAgain")}</Link>
      </p>
      {id !== null && id.length > 0 && (
        <p data-testid="ref-id">{t("connectFailed.reference", { id })}</p>
      )}
    </main>
  );
}
