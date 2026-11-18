"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Modal from "@/components/ui/Modal";
import ValidatedForm from "@/components/ui/ValidatedForm";
import PromptDialog from "@/components/ui/PromptDialog";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import { subjectDisplayLabel } from "@/lib/displayLabels";

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
  approvalMethod?: "ASSESSMENT" | "MANUAL" | null;
  approvalEvidence?: string | null;
  qualifyingAttemptId?: string | null;
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
  const { subjects: catalog, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
  const [subject, setSubject] = useState<string>("");
  const [sort, setSort] = useState("requested");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState<Certification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Certification | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<"ASSESSMENT" | "MANUAL">("ASSESSMENT");
  const [manualReason, setManualReason] = useState("");
  const [manualEvidence, setManualEvidence] = useState("");
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
        body: JSON.stringify({ status, ...(status === "CERTIFIED" ? { method: approvalMethod, ...(approvalMethod === "MANUAL" ? { evidence: manualEvidence.trim(), reviewNote: manualReason.trim() } : {}) } : {}), ...(note?.trim() ? { reviewNote: note.trim() } : {}) }),
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
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={approveTarget || rejectTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
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
              aria-label="Search certification requests"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search topic or tutor ID..."
              className="input input-bordered w-full min-h-11 focus:input-primary"
            />
            <select
              aria-label="Filter certifications by subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-bordered w-full min-h-11 focus:select-primary"
            >
              <option value="">All subjects</option>
              {catalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort certification requests"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select select-bordered w-full min-h-11 focus:select-primary"
            >
              <option value="requested">Sort: Requested date</option>
              <option value="certified">Sort: Certified date</option>
              <option value="reviewed">Sort: Reviewed date</option>
              <option value="subject">Sort: Subject</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : error && certifications.length === 0 ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
              <span>Certification requests could not be loaded.</span>
              <button type="button" onClick={refetch} className="btn btn-outline btn-error min-h-11">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tutor</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>{dateLabel}</th>
                    {tab === "rejected" && <th>Note</th>}
                    {tab === "certified" && <th>Qualification basis</th>}
                    {tab === "pending" && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td>
                        <AnonymousIdText id={c.tutor.anonymousId} role="TUTOR" />
                        <div className="text-sm text-(--kt-muted) mt-1">
                          {c.tutor.firstName} {c.tutor.lastName}
                        </div>
                      </td>
                      <td className="text-(--kt-muted)">{subjectDisplayLabel(c.subject)}</td>
                      <td className="text-(--kt-muted)">{c.topic}</td>
                      <td className="text-sm text-(--kt-muted) whitespace-nowrap">
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
                        <td className="text-sm text-(--kt-muted) max-w-xs whitespace-normal">
                          {c.reviewNote || "No note"}
                        </td>
                      )}
                      {tab === "certified" && <td className="whitespace-normal max-w-xs">
                        {c.approvalMethod === "MANUAL" ? <>Manual review<p className="text-sm text-(--kt-muted)">{c.reviewNote}</p><p className="text-sm text-(--kt-muted)">{c.approvalEvidence}</p></> : c.approvalMethod === "ASSESSMENT" ? <>Passing assessment<p className="text-sm text-(--kt-muted)">{c.qualifyingAttemptId}</p></> : <span className="text-sm text-(--kt-muted)">Legacy record — provenance unavailable</span>}
                      </td>}
                      {tab === "pending" && (
                        <td>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => { setApprovalMethod("ASSESSMENT"); setError(""); setApproveTarget(c); }}
                              className="btn btn-outline btn-success btn-sm min-h-11 sm:min-h-0 cursor-pointer"
                            >
                              Approve assessment
                            </button>
                            <button onClick={() => { setApprovalMethod("MANUAL"); setManualReason(""); setManualEvidence(""); setError(""); setApproveTarget(c); }} className="btn btn-outline btn-warning btn-sm min-h-11 sm:min-h-0 cursor-pointer">Manual certification</button>
                            <button
                              onClick={() => setRejectTarget(c)}
                              className="btn btn-outline btn-error btn-sm min-h-11 sm:min-h-0 cursor-pointer"
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

      <Modal open={approveTarget !== null} onClose={() => setApproveTarget(null)} title={approvalMethod === "MANUAL" ? "Manual certification" : "Approve passing assessment?"} size="md">
        <ValidatedForm onSubmit={(event) => { event.preventDefault(); if (approveTarget) review(approveTarget, "CERTIFIED"); }}>
          <p className="mb-3">{approveTarget && <AnonymousIdText id={approveTarget.tutor.anonymousId} role="TUTOR" />} · {approveTarget?.topic}</p>
          <p className="text-sm text-(--kt-muted) mb-3">{approvalMethod === "MANUAL" ? "Use documented evidence of competence for this specific topic. This alternative does not record an assessment pass. Your reason and evidence will be audited." : "Requires a submitted passing assessment for this tutor and topic."}</p>
          <FeedbackBanner variant="error" message={error || null} />
          {approvalMethod === "MANUAL" && <div className="space-y-3">
            <label className="flex flex-col gap-1"><span className="text-[0.9rem] font-medium">Certification reason</span><textarea aria-label="Certification reason" required minLength={10} maxLength={500} value={manualReason} onChange={event => setManualReason(event.target.value)} className="textarea textarea-bordered w-full" /></label>
            <label className="flex flex-col gap-1"><span className="text-[0.9rem] font-medium">Qualification evidence</span><textarea aria-label="Qualification evidence" required minLength={10} maxLength={2000} value={manualEvidence} onChange={event => setManualEvidence(event.target.value)} placeholder="Describe or reference the reviewed credential, work sample or observed competency and its relevance to this topic." className="textarea textarea-bordered w-full" /></label>
          </div>}
          <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setApproveTarget(null)} className="btn btn-ghost">Cancel</button><button type="submit" disabled={saving} className="btn btn-primary">{approvalMethod === "MANUAL" ? "Certify with evidence" : "Approve assessment"}</button></div>
        </ValidatedForm>
      </Modal>

      <PromptDialog
        open={rejectTarget !== null}
        title="Reject this certification request?"
        description={
          rejectTarget
            ? `The request for "${rejectTarget.topic}" will be marked Rejected. The tutor can see the outcome and may request it again.`
            : undefined
        }
        noteLabel="Feedback for the tutor (optional)"
        notePlaceholder="e.g. Re-take after reviewing quadratic factoring."
        confirmLabel="Reject"
        tone="danger"
        loading={saving}
        onConfirm={(note) => rejectTarget && review(rejectTarget, "REJECTED", note)}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
