import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../../../i18n/LanguageSelector";
import { STRAVA_START_URL } from "../../../infrastructure/api/lepre-backend";
import { HareLoader } from "../../ui";

export function LoadingHome(): JSX.Element {
  const { t } = useTranslation();
  return (
    <main className="shell shell--centered">
      <HareLoader className="loading-home__hare" />
      <h1>lepre</h1>
      <p>{t("home.opening")}</p>
    </main>
  );
}

export function DisconnectedHome(): JSX.Element {
  const { t } = useTranslation();
  return (
    <main className="shell public-home">
      <div className="public-settings">
        <p className="wordmark">lepre</p>
        <LanguageSelector />
      </div>
      <section className="public-hero">
        <div className="public-hero__copy">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1>{t("home.heroTitle")}</h1>
          <p className="lede">{t("home.heroDescription")}</p>
          <p className="public-hero__contrast">{t("home.heroContrast")}</p>
          <div className="connection-entry">
            <a className="primary-action public-connect-action" href={STRAVA_START_URL}>
              <strong>{t("home.connectStrava")}</strong>
              <span aria-hidden="true">→</span>
            </a>
            <p className="connection-note">{t("home.connectionNote")}</p>
          </div>
        </div>
        <WorkoutPreview />
      </section>

      <section className="public-benefits" aria-labelledby="public-benefits-title">
        <header>
          <p className="eyebrow">{t("home.benefitsEyebrow")}</p>
          <h2 id="public-benefits-title">{t("home.benefitsTitle")}</h2>
        </header>
        <div className="public-benefits__grid">
          <Benefit number="01" title={t("home.structureTitle")}>
            {t("home.structureDescription")}
          </Benefit>
          <Benefit number="02" title={t("home.weeklyTitle")}>
            {t("home.weeklyDescription")}
          </Benefit>
          <Benefit number="03" title={t("home.conditionTitle")}>
            {t("home.conditionDescription")}
          </Benefit>
        </div>
      </section>

      <section className="public-privacy">
        <div>
          <p className="eyebrow">{t("home.privacyEyebrow")}</p>
          <h2>{t("home.privacyTitle")}</h2>
        </div>
        <p>{t("home.privacyDescription")}</p>
        <a className="primary-action" href={STRAVA_START_URL}>
          {t("home.connectStrava")}
        </a>
      </section>
    </main>
  );
}

function WorkoutPreview(): JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="workout-preview" aria-labelledby="workout-preview-title">
      <div className="workout-preview__topline">
        <p>{t("home.previewEyebrow")}</p>
        <span>{t("home.previewType")}</span>
      </div>
      <h2 id="workout-preview-title">{t("home.previewTitle")}</h2>
      <p className="workout-preview__source">{t("home.previewSource")}</p>
      <dl className="workout-preview__metrics">
        <div>
          <dt>{t("home.previewDistance")}</dt>
          <dd>10.8 km</dd>
        </div>
        <div>
          <dt>{t("home.previewTime")}</dt>
          <dd>54:12</dd>
        </div>
        <div>
          <dt>{t("home.previewExecution")}</dt>
          <dd>± 4 s/km</dd>
        </div>
      </dl>
      <ol className="workout-preview__structure" aria-label={t("home.previewStructureLabel")}>
        {[1, 2, 3].map((repetition) => (
          <li className="workout-preview__repetition" key={repetition}>
            <b>{repetition}</b>
            <span className="workout-preview__work">
              <i />
              {t("home.previewWork")}
            </span>
            <span className="workout-preview__recovery">
              <i />
              {t("home.previewRecovery")}
            </span>
          </li>
        ))}
      </ol>
      <p className="workout-preview__insight">{t("home.previewInsight")}</p>
    </section>
  );
}

function Benefit({
  number,
  title,
  children,
}: Readonly<{ number: string; title: string; children: string }>): JSX.Element {
  return (
    <article className="public-benefit">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
