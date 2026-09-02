"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  admin: { anonymousId: string; firstName: string; lastName: string };
}

const ACTION_LABELS: Record<string, string> = {
  USER_STATUS_CHANGE: "User Status Changed",
  CLASS_STATUS_CHANGE: "Class Status Changed",
  CERTIFICATION_APPROVED: "Certification Approved",
  CERTIFICATION_REJECTED: "Certification Rejected",
  USER_APPROVED: "Registration Approved",
  USER_DECLINED: "Registration Declined",
};

const PAGE_SIZE = 25;
const ACTIONS = Object.values(AUDIT_ACTIONS);
const TARGET_TYPES = Object.values(AUDIT_TARGET_TYPES);

type SortKey = "createdAt" | "action" | "targetType";

export default function AuditLogTable() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const {
    data: logs,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
  } = usePaginatedList<AuditLogEntry>(
    "/api/admin/audit-log",
    "logs",
    {
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve the audit log.",
    "audit"
  );

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  const sortHeader = (label: string, k: SortKey) => (
    <th>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 font-semibold hover:text-primary cursor-pointer"
      >
        {label}
        {sort === k &&
          (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Moderation Action History</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admin ID, reason, target ID..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a] || a}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All target types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
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
                    {sortHeader("Action", "action")}
                    {sortHeader("Target", "targetType")}
                    <th>Admin</th>
                    <th>Reason</th>
                    {sortHeader("When", "createdAt")}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="text-sm">
                      <td className="font-semibold text-base-content/80">
                        {ACTION_LABELS[log.action] || log.action}
                      </td>
                      <td className="text-base-content/60">
                        {log.targetType} · {log.targetId}
                      </td>
                      <td className="text-base-content/60">
                        {log.admin.anonymousId} ({log.admin.firstName} {log.admin.lastName})
                      </td>
                      <td className="text-base-content/60">{log.reason || "—"}</td>
                      <td className="text-base-content/50">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  No moderation actions match these filters.
                </div>
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
    </div>
  );
}
