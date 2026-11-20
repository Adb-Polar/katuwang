import { renderReportCsv } from "@/lib/reports/csv";
import { renderReportPdf } from "@/lib/reports/pdf";
import type { ReportRange } from "@/lib/reports/range";
import type { ReportFormat, ReportModel } from "@/lib/reports/types";

export function reportFilename(model: ReportModel, range: ReportRange, format: ReportFormat): string {
  const base = model.filenameBase.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/-+/g, "-");
  return `${base}_${range.from}_to_${range.to}.${format}`;
}

/** Renders the model and returns it as a private, non-cached attachment. */
export async function reportResponse(model: ReportModel, range: ReportRange, format: ReportFormat): Promise<Response> {
  const body = format === "pdf" ? await renderReportPdf(model) : renderReportCsv(model);
  return new Response(typeof body === "string" ? body : new Uint8Array(body), {
    headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFilename(model, range, format)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
