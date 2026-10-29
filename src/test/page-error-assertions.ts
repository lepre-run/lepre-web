import { screen } from "@testing-library/react";
import { expect, type MockInstance } from "vitest";

export function expectPageErrorFallback(consoleError: MockInstance, message: string): void {
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  expect(consoleError).toHaveBeenCalledWith(
    "The page failed to render.",
    expect.objectContaining({ message }),
    expect.any(String),
  );
}
