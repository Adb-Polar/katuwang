"use client";

import { useState } from "react";
import { AUDIT_PAGE_SIZE } from "@/lib/pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import SortableTh from "@/components/ui/SortableTh";
import { formatDateTime } from "@/lib/datetime";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";

interface MissGroup {
  normalized: string;
  sample: string;
  role: "STUDENT_LEARNER" | "STUDENT_TUTOR" | "ADMIN";
  count: number;
  firstSeen: string;
  lastSeen: string;
}

const ROLE_LABELS: Record<MissGroup["role"], string> = {
  STUDENT_LEARNER: "Learner",
  STUDENT_TUTOR: "Tutor",
  ADMIN: "Admin",
};

const PAGE_SIZE = AUDIT_PAGE_SIZE;

export default function ChatbotMissesTable() {
  const [role, setRole] = useState<"" | MissGroup["role"]>("");
  const [q, setQ] = useState("");
  const { sort, dir, toggle } = useTableSort("lastSeen", "desc");

  const {
    data: groups,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
  } = usePaginatedList<MissGroup>(
    "/api/admin/chatbot-misses",
    "groups",
    {
      ...(role ? { role } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not load chatbot misses.",
    "misses"
  );

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Unanswered Questions</h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Messages the assistant couldn&apos;t match to a nav intent or FAQ, grouped by
            normalised wording. Use these to grow the FAQ knowledge base.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search message text..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "" | MissGroup["role"])}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All roles</option>
              <option value="STUDENT_LEARNER">Learner</option>
              <option value="STUDENT_TUTOR">Tutor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <th>Message</th>
                    <th>Role</th>
                    <SortableTh label="Count" field="count" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="First seen" field="firstSeen" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Last seen" field="lastSeen" sort={sort} dir={dir} onSort={toggle} />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={`${g.role}:${g.normalized}`} className="text-sm">
                      <td className="text-base-content/80 max-w-md truncate" title={g.normalized}>
                        {g.sample}
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm">{ROLE_LABELS[g.role]}</span>
                      </td>
                      <td className="text-base-content/60">{g.count}</td>
                      <td className="text-base-content/50">{formatDateTime(g.firstSeen)}</td>
                      <td className="text-base-content/50">{formatDateTime(g.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groups.length === 0 && (
                <EmptyState>No unanswered questions match these filters.</EmptyState>
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
