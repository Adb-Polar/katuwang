"use client";

import { useRef, useState } from "react";
import { FormValidationError, reportServerFieldErrors } from "@/lib/formValidation";
import ValidatedForm from "@/components/ui/ValidatedForm";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { Archive, ArchiveRestore, BadgeCheck, ChevronRight, CopyPlus, CornerUpLeft, Pencil, Trash2 } from "lucide-react";

import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useFetchList } from "@/hooks/useFetchList";
import CatalogLoadState from "@/components/ui/CatalogLoadState";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import { formatDateTime } from "@/lib/datetime";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import AdministrativeBankApproval from "@/components/admin/AdministrativeBankApproval";
import QualificationReviewModal from "@/components/admin/QualificationReviewModal";
import QuestionFormModal from "@/components/quiz/QuestionFormModal";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import LoadErrorState from "@/components/ui/LoadErrorState";
import Modal from "@/components/ui/Modal";
import ActionMenu from "@/components/ui/ActionMenu";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}
interface Question {
  id: string;
  subject: string;
  topic: string;
  prompt: string;
  explanation: string | null;
  active: boolean;
  reviewStatus?: "UNREVIEWED" | "DEMO" | "APPROVED";
  qualificationApprovalMethod?: "QUALIFIED_REVIEW" | "ADMIN_APPROVAL" | null;
  inUse: boolean;
  canDelete?: boolean;
  version?: number;
  previousVersionId?: string | null;
  hasNewerVersion?: boolean;
  options: Option[];
  createdAt: string;
}
interface CoverageRow {
  subject: string;
  topic: string;
  activeCount: number;
  config: { questionCount: number; passPercent: number; minBankSize: number };
  ready: boolean;
  openRequests: number;
}
interface QRequest {
  id: string;
  subject: string;
  topic: string;
  note: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  tutor: { id: string; anonymousId: string };
}
interface AttemptRow {
  certificationEligible?: boolean;
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  submittedAt: string | null;
  tutor: { id: string; anonymousId: string };
}
interface AttemptDetail {
  id: string;
  subject: string;
  topic: string;
  attemptNo: number;
  status: string;
  scorePercent?: number;
  correctCount?: number;
  questionCount: number;
  passPercent: number;
  submittedAt: string | null;
  tutor: { id: string; anonymousId: string };
  items: {
    position: number;
    questionId: string;
    prompt: string;
    options: { id: string; text: string; isCorrect?: boolean }[];
    selectedOptionId: string | null;
    isCorrect?: boolean | null;
    explanation?: string | null;
  }[];
}

function fmt(iso: string | null) {
  return iso ? formatDateTime(iso) : "—";
}

const ATTEMPT_TONE = {
  PASSED: { tone: "success", label: "Passed" },
  FAILED: { tone: "error", label: "Failed" },
  IN_PROGRESS: { tone: "warning", label: "In progress" },
} as const;

// ─── Root ───────────────────────────────────────────────────────────────────

type QBankTab = "questions" | "requests" | "results";

