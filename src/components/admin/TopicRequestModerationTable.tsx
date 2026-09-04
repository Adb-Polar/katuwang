"use client";

import { useState } from "react";
import Link from "next/link";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

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
  const { subjects: subjectCatalog } = useSubjectCatalog();
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
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
    "Could not retrieve topic requests."
  );

  const moderate = async (id: string, status: "OPEN" | "CANCELLED") => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/topic-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
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
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={closeTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">All Topic Requests</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by learner or topic..."
              className="input input-bordered input-sm w-full sm:max-w-xs text-xs focus:input-primary"
            />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Subjects</option>
              {subjectCatalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as "" | "public" | "directed")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">Public + Directed</option>
              <option value="public">Public only</option>
              <option value="directed">Directed only</option>
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
                  <tr className="text-2xs">
                    <th>Learner</th>
                    <SortableTh label="Subject / Topics" field="subject" sort={sort} dir={dir} onSort={toggle} />
                    <th>Directed to</th>
                    <th>Linked class</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="text-xs">
                      <td>
                        <Link
                          href={`/admin/users/${r.learner.id}`}
                          className="inline-block hover:opacity-70 transition-opacity"
                        >
                          <AnonymousIdBadge id={r.learner.anonymousId} role="LEARNER" />
                          <div className="text-2xs text-base-content/50 mt-1 hover:underline">
                            {r.learner.firstName} {r.learner.lastName}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <div className="font-semibold text-base-content/80">{r.subject}</div>
                        <div className="text-2xs text-base-content/50">{r.topics.join(", ")}</div>
                      </td>
                      <td className="text-base-content/60">
                        {r.directedTo ? (
                          <Link
                            href={`/admin/users/${r.directedTo.id}`}
                            className="inline-block hover:opacity-70 transition-opacity"
                          >
                            <AnonymousIdBadge id={r.directedTo.anonymousId} role="TUTOR" />
                          </Link>
                        ) : (
                          "Public"
                        )}
                      </td>
                      <td className="text-base-content/60">
                        {r.fulfilledClass ? (
                          <Link
                            href={`/admin/classes/${r.fulfilledClass.id}`}
                            className="font-mono text-2xs link link-hover text-primary"
                          >
                            {r.fulfilledClass.code}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} size="xs" />
                      </td>
                      <td className="flex gap-2 justify-end">
                        {(r.status === "OPEN" ||
                          r.status === "ACCEPTED" ||
                          r.status === "ENROLLED") && (
                          <button
                            onClick={() => {
                              setCloseTarget(r);
                              setReason("");
                              setError("");
                            }}
                            className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Close
                          </button>
                        )}
                        {(r.status === "CANCELLED" || r.status === "ACCEPTED") && (
                          <button
                            onClick={() => setReopenTarget(r)}
                            className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                          >
                            Re-open
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-xs">No requests found.</div>
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

      {closeTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setCloseTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Close request</h3>
            <p className="text-2xs text-base-content/50 mb-4">
              {closeTarget.subject} · {closeTarget.topics.join(", ")}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <FormField label="Reason" hint="Optional — shown for your own records">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this request being closed?"
                className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setCloseTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => moderate(closeTarget.id, "CANCELLED")}
                disabled={saving}
                className="btn btn-error btn-sm text-xs cursor-pointer"
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : "Close request"}
              </button>
            </div>
          </div>
        </div>
      )}

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
