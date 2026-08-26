"use client";

import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

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
};

export default function AuditLogTable() {
  const { data: logs, loading, error } = useFetchList<AuditLogEntry>(
    "/api/admin/audit-log",
    "Could not retrieve the audit log."
  );

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Moderation Action History</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
                    <th>Action</th>
                    <th>Target</th>
                    <th>Admin</th>
                    <th>Reason</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="text-xs">
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
                <div className="text-center py-8 text-base-content/40 italic text-xs">
                  No moderation actions recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
