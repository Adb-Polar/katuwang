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
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/70">{title}</h3>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs italic text-base-content/40">{emptyHint}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((r) => {
              const d = r.delta;
              const pct = d == null ? 0 : (Math.abs(d) / maxAbs) * 50;
              const down = d != null && d < 0;
              return (
                <li key={r.label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 font-mono text-base-content/70">{r.label}</span>
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
                      <span className="text-base-content/40">—</span>
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
          <summary className="text-2xs text-base-content/50 cursor-pointer hover:text-base-content/70">
            Show data table
          </summary>
          <table className="table table-xs mt-2">
            <thead>
              <tr>
                <th>Learner</th>
                <th className="text-right">Pre</th>
                <th className="text-right">Post</th>
                <th className="text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="text-base-content/70 font-mono">{r.label}</td>
                  <td className="text-right">{r.pre == null ? "—" : `${r.pre}${unit}`}</td>
                  <td className="text-right">{r.post == null ? "—" : `${r.post}${unit}`}</td>
                  <td className="text-right font-semibold">
                    {r.delta == null ? "—" : `${r.delta > 0 ? "+" : ""}${r.delta}${unit}`}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-base-content/40 italic text-xs">
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
