"use client";

import { FormValidationError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import BackLink from "@/components/ui/BackLink";
import PageHeader from "@/components/ui/PageHeader";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { displayPrompt } from "@/lib/questionText";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import QuestionFormModal from "@/components/quiz/QuestionFormModal";

interface BuilderQuestion {
  questionId: string;
  prompt: string;
  origin: string;
  topic: string;
}

export interface SessionTestBuilderProps {
  classId: string;
  sessionId: string;
  classSubject: string;
  classTopics: string[];
  sessionTopic: string;
  sessionStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  /** null when no test has been created for this session yet. */
  test: {
    id: string;
    title: string;
    instructions: string | null;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    pretestClosedAt: string | null;
    posttestOpenedAt: string | null;
    questions: { questionId: string; prompt: string; origin: string; topic: string }[];
  } | null;
  attemptCount: number;
}

export default function SessionTestBuilder({
  classId,
  sessionId,
  classSubject,
  classTopics,
  sessionTopic,
  sessionStatus,
  test: initialTest,
  attemptCount,
}: SessionTestBuilderProps) {
  const router = useRouter();

  // ── No test yet: a small create form ──
  if (!initialTest) {
    return (
      <CreateTestPanel
        classId={classId}
        sessionId={sessionId}
        sessionTopic={sessionTopic}
        classSubject={classSubject}
        onCreated={() => router.refresh()}
      />
    );
  }

  return (
    <BuilderBody
      classId={classId}
      sessionId={sessionId}
      classSubject={classSubject}
      classTopics={classTopics}
      sessionTopic={sessionTopic}
      test={initialTest}
      sessionStatus={sessionStatus}
      attemptCount={attemptCount}
    />
  );
}

function CreateTestPanel({
  classId,
  sessionId,
  sessionTopic,
  classSubject,
  onCreated,
}: {
  classId: string;
  sessionId: string;
  sessionTopic: string;
  classSubject: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState(`${sessionTopic} check-in`);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (validationForm: HTMLFormElement) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new FormValidationError(data, "Failed to create test.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <TestPageHeader classId={classId} sessionTopic={sessionTopic} classSubject={classSubject} status="No test yet" />
      <section className="card kt-card" aria-labelledby="create-test">
        <div className="kt-card-body gap-5">
          <div>
            <h2 id="create-test" className={sectionTitle}>Create the test</h2>
            <p className="text-sm text-(--kt-muted)">
              Learners answer the same questions before the session (the pre-test) and again after it, when you post
              the post-test, so you can see what they learned.
            </p>
          </div>
          <FeedbackBanner variant="error" message={error || null} />
          <ValidatedForm className="space-y-4" onSubmit={(e) => { e.preventDefault(); void create(e.currentTarget); }}>
            <TestFields title={title} setTitle={setTitle} instructions={instructions} setInstructions={setInstructions} editable />
            <div className="flex justify-end">
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy && <span className="loading loading-spinner loading-sm" />}
                Create test
              </button>
            </div>
          </ValidatedForm>
        </div>
      </section>
    </div>
  );
}

const sectionTitle = "font-serif text-2xl font-medium leading-tight";

/** Back link + the page's h1: the session's topic, labelled with the class subject. */
function TestPageHeader({
  classId,
  sessionTopic,
  classSubject,
  status,
  actions,
}: {
  classId: string;
  sessionTopic: string;
  classSubject: string;
  /** Where the test stands ("Draft", "Pre-test open", …), shown after the subject. */
  status: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <BackLink href={`/tutor/classes/${classId}`}>Back to class</BackLink>
      <PageHeader
        eyebrow="Session test"
        title={sessionTopic}
        subtitle={<>{subjectDisplayLabel(classSubject)} · {status}</>}
        actions={actions}
      />
    </div>
  );
}

/** Title + instructions, shared by the create form and the builder's details section. */
function TestFields({
  title,
  setTitle,
  instructions,
  setInstructions,
  editable,
}: {
  title: string;
  setTitle: (v: string) => void;
  instructions: string;
  setInstructions: (v: string) => void;
  editable: boolean;
}) {
  return (
    <>
      <FormField size="md" label="Title" required>
        <input
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!editable}
          maxLength={120}
          className="input input-bordered w-full"
        />
      </FormField>
      <FormField size="md" label="Instructions" hint="Optional. Learners see this before they start.">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={!editable}
          rows={3}
          maxLength={2000}
          className="textarea textarea-bordered w-full"
        />
        <CharCount value={instructions} max={2000} />
      </FormField>
    </>
  );
}

