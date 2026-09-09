"use client";

import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataTable, { type DataColumn } from "./DataTable";
import { useThemeColors } from "./useThemeColors";
import type { ChartRow, ChartSeries } from "./GroupedBarChart";
import { buildProgressTooltipRows, type PayloadEntry } from "./progressTooltip";

/**
 * Custom hover card. See {@link buildProgressTooltipRows}: rows stay in `series`
 * order (pre before post) and a series with no attempt at the hovered point
 * reads "not taken yet" — never a phantom number.
 *
 * The title is read from the hovered row's own `xKey` field, NOT recharts'
 * `label` — the x-axis runs on a synthetic per-row index (see `chartData`
 * below) precisely because two rows can share a display label.
 *
 * `props` is typed structurally (recharts' `TooltipContentProps` generics fight
 * with a plain arrow at the call site) — only the fields used are named.
 */
function renderProgressTooltip(
  props: { active?: boolean; payload?: ReadonlyArray<PayloadEntry> },
  series: ChartSeries[],
  unit: string,
  xKey: string,
): ReactNode {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const row = (payload[0]?.payload ?? undefined) as Record<string, unknown> | undefined;
  const title = row?.[xKey];
  const rows = buildProgressTooltipRows(row, payload, series, unit);
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

  // recharts runs a `type="category"` x-axis off the raw value, and it COLLAPSES
  // duplicate categories — two sessions with the same "code · topic" label would
  // share one x slot, so hovering the second shows the first's row (a phantom
  // post score on a pre-only session). Give every row a unique synthetic x and
  // render the real label via `tickFormatter` / the tooltip.
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
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey="__x"
                  tickFormatter={xTickLabel}
                  tick={{ fontSize: 9, fill: c.text }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: c.text }}
                  tickFormatter={(v) => `${v}${unit}`}
                />
                <Tooltip content={(props) => renderProgressTooltip(props, series, unit, xKey)} />
                <Legend wrapperStyle={{ fontSize: 11 }} itemSorter={() => 0} />
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
