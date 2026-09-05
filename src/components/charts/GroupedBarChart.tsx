"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataTable, { type DataColumn } from "./DataTable";
import { useThemeColors } from "./useThemeColors";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

export type ChartRow = Record<string, string | number | null | undefined>;

/**
 * Multi-series grouped vertical bars. Backs chart (a) — pre-vs-post average per
 * session. `null` values render as a missing bar (recharts skips them), never a
 * fake zero.
 */
export default function GroupedBarChart({
  title,
  data,
  xKey,
  series,
  unit,
  yDomain,
  tableColumns,
  emptyHint = "No data yet.",
  footer,
}: {
  title: string;
  data: ChartRow[];
  xKey: string;
  series: ChartSeries[];
  unit?: string;
  yDomain?: [number, number];
  tableColumns?: DataColumn<ChartRow>[];
  emptyHint?: string;
  footer?: ReactNode;
}) {
  const c = useThemeColors();
  const hasData = data.length > 0;

  const columns: DataColumn<ChartRow>[] =
    tableColumns ??
    [
      { header: "", cell: (r) => String(r[xKey] ?? "") },
      ...series.map(
        (s): DataColumn<ChartRow> => ({
          header: s.name,
          align: "right",
          cell: (r) => (r[s.key] == null ? "—" : `${r[s.key]}${unit ?? ""}`),
        }),
      ),
    ];

  return (
    <div className="card kt-card">
      <div className="card-body gap-2 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">{title}</h3>
        {hasData ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 10, fill: c.text }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  allowDecimals={false}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: c.text }}
                  tickFormatter={unit ? (v) => `${v}${unit}` : undefined}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }}
                  cursor={{ fill: c.grid, opacity: 0.4 }}
                  formatter={unit ? (v) => `${v}${unit}` : undefined}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-xs italic text-base-content/40">{emptyHint}</p>
        )}
        {footer}
        <DataTable rows={data} columns={columns} />
      </div>
    </div>
  );
}
