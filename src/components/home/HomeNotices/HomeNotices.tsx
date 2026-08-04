import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { STRAVA_START_URL } from "../../../infrastructure/api/lepre-backend";
import { Button } from "../../ui";
import { noticeMessage } from "../homePresentation";
import type { Notice, ReadyScreen } from "../homeTypes";

export function HomeNotices({
  screen,
  notice,
  syncing,
  onRetry,
}: Readonly<{
  screen: ReadyScreen;
  notice: Notice;
  syncing: boolean;
  onRetry: () => void;
}>): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      {screen.availability === "offline" && <p className="notice">{t("notices.offline")}</p>}
      {screen.availability === "reauthorization-required" && (
        <div className="notice notice--action">
          <p>{t("notices.reauthorization")}</p>
          <a className="notice-action" href={STRAVA_START_URL}>
            {t("actions.reconnectStrava")}
          </a>
        </div>
      )}
      {notice.kind === "error" && (
        <div className="notice notice--error notice--action" role="alert">
          <p>{noticeMessage(notice, t)}</p>
          {notice.retryable && (
            <Button onClick={onRetry} disabled={syncing}>
              {t("actions.tryAgain")}
            </Button>
          )}
        </div>
      )}
      {notice.kind === "paused" && <output className="notice">{noticeMessage(notice, t)}</output>}
    </>
  );
}
