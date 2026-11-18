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
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import StatusText from "@/components/ui/StatusText";
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
          ? `${target.anonymousId} is now suspended until ${formatDateTime(data.statusExpiresAt)}.`
          : `${target.anonymousId} is now ${statusDisplayLabel(status).toLowerCase()}.`
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
      {!target && error && <button type="button" className="btn btn-outline min-h-11" onClick={refetch}>Retry accounts</button>}

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
              className="input input-bordered min-h-11 w-full sm:max-w-xs focus:input-primary"
            />
            <select
              aria-label="Filter accounts by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto focus:select-primary"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="DECLINED">Declined</option>
            </select>
            <select
              aria-label="Filter accounts by grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeLevel | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto focus:select-primary"
            >
              <option value="">All grade levels</option>
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
            <div className="md:hidden">
              {displayed.map((u) => (
                <article key={u.id} className="space-y-2 border-b border-(--kt-border) py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary hover:underline">{u.firstName} {u.lastName}</Link>
                      <p className="text-sm text-(--kt-muted)">
                        <AnonymousIdText id={u.anonymousId} role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"} /> · {gradeSection(u.gradeLevel, u.section)}
                      </p>
                    </div>
                    <StatusText tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} />
                  </div>
                  <p className="text-sm break-all text-(--kt-muted)">{u.email}</p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/users/${u.id}`} className="btn btn-outline min-h-11 w-full">View details</Link>
                    <button type="button" onClick={() => openModal(u)} className="btn btn-primary min-h-11 w-full">Manage account</button>
                  </div>
                </article>
              ))}
              {!error && displayed.length === 0 && <EmptyState>No accounts found.</EmptyState>}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Code" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Name" field="name" sort={sort} dir={dir} onSort={toggle} />
                    <th>Email</th>
                    <th>Grade &amp; section</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-base-200/40"
                    >
                      <td>
                        <AnonymousIdText
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td className="text-(--kt-muted)">
                        <div className="flex items-center gap-2.5">
                          <div onClick={(e) => e.stopPropagation()}>
                            <UserAvatar
                              src={u.image}
                              name={`${u.firstName} ${u.lastName}`.trim()}
                              anonymousId={u.anonymousId}
                              size="sm"
                              role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                              modalTitle={`${u.firstName} ${u.lastName} - profile picture`}
                            />
                          </div>
                          <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary hover:underline">
                            {u.firstName} {u.lastName}<span className="sr-only"> — View account details</span>
                          </Link>
                        </div>
                      </td>
                      <td className="text-(--kt-muted)">{u.email}</td>
                      <td className="text-(--kt-muted)">
                        {gradeSection(u.gradeLevel, u.section)}
                      </td>
                      <td>
                        <StatusText tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} />
                        {u.status === "SUSPENDED" && u.statusExpiresAt && (
                          <div className="text-sm text-(--kt-muted) mt-1">
                            Until {formatDateTime(u.statusExpiresAt)}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openModal(u)}
                          aria-label={`Manage ${u.anonymousId} account`}
                          className="btn btn-outline btn-primary min-h-11"
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

      <Modal open={!!target} onClose={() => setTarget(null)} title="Manage account">
        {target && <ValidatedForm onSubmit={(e) => { e.preventDefault(); void handleSave(e.currentTarget); }}>
            <p className="text-sm text-(--kt-muted) mb-4">
              <AnonymousIdText id={target.anonymousId} role={target.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"} /> · {target.firstName} {target.lastName}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <div className="space-y-3.5">
              <FormField label="Status" required size="md">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="select select-bordered w-full focus:select-primary"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
              </FormField>

              {status === "SUSPENDED" && (
                <FormField label="Duration (days)" hint="Leave blank for an indefinite suspension" size="md">
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

              <FormField label="Reason" hint="Optional — shown for your own records" size="md">
                <textarea
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this account's status changing?"
                  className="textarea textarea-bordered w-full focus:textarea-primary h-24"
                />
              </FormField>
            </div>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save"}
              </button>
            </div>
        </ValidatedForm>}
      </Modal>
    </div>
  );
}
