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

/** Single-series vertical bar card. Extracted verbatim from ReportsView. */
export default function BarChartCard({
  title,
  rows,
  labelKey,
  color,
}: {
  title: string;
  rows: Breakdown[];
  labelKey: string;
  color: string;
}) {
  const c = useThemeColors();
  const data = rows.map((r) => ({ name: labelize(r[labelKey]), count: r.count }));

  return (
    <div className="card kt-card">
      <div className="card-body gap-2 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">{title}</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: c.text }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={48}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: c.text }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: c.grid }}
                cursor={{ fill: c.grid, opacity: 0.4 }}
              />
              <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DataTable rows={rows} labelKey={labelKey} />
      </div>
    </div>
  );
}
