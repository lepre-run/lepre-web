import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectPageErrorFallback } from "../test/page-error-assertions";
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

    expectPageErrorFallback(error, "interval core lap 2 must be a work lap");
  });
});
