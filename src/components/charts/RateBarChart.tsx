"use client";

import GroupedBarChart, { type ChartRow, type ChartSeries } from "./GroupedBarChart";
import type { DataColumn } from "./DataTable";

/**
 * Backs chart (c) — per-question correct rate, PRE vs POST, on a fixed 0–100%
 * axis. This comparison is only meaningful because both runs serve the same
 * question at the same `position` (see the plan, decision 2).
 *
 * Thin specialisation of {@link GroupedBarChart}: percentage domain, `%` unit,
 * and a data table that also surfaces `deltaRate` when present.
 */
export default function RateBarChart({
  title,
  data,
  xKey = "label",
  series,
  emptyHint,
}: {
  title: string;
  data: ChartRow[];
  xKey?: string;
  series: ChartSeries[];
  emptyHint?: string;
}) {
  const hasDelta = data.some((r) => r.deltaRate != null);

  const tableColumns: DataColumn<ChartRow>[] = [
    { header: "", cell: (r) => String(r[xKey] ?? "") },
    ...series.map(
      (s): DataColumn<ChartRow> => ({
        header: s.name,
        align: "right",
        cell: (r) => (r[s.key] == null ? "—" : `${r[s.key]}%`),
      }),
    ),
    ...(hasDelta
      ? [
          {
            header: "Δ rate",
            align: "right" as const,
            cell: (r: ChartRow) =>
              r.deltaRate == null ? "—" : `${(r.deltaRate as number) > 0 ? "+" : ""}${r.deltaRate}%`,
          },
        ]
      : []),
  ];

  return (
    <GroupedBarChart
      title={title}
      data={data}
      xKey={xKey}
      series={series}
      unit="%"
      yDomain={[0, 100]}
      tableColumns={tableColumns}
      emptyHint={emptyHint}
    />
  );
}
