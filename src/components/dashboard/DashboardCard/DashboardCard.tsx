import type { JSX, ReactNode } from "react";
import { Card } from "../../ui";

export function DashboardCard({
  kind,
  title,
  badge,
  children,
}: Readonly<{ kind: string; title: string; badge?: ReactNode; children: ReactNode }>): JSX.Element {
  return (
    <Card className={`condition-card condition-card--${kind}`}>
      <header>
        <h2>{title}</h2>
        {badge}
      </header>
      {children}
    </Card>
  );
}
