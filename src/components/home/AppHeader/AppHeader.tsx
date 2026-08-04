import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { STRAVA_START_URL } from "../../../infrastructure/api/lepre-backend";
import { Button } from "../../ui";
import { synchronizationLabel, synchronizationState } from "../homePresentation";
import type { Notice, ReadyScreen, SynchronizationStatus } from "../homeTypes";

export function AppHeader({
  screen,
  status,
  notice,
  syncing,
  accountOpen,
  onRetry,
  onToggleAccount,
}: Readonly<{
  screen: ReadyScreen;
  status: SynchronizationStatus;
  notice: Notice;
  syncing: boolean;
  accountOpen: boolean;
  onRetry: () => void;
  onToggleAccount: () => void;
}>): JSX.Element {
  const { t } = useTranslation();
  const needsReauthorization = screen.availability === "reauthorization-required";
  const retryableError = notice.kind === "error" && notice.retryable;
  return (
    <header className="app-header">
      <div>
        <p className="wordmark">lepre</p>
        <p className="runner-name">
          {screen.user.firstName} {screen.user.lastName}
        </p>
      </div>
      <div className="header-controls">
        <div
          className="sync-status"
          data-state={synchronizationState(screen, status)}
          aria-live="polite"
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span className="sync-status__indicator" aria-hidden="true" />
          <span className="sync-status__message">
            {synchronizationLabel(screen, status, notice, t)}
          </span>
          {needsReauthorization && (
            <a className="sync-status__action" href={STRAVA_START_URL}>
              {t("actions.reconnectStrava")}
            </a>
          )}
          {retryableError && (
            <Button className="sync-status__action" onClick={onRetry} disabled={syncing}>
              {t("actions.tryAgain")}
            </Button>
          )}
        </div>
        <Button
          variant="quiet"
          aria-expanded={accountOpen}
          aria-controls="account-panel"
          onClick={onToggleAccount}
        >
          {t("actions.account")}
        </Button>
      </div>
    </header>
  );
}
