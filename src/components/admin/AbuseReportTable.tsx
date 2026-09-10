"use client";

import { useState } from "react";
import Link from "next/link";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { VIOLATION_LABEL } from "@/lib/reportViolations";

const PAGE_SIZE = 10;

interface Report {
  id: string;
  targetType: "TUTOR" | "CLASS";
  violations: string[];
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: { anonymousId: string };
  class: { id: string; code: string; subject: string; status: string } | null;
  tutor: { id: string; anonymousId: string } | null;
}

type Tab = "pending" | "resolved" | "dismissed";
const TAB_STATUS: Record<Tab, string> = {
  pending: "PENDING",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function label(type: string) {
  return VIOLATION_LABEL[type as keyof typeof VIOLATION_LABEL] ?? type;
}

export default function AbuseReportTable() {
  const [tab, setTab] = useState<Tab>("pending");
  const [targetFilter, setTargetFilter] = useState<"" | "TUTOR" | "CLASS">("");
  const [success, setSuccess] = useState("");
  const [resolveTarget, setResolveTarget] = useState<Report | null>(null);
  const [dismissTarget, setDismissTarget] = useState<Report | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const dateField = tab === "pending" ? "createdAt" : "reviewedAt";
  const { sort, dir, toggle } = useTableSort(dateField, tab === "pending" ? "asc" : "desc");

  const {
    data: reports,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  } = usePaginatedList<Report>(
    "/api/admin/abuse-reports",
    "reports",
    { status: TAB_STATUS[tab], sort, dir, ...(targetFilter ? { targetType: targetFilter } : {}) },
    PAGE_SIZE,
    "Could not retrieve abuse reports.",
    "reports"
  );

  const targetName = (r: Report) =>
    r.targetType === "TUTOR"
      ? r.tutor?.anonymousId ?? "—"
      : `${r.class?.subject ?? "—"} · ${r.class?.code ?? "—"}`;

  const review = async (report: Report, decision: "RESOLVE" | "DISMISS", reviewNote?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/abuse-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          ...(reviewNote?.trim() ? { resolutionNote: reviewNote.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review the report.");

      setSuccess(
        decision === "RESOLVE"
          ? `Report about ${targetName(report)} marked resolved.`
          : `Report about ${targetName(report)} dismissed.`
      );
      setResolveTarget(null);
      setDismissTarget(null);
      setNote("");
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review the report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner
        variant="error"
        message={resolveTarget || dismissTarget ? null : error || null}
      />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Abuse Reports</h2>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              tabs={[
                { key: "pending", label: "Pending" },
                { key: "resolved", label: "Resolved" },
                { key: "dismissed", label: "Dismissed" },
              ]}
              active={tab}
              onChange={(key) => setTab(key as Tab)}
            />
            <select
              aria-label="Filter by report target"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value as "" | "TUTOR" | "CLASS")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All targets</option>
              <option value="TUTOR">Tutor reports</option>
              <option value="CLASS">Class reports</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <th>Target</th>
                    <th>Reporter</th>
                    <th>Reasons</th>
                    <SortableTh
                      label={tab === "pending" ? "Filed" : "Reviewed"}
                      field={dateField}
                      sort={sort}
                      dir={dir}
                      onSort={toggle}
                    />
                    {tab !== "pending" && <th>Admin note</th>}
                    {tab === "pending" && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="text-sm align-top">
                      <td>
                        <span className="badge badge-neutral badge-xs text-2xs font-bold mb-1">
                          {r.targetType}
                        </span>
                        <div className="font-mono text-xs">
                          {r.targetType === "TUTOR" ? (
                            r.tutor ? (
                              <AnonymousIdBadge id={r.tutor.anonymousId} role="TUTOR" />
                            ) : (
                              "—"
                            )
                          ) : r.class ? (
                            <Link
                              href={`/admin/classes/${r.class.id}`}
                              className="text-primary hover:underline"
                            >
                              {r.class.code}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </div>
                        {r.targetType === "CLASS" && r.class && (
                          <div className="text-2xs text-base-content/50 mt-0.5">{r.class.subject}</div>
                        )}
                        <Link
                          href={`/admin/audit-log?q=${r.id}`}
                          className="text-2xs text-primary hover:underline mt-1 inline-block"
                        >
                          View audit log
                        </Link>
                      </td>
                      <td>
                        <AnonymousIdBadge id={r.reporter.anonymousId} role="LEARNER" />
                      </td>
                      <td className="max-w-xs whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          {r.violations.map((v) => (
                            <span key={v} className="badge badge-outline badge-xs text-2xs">
                              {label(v)}
                            </span>
                          ))}
                        </div>
                        {r.details && (
                          <p className="text-2xs text-base-content/60 mt-1 whitespace-normal">
                            {r.details}
                          </p>
                        )}
                      </td>
                      <td className="text-2xs text-base-content/50">
                        {tab === "pending"
                          ? fmt(r.createdAt)
                          : r.reviewedAt
                            ? fmt(r.reviewedAt)
                            : "—"}
                      </td>
                      {tab !== "pending" && (
                        <td className="text-2xs text-base-content/60 max-w-xs whitespace-normal">
                          {r.resolutionNote || (
                            <span className="text-base-content/30 italic">No note</span>
                          )}
                        </td>
                      )}
                      {tab === "pending" && (
                        <td className="flex gap-2 justify-end">
                          <button
                            onClick={() => setResolveTarget(r)}
                            className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => {
                              setNote("");
                              setDismissTarget(r);
                            }}
                            className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  {tab === "pending" ? "No reports awaiting review." : `No ${tab} reports.`}
                </div>
              )}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </section>

      <ConfirmDialog
        open={resolveTarget !== null}
        title="Mark this report as resolved?"
        description={
          resolveTarget
            ? `Confirms you have acted on the report about ${targetName(resolveTarget)}. The reporter is notified. Apply any suspension or ban from the Users or Classes pages.`
            : undefined
        }
        confirmLabel="Mark resolved"
        tone="default"
        loading={saving}
        onConfirm={() => resolveTarget && review(resolveTarget, "RESOLVE", note)}
        onCancel={() => setResolveTarget(null)}
      />

      {dismissTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-semibold text-sm text-base-content">Dismiss this report?</h3>
            <p className="text-xs text-base-content/60">
              No action is taken on {targetName(dismissTarget)}. The reporter is notified.
            </p>
            <label className="form-control">
              <span className="label-text text-2xs font-semibold text-base-content/70 pb-1">
                Note for the reporter (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Why no action was needed."
                className="textarea textarea-bordered text-xs w-full focus:textarea-primary"
              />
            </label>
            <div className="modal-action pt-1">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDismissTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={() => review(dismissTarget, "DISMISS", note)}
                disabled={saving}
              >
                {saving && <span className="loading loading-spinner loading-xs" />}
                Dismiss
              </button>
            </div>
          </div>
          <label
            className="modal-backdrop"
            onClick={() => setDismissTarget(null)}
            aria-label="Close"
          />
        </div>
      )}
    </div>
  );
}
