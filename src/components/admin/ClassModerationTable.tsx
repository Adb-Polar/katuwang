"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import { formatDateTime } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import { getClassStatusBadge, ClassLifecycleStatus } from "@/components/classes/classStatus";
import LoadingRow from "@/components/ui/LoadingRow";
import LoadErrorState from "@/components/ui/LoadErrorState";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
}

interface AdminClass {
  id: string;
  code: string;
  subject: string;
  topics: string[];
  nextSessionAt: string | null;
  status: ClassLifecycleStatus;
  suspendedReason: string | null;
  suspendedUntil: string | null;
  tutor: Tutor;
  _count: { enrollments: number };
}

export default function ClassModerationTable() {
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const { subjects: subjectCatalog } = useSubjectCatalog();
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ClassLifecycleStatus | "">("");
  const [moderateTarget, setModerateTarget] = useState<{ class: AdminClass; action: "SUSPENDED" | "BANNED" } | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState<string>("");
  const [reinstateTarget, setReinstateTarget] = useState<AdminClass | null>(null);
  const [saving, setSaving] = useState(false);
  const { sort, dir, toggle } = useTableSort("createdAt", "desc", { subject: "asc", code: "asc", status: "asc" });

  const {
    data: classes,
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
  } = usePaginatedList<AdminClass>(
    "/api/admin/classes",
    "classes",
    {
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve classes."
  );

  const updateStatus = async (
    classId: string,
    status: "SUSPENDED" | "BANNED" | "SCHEDULED",
    body: Record<string, unknown> = {}
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");

      setSuccess(
        status === "SUSPENDED"
          ? data.suspendedUntil
            ? `Class suspended until ${formatDateTime(data.suspendedUntil)}.`
            : "Class suspended."
          : status === "BANNED"
          ? "Class banned permanently."
          : "Class reinstated."
      );
      setModerateTarget(null);
      setReinstateTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setSaving(false);
    }
  };

  const startModeration = (tutorClass: AdminClass, action: "SUSPENDED" | "BANNED") => {
    setModerateTarget({ class: tutorClass, action });
    setReason("");
    setDurationDays("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={moderateTarget || loadError ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">All Classes</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search classes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, topic, or tutor..."
              className="input input-bordered input-sm w-full sm:max-w-xs text-xs focus:input-primary"
            />
            <select
              aria-label="Filter classes by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="select select-bordered select-sm min-h-11 md:min-h-0 w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Subjects</option>
              {subjectCatalog.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter classes by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClassLifecycleStatus | "")}
              className="select select-bordered select-sm min-h-11 md:min-h-0 w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : (
            <>
            <div className="grid gap-3 md:hidden">
              {classes.map((c) => {
                const { tone, label } = getClassStatusBadge(c.status, false, "Scheduled");
                return (
                  <article key={c.id} className="min-w-0 space-y-3 rounded-xl border border-base-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/classes/${c.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">{c.code}</Link>
                      <StatusBadge tone={tone} label={label} size="xs" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{subjectDisplayLabel(c.subject)}</p>
                      <p className="break-words text-xs text-base-content/60">{c.topics.join(", ")}</p>
                    </div>
                    <div className="grid gap-2 text-xs text-base-content/65">
                      <p>Tutor: <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" /> {c.tutor.firstName} {c.tutor.lastName}</p>
                      <p>Next session: {c.nextSessionAt ? formatDateTime(c.nextSessionAt) : "None scheduled"}</p>
                      <p>Enrolled: {c._count.enrollments}</p>
                      {c.status === "SUSPENDED" && c.suspendedUntil && <p>Suspended until: {formatDateTime(c.suspendedUntil)}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-base-200 pt-3">
                      <Link href={`/admin/classes/${c.id}`} className="btn btn-outline btn-sm min-h-11">View class</Link>
                      {c.status === "SCHEDULED" && <button type="button" onClick={() => startModeration(c, "SUSPENDED")} className="btn btn-outline btn-error btn-sm min-h-11">Suspend</button>}
                      {(c.status === "SCHEDULED" || c.status === "SUSPENDED") && <button type="button" onClick={() => startModeration(c, "BANNED")} className="btn btn-outline btn-error btn-sm min-h-11">Ban</button>}
                      {(c.status === "SUSPENDED" || c.status === "BANNED") && <button type="button" onClick={() => setReinstateTarget(c)} className="btn btn-outline btn-success btn-sm min-h-11">Reinstate</button>}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border border-base-200 md:block">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
                    <SortableTh label="Code" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Subject / Topics" field="subject" sort={sort} dir={dir} onSort={toggle} />
                    <th>Tutor</th>
                    <th>Scheduled</th>
                    <th>Enrolled</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const { tone, label } = getClassStatusBadge(c.status, false, "Scheduled");
                    return (
                      <tr key={c.id} className="text-xs">
                        <td className="font-mono text-2xs font-semibold text-primary/80 align-top">
                          {c.code}
                        </td>
                        <td>
                          <div className="font-semibold text-base-content/80">{subjectDisplayLabel(c.subject)}</div>
                          <div className="text-2xs text-base-content/50">{c.topics.join(", ")}</div>
                        </td>
                        <td>
                          <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                          <div className="text-2xs text-base-content/50 mt-1">
                            {c.tutor.firstName} {c.tutor.lastName}
                          </div>
                        </td>
                        <td className="text-base-content/60">
                          {c.nextSessionAt ? formatDateTime(c.nextSessionAt) : "—"}
                        </td>
                        <td className="text-base-content/60">{c._count.enrollments}</td>
                        <td>
                          <StatusBadge tone={tone} label={label} size="xs" />
                          {c.status === "SUSPENDED" && c.suspendedUntil && (
                            <div className="text-2xs text-base-content/50 mt-1">
                              Until {formatDateTime(c.suspendedUntil)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2 justify-end">
                          <Link
                            href={`/admin/classes/${c.id}`}
                            className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                          >
                            View
                          </Link>
                          {c.status === "SCHEDULED" && (
                            <button
                              onClick={() => startModeration(c, "SUSPENDED")}
                              className="btn btn-outline btn-error btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {(c.status === "SCHEDULED" || c.status === "SUSPENDED") && (
                            <button
                              onClick={() => startModeration(c, "BANNED")}
                              className="btn btn-outline btn-error btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                            >
                              Ban
                            </button>
                          )}
                          {(c.status === "SUSPENDED" || c.status === "BANNED") && (
                            <button
                              onClick={() => setReinstateTarget(c)}
                              className="btn btn-outline btn-success btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                            >
                              Reinstate
                            </button>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {classes.length === 0 && (
              <div className="text-center py-8 text-base-content/40 italic text-xs">No classes found.</div>
            )}
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

      <Modal
        open={moderateTarget !== null}
        onClose={() => setModerateTarget(null)}
        title={moderateTarget?.action === "SUSPENDED" ? "Suspend Class" : "Ban Class"}
      >
        {moderateTarget && <>
            <p className="text-2xs text-base-content/50 mb-4">
              {subjectDisplayLabel(moderateTarget.class.subject)} · {moderateTarget.class.topics.join(", ")}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            {moderateTarget.action === "SUSPENDED" && (
              <FormField label="Duration (days)" hint="Leave blank for an indefinite suspension">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 5"
                  className="input input-bordered input-sm w-full focus:input-primary text-xs"
                />
              </FormField>
            )}

            <FormField label="Reason" hint="Optional — shown for your own records">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  moderateTarget.action === "SUSPENDED"
                    ? "Why is this class being suspended?"
                    : "Why is this class being banned?"
                }
                className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setModerateTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatus(moderateTarget.class.id, moderateTarget.action, {
                    reason,
                    ...(moderateTarget.action === "SUSPENDED" && durationDays
                      ? { durationDays: Number(durationDays) }
                      : {}),
                  })
                }
                disabled={saving}
                className="btn btn-error btn-sm text-xs cursor-pointer"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : moderateTarget.action === "SUSPENDED" ? (
                  "Suspend"
                ) : (
                  "Ban"
                )}
              </button>
            </div>
        </>}
      </Modal>

      <ConfirmDialog
        open={reinstateTarget !== null}
        title="Reinstate this class?"
        description="It will become visible to learners and reopen for enrollment again."
        confirmLabel="Reinstate"
        tone="default"
        loading={saving}
        onConfirm={() => reinstateTarget && updateStatus(reinstateTarget.id, "SCHEDULED")}
        onCancel={() => setReinstateTarget(null)}
      />
    </div>
  );
}
