import type { JSX, ReactNode } from "react";

export type TableColumn = Readonly<{
  id: string;
  label: ReactNode;
  className?: string;
}>;

export function Table({
  caption,
  columns,
  children,
  className = "",
  containerClassName = "",
  headerRowClassName = "",
}: Readonly<{
  caption: ReactNode;
  columns: ReadonlyArray<TableColumn>;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  headerRowClassName?: string;
}>): JSX.Element {
  return (
    <div className={containerClassName || undefined}>
      <table className={className || undefined}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr className={headerRowClassName || undefined}>
            {columns.map((column) => (
              <th className={column.className} scope="col" key={column.id}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
