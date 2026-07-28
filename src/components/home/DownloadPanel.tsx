import type { FormEvent, JSX } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";

export type DownloadPanelProps = Readonly<{
  from: string;
  to: string;
  earliest: string;
  latest: string;
  workoutCount: number;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onDownload: () => void;
  onClose: () => void;
}>;

export function DownloadPanel(props: DownloadPanelProps): JSX.Element {
  const { t } = useTranslation();
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    props.onDownload();
  };
  return (
    <section className="download-panel" role="dialog" aria-labelledby="download-title">
      <div className="download-panel__heading">
        <div>
          <p className="eyebrow">{t("download.eyebrow")}</p>
          <h2 id="download-title">{t("download.title")}</h2>
        </div>
        <p>{t("download.description")}</p>
      </div>
      <form onSubmit={submit}>
        <div className="download-fields">
          <label>
            <span>{t("download.from")}</span>
            <input
              type="date"
              value={props.from}
              min={props.earliest}
              max={props.to || props.latest}
              onChange={(event) => props.onFromChange(event.target.value)}
            />
          </label>
          <label>
            <span>{t("download.to")}</span>
            <input
              type="date"
              value={props.to}
              min={props.from || props.earliest}
              max={props.latest}
              onChange={(event) => props.onToChange(event.target.value)}
            />
          </label>
        </div>
        <output className="download-count">
          {t("download.workoutCount", { count: props.workoutCount })}
        </output>
        <div className="download-actions">
          <Button type="submit" disabled={props.workoutCount === 0}>
            {t("download.downloadJson")}
          </Button>
          <Button variant="quiet" onClick={props.onClose}>
            {t("download.cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}
