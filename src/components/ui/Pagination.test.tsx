import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("announces position and delegates available navigation", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <Pagination
        ariaLabel="Workout pages"
        previousLabel="Newer"
        nextLabel="Older"
        pageLabel="Page 2 of 3"
        previousDisabled={false}
        nextDisabled={true}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );

    const pagination = screen.getByRole("navigation", { name: "Workout pages" });
    expect(within(pagination).getByText("Page 2 of 3")).toBeInTheDocument();
    fireEvent.click(within(pagination).getByRole("button", { name: "Newer" }));
    fireEvent.click(within(pagination).getByRole("button", { name: "Older" }));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).not.toHaveBeenCalled();
  });
});
