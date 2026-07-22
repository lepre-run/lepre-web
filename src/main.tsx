import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { initializeI18n } from "./i18n/i18n";
import "./styles.css";

async function enableMocking(): Promise<void> {
  if (import.meta.env.MODE !== "mock") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

async function bootstrap(): Promise<void> {
  await initializeI18n();
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
