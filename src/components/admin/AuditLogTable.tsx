"use client";

import { useState } from "react";
import { AUDIT_PAGE_SIZE } from "@/lib/pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { formatDateTime, SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { formatAuditReason } from "@/lib/auditLogDisplay";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import SortableTh from "@/components/ui/SortableTh";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { auditActionDisplayLabel, statusDisplayLabel } from "@/lib/displayLabels";

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  admin: { anonymousId: string; firstName: string; lastName: string };
}

const PAGE_SIZE = AUDIT_PAGE_SIZE;
const ACTIONS = Object.values(AUDIT_ACTIONS);
const TARGET_TYPES = Object.values(AUDIT_TARGET_TYPES);

export default function AuditLogTable({ initialQuery = "" }: { initialQuery?: string }) {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [q, setQ] = useState(initialQuery);
  const { sort, dir, toggle } = useTableSort("createdAt", "desc", {
    action: "asc",
    targetType: "asc",
  });

  const {
    data: logs,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    refetch,
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

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />
      {error && <button type="button" className="btn btn-outline" onClick={refetch}>Retry audit log</button>}

      <section className="card kt-card">
        <div className="card-body gap-4">
          <p className="text-sm text-(--kt-muted)">Timestamps shown in {SCHOOL_TIME_ZONE_LABEL}.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              aria-label="Search audit log"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admin ID, reason or target ID"
              className="input input-bordered w-full focus:input-primary"
            />
            <select
              aria-label="Filter audit actions"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="">All actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {auditActionDisplayLabel(a)}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter audit target types"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="">All target types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {statusDisplayLabel(t)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Action" field="action" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Target" field="targetType" sort={sort} dir={dir} onSort={toggle} />
                    <th>Admin</th>
                    <th>Reason</th>
                    <SortableTh label="When" field="createdAt" sort={sort} dir={dir} onSort={toggle} />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-medium">
                        {auditActionDisplayLabel(log.action)}
                      </td>
                      <td className="text-(--kt-muted)">
                        {statusDisplayLabel(log.targetType)} · {log.targetId}
                      </td>
                      <td className="whitespace-nowrap">
                        <AnonymousIdText id={log.admin.anonymousId} role="ADMIN" />
                        <span className="text-sm text-(--kt-muted)"> {log.admin.firstName} {log.admin.lastName}</span>
                      </td>
                      <td className="min-w-48 max-w-md whitespace-normal break-words text-(--kt-muted)">{formatAuditReason(log.reason) || "—"}</td>
                      <td className="whitespace-nowrap text-sm text-(--kt-muted)">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!error && logs.length === 0 && (
                <EmptyState>No moderation actions match these filters.</EmptyState>
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
