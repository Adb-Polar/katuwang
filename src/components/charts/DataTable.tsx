"use client";

import type { ReactNode } from "react";

function labelize(v: string | number) {
  return String(v).replace(/_/g, " ");
}

export interface DataColumn<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
}

/**
 * The `<details>Show data table</details>` a11y companion that every chart card
 * keeps — a chart is never the only way to read the numbers.
 *
 * Two shapes are supported:
 *  - the original `{ rows, labelKey }` (label + count) used by ReportsView, and
 *  - `{ rows, columns }` for the richer session-test payloads.
 */
export default function DataTable<Row extends Record<string, unknown>>(
  props:
    | { rows: Row[]; labelKey: string; columns?: undefined }
    | { rows: Row[]; columns: DataColumn<Row>[]; labelKey?: undefined },
) {
  const { rows } = props;
  const columns: DataColumn<Row>[] = props.columns ?? [
    { header: "", cell: (r) => labelize(r[props.labelKey!] as string | number) },
    { header: "", cell: (r) => (r.count as number) ?? "", align: "right" },
  ];

  return (
    <details className="mt-2">
      <summary className="text-2xs text-base-content/50 cursor-pointer hover:text-base-content/70">
        Show data table
      </summary>
      <table className="table table-xs mt-2">
        {columns.some((c) => c.header) && (
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={c.align === "right" ? "text-right" : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c, j) => (
                <td
                  key={j}
                  className={
                    c.align === "right" ? "text-right font-semibold" : "text-base-content/70"
                  }
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-3 text-base-content/40 italic text-xs"
              >
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </details>
  );
}
