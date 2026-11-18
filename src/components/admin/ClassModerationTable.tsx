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
import { formatDateTime } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ActionMenu from "@/components/ui/ActionMenu";
import { Ban, PauseCircle, RotateCcw } from "lucide-react";
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
  const { subjects: subjectCatalog, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
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
    body: Record<string, unknown> = {},
    validationForm?: HTMLFormElement
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...body }),
      });
      const data = await res.json();
      if (!res.ok && validationForm && reportServerFieldErrors(validationForm, data)) return;
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

  const rowActions = (c: AdminClass) => (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <Link href={`/admin/classes/${c.id}`} className="btn btn-ghost min-h-11 md:min-h-0">
        View
      </Link>
      {c.status === "SCHEDULED" && (
        <button
          type="button"
          onClick={() => startModeration(c, "SUSPENDED")}
          className="btn btn-outline btn-error min-h-11 md:min-h-0"
        >
          Suspend
        </button>
      )}
      {(c.status === "SCHEDULED" || c.status === "SUSPENDED") && (
        <button
          type="button"
          onClick={() => startModeration(c, "BANNED")}
          className="btn btn-outline btn-error min-h-11 md:min-h-0"
        >
          Ban
        </button>
      )}
      {(c.status === "SUSPENDED" || c.status === "BANNED") && (
        <button
          type="button"
          onClick={() => setReinstateTarget(c)}
          className="btn btn-outline btn-success min-h-11 md:min-h-0"
        >
          Reinstate
        </button>
      )}
    </div>
  );

  const moderationActions = (c: AdminClass) => [
    ...(c.status === "SCHEDULED"
      ? [{ label: "Suspend class", icon: <PauseCircle className="h-4 w-4" />, onSelect: () => startModeration(c, "SUSPENDED") }]
      : []),
    ...(c.status === "SCHEDULED" || c.status === "SUSPENDED"
      ? [{ label: "Ban class", icon: <Ban className="h-4 w-4" />, onSelect: () => startModeration(c, "BANNED"), danger: true }]
      : []),
    ...(c.status === "SUSPENDED" || c.status === "BANNED"
      ? [{ label: "Reinstate class", icon: <RotateCcw className="h-4 w-4" />, onSelect: () => setReinstateTarget(c) }]
      : []),
  ];

  const tableActions = (c: AdminClass) => {
    const actions = moderationActions(c);
    return (
      <div className="flex items-center justify-end gap-1">
        <Link href={`/admin/classes/${c.id}`} className="btn btn-ghost btn-sm">
          View
        </Link>
        {actions.length > 0 && <ActionMenu label={`Moderate ${c.code}`} actions={actions} />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={moderateTarget || loadError ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search classes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, topic, or tutor..."
              className="input input-bordered w-full sm:max-w-xs focus:input-primary"
            />
            <select
              aria-label="Filter classes by subject"
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
              aria-label="Filter classes by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClassLifecycleStatus | "")}
              className="select select-bordered w-full sm:w-auto focus:select-primary"
            >
              <option value="">All statuses</option>
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
            <div className="md:hidden">
              {classes.map((c) => {
                const { tone, label } = getClassStatusBadge(c.status, false, "Scheduled");
                return (
                  <article key={c.id} className="min-w-0 space-y-3 border-b border-(--kt-border) py-4 last:border-b-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/classes/${c.id}`} className="whitespace-nowrap font-medium text-primary hover:underline">{c.code}</Link>
                      <StatusText tone={tone} label={label} />
                    </div>
                    <div>
                      <p className="font-medium">{subjectDisplayLabel(c.subject)}</p>
                      <p className="break-words text-sm text-(--kt-muted)">{c.topics.join(", ")}</p>
                    </div>
                    <div className="grid gap-1 text-sm text-(--kt-muted)">
                      <p>Tutor: <AnonymousIdText id={c.tutor.anonymousId} role="TUTOR" /> {c.tutor.firstName} {c.tutor.lastName}</p>
                      <p>Next session: {c.nextSessionAt ? formatDateTime(c.nextSessionAt) : "None scheduled"}</p>
                      <p>Enrolled: {c._count.enrollments}</p>
                      {c.status === "SUSPENDED" && c.suspendedUntil && <p>Suspended until: {formatDateTime(c.suspendedUntil)}</p>}
                    </div>
                    {rowActions(c)}
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Code" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Subject and topics" field="subject" sort={sort} dir={dir} onSort={toggle} />
                    <th>Tutor</th>
                    <th>Next session</th>
                    <th>Enrolled</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const { tone, label } = getClassStatusBadge(c.status, false, "Scheduled");
                    return (
                      <tr key={c.id}>
                        <td className="whitespace-nowrap font-medium">
                          {c.code}
                        </td>
                        <td>
                          <div className="font-medium">{subjectDisplayLabel(c.subject)}</div>
                          <div className="text-sm text-(--kt-muted)">{c.topics.join(", ")}</div>
                        </td>
                        <td>
                          <AnonymousIdText id={c.tutor.anonymousId} role="TUTOR" />
                          <div className="whitespace-nowrap text-sm text-(--kt-muted)">
                            {c.tutor.firstName} {c.tutor.lastName}
                          </div>
                        </td>
                        <td className="text-sm text-(--kt-muted)">
                          {c.nextSessionAt ? formatDateTime(c.nextSessionAt) : "—"}
                        </td>
                        <td>{c._count.enrollments}</td>
                        <td>
                          <StatusText tone={tone} label={label} />
                          {c.status === "SUSPENDED" && c.suspendedUntil && (
                            <div className="text-sm text-(--kt-muted)">
                              Until {formatDateTime(c.suspendedUntil)}
                            </div>
                          )}
                        </td>
                        <td>{tableActions(c)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {classes.length === 0 && <EmptyState>No classes found.</EmptyState>}
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
        title={moderateTarget?.action === "SUSPENDED" ? "Suspend class" : "Ban class"}
      >
        {moderateTarget && <ValidatedForm onSubmit={(e) => { e.preventDefault(); void updateStatus(moderateTarget.class.id, moderateTarget.action, { reason, ...(moderateTarget.action === "SUSPENDED" && durationDays ? { durationDays: Number(durationDays) } : {}) }, e.currentTarget); }}>
            <p className="text-sm text-(--kt-muted) mb-4">
              {subjectDisplayLabel(moderateTarget.class.subject)} · {moderateTarget.class.topics.join(", ")}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            {moderateTarget.action === "SUSPENDED" && (
              <FormField size="md" label="Duration (days)" hint="Leave blank for an indefinite suspension">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 5"
                  className="input input-bordered w-full focus:input-primary"
                />
              </FormField>
            )}

            <FormField size="md" label="Reason" hint="Optional — shown for your own records">
              <textarea
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  moderateTarget.action === "SUSPENDED"
                    ? "Why is this class being suspended?"
                    : "Why is this class being banned?"
                }
                className="textarea textarea-bordered w-full focus:textarea-primary h-24"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setModerateTarget(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit"
                disabled={saving}
                className="btn btn-error"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : moderateTarget.action === "SUSPENDED" ? (
                  "Suspend"
                ) : (
                  "Ban"
                )}
              </button>
            </div>
        </ValidatedForm>}
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
