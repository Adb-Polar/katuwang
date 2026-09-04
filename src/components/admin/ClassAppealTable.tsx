"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

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
    subject: SubjectArea;
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClassAppealTable() {
  const [tab, setTab] = useState<Tab>("pending");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<Appeal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Appeal | null>(null);
  const [reviewNote, setReviewNote] = useState("");
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
          ? `Appeal approved — ${appeal.class.subject} · ${appeal.class.code} is scheduled again.`
          : `Appeal for ${appeal.class.subject} · ${appeal.class.code} was rejected.`
      );
      setApproveTarget(null);
      setRejectTarget(null);
      setReviewNote("");
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
      <FeedbackBanner variant="error" message={approveTarget || rejectTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Class Appeals</h2>

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
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
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
                    {tab === "pending" && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((a) => (
                    <tr key={a.id} className="text-sm align-top">
                      <td>
                        <span className="font-mono text-xs">{a.class.code}</span>
                        <div className="text-2xs text-base-content/50 mt-0.5">
                          {a.class.subject} · was {a.class.status}
                        </div>
                        {a.class.suspendedReason && (
                          <div className="text-2xs text-base-content/40 mt-0.5 max-w-[14rem] whitespace-normal">
                            Mod reason: {a.class.suspendedReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <AnonymousIdBadge id={a.tutor.anonymousId} role="TUTOR" />
                      </td>
                      <td className="text-2xs text-base-content/70 max-w-xs whitespace-normal">{a.reason}</td>
                      <td className="text-2xs text-base-content/50">
                        {tab === "pending" ? fmt(a.createdAt) : a.reviewedAt ? fmt(a.reviewedAt) : "—"}
                      </td>
                      {tab !== "pending" && (
                        <td className="text-2xs text-base-content/60 max-w-xs whitespace-normal">
                          {a.reviewNote || <span className="text-base-content/30 italic">No note</span>}
                        </td>
                      )}
                      {tab === "pending" && (
                        <td className="flex gap-2 justify-end">
                          <button
                            onClick={() => setApproveTarget(a)}
                            className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewNote("");
                              setRejectTarget(a);
                            }}
                            className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {appeals.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  {tab === "pending" ? "No appeals awaiting review." : `No ${tab} appeals.`}
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
        open={approveTarget !== null}
        title="Approve this appeal?"
        description={
          approveTarget
            ? `${approveTarget.class.subject} · ${approveTarget.class.code} will be reinstated to SCHEDULED and the tutor notified.`
            : undefined
        }
        confirmLabel="Approve & reinstate"
        tone="default"
        loading={saving}
        onConfirm={() => approveTarget && review(approveTarget, "APPROVE")}
        onCancel={() => setApproveTarget(null)}
      />

      {rejectTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-semibold text-sm text-base-content">Reject this appeal?</h3>
            <p className="text-xs text-base-content/60">
              {rejectTarget.class.subject} · {rejectTarget.class.code} stays moderated. The tutor is
              notified and can appeal again.
            </p>
            <label className="form-control">
              <span className="label-text text-2xs font-semibold text-base-content/70 pb-1">
                Note for the tutor (optional)
              </span>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Why the moderation stands."
                className="textarea textarea-bordered text-xs w-full focus:textarea-primary"
              />
            </label>
            <div className="modal-action pt-1">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRejectTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={() => review(rejectTarget, "REJECT", reviewNote)}
                disabled={saving}
              >
                {saving && <span className="loading loading-spinner loading-xs" />}
                Reject
              </button>
            </div>
          </div>
          <label className="modal-backdrop" onClick={() => setRejectTarget(null)} aria-label="Close" />
        </div>
      )}
    </div>
  );
}
