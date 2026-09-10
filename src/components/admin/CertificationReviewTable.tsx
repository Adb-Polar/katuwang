"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Certification {
  id: string;
  subject: string;
  topic: string;
  status: "PENDING" | "CERTIFIED" | "REJECTED";
  requestedAt: string;
  certifiedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  tutor: Tutor;
}

type Tab = "pending" | "certified" | "rejected";
const TAB_STATUS: Record<Tab, string> = {
  pending: "PENDING",
  certified: "CERTIFIED",
  rejected: "REJECTED",
};

export default function CertificationReviewTable() {
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const { subjects: catalog } = useSubjectCatalog();
  const [subject, setSubject] = useState<string>("");
  const [sort, setSort] = useState("requested");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<Certification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Certification | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    data: certifications,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  } = usePaginatedList<Certification>(
    "/api/admin/certifications",
    "certifications",
    {
      status: TAB_STATUS[tab],
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(subject ? { subject } : {}),
      sort,
    },
    PAGE_SIZE,
    "Could not retrieve certification requests.",
    "certs"
  );

  const review = async (
    certification: Certification,
    status: "CERTIFIED" | "REJECTED",
    note?: string
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/certifications/${certification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(note?.trim() ? { reviewNote: note.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review certification.");

      setSuccess(
        status === "CERTIFIED"
          ? `${certification.tutor.anonymousId} is now certified for "${certification.topic}".`
          : `Certification request for "${certification.topic}" was rejected.`
      );
      setApproveTarget(null);
      setRejectTarget(null);
      setRejectNote("");
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review certification.");
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = tab === "certified" ? "Certified" : tab === "rejected" ? "Reviewed" : "Requested";

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={approveTarget || rejectTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Certification Requests</h2>

          <Tabs
            tabs={[
              { key: "pending", label: "Pending" },
              { key: "certified", label: "Certified" },
              { key: "rejected", label: "Rejected" },
            ]}
            active={tab}
            onChange={(key) => setTab(key as Tab)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search topic or tutor ID..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All subjects</option>
              {catalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="requested">Sort: Requested date</option>
              <option value="certified">Sort: Certified date</option>
              <option value="reviewed">Sort: Reviewed date</option>
              <option value="subject">Sort: Subject</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <th>Tutor</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>{dateLabel}</th>
                    {tab === "rejected" && <th>Note</th>}
                    {tab === "pending" && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id} className="text-sm">
                      <td>
                        <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                        <div className="text-2xs text-base-content/50 mt-1">
                          {c.tutor.firstName} {c.tutor.lastName}
                        </div>
                      </td>
                      <td className="text-base-content/70">{c.subject}</td>
                      <td className="text-base-content/70">{c.topic}</td>
                      <td className="text-base-content/60">
                        {tab === "certified"
                          ? c.certifiedAt
                            ? formatDateTime(c.certifiedAt)
                            : "—"
                          : tab === "rejected"
                          ? c.reviewedAt
                            ? formatDateTime(c.reviewedAt)
                            : "—"
                          : formatDateTime(c.requestedAt)}
                      </td>
                      {tab === "rejected" && (
                        <td className="text-2xs text-base-content/60 max-w-xs whitespace-normal">
                          {c.reviewNote || <span className="text-base-content/30 italic">No note</span>}
                        </td>
                      )}
                      {tab === "pending" && (
                        <td className="flex gap-2 justify-end">
                          <button
                            onClick={() => setApproveTarget(c)}
                            className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectNote("");
                              setRejectTarget(c);
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
              {certifications.length === 0 && (
                <EmptyState>
                  {tab === "certified"
                    ? "No certified topics match these filters."
                    : tab === "rejected"
                    ? "No rejected certification requests match these filters."
                    : "No pending certification requests."}
                </EmptyState>
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
        title="Approve this certification?"
        description={
          approveTarget
            ? `${approveTarget.tutor.anonymousId} will be certified for "${approveTarget.topic}" (${approveTarget.subject}).`
            : undefined
        }
        confirmLabel="Approve"
        tone="default"
        loading={saving}
        onConfirm={() => approveTarget && review(approveTarget, "CERTIFIED")}
        onCancel={() => setApproveTarget(null)}
      />

      {rejectTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl shadow-xl space-y-3">
            <h3 className="font-semibold text-sm text-base-content">Reject this certification request?</h3>
            <p className="text-xs text-base-content/60">
              The request for &quot;{rejectTarget.topic}&quot; will be marked <strong>Rejected</strong>. The tutor
              can see the outcome and may request it again.
            </p>
            <label className="form-control">
              <span className="label-text text-2xs font-semibold text-base-content/70 pb-1">
                Feedback for the tutor (optional)
              </span>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="e.g. Re-take after reviewing quadratic factoring."
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
                onClick={() => review(rejectTarget, "REJECTED", rejectNote)}
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
