"use client";

import { useState } from "react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import SortableTh from "@/components/ui/SortableTh";
import SessionTestResults from "@/components/tutor/SessionTestResults";

const PAGE_SIZE = 10;

interface Row {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  classCode: string;
  subject: string;
  sessionTopic: string;
  scheduledAt: string;
  tutor: { id: string; anonymousId: string };
  questionCount: number;
  attemptCount: number;
}

const STATUS_TONE = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CLOSED: "warning",
} as const;

export default function SessionTestsTable() {
  const { subjects } = useSubjectCatalog();
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { sort, dir, toggle } = useTableSort("scheduledAt", "desc");

  const {
    data: tests,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
  } = usePaginatedList<Row>(
    "/api/admin/session-tests",
    "tests",
    {
      ...(subject ? { subject } : {}),
      ...(status ? { status } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
    },
    PAGE_SIZE,
    "Could not load session tests.",
    "stests",
  );

  const sorted = [...tests].sort((a, b) => {
    const va = a[sort as keyof Row];
    const vb = b[sort as keyof Row];
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va ?? "").localeCompare(String(vb ?? ""));
    return dir === "asc" ? cmp : -cmp;
  });

  if (openId) {
    return (
      <div className="space-y-4">
        <button onClick={() => setOpenId(null)} className="btn btn-ghost btn-sm text-xs">
          ← Back to session tests
        </button>
        <SessionTestResults
          resultsUrl={`/api/admin/session-tests/${openId}/results`}
          attemptBaseUrl={`/api/admin/session-tests/${openId}/attempts`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title / class / tutor..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">Any status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
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
                    <SortableTh label="Class" field="classCode" sort={sort} dir={dir} onSort={toggle} />
                    <th>Tutor</th>
                    <SortableTh label="Session" field="sessionTopic" sort={sort} dir={dir} onSort={toggle} />
                    <th>Title</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Questions" field="questionCount" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Attempts" field="attemptCount" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <tr key={t.id} className="text-sm">
                      <td className="text-base-content/70">
                        <span className="font-mono text-2xs">{t.classCode}</span>
                        <div className="text-2xs text-base-content/40">{t.subject}</div>
                      </td>
                      <td>
                        <AnonymousIdBadge id={t.tutor.anonymousId} role="TUTOR" />
                      </td>
                      <td className="text-base-content/70">{t.sessionTopic}</td>
                      <td className="text-base-content/70 max-w-[12rem] whitespace-normal">{t.title}</td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[t.status]} label={t.status.toLowerCase()} size="xs" />
                      </td>
                      <td className="text-base-content/60">{t.questionCount}</td>
                      <td className="text-base-content/60">{t.attemptCount}</td>
                      <td className="text-right">
                        <button onClick={() => setOpenId(t.id)} className="btn btn-outline btn-xs text-2xs font-bold">
                          Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  No session tests match these filters.
                </div>
              )}
            </div>
          )}

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </section>
    </div>
  );
}
