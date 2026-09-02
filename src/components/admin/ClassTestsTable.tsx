"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ClassTestResults from "@/components/tutor/ClassTestResults";

const PAGE_SIZE = 10;
const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];

interface Row {
  id: string;
  kind: "PRE" | "POST";
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  classCode: string;
  subject: SubjectArea;
  tutor: { id: string; anonymousId: string };
  questionCount: number;
  attemptCount: number;
}

const KIND_LABEL = { PRE: "Pre", POST: "Post" } as const;
const STATUS_TONE = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CLOSED: "warning",
} as const;

export default function ClassTestsTable() {
  const [subject, setSubject] = useState<SubjectArea | "">("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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
    "/api/admin/class-tests",
    "tests",
    {
      ...(subject ? { subject } : {}),
      ...(kind ? { kind } : {}),
      ...(status ? { status } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
    },
    PAGE_SIZE,
    "Could not load class tests.",
    "ctests"
  );

  if (openId) {
    return (
      <ClassTestResults
        resultsUrl={`/api/admin/class-tests/${openId}/results`}
        attemptUrl={(attemptId) => `/api/admin/class-tests/${openId}/attempts/${attemptId}`}
        backHref="/admin/class-tests"
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title / class / tutor..."
              className="input input-bordered input-sm text-xs focus:input-primary"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectArea | "")}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="select select-bordered select-sm text-xs focus:select-primary"
            >
              <option value="">Pre &amp; Post</option>
              <option value="PRE">Pre-test</option>
              <option value="POST">Post-test</option>
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
                    <th>Class</th>
                    <th>Tutor</th>
                    <th>Kind</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th>Attempts</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id} className="text-sm">
                      <td className="text-base-content/70">
                        <span className="font-mono text-2xs">{t.classCode}</span>
                        <div className="text-2xs text-base-content/40">{t.subject}</div>
                      </td>
                      <td>
                        <AnonymousIdBadge id={t.tutor.anonymousId} role="TUTOR" />
                      </td>
                      <td className="text-base-content/60">{KIND_LABEL[t.kind]}</td>
                      <td className="text-base-content/70 max-w-[12rem] whitespace-normal">{t.title}</td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[t.status]} label={t.status.toLowerCase()} size="xs" />
                      </td>
                      <td className="text-base-content/60">{t.questionCount}</td>
                      <td className="text-base-content/60">{t.attemptCount}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setOpenId(t.id)}
                          className="btn btn-outline btn-xs text-2xs font-bold"
                        >
                          Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tests.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-sm">
                  No class tests match these filters.
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
