import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../../i18n/LanguageSelector";
import { Button } from "../ui";

export function AccountPanel({
  syncing,
  offline,
  onDisconnect,
}: Readonly<{
  syncing: boolean;
  offline: boolean;
  onDisconnect: () => Promise<void>;
}>): JSX.Element {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const disconnect = async (): Promise<void> => {
    setDisconnecting(true);
    await onDisconnect();
    setDisconnecting(false);
  };
  return (
    <section
      className="account-panel"
      id="account-panel"
      aria-labelledby={confirming ? "disconnect-title" : "account-title"}
    >
      {!confirming ? (
        <>
          <div>
            <p className="eyebrow">{t("account.eyebrow")}</p>
            <h2 id="account-title">{t("account.title")}</h2>
            <p>{t("account.description")}</p>
          </div>
          <div className="account-panel__controls">
            <LanguageSelector />
            <Button
              variant="danger"
              onClick={() => setConfirming(true)}
              disabled={syncing || offline}
            >
              {t("actions.disconnectStrava")}
            </Button>
          </div>
        </>
      ) : (
        <div
          className="disconnect-confirmation"
          role="alertdialog"
          aria-labelledby="disconnect-title"
        >
          <div>
            <p className="eyebrow">{t("account.eyebrow")}</p>
            <h3 id="disconnect-title">{t("account.disconnectTitle")}</h3>
            <p>{t("account.disconnectWarning")}</p>
          </div>
          <div className="disconnect-actions">
            <Button
              variant="danger-solid"
              onClick={() => void disconnect()}
              disabled={disconnecting}
            >
              {disconnecting ? t("actions.disconnecting") : t("actions.confirmDisconnect")}
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)} disabled={disconnecting}>
              {t("actions.cancel")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
