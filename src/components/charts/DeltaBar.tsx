"use client";

export interface DeltaRow {
  /** Peer-safe identifier only — never a real name (RA 10173). */
  label: string;
  pre: number | null;
  post: number | null;
  delta: number | null;
}

/**
 * Backs chart (d) — per-learner gain. Pure CSS diverging bars (no recharts) plus
 * the `.kt-delta` ▲/▼ badge from globals.css, which was built for exactly this.
 * Learners with no paired attempt render as a dash, never dropped.
 */
export default function DeltaBar({
  title,
  rows,
  unit = "%",
  emptyHint = "No learners yet.",
}: {
  title: string;
  rows: DeltaRow[];
  unit?: string;
  emptyHint?: string;
}) {
  const maxAbs = Math.max(1, ...rows.map((r) => (r.delta == null ? 0 : Math.abs(r.delta))));

  return (
    <div className="card kt-card">
      <div className="card-body gap-2 p-5">
        <h3 className="font-serif text-xl font-medium leading-tight">{title}</h3>
        {rows.length === 0 ? (
          <p className="py-6 text-(--kt-muted)">{emptyHint}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((r, i) => {
              const d = r.delta;
              const pct = d == null ? 0 : (Math.abs(d) / maxAbs) * 50;
              const down = d != null && d < 0;
              return (
                <li key={`${r.label}::${i}`} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 kt-id">{r.label}</span>
                  <div className="relative h-4 flex-1 rounded bg-base-200">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-base-300" />
                    {d != null && d !== 0 && (
                      <span
                        className="absolute inset-y-0.5 rounded"
                        style={{
                          left: down ? `${50 - pct}%` : "50%",
                          width: `${pct}%`,
                          background: down ? "var(--kt-tint-error)" : "var(--kt-tint-success)",
                        }}
                      />
                    )}
                  </div>
                  <span className="w-24 shrink-0 text-right">
                    {d == null ? (
                      <span className="text-(--kt-muted)">—</span>
                    ) : (
                      <span className="kt-delta" data-dir={down ? "down" : "up"}>
                        {d > 0 ? "+" : ""}
                        {d}
                        {unit}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <details className="mt-2">
          <summary className="text-sm text-(--kt-muted) cursor-pointer hover:text-base-content">
            Show data table
          </summary>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Learner</th>
                <th className="text-right">Pre</th>
                <th className="text-right">Post</th>
                <th className="text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.label}::${i}`}>
                  <td className="kt-id">{r.label}</td>
                  <td className="text-right">{r.pre == null ? "—" : `${r.pre}${unit}`}</td>
                  <td className="text-right">{r.post == null ? "—" : `${r.post}${unit}`}</td>
                  <td className="text-right font-semibold">
                    {r.delta == null ? "—" : `${r.delta > 0 ? "+" : ""}${r.delta}${unit}`}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-sm text-(--kt-muted)">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
