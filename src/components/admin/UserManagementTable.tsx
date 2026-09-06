"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const PAGE_SIZE = 10;

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
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "learners" | "tutors">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
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

  const handleSave = async () => {
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
      if (!res.ok) throw new Error(data.error || "Failed to update account.");

      setSuccess(
        status === "SUSPENDED" && data.statusExpiresAt
          ? `${target.anonymousId} is now SUSPENDED until ${formatExpiry(data.statusExpiresAt)}.`
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

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Learner & Tutor Accounts</h2>

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input input-bordered input-sm w-full sm:max-w-xs text-xs focus:input-primary"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
              className="select select-bordered select-sm w-full sm:w-auto text-xs focus:select-primary"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="DECLINED">Declined</option>
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
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                      className="text-sm cursor-pointer hover:bg-base-200/40"
                    >
                      <td>
                        <AnonymousIdBadge
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td className="text-base-content/70">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="text-base-content/60">{u.email}</td>
                      <td className="text-base-content/60">
                        {u.gradeLevel.replace("_", " ")} · {u.section}
                      </td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[u.status]} label={u.status} size="xs" />
                        {u.status === "SUSPENDED" && u.statusExpiresAt && (
                          <div className="text-2xs text-base-content/50 mt-1">
                            Until {formatExpiry(u.statusExpiresAt)}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(u);
                          }}
                          className="btn btn-outline btn-primary btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayed.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">No accounts found.</div>
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

      {target && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Manage Account</h3>
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
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-sm text-xs cursor-pointer"
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
