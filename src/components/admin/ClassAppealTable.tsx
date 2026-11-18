"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AuditLogLink from "@/components/ui/AuditLogLink";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PromptDialog from "@/components/ui/PromptDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/datetime";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import LoadErrorState from "@/components/ui/LoadErrorState";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface Appeal {
  id: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  class: {
    id: string;
    code: string;
    subject: string;
    status: string;
    suspendedReason: string | null;
  };
  tutor: { id: string; anonymousId: string };
}

type Tab = "pending" | "approved" | "rejected";
const TAB_STATUS: Record<Tab, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

export default function ClassAppealTable() {
  const [tab, setTab] = useState<Tab>("pending");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<Appeal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Appeal | null>(null);
  const [saving, setSaving] = useState(false);
  const dateField = tab === "pending" ? "createdAt" : "reviewedAt";
  const { sort, dir, toggle } = useTableSort(dateField, tab === "pending" ? "asc" : "desc");

  const {
    data: appeals,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    loadError,
    setError,
    refetch,
  } = usePaginatedList<Appeal>(
    "/api/admin/class-appeals",
    "appeals",
    { status: TAB_STATUS[tab], sort, dir },
    PAGE_SIZE,
    "Could not retrieve class appeals.",
    "appeals"
  );

  const review = async (appeal: Appeal, decision: "APPROVE" | "REJECT", note?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/class-appeals/${appeal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, ...(note?.trim() ? { reviewNote: note.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review the appeal.");

      setSuccess(
        decision === "APPROVE"
          ? `Appeal approved — ${subjectDisplayLabel(appeal.class.subject)} · ${appeal.class.code} is scheduled again.`
          : `Appeal for ${subjectDisplayLabel(appeal.class.subject)} · ${appeal.class.code} was rejected.`
      );
      setApproveTarget(null);
      setRejectTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review the appeal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={approveTarget || rejectTarget || loadError ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <Tabs
            tabs={[
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ]}
            active={tab}
            onChange={(key) => setTab(key as Tab)}
          />

          {loading ? (
            <LoadingRow />
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Tutor</th>
                    <th>Tutor&apos;s reason</th>
                    <SortableTh
                      label={tab === "pending" ? "Filed" : "Reviewed"}
                      field={dateField}
                      sort={sort}
                      dir={dir}
                      onSort={toggle}
                    />
                    {tab !== "pending" && <th>Admin note</th>}
                    {tab === "pending" && <th><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((a) => (
                    <tr key={a.id} className="align-top">
                      <td>
                        <span className="whitespace-nowrap font-medium">{a.class.code}</span>
                        <div className="text-sm text-(--kt-muted)">
                          {subjectDisplayLabel(a.class.subject)} · was {statusDisplayLabel(a.class.status)}
                        </div>
                        {a.class.suspendedReason && (
                          <div className="text-sm text-(--kt-muted) max-w-[14rem] whitespace-normal">
                            Moderation reason: {a.class.suspendedReason}
                          </div>
                        )}
                        <AuditLogLink targetId={a.class.id} />
                      </td>
                      <td>
                        <AnonymousIdText id={a.tutor.anonymousId} role="TUTOR" />
                      </td>
                      <td className="max-w-xs whitespace-normal">{a.reason}</td>
                      <td className="text-sm text-(--kt-muted)">
                        {tab === "pending" ? formatDateTime(a.createdAt) : a.reviewedAt ? formatDateTime(a.reviewedAt) : "—"}
                      </td>
                      {tab !== "pending" && (
                        <td className="max-w-xs whitespace-normal">
                          {a.reviewNote || <span className="text-sm text-(--kt-muted)">No note</span>}
                        </td>
                      )}
                      {tab === "pending" && (
                        <td>
                          <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => setApproveTarget(a)}
                            type="button"
                            className="btn btn-outline btn-success min-h-11 md:min-h-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(a)}
                            type="button"
                            className="btn btn-outline btn-error min-h-11 md:min-h-0"
                          >
                            Reject
                          </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {appeals.length === 0 && (
                <EmptyState>{tab === "pending" ? "No appeals awaiting review." : `No ${tab} appeals.`}</EmptyState>
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
        open={approveTarget !== null}
        title="Approve this appeal?"
        description={
          approveTarget
            ? `${subjectDisplayLabel(approveTarget.class.subject)} · ${approveTarget.class.code} will be reinstated to scheduled status and the tutor notified.`
            : undefined
        }
        confirmLabel="Approve & reinstate"
        tone="default"
        loading={saving}
        onConfirm={() => approveTarget && review(approveTarget, "APPROVE")}
        onCancel={() => setApproveTarget(null)}
      />

      <PromptDialog
        open={rejectTarget !== null}
        title="Reject this appeal?"
        description={
          rejectTarget
            ? `${subjectDisplayLabel(rejectTarget.class.subject)} · ${rejectTarget.class.code} stays moderated. The tutor is notified and can appeal again.`
            : undefined
        }
        noteLabel="Note for the tutor (optional)"
        notePlaceholder="Why the moderation stands."
        confirmLabel="Reject"
        tone="danger"
        loading={saving}
        onConfirm={(note) => rejectTarget && review(rejectTarget, "REJECT", note)}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
