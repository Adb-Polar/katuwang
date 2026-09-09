"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataTable, { type DataColumn } from "./DataTable";
import { useThemeColors } from "./useThemeColors";
import { buildProgressTooltipRows, type PayloadEntry } from "./progressTooltip";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

export type ChartRow = Record<string, string | number | null | undefined>;

/**
 * Custom hover card — same contract as {@link ProgressAreaChart}'s: rows stay in
 * `series` order (recharts' default sorts alphabetically by name, which flips
 * "Pre-test"/"Post-test") and a series with no value at the hovered point reads
 * `missingLabel` instead of running the number formatter on a phantom value.
 *
 * The title is read from the hovered row's own `xKey` field, NOT recharts'
 * `label` — the x-axis runs on a synthetic per-row index so duplicate display
 * labels don't collapse (see `chartData` below).
 */
function renderTooltip(
  props: { active?: boolean; payload?: ReadonlyArray<PayloadEntry> },
  series: ChartSeries[],
  unit: string,
  xKey: string,
  missingLabel: string,
): ReactNode {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = (payload[0]?.payload ?? undefined) as Record<string, unknown> | undefined;
  const title = row?.[xKey];
  const rows = buildProgressTooltipRows(row, payload, series, unit, missingLabel);
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs shadow-md">
      {title != null && title !== "" && (
        <p className="mb-1 font-semibold text-base-content">{String(title)}</p>
      )}
      {rows.map((r) => (
        <p key={r.key} className="flex items-center gap-1.5 leading-5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: r.color }} />
          <span className="text-base-content/60">{r.name}:</span>
          <span
            className={
              r.value == null ? "italic text-base-content/40" : "font-medium text-base-content"
            }
          >
            {r.text}
          </span>
        </p>
      ))}
    </div>
  );
}

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
  missingLabel = "—",
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
  /** hover-card text for a series with no value at the hovered point */
  missingLabel?: string;
  footer?: ReactNode;
}) {
  const c = useThemeColors();
  const hasData = data.length > 0;

  // recharts' `type="category"` x-axis COLLAPSES duplicate category values, so
  // two rows with the same label (e.g. a class with two sessions on the same
  // topic) would share one x slot and the tooltip/active bar for the second
  // would show the first's numbers. Run the axis on a unique synthetic index and
  // map back to the real label for ticks + the tooltip title.
  const chartData: ChartRow[] = data.map((d, i) => ({ ...d, __x: String(i) }));
  const xTickLabel = (v: unknown) => String(chartData[Number(v)]?.[xKey] ?? "");

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
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey="__x"
                  tickFormatter={xTickLabel}
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
                  cursor={{ fill: c.grid, opacity: 0.4 }}
                  content={(props) => renderTooltip(props, series, unit ?? "", xKey, missingLabel)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} itemSorter={() => 0} />
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
