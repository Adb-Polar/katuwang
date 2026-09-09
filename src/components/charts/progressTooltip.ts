/**
 * Pure helper behind {@link ProgressAreaChart}'s custom hover card. Kept in its
 * own recharts-free module so it can be unit-tested in the node test env.
 *
 * Two jobs:
 *   1. Emit one row per series in the SAME ORDER `series` is declared
 *      (pre before post) — recharts' default card sorts alphabetically by name,
 *      which puts "Post-test" first.
 *   2. Never show a number for a series the learner has no attempt for. A
 *      missing value renders as `missingLabel` ("not taken yet"), so hovering a
 *      session where only the pre-test was taken can't display a phantom post
 *      score.
 */

export interface SeriesLike {
  key: string;
  name: string;
  color: string;
}

export interface TooltipRow {
  key: string;
  name: string;
  color: string;
  /** `null` when this series has no value at the hovered point. */
  value: number | null;
  /** Ready-to-render text: `"<n><unit>"` or the missing-value label. */
  text: string;
}

export interface PayloadEntry {
  dataKey?: unknown;
  value?: unknown;
  payload?: unknown;
}

function coerce(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param row      the raw data row for the hovered point (has every series key,
 *                 including the ones whose value is `null`)
 * @param payload  recharts' tooltip payload — used only as a fallback when the
 *                 raw row is unavailable or partial
 */
export function buildProgressTooltipRows(
  row: Record<string, unknown> | undefined,
  payload: ReadonlyArray<PayloadEntry> | undefined,
  series: SeriesLike[],
  unit: string,
  missingLabel = "not taken yet",
): TooltipRow[] {
  return series.map((s) => {
    let value = coerce(row?.[s.key]);
    if (value == null) {
      const entry = payload?.find((p) => p?.dataKey === s.key);
      value = coerce(entry?.value);
    }
    return {
      key: s.key,
      name: s.name,
      color: s.color,
      value,
      text: value == null ? missingLabel : `${value}${unit}`,
    };
  });
}
