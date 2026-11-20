"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import { DAY_MS, parseLocalDateAndTime } from "@/lib/datetime";
import type { ReportFormat } from "@/lib/reports/types";

const DEFAULT_DAYS = 90;
const localDate = (d: Date) => parseLocalDateAndTime(d).date;

function filenameFrom(res: Response, fallback: string): string {
  const match = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

/**
 * Date range + PDF/CSV buttons for a report endpoint. Extra params (scope,
 * classId) come from the parent; empty values are dropped.
 */
export default function ReportDownloadButtons({
  endpoint,
  params = {},
  label = "Download report",
}: {
  endpoint: string;
  params?: Record<string, string | undefined>;
  label?: string;
}) {
  const [from, setFrom] = useState(() => localDate(new Date(Date.now() - (DEFAULT_DAYS - 1) * DAY_MS)));
  const [to, setTo] = useState(() => localDate(new Date()));
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const [error, setError] = useState("");

  async function download(format: ReportFormat) {
    setBusy(format);
    setError("");
    try {
      const qs = new URLSearchParams({ format, from, to });
      for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
      const res = await fetch(`${endpoint}?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "The report could not be generated. Please try again.");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFrom(res, `katuwang-report.${format}`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The report could not be downloaded. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-(--kt-muted)">
          From
          <input type="date" className="input input-bordered input-sm" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-(--kt-muted)">
          To
          <input type="date" className="input input-bordered input-sm" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <div className="join">
          {(["pdf", "csv"] as const).map((format) => (
            <button
              key={format}
              type="button"
              className="btn btn-sm btn-outline join-item gap-1.5"
              disabled={busy !== null || !from || !to}
              onClick={() => download(format)}
            >
              {busy === format ? <span className="loading loading-spinner loading-xs" /> : <Download className="h-3.5 w-3.5" />}
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <FeedbackBanner variant="error" message={error || null} />
    </fieldset>
  );
}
