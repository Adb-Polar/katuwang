import { formatDate } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import type { ReportRange } from "@/lib/reports/range";

/** "GRADE_7" → "Grade 7", "IN_PROGRESS" → "In progress". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const subjectLabel = (slug: string | null | undefined) => (slug ? subjectDisplayLabel(slug) : "");
export const dateCell = (d: Date | string | null | undefined) => (d ? formatDate(d) : "");
export const rangeLabel = (r: ReportRange) => `${formatDate(r.start)} – ${formatDate(new Date(r.end.getTime() - 1))}`;

export function avg(nums: number[]): number | null {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

/** Signed percentage-point gain, e.g. "+12", for summary tiles. */
export const signed = (n: number | null) => (n == null ? null : n > 0 ? `+${n}` : String(n));