export default function QuestionBankManager({ only }: { only?: QBankTab } = {}) {
  const [tab, setTab] = useState<QBankTab>(only ?? "questions");
  const [selSubject, setSelSubject] = useState<string | null>(null);
  const [selTopic, setSelTopic] = useState<string | null>(null);
  const coverage = useFetchList<CoverageRow>(
    "/api/admin/assessment-questions/coverage",
    "Could not load topic coverage."
  );
  const openRequestTotal = coverage.data.reduce((n, c) => n + c.openRequests, 0);
  const active = only ?? tab;

  const crumbs =
    active === "questions" && selSubject
      ? [
          {
            label: "Subjects",
            onClick: () => {
              setSelSubject(null);
              setSelTopic(null);
            },
          },
          selTopic
            ? { label: selSubject, onClick: () => setSelTopic(null) }
            : { label: selSubject },
          ...(selTopic ? [{ label: selTopic }] : []),
        ]
      : null;

  return (
    <div className="space-y-4">
      {crumbs && <Breadcrumb items={crumbs} />}

      <section className="card kt-card">
        <div className="card-body gap-4">
          {!only && (
            <Tabs
              tabs={[
                { key: "questions", label: "Questions" },
                { key: "requests", label: "Requests", count: openRequestTotal },
                { key: "results", label: "Results" },
              ]}
              active={tab}
              onChange={(k) => setTab(k as QBankTab)}
            />
          )}

          {active === "questions" && (
            coverage.loading ? <LoadingRow /> : coverage.loadError ? (
              <LoadErrorState message={coverage.loadError} onRetry={coverage.refetch} />
            ) : <QuestionsTab
              coverage={coverage.data}
              refetchCoverage={coverage.refetch}
              selSubject={selSubject}
              setSelSubject={setSelSubject}
              selTopic={selTopic}
              setSelTopic={setSelTopic}
            />
          )}
          {active === "requests" && <RequestsTab onResolved={coverage.refetch} />}
          {active === "results" && <ResultsTab />}
        </div>
      </section>
    </div>
  );
}

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  // last crumb that has a handler = the immediate parent level
  const back = [...items].reverse().find((it) => it.onClick)?.onClick;

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl border border-base-200 bg-base-200/30 px-2 py-1.5">
      {back && (
        <button
          onClick={back}
          className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 gap-1 text-2xs font-semibold text-base-content/70 hover:text-primary"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
          Back
        </button>
      )}
      <span className="flex items-center gap-1 flex-wrap text-xs">
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-base-content/30" />}
            {it.onClick ? (
              <button
                onClick={it.onClick}
                className="rounded-md px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10 cursor-pointer transition-colors"
              >
                {it.label}
              </button>
            ) : (
              <span className="rounded-md bg-base-100 border border-base-200 px-1.5 py-0.5 font-semibold text-base-content/80">
                {it.label}
              </span>
            )}
          </span>
        ))}
      </span>
    </div>
  );
}

// ─── Questions tab ──────────────────────────────────────────────────────────

