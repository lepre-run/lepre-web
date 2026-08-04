import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import type { EvidenceStrength } from "../../../domain/training-dashboard";

export function EvidenceBadge({ strength }: Readonly<{ strength: EvidenceStrength }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <span className="condition-card__evidence" data-strength={strength}>
      {t(`dashboard.evidence.${strength}`)}
    </span>
  );
}
