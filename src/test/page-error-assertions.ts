import { screen, within } from "@testing-library/react";
import { expect, type MockInstance } from "vitest";

export function expectPageErrorFallback(consoleError: MockInstance, message: string): void {
  const page = screen.getByRole("main");
  const alert = within(page).getByRole("alert");
  expect(within(alert).getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
  expect(alert).toHaveTextContent("This page could not be displayed.");
  expect(within(page).getByRole("button", { name: "Reload" })).toBeInTheDocument();
  expect(consoleError).toHaveBeenCalledWith(
    "The page failed to render.",
    expect.objectContaining({ message }),
    expect.any(String),
  );
}
