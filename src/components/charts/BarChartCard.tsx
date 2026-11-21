"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataTable from "./DataTable";
import { useThemeColors } from "./useThemeColors";

interface Breakdown {
  count: number;
  [key: string]: string | number;
}

function labelize(v: string | number) {
  return String(v).replace(/_/g, " ");
}

const MAX_VERTICAL_BARS = 8;
const MAX_RANKED_BARS = 10;
const RANKED_ROW_HEIGHT = 26;
const RANKED_LABEL_WIDTH = 150;
const RANKED_LABEL_MAX_CHARS = 22;

function truncate(value: string, maxChars: number) {
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
}

/**
 * Single-series bar card. Up to {@link MAX_VERTICAL_BARS} categories render as
 * vertical bars in the given order; more than that would crowd the x-axis
 * labels into each other, so the card switches to a ranked horizontal chart of
 * the top {@link MAX_RANKED_BARS} (the data table below still lists every row).
 */
export default function BarChartCard({
  title,
  rows,
  labelKey,
  color,
  labelFormatter = labelize,
}: {
  title: string;
  rows: Breakdown[];
  labelKey: string;
  color: string;
  labelFormatter?: (value: string) => string;
}) {
  const c = useThemeColors();
  const allBars = rows.map((r) => ({ name: labelFormatter(String(r[labelKey])), count: r.count }));
  const isRanked = allBars.length > MAX_VERTICAL_BARS;
  const data = isRanked
    ? [...allBars].sort((a, b) => b.count - a.count).slice(0, MAX_RANKED_BARS)
    : allBars;
  const tooltip = (
    <Tooltip
      contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }}
      cursor={{ fill: c.grid, opacity: 0.4 }}
    />
  );

  return (
    <div className="card kt-card">
      <div className="card-body gap-2 p-5">
        <h2 className="font-serif text-xl font-medium leading-tight">{title}</h2>
        {isRanked ? (
          <>
            <div className="w-full" style={{ height: data.length * RANKED_ROW_HEIGHT + 32 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: c.text }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={RANKED_LABEL_WIDTH}
                    interval={0}
                    tick={{ fontSize: 12, fill: c.text }}
                    tickFormatter={(value: string) => truncate(value, RANKED_LABEL_MAX_CHARS)}
                  />
                  {tooltip}
                  <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-base-content/70">
              Top {data.length} of {allBars.length}. The data table lists all of them.
            </p>
          </>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: c.text }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={56}
                  tickFormatter={(value: string) => truncate(value, 12)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.text }} />
                {tooltip}
                <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <DataTable rows={rows} columns={[
          { header: "", cell: (row) => labelFormatter(String(row[labelKey])) },
          { header: "", cell: (row) => row.count, align: "right" },
        ]} />
      </div>
    </div>
  );
}