function QuestionsTab({
  coverage,
  refetchCoverage,
  selSubject,
  setSelSubject,
  selTopic,
  setSelTopic,
}: {
  coverage: CoverageRow[];
  refetchCoverage: () => void;
  selSubject: string | null;
  setSelSubject: (s: string | null) => void;
  selTopic: string | null;
  setSelTopic: (t: string | null) => void;
}) {
  const [success, setSuccess] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Question | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [versionTarget, setVersionTarget] = useState<Question | null>(null);
  const formTarget = versionTarget ?? editTarget;
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const SUBJECTS = [...new Set(coverage.map(row => row.subject))];
  const topicsFor = (subject: string) => coverage.filter(row => row.subject === subject).map(row => row.topic);
  const subject: string = selSubject ?? SUBJECTS[0] ?? "";
  const topic: string = selTopic ?? topicsFor(subject)[0] ?? "";

  const cov = coverage.find(c => c.subject === subject && c.topic === topic);

  const {
    data: questions,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    loadError,
    setError,
    refetch,
  } = usePaginatedList<Question>(
    "/api/admin/assessment-questions",
    "questions",
    { subject, topic },
    PAGE_SIZE,
    "Could not load questions.",
    "qbank"
  );

  const afterWrite = (msg: string) => {
    setSuccess(msg);
    setShowAdd(false);
    setEditTarget(null);
    setReviewTarget(null);
    setVersionTarget(null);
    setDeleteTarget(null);
    refetch();
    refetchCoverage();
    setTimeout(() => setSuccess(""), 4000);
  };

  const toggleActive = async (q: Question) => {
    setBusyId(q.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/assessment-questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !q.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new FormValidationError(data, "Failed to update question.");
      afterWrite(`Question ${q.active ? "retired" : "reactivated"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update question.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (q: Question) => {
    setBusyId(q.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/assessment-questions/${q.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new FormValidationError(data, "Failed to delete question.");
      afterWrite("Question deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question.");
    } finally {
      setBusyId(null);
    }
  };

  // ─── Level 1: subject picker ──────────────────────────────────────────────
  if (!selSubject) {
    return (
      <div className="space-y-4">
        <FeedbackBanner variant="success" message={success || null} />
        <AdministrativeBankApproval onApproved={count => afterWrite(`${count} questions approved for assessments.`)} />
        <p className="text-2xs text-base-content/50">
          Pick a subject to drill into its topics and questions.
        </p>
        <div className="border border-base-200 rounded-xl divide-y divide-base-200">
          {SUBJECTS.map((s) => {
            const rows = coverage.filter((c) => c.subject === s);
            const totalTopics = topicsFor(s).length;
            const ready = rows.filter((r) => r.ready).length;
            const activeQ = rows.reduce((n, r) => n + r.activeCount, 0);
            const openReq = rows.reduce((n, r) => n + r.openRequests, 0);
            return (
              <button
                key={s}
                onClick={() => setSelSubject(s)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-base-200/40 transition-colors cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-base-content/90">{s}</span>
                  <span className="block text-2xs text-base-content/50">
                    {totalTopics} topics · {activeQ} approved assessment question{activeQ === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {openReq > 0 && (
                    <StatusBadge
                      tone="info"
                      label={`${openReq} req`}
                      size="xs"
                    />
                  )}
                  <StatusBadge
                    tone={ready === totalTopics ? "success" : "warning"}
                    label={`${ready}/${totalTopics} ready`}
                    size="xs"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Level 2: topic picker for the chosen subject ─────────────────────────
  if (!selTopic) {
    return (
      <div className="space-y-4">
        <FeedbackBanner variant="success" message={success || null} />
        <div className="border border-base-200 rounded-xl divide-y divide-base-200">
          {topicsFor(selSubject).map((t) => {
            const row = coverage.find((c) => c.subject === selSubject && c.topic === t);
            const active = row?.activeCount ?? 0;
            const min = row?.config.minBankSize ?? 5;
            const isReady = row?.ready ?? false;
            return (
              <button
                key={t}
                onClick={() => setSelTopic(t)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-base-200/40 transition-colors cursor-pointer"
              >
                <span className="text-sm text-base-content/80">{t}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {row && row.openRequests > 0 && (
                    <StatusBadge tone="info" label={`${row.openRequests} req`} size="xs" />
                  )}
                  <StatusBadge
                    tone={isReady ? "success" : "warning"}
                    label={isReady ? `Ready · ${active}` : `${active} / ${min}`}
                    size="xs"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Level 3: questions for subject + topic ───────────────────────────────
  return (
    <div className="space-y-4">
      <FeedbackBanner variant="info" message="Questions need documented administrator approval or qualified topic review for tutor assessments. Approval provenance is shown separately. Demo and unapproved content is for practice; corrected versions need new approval." />
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={editTarget || showAdd || deleteTarget || loadError ? null : error || null} />

      {cov && (
        <CoveragePanel row={cov} />
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            setError("");
            setShowAdd(true);
          }}
          className="btn btn-primary btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
        >
          Add question
        </button>
      </div>

      {loading ? (
        <LoadingRow />
      ) : loadError ? (
        <LoadErrorState message={loadError} onRetry={refetch} />
      ) : (
        <div className="border border-base-200 rounded-xl">
          <table role="table" aria-label={`Questions for ${topic}`} className="table table-sm block w-full xl:table xl:table-fixed">
            <thead role="rowgroup" className="hidden xl:table-header-group">
              <tr role="row" className="text-xs">
                <th role="columnheader" scope="col" className="w-[44%]">Prompt</th>
                <th role="columnheader" scope="col" className="w-[28%]">Answer</th>
                <th role="columnheader" scope="col">Status</th>
                <th role="columnheader" scope="col" className="w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="block xl:table-row-group">
              {questions.map((q) => {
                const correct = q.options.find((o) => o.isCorrect);
                return (
                  <tr role="row" key={q.id} className="grid grid-cols-1 text-sm sm:grid-cols-2 xl:table-row">
                    <td role="cell" className="block min-w-0 whitespace-normal align-top text-base-content/80 [overflow-wrap:anywhere] sm:col-span-2 xl:table-cell">
                      <span className="mb-1 block text-2xs font-semibold text-base-content/50 xl:hidden">Prompt</span>
                      {q.prompt}
                      <div className="text-2xs text-base-content/40 mt-0.5">
                        v{q.version ?? 1} · {q.options.length} options · added {fmt(q.createdAt)}
                      </div>
                    </td>
                    <td role="cell" className="block min-w-0 whitespace-normal align-top text-2xs text-base-content/60 [overflow-wrap:anywhere] xl:table-cell">
                      <span className="mb-1 block font-semibold text-base-content/50 xl:hidden">Answer</span>
                      {correct?.text || <span className="italic text-error/60">none marked</span>}
                    </td>
                    <td role="cell" className="block min-w-0 whitespace-normal align-top xl:table-cell">
                      <span className="mb-1 block text-2xs font-semibold text-base-content/50 xl:hidden">Status</span>
                      <div className="flex flex-col items-start gap-1.5 [&>.kt-badge]:max-w-full [&>.kt-badge]:whitespace-normal [&>.kt-badge]:leading-relaxed [&>.kt-badge]:[overflow-wrap:anywhere]">
                        <StatusBadge
                          tone={q.active ? "success" : "neutral"}
                          label={q.active ? "Active" : "Retired"}
                          size="xs"
                        />
                        <StatusBadge tone={q.reviewStatus === "APPROVED" ? "success" : "warning"} label={q.reviewStatus === "APPROVED" ? (q.qualificationApprovalMethod === "ADMIN_APPROVAL" ? "Admin approved for assessments" : "Qualified review approved") : q.reviewStatus === "DEMO" ? "Demo — practice only" : "Unreviewed — practice only"} size="xs" />
                        {q.inUse && (
                          <span className="text-2xs text-base-content/40">in use</span>
                        )}
                      </div>
                    </td>
                    <td role="cell" className="block min-w-0 whitespace-normal align-top sm:col-span-2 xl:table-cell">
                      <span className="mb-1 block text-2xs font-semibold text-base-content/50 xl:hidden">Actions</span>
                      <div className="flex xl:justify-end">
                        <ActionMenu
                          label="Question actions"
                          disabled={busyId === q.id}
                          actions={[
                            {
                              label: "Edit",
                              icon: <Pencil className="h-4 w-4" />,
                              onSelect: () => { setError(""); setEditTarget(q); },
                              disabled: q.inUse || busyId === q.id,
                              title: q.inUse ? "Content is locked — create a corrected version" : undefined,
                            },
                            {
                              label: q.reviewStatus === "APPROVED" ? "Revoke assessment approval" : "Record qualified review",
                              icon: <BadgeCheck className="h-4 w-4" />,
                              onSelect: () => setReviewTarget(q),
                              disabled: q.reviewStatus !== "APPROVED" && (!q.active || q.hasNewerVersion || q.reviewStatus === "DEMO"),
                            },
                            {
                              label: "Create corrected version",
                              icon: <CopyPlus className="h-4 w-4" />,
                              onSelect: () => { setError(""); setEditTarget(null); setVersionTarget(q); },
                              disabled: q.hasNewerVersion || busyId === q.id,
                              title: q.hasNewerVersion ? "Open the latest version to make another correction" : undefined,
                            },
                            {
                              label: q.active ? "Retire" : "Reactivate",
                              icon: q.active ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />,
                              onSelect: () => toggleActive(q),
                              disabled: busyId === q.id,
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-4 w-4" />,
                              onSelect: () => { setError(""); setDeleteTarget(q); },
                              disabled: q.canDelete === false || q.inUse || busyId === q.id,
                              title: q.canDelete === false || q.inUse ? "History is retained — retire instead" : undefined,
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {questions.length === 0 && (
            <EmptyState>No questions for this topic yet.</EmptyState>
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

      {reviewTarget && <QualificationReviewModal key={reviewTarget.id} question={reviewTarget} revoke={reviewTarget.reviewStatus === "APPROVED"} onClose={() => setReviewTarget(null)} onSaved={() => afterWrite("Assessment approval updated.")} />}

      {(showAdd || editTarget || versionTarget) && (
        <QuestionFormModal
          title={versionTarget ? "Create corrected version" : editTarget ? "Edit question" : "Add question"}
          requireReason={Boolean(versionTarget)}
          contextLabel={`${subject} · ${topic}`}
          submitLabel={versionTarget ? "Create version" : editTarget ? "Save changes" : "Add question"}
          initial={
            formTarget
              ? {
                  prompt: formTarget.prompt,
                  explanation: formTarget.explanation ?? undefined,
                  options: formTarget.options.map((o) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
                }
              : null
          }
          onClose={() => {
            setShowAdd(false);
            setEditTarget(null);
            setVersionTarget(null);
          }}
          onSubmit={async (draft) => {
            const isEdit = editTarget !== null;
            const res = await fetch(
              versionTarget
                ? `/api/admin/assessment-questions/${versionTarget.id}/versions`
                : isEdit
                ? `/api/admin/assessment-questions/${editTarget!.id}`
                : "/api/admin/assessment-questions",
              {
                method: isEdit && !versionTarget ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? draft : { ...draft, subject, topic }),
              }
            );
            const data = await res.json();
            if (!res.ok) throw new FormValidationError(data, "Failed to save question.");
            afterWrite(versionTarget ? "Corrected version created. The prior version is retired." : isEdit ? "Question updated." : "Question added.");
          }}
        />
      )}

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete this question?">
        {deleteTarget && <div className="space-y-3">
            <p className="text-xs text-base-content/60">This cannot be undone.</p>
            <p className="text-2xs text-base-content/50 border border-base-200 rounded-lg p-2">
              {deleteTarget.prompt}
            </p>
            <div className="modal-action pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button"
                className="btn btn-error btn-sm"
                disabled={busyId === deleteTarget.id}
                onClick={() => remove(deleteTarget)}
              >
                {busyId === deleteTarget.id && <span className="loading loading-spinner loading-xs" />}
                Delete
              </button>
            </div>
        </div>}
      </Modal>
    </div>
  );
}

// ─── Coverage readiness strip ──────────────────────────────────────────────
// Assessment tuning is platform-wide now (Settings → Assessment); this panel is
// read-only and just shows how this topic's bank measures up.

function CoveragePanel({ row }: { row: CoverageRow }) {
  return (
    <div className="border border-base-200 bg-base-200/20 rounded-xl p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-semibold text-base-content/80">
          {row.activeCount} approved assessment question{row.activeCount === 1 ? "" : "s"}
        </span>
        {row.ready ? (
          <StatusBadge tone="success" label={`Ready · needs ≥ ${row.config.minBankSize}`} size="xs" />
        ) : (
          <StatusBadge
            tone="warning"
            label={`${row.activeCount} / ${row.config.minBankSize} — not assessable yet`}
            size="xs"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap text-2xs text-base-content/50">
        <span>
          Platform assessment settings: {row.config.questionCount} questions / attempt ·{" "}
          {row.config.passPercent}% to pass · min bank {row.config.minBankSize}
        </span>
        <Link href="/admin/settings" className="text-primary hover:underline font-medium">
          Change in Settings → Assessment
        </Link>
      </div>
    </div>
  );
}

// ─── Requests tab ───────────────────────────────────────────────────────────

function RequestsTab({ onResolved }: { onResolved: () => void }) {
  const [status, setStatus] = useState<"OPEN" | "RESOLVED" | "DISMISSED">("OPEN");
  const [success, setSuccess] = useState("");
  const [target, setTarget] = useState<{ req: QRequest; decision: "RESOLVED" | "DISMISSED" } | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    data: requests,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    loadError,
    setError,
    refetch,
  } = usePaginatedList<QRequest>(
    "/api/admin/question-requests",
    "requests",
    { status },
    PAGE_SIZE,
    "Could not load question requests.",
    "qreq"
  );

  const resolve = async (validationForm: HTMLFormElement) => {
    if (!target) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/question-requests/${target.req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target.decision, ...(note.trim() ? { resolutionNote: note.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new FormValidationError(data, "Failed to update request.");
      setSuccess(`Request ${target.decision === "RESOLVED" ? "resolved" : "dismissed"}.`);
      setTarget(null);
      setNote("");
      refetch();
      onResolved();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={target || loadError ? null : error || null} />

      <Tabs
        tabs={[
          { key: "OPEN", label: "Open" },
          { key: "RESOLVED", label: "Resolved" },
          { key: "DISMISSED", label: "Dismissed" },
        ]}
        active={status}
        onChange={(k) => setStatus(k as typeof status)}
      />

      {loading ? (
        <LoadingRow />
      ) : loadError ? (
        <LoadErrorState message={loadError} onRetry={refetch} />
      ) : (
        <div className="overflow-x-auto border border-base-200 rounded-xl">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs">
                <th>Tutor</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>Note</th>
                <th>{status === "OPEN" ? "Requested" : "Resolved"}</th>
                {status === "OPEN" && <th></th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="text-sm align-top">
                  <td>
                    <AnonymousIdBadge id={r.tutor.anonymousId} role="TUTOR" />
                  </td>
                  <td className="text-base-content/70">{subjectDisplayLabel(r.subject)}</td>
                  <td className="text-base-content/70">{r.topic}</td>
                  <td className="text-2xs text-base-content/60 max-w-xs whitespace-normal">
                    {r.note || <span className="text-base-content/30 italic">No note</span>}
                    {r.resolutionNote && (
                      <div className="text-2xs text-base-content/40 mt-1">↳ {r.resolutionNote}</div>
                    )}
                  </td>
                  <td className="text-2xs text-base-content/50">
                    {fmt(status === "OPEN" ? r.createdAt : r.resolvedAt)}
                  </td>
                  {status === "OPEN" && (
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setError("");
                            setNote("");
                            setTarget({ req: r, decision: "RESOLVED" });
                          }}
                          className="btn btn-outline btn-success btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => {
                            setError("");
                            setNote("");
                            setTarget({ req: r, decision: "DISMISSED" });
                          }}
                          className="btn btn-outline btn-error btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <EmptyState>No {status.toLowerCase()} requests.</EmptyState>
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

      <Modal
        open={target !== null}
        onClose={() => { if (!saving) setTarget(null); }}
        title={target?.decision === "RESOLVED" ? "Resolve this request?" : "Dismiss this request?"}
      >
        {target && <ValidatedForm className="space-y-3" onSubmit={(e) => { e.preventDefault(); void resolve(e.currentTarget); }}>
            <p className="text-xs text-base-content/60">
              {subjectDisplayLabel(target.req.subject)} · {target.req.topic} — from {target.req.tutor.anonymousId}
            </p>
            <FeedbackBanner variant="error" message={error || null} />
            <FormField label="Note for the tutor" hint="Optional">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
              />
            </FormField>
            <div className="modal-action pt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(null)} disabled={saving}>
                Cancel
              </button>
              <button type="submit"
                className={`btn btn-sm ${target.decision === "RESOLVED" ? "btn-success" : "btn-error"}`}
                disabled={saving}
              >
                {saving && <span className="loading loading-spinner loading-xs" />}
                {target.decision === "RESOLVED" ? "Resolve" : "Dismiss"}
              </button>
            </div>
        </ValidatedForm>}
      </Modal>
    </div>
  );
}

// ─── Results tab ────────────────────────────────────────────────────────────

function ResultsTab() {
  const { subjects, loading: catalogLoading, error: catalogLoadError, retry: retryCatalog } = useSubjectCatalog();
  const SUBJECTS = subjects.map(subject => subject.slug);
  const [subject, setSubject] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequest = useRef(0);

  const {
    data: attempts,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    loadError,
    refetch,
  } = usePaginatedList<AttemptRow>(
    "/api/admin/assessment-attempts",
    "attempts",
    {
      ...(subject ? { subject } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
    },
    PAGE_SIZE,
    "Could not load attempts.",
    "qres"
  );

  const openDetail = async (id: string) => {
    const request = ++detailRequest.current;
    setDetailId(id);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/assessment-attempts/${id}`);
      if (!res.ok) throw new Error("Could not retrieve assessment details.");
      const data = await res.json();
      if (request === detailRequest.current) setDetail(data);
    } catch (err) {
      if (request === detailRequest.current) setDetailError(err instanceof Error ? err.message : "Could not retrieve assessment details.");
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailRequest.current += 1;
    setDetailId(null);
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <CatalogLoadState loading={catalogLoading} error={catalogLoadError} retry={retryCatalog} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          aria-label="Search assessment results by tutor ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tutor ID..."
          className="input input-bordered input-sm text-xs focus:input-primary"
        />
        <select
          aria-label="Filter assessment results by subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="select select-bordered select-sm min-h-11 md:min-h-0 text-xs focus:select-primary"
        >
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {subjectDisplayLabel(s)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter assessment results by outcome"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered select-sm min-h-11 md:min-h-0 text-xs focus:select-primary"
        >
          <option value="">All outcomes</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="IN_PROGRESS">In progress</option>
        </select>
      </div>

      {loading ? (
        <LoadingRow />
      ) : loadError ? (
        <LoadErrorState message={loadError} onRetry={refetch} />
      ) : (
        <div className="overflow-x-auto border border-base-200 rounded-xl">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs">
                <th>Tutor</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>Attempt</th>
                <th>Score</th>
                <th>Outcome</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="text-sm">
                  <td>
                    <AnonymousIdBadge id={a.tutor.anonymousId} role="TUTOR" />
                  </td>
                  <td className="text-base-content/70">{subjectDisplayLabel(a.subject)}</td>
                  <td className="text-base-content/70">{a.topic}</td>
                  <td className="text-base-content/60">#{a.attemptNo}</td>
                  <td className="text-base-content/60">
                    {a.status === "IN_PROGRESS" ? "—" : `${a.scorePercent}% (${a.correctCount}/${a.questionCount})`}
                  </td>
                  <td>
                    <StatusBadge
                      tone={a.certificationEligible === false ? "neutral" : ATTEMPT_TONE[a.status].tone}
                      label={a.certificationEligible === false ? "Practice — not for certification" : ATTEMPT_TONE[a.status].label}
                      size="xs"
                    />
                  </td>
                  <td className="text-2xs text-base-content/50">{fmt(a.submittedAt)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => openDetail(a.id)}
                      className="btn btn-outline btn-xs min-h-11 sm:min-h-0 text-2xs font-bold cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <EmptyState>No attempts match these filters.</EmptyState>
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

      <Modal
        open={detailId !== null}
        onClose={closeDetail}
        title={detail ? `${subjectDisplayLabel(detail.subject)} · ${detail.topic}` : "Assessment attempt details"}
        size="lg"
      >
          {detailLoading ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : detailError ? (
              <LoadErrorState message={detailError} onRetry={() => detailId && openDetail(detailId)} />
            ) : detail ? (
              <>
                    <p className="text-2xs text-base-content/50 mb-4">
                      {detail.tutor.anonymousId} · attempt #{detail.attemptNo} ·{" "}
                      {detail.status === "IN_PROGRESS"
                        ? "in progress"
                        : `${detail.scorePercent}% (pass ≥ ${detail.passPercent}%)`}
                    </p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {detail.items.map((item) => (
                    <div key={item.questionId} className="border border-base-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-2xs text-base-content/40 shrink-0">Q{item.position + 1}</span>
                        <p className="text-xs font-semibold text-base-content/80">{item.prompt}</p>
                        {item.isCorrect != null && (
                          <span className={`text-2xs shrink-0 ${item.isCorrect ? "text-success" : "text-error"}`}>
                            {item.isCorrect ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {item.options.map((o) => {
                          const chosen = o.id === item.selectedOptionId;
                          return (
                            <li
                              key={o.id}
                              className={`text-2xs rounded-lg px-2 py-1 border ${
                                o.isCorrect
                                  ? "border-success/30 bg-success/5 text-success"
                                  : chosen
                                  ? "border-error/30 bg-error/5 text-error"
                                  : "border-base-200 text-base-content/60"
                              }`}
                            >
                              {o.text}
                              {o.isCorrect && " · correct"}
                              {chosen && " · tutor's pick"}
                            </li>
                          );
                        })}
                      </ul>
                      {item.explanation && (
                        <p className="text-2xs text-base-content/50 italic">{item.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="modal-action pt-1">
                  <button className="btn btn-ghost btn-sm" onClick={closeDetail}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
      </Modal>
    </div>
  );
}
