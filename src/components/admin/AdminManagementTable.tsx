"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { Role, AccountStatus } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Tabs from "@/components/ui/Tabs";
import Pagination from "@/components/ui/Pagination";
import { statusDisplayLabel } from "@/lib/displayLabels";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import StatCard, { type StatCardProps } from "@/components/ui/StatCard";
import CreateAdminModal from "@/components/admin/CreateAdminModal";
import Modal from "@/components/ui/Modal";
import { Shield, Crown, ShieldCheck, UserPlus } from "lucide-react";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

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

  const statCards: StatCardProps[] = [
    {
      label: "Total Administrators",
      value: counts.total ?? admins.length,
      icon: Shield,
      tint: "primary",
    },
    {
      label: "Super Admins",
      value: counts.superAdmins ?? 0,
      icon: Crown,
      tint: "accent",
    },
    {
      label: "Standard Admins",
      value: counts.admins ?? 0,
      icon: ShieldCheck,
      tint: "success",
    },
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

      setSuccess(`${target.anonymousId} is now ${status}.`);
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
      {!target && error && <button type="button" className="btn btn-outline btn-sm min-h-11" onClick={refetch}>Retry administrators</button>}

      {/* Dashboard Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* User Management Table Section */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="card-title text-sm font-bold">Platform Administrators</h2>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="btn btn-primary btn-sm text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Admin Account</span>
            </button>
          </div>

          <Tabs
            tabs={[
              { key: "all", label: "All" },
              { key: "super_admins", label: "Super Admins" },
              { key: "admins", label: "Standard Admins" },
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
              className="input input-bordered min-h-11 sm:input-sm w-full sm:max-w-xs text-base sm:text-xs focus:input-primary"
            />
            <select
              aria-label="Filter administrators by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
              className="select select-bordered min-h-11 sm:select-sm w-full sm:w-auto text-base sm:text-xs focus:select-primary"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
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
                      className="text-sm hover:bg-base-200/40"
                    >
                      <td>
                        <AnonymousIdBadge
                          id={u.anonymousId}
                          role="ADMIN"
                        />
                      </td>
                      <td className="text-base-content/70">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="text-base-content/60">{u.email}</td>
                      <td>
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="kt-badge kt-badge--accent text-2xs font-semibold">
                            Super Admin
                          </span>
                        ) : (
                          <span className="kt-badge kt-badge--neutral text-2xs font-semibold">
                            Admin
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[u.status]} label={statusDisplayLabel(u.status)} size="xs" />
                        {u.status === "SUSPENDED" && u.statusReason && (
                          <div className="text-2xs text-base-content/50 mt-1 max-w-xs truncate">
                            {u.statusReason}
                          </div>
                        )}
                      </td>
                      <td className="text-base-content/60 text-xs">
                        {formatDateTime(u.createdAt)} PHT
                      </td>
                      <td className="text-right">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="text-2xs text-base-content/40 font-medium">
                            System Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openModal(u)}
                            className="btn btn-outline btn-primary btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
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

      {/* Manage Account Modal (mirroring UserManagementTable) */}
      <Modal open={!!target} onClose={() => setTarget(null)} title="Manage Administrator">
        {target && <>
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
                </select>
              </FormField>

              <FormField label="Reason" hint="Optional — audit log record for this status change">
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
        </>}
      </Modal>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAdminCreated={() => {
          refetch();
          setSuccess("New administrator account provisioned successfully.");
          setTimeout(() => setSuccess(""), 4000);
        }}
      />
    </div>
  );
}
