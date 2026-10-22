import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { HareLoader } from "../../ui";

export function EmptyWorkoutFeed({ syncing }: Readonly<{ syncing: boolean }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      {syncing && <HareLoader className="empty-state__hare" />}
      <h2>{syncing ? t("feed.importing") : t("feed.emptyTitle")}</h2>
      <p>{t("feed.emptyDescription")}</p>
    </div>
  );
}
