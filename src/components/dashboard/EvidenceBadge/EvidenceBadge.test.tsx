import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { EvidenceBadge } from "./EvidenceBadge";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("EvidenceBadge", () => {
  it("translates the strength of the available evidence", () => {
    render(<EvidenceBadge strength="strong" />);
    expect(screen.getByText("Strong evidence")).toHaveAttribute("data-strength", "strong");
  });
});
