"use client";

import CatalogLoadState from "@/components/ui/CatalogLoadState";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Pagination from "@/components/ui/Pagination";
import StatusText from "@/components/ui/StatusText";
import SortableTh from "@/components/ui/SortableTh";
import SessionTestResults from "@/components/tutor/SessionTestResults";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import { statusDisplayLabel, subjectDisplayLabel } from "@/lib/displayLabels";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

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
  const { subjects, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
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
    loadError,
    refetch,
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
        <button type="button" onClick={() => setOpenId(null)} className="btn btn-ghost">
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
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              aria-label="Search session tests"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, class, or tutor..."
              className="input input-bordered w-full focus:input-primary"
            />
            <select
              aria-label="Filter session tests by subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter session tests by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select select-bordered w-full focus:select-primary"
            >
              <option value="">Any status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Class" field="classCode" sort={sort} dir={dir} onSort={toggle} />
                    <th>Tutor</th>
                    <SortableTh label="Session" field="sessionTopic" sort={sort} dir={dir} onSort={toggle} />
                    <th>Title</th>
                    <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Questions" field="questionCount" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Attempts" field="attemptCount" sort={sort} dir={dir} onSort={toggle} />
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="whitespace-nowrap font-medium">{t.classCode}</span>
                        <div className="text-sm text-(--kt-muted)">{subjectDisplayLabel(t.subject)}</div>
                      </td>
                      <td>
                        <AnonymousIdText id={t.tutor.anonymousId} role="TUTOR" />
                      </td>
                      <td>{t.sessionTopic}</td>
                      <td className="max-w-[12rem] whitespace-normal">{t.title}</td>
                      <td>
                        <StatusText tone={STATUS_TONE[t.status]} label={statusDisplayLabel(t.status)} />
                      </td>
                      <td>{t.questionCount}</td>
                      <td>{t.attemptCount}</td>
                      <td className="text-right">
                        <button type="button" onClick={() => setOpenId(t.id)} className="btn btn-outline min-h-11 md:min-h-0">
                          Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sorted.length === 0 && <EmptyState>No session tests match these filters.</EmptyState>}
            </>
          )}

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </section>
    </div>
  );
}
