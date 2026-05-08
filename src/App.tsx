import type { JSX } from "react";
import { Route, Routes } from "react-router-dom";
import { ConnectFailed } from "./pages/ConnectFailed";
import { Connected } from "./pages/Connected";
import { Home } from "./pages/Home";

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connected" element={<Connected />} />
      <Route path="/connect-failed" element={<ConnectFailed />} />
    </Routes>
  );
}
