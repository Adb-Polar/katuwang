"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { Role, AccountStatus } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import StatusText from "@/components/ui/StatusText";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { statusDisplayLabel } from "@/lib/displayLabels";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import CreateAdminModal from "@/components/admin/CreateAdminModal";
import Modal from "@/components/ui/Modal";
import { UserPlus } from "lucide-react";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface AdminRecord {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: AccountStatus;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contactInfo: string | null;
}

const STATUS_TONE: Record<AccountStatus, "success" | "warning" | "error"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
  PENDING: "warning",
  DECLINED: "error",
};

const TAB_ROLE: Record<"all" | "super_admins" | "admins", string> = {
  all: "",
  super_admins: "SUPER_ADMIN",
  admins: "ADMIN",
};

export default function AdminManagementTable() {
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "super_admins" | "admins">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [target, setTarget] = useState<AdminRecord | null>(null);
  const [status, setStatus] = useState<AccountStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { sort, dir, toggle } = useTableSort("createdAt", "desc", { name: "asc", code: "asc" });

  const {
    data: admins,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
    meta,
  } = usePaginatedList<AdminRecord>(
    "/api/admin/admins",
    "admins",
    {
      ...(TAB_ROLE[activeTab] ? { role: TAB_ROLE[activeTab] } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve administrators."
  );

  const counts = (meta?.counts as { total?: number; superAdmins?: number; admins?: number } | undefined) ?? {
    total: total || admins.length,
    superAdmins: admins.filter((a) => a.role === "SUPER_ADMIN").length,
    admins: admins.filter((a) => a.role === "ADMIN").length,
  };

  const adminNumbers = [
    plural(counts.total ?? admins.length, "administrator", "administrators"),
    plural(counts.superAdmins ?? 0, "super admin", "super admins"),
    plural(counts.admins ?? 0, "standard admin", "standard admins"),
  ];

  const openModal = (admin: AdminRecord) => {
    setTarget(admin);
    setStatus(admin.status);
    setReason(admin.statusReason || "");
    setError("");
  };

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/admins/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account.");

      setSuccess(`${target.anonymousId} is now ${statusDisplayLabel(status).toLowerCase()}.`);
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
      {!target && error && <button type="button" className="btn btn-outline min-h-11" onClick={refetch}>Retry administrators</button>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul aria-label="Administrator numbers" className="flex flex-wrap gap-x-6 gap-y-2 text-(--kt-muted)">
          {adminNumbers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create admin account</span>
        </button>
      </div>

      <section className="card kt-card">
        <div className="card-body gap-4">

          <Tabs
            tabs={[
              { key: "all", label: "All" },
              { key: "super_admins", label: "Super admins" },
              { key: "admins", label: "Standard admins" },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "all" | "super_admins" | "admins")}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search administrators by name, email, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input input-bordered min-h-11 w-full sm:max-w-xs focus:input-primary"
            />
            <select
              aria-label="Filter administrators by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto focus:select-primary"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Code" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Name" field="name" sort={sort} dir={dir} onSort={toggle} />
                    <th>Email</th>
                    <SortableTh label="Role" field="role" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Created" field="createdAt" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-base-200/40"
                    >
                      <td>
                        <AnonymousIdText
                          id={u.anonymousId}
                          role="ADMIN"
                        />
                      </td>
                      <td className="text-(--kt-muted)">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="text-(--kt-muted)">{u.email}</td>
                      <td>
                        {u.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                      </td>
                      <td>
                        <StatusText tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} />
                        {u.status === "SUSPENDED" && u.statusReason && (
                          <div className="text-sm text-(--kt-muted) mt-1 max-w-xs truncate">
                            {u.statusReason}
                          </div>
                        )}
                      </td>
                      <td className="text-sm text-(--kt-muted) whitespace-nowrap">
                        {formatDateTime(u.createdAt)} PHT
                      </td>
                      <td className="text-right">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="text-sm text-(--kt-muted)">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openModal(u)}
                            className="btn btn-outline btn-primary min-h-11"
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!error && admins.length === 0 && (
                <EmptyState>No administrator accounts found.</EmptyState>
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

      <Modal open={!!target} onClose={() => setTarget(null)} title="Manage administrator">
        {target && <>
            <p className="text-sm text-(--kt-muted) mb-4">
              <AnonymousIdText id={target.anonymousId} role="ADMIN" /> · {target.firstName} {target.lastName}
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
                </select>
              </FormField>

              <FormField label="Reason" hint="Optional — audit log record for this status change" size="md">
                <textarea
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
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save"}
              </button>
            </div>
        </>}
      </Modal>

      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAdminCreated={() => {
          refetch();
          setSuccess("New admin account created.");
          setTimeout(() => setSuccess(""), 4000);
        }}
      />
    </div>
  );
}
