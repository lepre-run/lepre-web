import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./Table";

describe("Table", () => {
  it("exposes its caption, column headers, and caller-owned rows", () => {
    render(
      <Table
        caption="Splits"
        columns={[
          { id: "lap", label: "Lap" },
          { id: "pace", label: "Pace" },
        ]}
      >
        <tr>
          <td>1</td>
          <td>4:30 /km</td>
        </tr>
      </Table>,
    );

    const table = screen.getByRole("table", { name: "Splits" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(table).getByRole("cell", { name: "4:30 /km" })).toBeInTheDocument();
  });
});
