"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";

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

const PAGE_SIZE = 25;

type SortKey = "lastSeen" | "count" | "firstSeen";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChatbotMissesTable() {
  const [role, setRole] = useState<"" | MissGroup["role"]>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("lastSeen");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

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

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir("desc");
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
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs">
                    <th>Message</th>
                    <th>Role</th>
                    {sortHeader("Count", "count")}
                    {sortHeader("First seen", "firstSeen")}
                    {sortHeader("Last seen", "lastSeen")}
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
                      <td className="text-base-content/50">{formatWhen(g.firstSeen)}</td>
                      <td className="text-base-content/50">{formatWhen(g.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groups.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  No unanswered questions match these filters.
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
