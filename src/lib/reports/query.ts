import { reportQuerySchema } from "@/lib/validations/reports";
import { resolveReportRange, type ReportRange } from "@/lib/reports/range";
import type { ReportFormat } from "@/lib/reports/types";

export interface ReportQuery {
  format: ReportFormat;
  range: ReportRange;
  classId?: string;
  scope?: string;
}

/** Validates `?format&from&to&classId&scope`; empty params count as absent. */
export function parseReportQuery(params: URLSearchParams): ReportQuery | { error: string } {
  const raw = Object.fromEntries([...params].filter(([, v]) => v.trim() !== ""));
  const parsed = reportQuerySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report request." };
  const range = resolveReportRange(parsed.data.from, parsed.data.to);
  if ("error" in range) return range;
  return { format: parsed.data.format, range, classId: parsed.data.classId, scope: parsed.data.scope };
}
