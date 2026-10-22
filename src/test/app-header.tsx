import { render } from "@testing-library/react";
import { vi } from "vitest";
import { AppHeader } from "../components/home/AppHeader/AppHeader";
import type { Notice, ReadyScreen, SynchronizationStatus } from "../components/home/homeTypes";
import { readyScreen } from "./home-builders";

export function renderHeader(
  status: SynchronizationStatus,
  options: Readonly<{ notice?: Notice; screen?: ReadyScreen }> = {},
) {
  return render(
    <AppHeader
      screen={options.screen ?? readyScreen}
      status={status}
      notice={options.notice ?? { kind: "none" }}
      syncing={status === "syncing"}
      accountOpen={false}
      onRetry={vi.fn()}
      onToggleAccount={vi.fn()}
    />,
  );
}
