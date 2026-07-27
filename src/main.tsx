import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { initializeI18n } from "./i18n/i18n";
import "./styles.css";

const MOCK_DATA_VERSION_KEY = "lepre:mock-data-version";
const MOCK_DATA_VERSION = "adaptive-interval-dashboard-training-year-2026-07-27";

async function resetStaleMockData(): Promise<void> {
  if (
    import.meta.env.MODE !== "mock" ||
    localStorage.getItem(MOCK_DATA_VERSION_KEY) === MOCK_DATA_VERSION
  ) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("lepre");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Could not reset mock workout data"));
    request.onblocked = () => reject(new Error("Mock workout data reset was blocked"));
  });
  localStorage.setItem(MOCK_DATA_VERSION_KEY, MOCK_DATA_VERSION);
}

async function enableMocking(): Promise<void> {
  if (import.meta.env.MODE !== "mock") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

async function bootstrap(): Promise<void> {
  await initializeI18n();
  await resetStaleMockData();
  await enableMocking();
  const root = document.getElementById("root");
  if (!root) throw new Error("missing #root mount point in index.html");

  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