function BuilderBody({
  classId,
  sessionId,
  classSubject,
  classTopics,
  sessionTopic,
  test,
  sessionStatus,
  attemptCount,
}: {
  classId: string;
  sessionId: string;
  classSubject: string;
  classTopics: string[];
  sessionTopic: string;
  test: NonNullable<SessionTestBuilderProps["test"]>;
  sessionStatus: SessionTestBuilderProps["sessionStatus"];
  attemptCount: number;
}) {
  const router = useRouter();
  const editable = test.status === "DRAFT" && attemptCount === 0;

  const [title, setTitle] = useState(test.title);
  const [instructions, setInstructions] = useState(test.instructions ?? "");
  const [items, setItems] = useState<BuilderQuestion[]>(test.questions);
  const [savedIds, setSavedIds] = useState<string[]>(test.questions.map((q) => q.questionId));
  const [status, setStatus] = useState(test.status);
  const [pretestClosed, setPretestClosed] = useState(Boolean(test.pretestClosedAt));
  const [posttestOpen, setPosttestOpen] = useState(Boolean(test.posttestOpenedAt));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showBank, setShowBank] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [writeTopic, setWriteTopic] = useState<string>(classTopics[0] ?? "");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmPretestClose, setConfirmPretestClose] = useState(false);
  const [confirmPosttestOpen, setConfirmPosttestOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const dirty = JSON.stringify(items.map((i) => i.questionId)) !== JSON.stringify(savedIds);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const addQuestions = (rows: BuilderQuestion[]) => {
    setItems((prev) => {
      const have = new Set(prev.map((p) => p.questionId));
      return [...prev, ...rows.filter((r) => !have.has(r.questionId))];
    });
  };
  const removeAt = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const saveMeta = async (validationForm: HTMLFormElement) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new FormValidationError(data, "Failed to save.");
      flash("Details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  const saveQuestions = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: items.map((i) => i.questionId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new FormValidationError(data, "Failed to save questions.");
      setSavedIds(items.map((i) => i.questionId));
      flash("Questions saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save questions.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: "PUBLISHED" | "PRETEST_CLOSED" | "POSTTEST_OPEN" | "CLOSED") => {
    setConfirmPublish(false);
    setConfirmPretestClose(false);
    setConfirmPosttestOpen(false);
    setConfirmClose(false);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new FormValidationError(data, "Failed to update status.");
      setStatus(data.status);
      if (next === "PRETEST_CLOSED") setPretestClosed(true);
      if (next === "POSTTEST_OPEN") {
        setPretestClosed(true);
        setPosttestOpen(true);
      }
      flash(next === "PUBLISHED" ? "Test published — learners can take the pre-test now." : next === "PRETEST_CLOSED" ? "Pre-test closed. Post the post-test when it is ready." : next === "POSTTEST_OPEN" ? "Post-test posted — learners can take it now." : "Test closed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  // Where the test stands, as a few words after the subject in the header (the header's buttons say what's next).
  const isLive = status === "PUBLISHED" && sessionStatus !== "CANCELLED";
  const statusWords =
    status === "DRAFT" ? "Draft"
    : status === "CLOSED" ? "Closed"
    : sessionStatus === "CANCELLED" ? "Session cancelled, no new attempts"
    : posttestOpen ? "Post-test open"
    : pretestClosed || sessionStatus === "COMPLETED" ? "Pre-test closed"
    : "Pre-test open";

  return (
    <div className="space-y-6 max-w-3xl">
      <TestPageHeader
        classId={classId}
        sessionTopic={sessionTopic}
        classSubject={classSubject}
        status={<span className={isLive ? "text-success font-medium" : "font-medium text-base-content"}>{statusWords}</span>}
        actions={
          <>
            {status === "PUBLISHED" && sessionStatus === "SCHEDULED" && !pretestClosed && !posttestOpen && (
              <button type="button" onClick={() => setConfirmPretestClose(true)} disabled={busy} className="btn btn-outline">
                Close pre-test
              </button>
            )}
            {status === "PUBLISHED" && sessionStatus !== "CANCELLED" && !posttestOpen && (
              <button type="button" onClick={() => setConfirmPosttestOpen(true)} disabled={busy} className="btn btn-primary">
                Publish post-test
              </button>
            )}
            {status !== "DRAFT" && (
              <Link href={`/tutor/classes/${classId}/sessions/${sessionId}/test/results`} className="btn btn-outline">
                View results
              </Link>
            )}
          </>
        }
      />

      <FeedbackBanner variant="success" message={notice || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {/* ── Meta ── */}
      <section className="card kt-card" aria-labelledby="test-details">
        <div className="kt-card-body gap-5">
          <h2 id="test-details" className={sectionTitle}>Test details</h2>
          <ValidatedForm className="space-y-4" onSubmit={(e) => { e.preventDefault(); void saveMeta(e.currentTarget); }}>
            <TestFields title={title} setTitle={setTitle} instructions={instructions} setInstructions={setInstructions} editable={editable} />
            {editable && (
              <div className="flex justify-end">
                <button type="submit" disabled={busy} className="btn btn-outline">
                  {busy && <span className="loading loading-spinner loading-sm" />}
                  Save details
                </button>
              </div>
            )}
          </ValidatedForm>
        </div>
      </section>

      {/* ── Questions ── */}
      <section className="card kt-card" aria-labelledby="test-questions">
        <div className="kt-card-body gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="test-questions" className={sectionTitle}>
                Questions <span className="font-sans text-base font-normal text-(--kt-muted)">{items.length}</span>
              </h2>
              {editable && (
                <p className="text-sm text-(--kt-muted)">Add questions, save the set, then publish. Learners can&apos;t see it until then.</p>
              )}
            </div>
            {editable && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowBank(true)} className="btn btn-outline">Add from bank</button>
                <button onClick={() => setShowMine(true)} className="btn btn-outline">My questions</button>
                <button onClick={() => setShowWrite(true)} className="btn btn-outline">Write a question</button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-(--kt-muted)">No questions yet. Add some from the bank or write your own.</p>
          ) : (
            <ol className="border-t border-(--kt-border)">
              {items.map((q, idx) => (
                <li key={q.questionId} className="flex items-start gap-4 py-3 border-b border-(--kt-border) last:border-b-0">
                  <span className="font-serif text-lg leading-snug text-(--kt-muted) w-6 shrink-0 tabular-nums">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">{displayPrompt(q.prompt, q.topic)}</p>
                    <p className="text-sm text-(--kt-muted) mt-0.5">
                      {q.topic} · {q.origin === "TUTOR" ? "written by you" : "from the question bank"}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="btn btn-ghost btn-square"
                        aria-label={`Move question ${idx + 1} up`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="btn btn-ghost btn-square"
                        aria-label={`Move question ${idx + 1} down`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeAt(idx)}
                        className="btn btn-ghost btn-square text-error"
                        aria-label={`Remove question ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}

          {editable && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={saveQuestions} disabled={busy || !dirty} className="btn btn-outline">
                {busy && <span className="loading loading-spinner loading-sm" />}
                {dirty ? "Save question set" : "Saved"}
              </button>
              <button
                onClick={() => setConfirmPublish(true)}
                disabled={busy || items.length === 0 || dirty}
                title={dirty ? "Save the question set first" : undefined}
                className="btn btn-primary"
              >
                Publish test
              </button>
            </div>
          )}

          {status === "PUBLISHED" && (posttestOpen || sessionStatus === "CANCELLED") && (
            <div className="flex justify-end">
              <button onClick={() => setConfirmClose(true)} disabled={busy} className="btn btn-outline btn-error">
                Close all testing
              </button>
            </div>
          )}
        </div>
      </section>

      {showBank && (
        <AddFromBankModal
          subject={classSubject}
          topics={classTopics}
          existingIds={new Set(items.map((i) => i.questionId))}
          onAdd={(rows) => {
            addQuestions(rows);
            setShowBank(false);
          }}
          onClose={() => setShowBank(false)}
        />
      )}

      {showMine && (
        <MyQuestionsModal
          existingIds={new Set(items.map((i) => i.questionId))}
          onAdd={(rows) => {
            addQuestions(rows);
            setShowMine(false);
          }}
          onClose={() => setShowMine(false)}
        />
      )}

      {showWrite && (
        <QuestionFormModal
          title="Write a question"
          contextLabel={subjectDisplayLabel(classSubject)}
          submitLabel="Add question"
          topicField={{
            options: classTopics,
            value: writeTopic ?? classTopics[0],
            onChange: setWriteTopic,
          }}
          onClose={() => setShowWrite(false)}
          onSubmit={async (draft) => {
            const topic = writeTopic ?? classTopics[0];
            const res = await fetch("/api/tutor/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ classId, topic, ...draft }),
            });
            const data = await res.json();
            if (!res.ok) throw new FormValidationError(data, "Failed to add question.");
            addQuestions([{ questionId: data.id, prompt: data.prompt, origin: "TUTOR", topic: data.topic }]);
            setShowWrite(false);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this test?"
        description="Once published the question set is locked and enrolled learners can take the pre-test."
        confirmLabel="Publish"
        loading={busy}
        onConfirm={() => changeStatus("PUBLISHED")}
        onCancel={() => setConfirmPublish(false)}
      />
      <ConfirmDialog
        open={confirmPretestClose}
        title="Close the pre-test?"
        description="Learners cannot start a new pre-test after this. Existing attempts can be finished within 15 minutes. Post the post-test separately when it is ready."
        confirmLabel="Close pre-test"
        tone="danger"
        loading={busy}
        onConfirm={() => changeStatus("PRETEST_CLOSED")}
        onCancel={() => setConfirmPretestClose(false)}
      />
      <ConfirmDialog
        open={confirmPosttestOpen}
        title="Post the post-test?"
        description="This closes new pre-test starts and opens the post-test to enrolled learners. They will be notified."
        confirmLabel="Publish post-test"
        loading={busy}
        onConfirm={() => changeStatus("POSTTEST_OPEN")}
        onCancel={() => setConfirmPosttestOpen(false)}
      />
      <ConfirmDialog
        open={confirmClose}
        title="Close all testing?"
        description="New starts stop immediately. Existing attempts can be finished within 15 minutes."
        confirmLabel="Close all testing"
        tone="danger"
        loading={busy}
        onConfirm={() => changeStatus("CLOSED")}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}

// ─── Add-from-bank modal ───────────────────────────────────────────────────

interface BankQuestion {
  reviewStatus?: string;
  id: string;
  prompt: string;
  topic: string;
}

const BANK_PAGE_SIZE = 50;

function AddFromBankModal({
  subject,
  topics,
  existingIds,
  onAdd,
  onClose,
}: {
  subject: string;
  topics: string[];
  existingIds: Set<string>;
  onAdd: (rows: BuilderQuestion[]) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ topic: "", q: "", page: 1 });
  const [rows, setRows] = useState<BankQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [requiresCertification, setRequiresCertification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Map<string, BankQuestion>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          subject,
          pageSize: String(BANK_PAGE_SIZE),
          page: String(filters.page),
        });
        if (filters.topic) params.set("topic", filters.topic);
        if (filters.q) params.set("q", filters.q);
        const res = await fetch(`/api/tutor/question-bank?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new FormValidationError(data, "Failed to load questions.");
        if (!cancelled) {
          setRows(data.questions);
          setTotal(data.total);
          setRequiresCertification(data.requiresCertification === true);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setError(err instanceof Error ? err.message : "Failed to load questions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [subject, filters]);

  const toggle = (question: BankQuestion) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.set(question.id, question);
      return next;
    });

  const commit = () =>
    onAdd(
      Array.from(picked.values()).map((r) => ({ questionId: r.id, prompt: r.prompt, origin: "BANK", topic: r.topic })),
    );

  const subjectName = subjectDisplayLabel(subject);
  return (
    <PickerModal
      title="Add from the question bank"
      note={
        <>
          {subjectName} questions{requiresCertification ? " in the topics you're certified in" : ""}. Search by
          question text or pick a topic.
        </>
      }
      pickedCount={picked.size}
      busy={loading}
      onCommit={commit}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((prev) => ({ ...prev, q: q.trim(), page: 1 }));
        }}
        className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2"
      >
        <select
          aria-label="Filter by topic"
          value={filters.topic}
          onChange={(e) => setFilters((prev) => ({ ...prev, topic: e.target.value, page: 1 }))}
          className="select select-bordered w-full"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          aria-label="Search bank questions"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions"
          className="input input-bordered w-full"
        />
        <button type="submit" disabled={loading} className="btn btn-outline">Search</button>
      </form>

      <FeedbackBanner variant="error" message={error || null} />

      {loading ? (
        <p role="status" className="text-(--kt-muted) py-4">Loading questions…</p>
      ) : error ? null : rows.length === 0 ? (
        <p className="py-4">
          No {subjectName} questions found.
          {filters.q || filters.topic
            ? " Try another search or choose All topics."
            : requiresCertification
              ? " Check your topic certifications, or ask an admin to add questions for this subject."
              : " Ask an admin to add questions for this subject."}
        </p>
      ) : (
        <QuestionPickList
          rows={rows.map((r) => ({
            id: r.id,
            prompt: r.prompt,
            topic: r.topic,
            note: r.reviewStatus === "APPROVED" ? undefined : r.reviewStatus === "DEMO" ? "Demo, practice only" : "Not reviewed yet, practice only",
          }))}
          existingIds={existingIds}
          isPicked={(id) => picked.has(id)}
          onToggle={(id) => {
            const row = rows.find((r) => r.id === id);
            if (row) toggle(row);
          }}
        />
      )}

      {!loading && !error && total > BANK_PAGE_SIZE && (
        <Pagination
          page={filters.page}
          pageSize={BANK_PAGE_SIZE}
          total={total}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      )}
    </PickerModal>
  );
}

/** Modal shell shared by the two question pickers: serif title, a note, the list, Cancel / Add N questions. */
function PickerModal({
  title,
  note,
  pickedCount,
  busy,
  onCommit,
  onClose,
  children,
}: {
  title: string;
  note?: ReactNode;
  pickedCount: number;
  busy: boolean;
  onCommit: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <div className="modal-box max-w-2xl p-6 space-y-4">
        <div>
          <h2 id="picker-title" className="font-serif text-2xl font-medium leading-tight">{title}</h2>
          {note && <p className="text-sm text-(--kt-muted) mt-1">{note}</p>}
        </div>
        {children}
        <div className="modal-action mt-0 pt-2 border-t border-(--kt-border) items-center">
          <span className="mr-auto text-sm text-(--kt-muted)">{pickedCount > 0 ? `${pickedCount} selected` : ""}</span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onCommit} disabled={busy || pickedCount === 0}>
            {pickedCount > 1 ? `Add ${pickedCount} questions` : "Add question"}
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
}

/** Checkbox list of questions: prompt at body size, "Topic" (and a note) under it, already-added rows disabled. */
function QuestionPickList({
  rows,
  existingIds,
  isPicked,
  onToggle,
}: {
  rows: { id: string; prompt: string; topic: string; note?: string }[];
  existingIds: Set<string>;
  isPicked: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="max-h-[50vh] overflow-y-auto border-y border-(--kt-border) -mx-6 px-6">
      {rows.map((r) => {
        const already = existingIds.has(r.id);
        return (
          <li key={r.id} className="border-b border-(--kt-border) last:border-b-0">
            <label className={`flex items-start gap-3 py-3 ${already ? "text-(--kt-muted)" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm mt-0.5"
                disabled={already}
                checked={already || isPicked(r.id)}
                onChange={() => onToggle(r.id)}
              />
              <span className="min-w-0">
                <span className="block leading-snug">{displayPrompt(r.prompt, r.topic)}</span>
                <span className="block text-sm text-(--kt-muted) mt-0.5">
                  {r.topic}
                  {r.note && ` · ${r.note}`}
                  {already && " · already on this test"}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

// ─── My-questions modal ────────────────────────────────────────────────────

function MyQuestionsModal({
  existingIds,
  onAdd,
  onClose,
}: {
  existingIds: Set<string>;
  onAdd: (rows: BuilderQuestion[]) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<{ id: string; prompt: string; topic: string; origin: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tutor/questions");
        const data = await res.json();
        if (!res.ok) throw new FormValidationError(data, "Failed to load your questions.");
        if (!cancelled) setRows(data.questions);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load your questions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const commit = () =>
    onAdd(
      rows.filter((r) => picked.has(r.id)).map((r) => ({ questionId: r.id, prompt: r.prompt, origin: "TUTOR", topic: r.topic })),
    );

  return (
    <PickerModal
      title="Your questions"
      note="Questions you've written for your classes."
      pickedCount={picked.size}
      busy={loading}
      onCommit={commit}
      onClose={onClose}
    >
      <FeedbackBanner variant="error" message={error || null} />
      {loading ? (
        <p role="status" className="text-(--kt-muted) py-4">Loading your questions…</p>
      ) : rows.length === 0 ? (
        <p className="py-4">You haven&apos;t written any questions yet. Use Write a question to add one.</p>
      ) : (
        <QuestionPickList
          rows={rows}
          existingIds={existingIds}
          isPicked={(id) => picked.has(id)}
          onToggle={toggle}
        />
      )}
    </PickerModal>
  );
}
