import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConditionDashboard } from "../components/dashboard/ConditionDashboard/ConditionDashboard";
import { AccountPanel } from "../components/home/AccountPanel/AccountPanel";
import { AppHeader } from "../components/home/AppHeader/AppHeader";
import { DownloadPanel } from "../components/home/DownloadPanel/DownloadPanel";
import { FeedHeader } from "../components/home/FeedHeader/FeedHeader";
import { DisconnectedHome, LoadingHome } from "../components/home/PublicHome/PublicHome";
import { HareLoader } from "../components/ui";
import { WeeklyOverview } from "../components/weekly-overview/WeeklyOverview/WeeklyOverview";
import { useHomeController } from "../hooks/useHomeController";
import { useWorkoutArrivals } from "../hooks/useWorkoutArrivals";
import { useWorkoutExport } from "../hooks/useWorkoutExport";

export function Home(): JSX.Element {
  const controller = useHomeController();
  const workoutExport = useWorkoutExport(controller.workouts);
  const arrivals = useWorkoutArrivals(controller.workouts, controller.screen.kind === "ready");
  const [accountOpen, setAccountOpen] = useState(false);

  if (controller.screen.kind === "checking") return <LoadingHome />;
  if (controller.screen.kind === "disconnected") return <DisconnectedHome />;
  const screen = controller.screen;
  const disconnect = async (): Promise<void> => {
    if (await controller.disconnect()) setAccountOpen(false);
  };

  return (
    <main className="shell">
      <AppHeader
        screen={screen}
        status={controller.status}
        notice={controller.notice}
        syncing={controller.syncing}
        accountOpen={accountOpen}
        onRetry={() => void controller.sync()}
        onToggleAccount={() => setAccountOpen((open) => !open)}
      />
      {accountOpen && (
        <AccountPanel
          syncing={controller.syncing}
          offline={screen.availability === "offline"}
          onDisconnect={disconnect}
        />
      )}
      {controller.workouts.length > 0 && <ConditionDashboard workouts={controller.workouts} />}
      <FeedHeader workoutCount={controller.workouts.length} onDownload={workoutExport.show} />
      {workoutExport.open && (
        <DownloadPanel
          from={workoutExport.from}
          to={workoutExport.to}
          earliest={workoutExport.bounds.earliest}
          latest={workoutExport.bounds.latest}
          workoutCount={workoutExport.selectedCount}
          onFromChange={workoutExport.setFrom}
          onToChange={workoutExport.setTo}
          onDownload={workoutExport.download}
          onClose={workoutExport.close}
        />
      )}
      {controller.workouts.length === 0 ? (
        <EmptyWorkoutFeed syncing={controller.syncing} />
      ) : (
        <WeeklyOverview workouts={controller.workouts} arrivals={arrivals} />
      )}
    </main>
  );
}

function EmptyWorkoutFeed({ syncing }: Readonly<{ syncing: boolean }>): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      {syncing && <HareLoader className="empty-state__hare" />}
      <h2>{syncing ? t("feed.importing") : t("feed.emptyTitle")}</h2>
      <p>{t("feed.emptyDescription")}</p>
    </div>
  );
}
