import type { JSX } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Connected } from "./pages/Connected";
import { ConnectFailed } from "./pages/ConnectFailed";
import { Home } from "./pages/Home";
import { PageErrorBoundary } from "./pages/PageErrorBoundary";

export function App(): JSX.Element {
  const { pathname } = useLocation();

  return (
    <PageErrorBoundary key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connected" element={<Connected />} />
        <Route path="/connect-failed" element={<ConnectFailed />} />
      </Routes>
    </PageErrorBoundary>
  );
}
