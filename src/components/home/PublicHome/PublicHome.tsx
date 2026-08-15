import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../../../i18n/LanguageSelector";
import { STRAVA_START_URL } from "../../../infrastructure/api/lepre-backend";

export function LoadingHome(): JSX.Element {
  const { t } = useTranslation();
  return (
    <main className="shell shell--centered">
      <h1>lepre</h1>
      <p>{t("home.opening")}</p>
    </main>
  );
}

export function DisconnectedHome(): JSX.Element {
  const { t } = useTranslation();
  return (
    <main className="shell shell--centered">
      <div className="public-settings">
        <p className="wordmark">lepre</p>
        <LanguageSelector />
      </div>
      <h1>{t("home.heroTitle")}</h1>
      <p className="lede">{t("home.heroDescription")}</p>
      <div className="connection-entry">
        <a className="primary-action" href={STRAVA_START_URL}>
          {t("home.connectStrava")}
        </a>
        <p className="connection-capacity" role="status">
          {t("home.athleteCapacity")}
        </p>
      </div>
    </main>
  );
}
