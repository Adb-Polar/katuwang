"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, CornerUpLeft } from "lucide-react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useFetchList } from "@/hooks/useFetchList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";

const PAGE_SIZE = 10;
const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}
interface Question {
  id: string;
  subject: SubjectArea;
  topic: string;
  prompt: string;
  explanation: string | null;
  active: boolean;
  inUse: boolean;
  options: Option[];
  createdAt: string;
}
interface CoverageRow {
  subject: SubjectArea;
  topic: string;
  activeCount: number;
  config: { questionCount: number; passPercent: number; minBankSize: number };
  ready: boolean;
  openRequests: number;
}
interface QRequest {
  id: string;
  subject: SubjectArea;
  topic: string;
  note: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  tutor: { id: string; anonymousId: string };
}
interface AttemptRow {
  id: string;
  subject: SubjectArea;
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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [selSubject, setSelSubject] = useState<SubjectArea | null>(null);
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
            <QuestionsTab
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
          className="btn btn-ghost btn-xs gap-1 text-2xs font-semibold text-base-content/70 hover:text-primary"
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
  selSubject: SubjectArea | null;
  setSelSubject: (s: SubjectArea | null) => void;
  selTopic: string | null;
  setSelTopic: (t: string | null) => void;
}) {
  const [success, setSuccess] = useState("");
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const subject: SubjectArea = selSubject ?? SUBJECTS[0];
  const topic: string = selTopic ?? SUBJECT_TOPICS[subject][0];

  const cov = useMemo(
    () => coverage.find((c) => c.subject === subject && c.topic === topic),
    [coverage, subject, topic]
  );

  const {
    data: questions,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
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
      if (!res.ok) throw new Error(data.error || "Failed to update question.");
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
      if (!res.ok) throw new Error(data.error || "Failed to delete question.");
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
        <p className="text-2xs text-base-content/50">
          Pick a subject to drill into its topics and questions.
        </p>
        <div className="border border-base-200 rounded-xl divide-y divide-base-200">
          {SUBJECTS.map((s) => {
            const rows = coverage.filter((c) => c.subject === s);
            const totalTopics = SUBJECT_TOPICS[s].length;
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
                    {totalTopics} topics · {activeQ} active question{activeQ === 1 ? "" : "s"}
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
          {SUBJECT_TOPICS[selSubject].map((t) => {
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
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={editTarget || showAdd || deleteTarget ? null : error || null} />

      {cov && (
        <CoveragePanel row={cov} />
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            setError("");
            setShowAdd(true);
          }}
          className="btn btn-primary btn-xs text-2xs font-bold cursor-pointer"
        >
          Add question
        </button>
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
                <th>Prompt</th>
                <th>Answer</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => {
                const correct = q.options.find((o) => o.isCorrect);
                return (
                  <tr key={q.id} className="text-sm align-top">
                    <td className="max-w-sm whitespace-normal text-base-content/80">
                      {q.prompt}
                      <div className="text-2xs text-base-content/40 mt-0.5">
                        {q.options.length} options · added {fmt(q.createdAt)}
                      </div>
                    </td>
                    <td className="text-2xs text-base-content/60 max-w-[12rem] whitespace-normal">
                      {correct?.text || <span className="italic text-error/60">none marked</span>}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <StatusBadge
                          tone={q.active ? "success" : "neutral"}
                          label={q.active ? "Active" : "Retired"}
                          size="xs"
                        />
                        {q.inUse && (
                          <span className="text-2xs text-base-content/40">in use</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setError("");
                            setEditTarget(q);
                          }}
                          disabled={q.inUse || busyId === q.id}
                          title={q.inUse ? "In use — retire and recreate to change" : undefined}
                          className="btn btn-outline btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(q)}
                          disabled={busyId === q.id}
                          className="btn btn-outline btn-xs text-2xs font-bold cursor-pointer"
                        >
                          {q.active ? "Retire" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => {
                            setError("");
                            setDeleteTarget(q);
                          }}
                          disabled={q.inUse || busyId === q.id}
                          title={q.inUse ? "In use — retire instead" : undefined}
                          className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {questions.length === 0 && (
            <div className="text-center py-8 text-base-content/40 italic text-sm">
              No questions for this topic yet.
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

      {(showAdd || editTarget) && (
        <QuestionFormModal
          subject={subject}
          topic={topic}
          question={editTarget}
          onClose={() => {
            setShowAdd(false);
            setEditTarget(null);
          }}
          onSaved={afterWrite}
        />
      )}

      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 kt-card space-y-3">
            <h3 className="font-bold text-sm text-base-content">Delete this question?</h3>
            <p className="text-xs text-base-content/60">This cannot be undone.</p>
            <p className="text-2xs text-base-content/50 border border-base-200 rounded-lg p-2">
              {deleteTarget.prompt}
            </p>
            <div className="modal-action pt-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                disabled={busyId === deleteTarget.id}
                onClick={() => remove(deleteTarget)}
              >
                {busyId === deleteTarget.id && <span className="loading loading-spinner loading-xs" />}
                Delete
              </button>
            </div>
          </div>
          <label className="modal-backdrop" onClick={() => setDeleteTarget(null)} aria-label="Close" />
        </div>
      )}
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
          {row.activeCount} active question{row.activeCount === 1 ? "" : "s"}
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

// ─── Add / edit question modal ──────────────────────────────────────────────

interface DraftOption {
  text: string;
  isCorrect: boolean;
}

function QuestionFormModal({
  subject,
  topic,
  question,
  onClose,
  onSaved,
}: {
  subject: SubjectArea;
  topic: string;
  question: Question | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const isEdit = question !== null;
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [options, setOptions] = useState<DraftOption[]>(
    question
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setCorrect = (idx: number) =>
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  const setText = (idx: number, text: string) =>
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  const addOption = () =>
    setOptions((prev) => (prev.length >= OPTION_COUNT_MAX ? prev : [...prev, { text: "", isCorrect: false }]));
  const removeOption = (idx: number) =>
    setOptions((prev) => {
      if (prev.length <= OPTION_COUNT_MIN) return prev;
      const next = prev.filter((_, i) => i !== idx);
      if (!next.some((o) => o.isCorrect)) next[0].isCorrect = true;
      return next;
    });

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        prompt,
        explanation: explanation.trim() || undefined,
        options: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        ...(isEdit ? {} : { subject, topic }),
      };
      const res = await fetch(
        isEdit ? `/api/admin/assessment-questions/${question!.id}` : "/api/admin/assessment-questions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save question.");
      onSaved(isEdit ? "Question updated." : "Question added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg p-6 kt-card space-y-4">
        <div>
          <h3 className="font-bold text-sm text-base-content">
            {isEdit ? "Edit question" : "Add question"}
          </h3>
          <p className="text-2xs text-base-content/50 mt-0.5">
            {subject} · {topic}
          </p>
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        <FormField label="Question prompt" required>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            maxLength={1000}
            className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
          />
        </FormField>

        <FormField label="Options" hint="Select the one correct answer">
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  className="radio radio-xs radio-primary"
                  checked={o.isCorrect}
                  onChange={() => setCorrect(i)}
                />
                <input
                  type="text"
                  value={o.text}
                  onChange={(e) => setText(i, e.target.value)}
                  maxLength={500}
                  placeholder={`Option ${i + 1}`}
                  className="input input-bordered input-xs text-xs flex-1 focus:input-primary"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= OPTION_COUNT_MIN}
                  className="btn btn-ghost btn-xs text-2xs"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              </div>
            ))}
            {options.length < OPTION_COUNT_MAX && (
              <button type="button" onClick={addOption} className="btn btn-ghost btn-xs text-2xs">
                + Add option
              </button>
            )}
          </div>
        </FormField>

        <FormField label="Explanation" hint="Shown to the tutor after grading (optional)">
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            maxLength={1000}
            className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
          />
        </FormField>

        <div className="modal-action pt-1">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
            {saving && <span className="loading loading-spinner loading-xs" />}
            {isEdit ? "Save changes" : "Add question"}
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
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

  const resolve = async () => {
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
      if (!res.ok) throw new Error(data.error || "Failed to update request.");
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
      <FeedbackBanner variant="error" message={target ? null : error || null} />

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
        <div className="flex justify-center items-center py-10">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
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
                  <td className="text-base-content/70">{r.subject}</td>
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
                          className="btn btn-outline btn-success btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => {
                            setError("");
                            setNote("");
                            setTarget({ req: r, decision: "DISMISSED" });
                          }}
                          className="btn btn-outline btn-error btn-xs text-2xs font-bold cursor-pointer"
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
            <div className="text-center py-8 text-base-content/40 italic text-sm">
              No {status.toLowerCase()} requests.
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

      {target && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 kt-card space-y-3">
            <h3 className="font-bold text-sm text-base-content">
              {target.decision === "RESOLVED" ? "Resolve" : "Dismiss"} this request?
            </h3>
            <p className="text-xs text-base-content/60">
              {target.req.subject} · {target.req.topic} — from {target.req.tutor.anonymousId}
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
              <button className="btn btn-ghost btn-sm" onClick={() => setTarget(null)} disabled={saving}>
                Cancel
              </button>
              <button
                className={`btn btn-sm ${target.decision === "RESOLVED" ? "btn-success" : "btn-error"}`}
                onClick={resolve}
                disabled={saving}
              >
                {saving && <span className="loading loading-spinner loading-xs" />}
                {target.decision === "RESOLVED" ? "Resolve" : "Dismiss"}
              </button>
            </div>
          </div>
          <label className="modal-backdrop" onClick={() => setTarget(null)} aria-label="Close" />
        </div>
      )}
    </div>
  );
}

// ─── Results tab ────────────────────────────────────────────────────────────

function ResultsTab() {
  const [subject, setSubject] = useState<SubjectArea | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const {
    data: attempts,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
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
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/assessment-attempts/${id}`);
      const data = await res.json();
      if (res.ok) setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tutor ID..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered select-sm text-xs focus:select-primary"
        >
          <option value="">All outcomes</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
          <option value="IN_PROGRESS">In progress</option>
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
                  <td className="text-base-content/70">{a.subject}</td>
                  <td className="text-base-content/70">{a.topic}</td>
                  <td className="text-base-content/60">#{a.attemptNo}</td>
                  <td className="text-base-content/60">
                    {a.status === "IN_PROGRESS" ? "—" : `${a.scorePercent}% (${a.correctCount}/${a.questionCount})`}
                  </td>
                  <td>
                    <StatusBadge
                      tone={ATTEMPT_TONE[a.status].tone}
                      label={ATTEMPT_TONE[a.status].label}
                      size="xs"
                    />
                  </td>
                  <td className="text-2xs text-base-content/50">{fmt(a.submittedAt)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => openDetail(a.id)}
                      className="btn btn-outline btn-xs text-2xs font-bold cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <div className="text-center py-8 text-base-content/40 italic text-sm">
              No attempts match these filters.
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

      {(detail || detailLoading) && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl p-6 kt-card space-y-4">
            {detailLoading || !detail ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-base-content">
                      {detail.subject} · {detail.topic}
                    </h3>
                    <p className="text-2xs text-base-content/50 mt-0.5">
                      {detail.tutor.anonymousId} · attempt #{detail.attemptNo} ·{" "}
                      {detail.status === "IN_PROGRESS"
                        ? "in progress"
                        : `${detail.scorePercent}% (pass ≥ ${detail.passPercent}%)`}
                    </p>
                  </div>
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setDetail(null)}>
                    ✕
                  </button>
                </div>

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
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
          <label className="modal-backdrop" onClick={() => setDetail(null)} aria-label="Close" />
        </div>
      )}
    </div>
  );
}
