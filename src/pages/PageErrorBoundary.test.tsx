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

  it("stays on the fallback until its reset key changes", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = render(
      <PageErrorBoundary resetKey="/connected">
        <BrokenCard />
      </PageErrorBoundary>,
    );

    rerender(
      <PageErrorBoundary resetKey="/connected">
        <h1>Weekly overview</h1>
      </PageErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <PageErrorBoundary resetKey="/connect-failed">
        <h1>Weekly overview</h1>
      </PageErrorBoundary>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekly overview" })).toBeInTheDocument();
  });
});
