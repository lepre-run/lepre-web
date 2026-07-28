import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { synchronizationLabel, synchronizationState } from "./homePresentation";
import type { ReadyScreen, SynchronizationStatus } from "./homeTypes";

export function AppHeader({
  screen,
  status,
  accountOpen,
  onToggleAccount,
}: Readonly<{
  screen: ReadyScreen;
  status: SynchronizationStatus;
  accountOpen: boolean;
  onToggleAccount: () => void;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <header className="app-header">
      <div>
        <p className="wordmark">lepre</p>
        <p className="runner-name">
          {screen.user.firstName} {screen.user.lastName}
        </p>
      </div>
      <div className="header-controls">
        <p
          className="sync-status"
          data-state={synchronizationState(screen, status)}
          aria-live="polite"
        >
          <span aria-hidden="true" />
          {synchronizationLabel(screen, status, t)}
        </p>
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
