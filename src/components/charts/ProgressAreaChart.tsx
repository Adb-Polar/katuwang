"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataTable, { type DataColumn } from "./DataTable";
import { useThemeColors } from "./useThemeColors";
import type { ChartRow, ChartSeries } from "./GroupedBarChart";

/**
 * Overlaid areas over an ordered axis. Backs chart (b) — a single learner's
 * pre/post score across their sessions. Gaps (`null`) stay gaps:
 * `connectNulls={false}`.
 */
export default function ProgressAreaChart({
  title,
  data,
  xKey,
  series,
  unit = "%",
  yDomain = [0, 100],
  tableColumns,
  emptyHint = "No sessions with a test yet.",
}: {
  title: string;
  data: ChartRow[];
  xKey: string;
  series: ChartSeries[];
  unit?: string;
  yDomain?: [number, number];
  tableColumns?: DataColumn<ChartRow>[];
  emptyHint?: string;
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
          cell: (r) => (r[s.key] == null ? "—" : `${r[s.key]}${unit}`),
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
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: c.text }} interval="preserveStartEnd" />
                <YAxis
                  allowDecimals={false}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: c.text }}
                  tickFormatter={(v) => `${v}${unit}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }}
                  formatter={(v) => `${v}${unit}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#fill-${s.key})`}
                    connectNulls={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-xs italic text-base-content/40">{emptyHint}</p>
        )}
        <DataTable rows={data} columns={columns} />
      </div>
    </div>
  );
}
