"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import ValidatedForm from "@/components/ui/ValidatedForm";
import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import StatusText from "@/components/ui/StatusText";
import EmptyState from "@/components/ui/EmptyState";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import LoadingRow from "@/components/ui/LoadingRow";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Modal from "@/components/ui/Modal";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

type RequestStatus = "OPEN" | "ACCEPTED" | "ENROLLED" | "FULFILLED" | "CANCELLED";

const STATUS_TONE: Record<RequestStatus, "info" | "success" | "neutral" | "error"> = {
  OPEN: "info",
  ACCEPTED: "success",
  ENROLLED: "success",
  FULFILLED: "neutral",
  CANCELLED: "error",
};

interface AdminTopicRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  status: RequestStatus;
  createdAt: string;
  topics: string[];
  learner: { id: string; anonymousId: string; firstName: string; lastName: string };
  directedTo: { id: string; anonymousId: string } | null;
  fulfilledClass: { id: string; code: string; status: string; nextSessionAt: string | null } | null;
}

export default function TopicRequestModerationTable() {
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const { subjects: subjectCatalog, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "EXPIRED" | "">("");
  const [scopeFilter, setScopeFilter] = useState<"" | "public" | "directed">("");
  const [closeTarget, setCloseTarget] = useState<AdminTopicRequest | null>(null);
  const [reopenTarget, setReopenTarget] = useState<AdminTopicRequest | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { sort, dir, toggle } = useTableSort("createdAt", "desc", { subject: "asc", status: "asc" });

  const {
    data: requests,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    loadError,
    refetch,
  } = usePaginatedList<AdminTopicRequest>(
    "/api/admin/topic-requests",
    "requests",
    {
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(scopeFilter ? { scope: scopeFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve class requests."
  );

  const moderate = async (id: string, status: "OPEN" | "CANCELLED", validationForm?: HTMLFormElement) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/topic-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok && validationForm && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to update request.");

      setSuccess(status === "CANCELLED" ? "Request closed." : "Request re-opened.");
      setCloseTarget(null);
      setReopenTarget(null);
      setReason("");
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={closeTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search class requests"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by learner or topic..."
              className="input input-bordered w-full sm:max-w-xs focus:input-primary"
            />
            <select
              aria-label="Filter class requests by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="select select-bordered w-full sm:w-auto focus:select-primary"
            >
              <option value="">All subjects</option>
              {subjectCatalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter class requests by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "EXPIRED" | "")}
              className="select select-bordered w-full sm:w-auto focus:select-primary"
            >
              <option value="">All statuses</option>
              <option value="EXPIRED">Expired</option>
              <option value="OPEN">Open</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              aria-label="Filter class requests by audience"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as "" | "public" | "directed")}
              className="select select-bordered w-full sm:w-auto focus:select-primary"
            >
              <option value="">Public and directed</option>
              <option value="public">Public only</option>
              <option value="directed">Directed only</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Learner</th>
                    <SortableTh label="Subject and topics" field="subject" sort={sort} dir={dir} onSort={toggle} />
                    <th>Directed to</th>
                    <th>Linked class</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          href={`/admin/users/${r.learner.id}`}
                          className="inline-block hover:underline"
                        >
                          <AnonymousIdText id={r.learner.anonymousId} role="LEARNER" />
                          <div className="text-sm text-(--kt-muted)">
                            {r.learner.firstName} {r.learner.lastName}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <Link href={`/admin/topic-requests/${r.id}`} className="font-medium text-primary hover:underline">{subjectDisplayLabel(r.subject)}</Link>
                        <div className="text-sm text-(--kt-muted)">{r.topics.join(", ")}</div>
                      </td>
                      <td className="text-(--kt-muted)">
                        {r.directedTo ? (
                          <Link
                            href={`/admin/users/${r.directedTo.id}`}
                            className="inline-block hover:underline"
                          >
                            <AnonymousIdText id={r.directedTo.anonymousId} role="TUTOR" />
                          </Link>
                        ) : (
                          "Public"
                        )}
                      </td>
                      <td className="text-(--kt-muted)">
                        {r.fulfilledClass ? (
                          <Link
                            href={`/admin/classes/${r.fulfilledClass.id}`}
                            className="whitespace-nowrap font-medium text-primary hover:underline"
                          >
                            {r.fulfilledClass.code}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <StatusText tone={STATUS_TONE[r.status]} label={statusDisplayLabel(r.status)} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2 justify-end">
                        {(r.status === "OPEN" ||
                          r.status === "ACCEPTED" ||
                          r.status === "ENROLLED") && (
                          <button
                            type="button"
                            onClick={() => {
                              setCloseTarget(r);
                              setReason("");
                              setError("");
                            }}
                            className="btn btn-outline btn-error min-h-11 md:min-h-0"
                          >
                            Close
                          </button>
                        )}
                        {(r.status === "CANCELLED" || r.status === "ACCEPTED") && (
                          <button
                            type="button"
                            onClick={() => setReopenTarget(r)}
                            className="btn btn-outline btn-success min-h-11 md:min-h-0"
                          >
                            Re-open
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length === 0 && <EmptyState>No requests found.</EmptyState>}
            </>
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

      <Modal open={closeTarget !== null} onClose={() => setCloseTarget(null)} title="Close request">
        {closeTarget && <ValidatedForm onSubmit={(e) => { e.preventDefault(); void moderate(closeTarget.id, "CANCELLED", e.currentTarget); }}>
            <p className="text-sm text-(--kt-muted) mb-4">
              {subjectDisplayLabel(closeTarget.subject)} · {closeTarget.topics.join(", ")}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <FormField size="md" label="Reason" hint="Optional — shown for your own records">
              <textarea
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this request being closed?"
                className="textarea textarea-bordered w-full focus:textarea-primary h-24"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setCloseTarget(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit"
                disabled={saving}
                className="btn btn-error"
              >
                {saving ? <span className="loading loading-spinner loading-sm"></span> : "Close request"}
              </button>
            </div>
        </ValidatedForm>}
      </Modal>

      <ConfirmDialog
        open={reopenTarget !== null}
        title="Re-open this request?"
        description="It becomes visible to eligible tutors again."
        confirmLabel="Re-open"
        tone="default"
        loading={saving}
        onConfirm={() => reopenTarget && moderate(reopenTarget.id, "OPEN")}
        onCancel={() => setReopenTarget(null)}
      />
    </div>
  );
}
