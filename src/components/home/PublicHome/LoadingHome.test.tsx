import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { LoadingHome } from "./PublicHome";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("LoadingHome", () => {
  it("explains loading without exposing unavailable controls", () => {
    const { container } = render(<LoadingHome />);
    expect(screen.getByRole("heading", { name: "lepre" })).toBeInTheDocument();
    expect(screen.getByText("Opening your local workouts…")).toBeInTheDocument();
    expect(container.querySelector(".hare-loader")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
