import { screen, within } from "@testing-library/react";
import { expect } from "vitest";

export function expectIntervalExecution(heading: string): void {
  expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  expect(screen.getByText("Intervals")).toBeInTheDocument();
  const boundaries = screen.getAllByTestId("interval-boundary-lap-row");
  expect(boundaries).toHaveLength(2);
  expect(within(boundaries[0]).getByText("Warm-up")).toBeInTheDocument();
  expect(within(boundaries[1]).getByText("Cool-down")).toBeInTheDocument();
  const repetitions = screen.getAllByTestId("interval-repetition-row");
  expect(repetitions).toHaveLength(3);
  expect(within(repetitions[0]).getByText(/Interval 1/)).toBeInTheDocument();
  expect(within(repetitions[0]).getByText(/Recovery 1/)).toBeInTheDocument();
  expect(within(repetitions[1]).getByText(/Interval 2/)).toBeInTheDocument();
  expect(within(repetitions[1]).getByText(/Recovery 2/)).toBeInTheDocument();
  expect(within(repetitions[2]).getByText(/Interval 3/)).toBeInTheDocument();
  expect(within(repetitions[2]).getByText("No recovery lap")).toBeInTheDocument();
}
