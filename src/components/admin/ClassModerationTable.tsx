"use client";

import { useState } from "react";
import Link from "next/link";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { getClassStatusBadge, ClassLifecycleStatus } from "@/components/classes/classStatus";

const PAGE_SIZE = 10;

interface Tutor {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
}

interface AdminClass {
  id: string;
  code: string;
  subject: SubjectArea;
  topics: string[];
  scheduledAt: string;
  status: ClassLifecycleStatus;
  suspendedReason: string | null;
  suspendedUntil: string | null;
  tutor: Tutor;
  _count: { enrollments: number };
}

function formatExpiry(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClassModerationTable() {
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<SubjectArea | "">("");
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
    loading,
    error,
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
            ? `Class suspended until ${formatExpiry(data.suspendedUntil)}.`
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

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={moderateTarget ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">All Classes</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, topic, or tutor..."
              className="input input-bordered input-sm w-full sm:max-w-xs text-xs focus:input-primary"
            />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as SubjectArea | "")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Subjects</option>
              {Object.values(SubjectArea).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClassLifecycleStatus | "")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
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
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
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
                        <td>
                          <div className="font-mono text-2xs font-semibold text-primary/80">{c.code}</div>
                          <div className="font-semibold text-base-content/80">{c.subject}</div>
                          <div className="text-2xs text-base-content/50">{c.topics.join(", ")}</div>
                        </td>
                        <td>
                          <AnonymousIdBadge id={c.tutor.anonymousId} role="TUTOR" />
                          <div className="text-2xs text-base-content/50 mt-1">
                            {c.tutor.firstName} {c.tutor.lastName}
                          </div>
                        </td>
                        <td className="text-base-content/60">
                          {new Date(c.scheduledAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="text-base-content/60">{c._count.enrollments}</td>
                        <td>
                          <StatusBadge tone={tone} label={label} size="xs" />
                          {c.status === "SUSPENDED" && c.suspendedUntil && (
                            <div className="text-2xs text-base-content/50 mt-1">
                              Until {formatExpiry(c.suspendedUntil)}
                            </div>
                          )}
                        </td>
                        <td className="flex gap-2 justify-end">
                          <Link
                            href={`/admin/classes/${c.id}`}
                            className="btn btn-ghost btn-xs text-2xs font-bold cursor-pointer"
                          >
                            View
                          </Link>
                          {c.status === "SCHEDULED" && (
                            <button
                              onClick={() => {
                                setModerateTarget({ class: c, action: "SUSPENDED" });
                                setReason("");
                                setDurationDays("");
                                setError("");
                              }}
                              className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {(c.status === "SCHEDULED" || c.status === "SUSPENDED") && (
                            <button
                              onClick={() => {
                                setModerateTarget({ class: c, action: "BANNED" });
                                setReason("");
                                setDurationDays("");
                                setError("");
                              }}
                              className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                            >
                              Ban
                            </button>
                          )}
                          {(c.status === "SUSPENDED" || c.status === "BANNED") && (
                            <button
                              onClick={() => setReinstateTarget(c)}
                              className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                            >
                              Reinstate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {classes.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-xs">No classes found.</div>
              )}
            </div>
          )}

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </section>

      {moderateTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setModerateTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">
              {moderateTarget.action === "SUSPENDED" ? "Suspend Class" : "Ban Class"}
            </h3>
            <p className="text-2xs text-base-content/50 mb-4">
              {moderateTarget.class.subject} · {moderateTarget.class.topics.join(", ")}
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
          </div>
        </div>
      )}

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
