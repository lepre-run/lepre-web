import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ConnectFailed } from "./ConnectFailed";

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ConnectFailed />
    </MemoryRouter>,
  );
}

describe("ConnectFailed", () => {
  it("renders the known message for reason=user_denied", () => {
    renderAt("/connect-failed?reason=user_denied");
    expect(screen.getByText(/declined the strava authorization/i)).toBeInTheDocument();
  });

  it("renders the scope-insufficient message", () => {
    renderAt("/connect-failed?reason=scope_insufficient");
    expect(screen.getByText(/all three permissions/i)).toBeInTheDocument();
  });

  it("renders a generic fallback for an unrecognised reason slug", () => {
    renderAt("/connect-failed?reason=cosmic_rays");
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders the correlation id when ?id=... is present", () => {
    renderAt("/connect-failed?reason=db_failure&id=abc-123");
    expect(screen.getByTestId("ref-id")).toHaveTextContent("ref: abc-123");
  });

  it("does not render a ref-id element when ?id is missing", () => {
    renderAt("/connect-failed?reason=user_denied");
    expect(screen.queryByTestId("ref-id")).not.toBeInTheDocument();
  });

  it("offers a link back to /", () => {
    renderAt("/connect-failed?reason=user_denied");
    const link = screen.getByRole("link", { name: /try again/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
