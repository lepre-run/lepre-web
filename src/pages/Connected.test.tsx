import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Connected } from "./Connected";

describe("Connected", () => {
  it("renders the static success heading", () => {
    render(<Connected />);
    expect(screen.getByRole("heading", { name: /connected/i })).toBeInTheDocument();
  });
});
