"use client";

import ValidatedForm from "@/components/ui/ValidatedForm";
import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { Role, GradeLevel, AccountStatus } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { GRADE_LEVELS, gradeSection } from "@/lib/gradeLevels";
import { statusDisplayLabel } from "@/lib/displayLabels";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import UserAvatar from "@/components/profile/UserAvatar";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface AdminUser {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  gradeLevel: GradeLevel;
  section: string;
  status: AccountStatus;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  statusExpiresAt: string | null;
  image?: string | null;
  profilePictureLocked?: boolean;
}

const STATUS_TONE: Record<AccountStatus, "success" | "warning" | "error"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
  PENDING: "warning",
  DECLINED: "error",
};

const TAB_ROLE: Record<"all" | "learners" | "tutors", string> = {
  all: "",
  learners: "STUDENT_LEARNER",
  tutors: "STUDENT_TUTOR",
};

export default function UserManagementTable() {
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "learners" | "tutors">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "">("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AccountStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { sort, dir, toggle } = useTableSort("createdAt", "desc", { name: "asc", code: "asc" });

  const {
    data: users,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  } = usePaginatedList<AdminUser>(
    "/api/admin/users",
    "users",
    {
      ...(TAB_ROLE[activeTab] ? { role: TAB_ROLE[activeTab] } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(gradeFilter ? { gradeLevel: gradeFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve users."
  );

  const displayed = users;

  const openModal = (user: AdminUser) => {
    setTarget(user);
    setStatus(user.status);
    setReason("");
    setDurationDays("");
    setError("");
  };

  const handleSave = async (validationForm: HTMLFormElement) => {
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason,
          ...(status === "SUSPENDED" && durationDays ? { durationDays: Number(durationDays) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to update account.");

      setSuccess(
        status === "SUSPENDED" && data.statusExpiresAt
          ? `${target.anonymousId} is now SUSPENDED until ${formatDateTime(data.statusExpiresAt)}.`
          : `${target.anonymousId} is now ${status}.`
      );
      setTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={target ? null : error || null} />
      {!target && error && <button type="button" className="btn btn-outline btn-sm min-h-11" onClick={refetch}>Retry accounts</button>}

      <section className="card kt-card">
        <div className="card-body gap-4">


          <Tabs
            tabs={[
              { key: "all", label: "All" },
              { key: "learners", label: "Learners" },
              { key: "tutors", label: "Tutors" },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "all" | "learners" | "tutors")}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search accounts by name, email, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input input-bordered min-h-11 w-full sm:max-w-xs text-base sm:text-sm focus:input-primary"
            />
            <select
              aria-label="Filter accounts by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto text-base sm:text-sm focus:select-primary"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="DECLINED">Declined</option>
            </select>
            <select
              aria-label="Filter accounts by grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeLevel | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto text-base sm:text-sm focus:select-primary"
            >
              <option value="">All Grade Levels</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <>
            <div className="grid gap-3 md:hidden">
              {displayed.map((u) => (
                <article key={u.id} className="rounded-xl border border-base-300 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary hover:underline">{u.firstName} {u.lastName}</Link>
                      <p className="text-xs text-base-content/60">{u.anonymousId} · {gradeSection(u.gradeLevel, u.section)}</p>
                    </div>
                    <StatusBadge tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} size="xs" />
                  </div>
                  <p className="text-xs break-all text-base-content/60">{u.email}</p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/users/${u.id}`} className="btn btn-outline min-h-11 text-sm w-full">View details</Link>
                    <button type="button" onClick={() => openModal(u)} className="btn btn-primary min-h-11 text-sm w-full">Manage account</button>
                  </div>
                </article>
              ))}
              {!error && displayed.length === 0 && <EmptyState>No accounts found.</EmptyState>}
            </div>
            <div className="hidden md:block overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <SortableTh label="Code" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Name" field="name" sort={sort} dir={dir} onSort={toggle} />
                    <th>Email</th>
                    <th>Grade &amp; Section</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((u) => (
                    <tr
                      key={u.id}
                      className="text-sm hover:bg-base-200/40"
                    >
                      <td>
                        <AnonymousIdBadge
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td className="text-base-content/70">
                        <div className="flex items-center gap-2.5">
                          <div onClick={(e) => e.stopPropagation()}>
                            <UserAvatar
                              src={u.image}
                              name={`${u.firstName} ${u.lastName}`.trim()}
                              anonymousId={u.anonymousId}
                              size="sm"
                              role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                              modalTitle={`${u.firstName} ${u.lastName} - Profile Picture`}
                            />
                          </div>
                          <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary hover:underline">
                            {u.firstName} {u.lastName}<span className="sr-only"> — View account details</span>
                          </Link>
                        </div>
                      </td>
                      <td className="text-base-content/60">{u.email}</td>
                      <td className="text-base-content/60">
                        {gradeSection(u.gradeLevel, u.section)}
                      </td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} size="xs" />
                        {u.status === "SUSPENDED" && u.statusExpiresAt && (
                          <div className="text-2xs text-base-content/50 mt-1">
                            Until {formatDateTime(u.statusExpiresAt)}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openModal(u)}
                          aria-label={`Manage ${u.anonymousId} account`}
                          className="btn btn-outline btn-primary min-h-11 text-xs font-bold"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!error && displayed.length === 0 && (
                <EmptyState>No accounts found.</EmptyState>
              )}
            </div>
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

      <Modal open={!!target} onClose={() => setTarget(null)} title="Manage Account">
        {target && <ValidatedForm onSubmit={(e) => { e.preventDefault(); void handleSave(e.currentTarget); }}>
            <p className="text-2xs text-base-content/50 mb-4">
              {target.anonymousId} · {target.firstName} {target.lastName}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <div className="space-y-3.5">
              <FormField label="Status" required>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="select select-bordered select-sm w-full focus:select-primary text-xs"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
              </FormField>

              {status === "SUSPENDED" && (
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
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this account's status changing?"
                  className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
                />
              </FormField>
            </div>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit"
                disabled={saving}
                className="btn btn-primary btn-sm text-xs cursor-pointer"
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
              </button>
            </div>
        </ValidatedForm>}
      </Modal>
    </div>
  );
}
