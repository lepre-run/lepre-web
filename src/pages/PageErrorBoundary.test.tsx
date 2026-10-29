import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageErrorBoundary } from "./PageErrorBoundary";

function BrokenCard(): never {
  throw new Error("interval core lap 2 must be a work lap");
}

describe("PageErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its page when nothing fails", () => {
    render(
      <PageErrorBoundary>
        <h1>Weekly overview</h1>
      </PageErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Weekly overview" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("replaces a crashing page with a recoverable message and logs the error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <PageErrorBoundary>
        <BrokenCard />
      </PageErrorBoundary>,
    );

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
