import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";

export function FeedHeader({
  workoutCount,
  onDownload,
}: Readonly<{ workoutCount: number; onDownload: () => void }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="feed-heading">
      <div>
        <p className="eyebrow">{t("feed.eyebrow")}</p>
        <h1>{t("feed.title")}</h1>
      </div>
      <div className="feed-actions">
        <p className="workout-count">{t("feed.storedCount", { count: workoutCount })}</p>
        <Button variant="quiet" onClick={onDownload} disabled={workoutCount === 0}>
          {t("actions.download")}
        </Button>
      </div>
    </div>
  );
}
