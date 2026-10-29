import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./pages/Home", () => ({
  Home: (): never => {
    throw new Error("interval core lap 2 must be a work lap");
  },
}));

function renderAt(url: string): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["/", "/connected"])("shows the page error fallback when Home throws on %s", (url) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderAt(url);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(
      "The page failed to render.",
      expect.objectContaining({ message: "interval core lap 2 must be a work lap" }),
      expect.any(String),
    );
  });
});
