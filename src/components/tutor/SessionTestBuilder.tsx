"use client";

import { FormValidationError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import CharCount from "@/components/ui/CharCount";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
  onCreated,
}: {
  classId: string;
  sessionId: string;
  sessionTopic: string;
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
    <div className="space-y-6">
      <Link href={`/tutor/classes/${classId}`} className="btn btn-ghost btn-sm text-xs gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to class
      </Link>
      <section className="card kt-card max-w-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Create this session&apos;s test</h2>
          <p className="text-2xs text-base-content/50">
            One question set — learners take it before the session (pre-test) and again
            when you post the post-test, so you can see the gain.
          </p>
          <FeedbackBanner variant="error" message={error || null} />
          <ValidatedForm className="space-y-4" onSubmit={(e) => { e.preventDefault(); void create(e.currentTarget); }}>
          <FormField label="Title" required>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="input input-bordered input-sm w-full text-xs focus:input-primary"
            />
          </FormField>
          <FormField label="Instructions" hint="Shown to learners before they start (optional)">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              maxLength={2000}
              className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
            />
            <CharCount value={instructions} max={2000} />
          </FormField>
          <div className="flex justify-end">
            <button type="submit" disabled={busy} className="btn btn-primary btn-sm text-xs">
              {busy && <span className="loading loading-spinner loading-xs" />}
              Create test
            </button>
          </div>
          </ValidatedForm>
        </div>
      </section>
    </div>
  );
}

function BuilderBody({
  classId,
  sessionId,
  classSubject,
  classTopics,
  test,
  sessionStatus,
  attemptCount,
}: {
  classId: string;
  sessionId: string;
  classSubject: string;
  classTopics: string[];
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

  const statusTone = status === "PUBLISHED" ? "success" : status === "CLOSED" ? "warning" : "neutral";
  const statusLabel = status === "PUBLISHED"
    ? sessionStatus === "CANCELLED" ? "Session cancelled" : posttestOpen ? "Post-test open" : sessionStatus === "COMPLETED" || pretestClosed ? "Pre-test closed" : "Pre-test open"
    : status.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href={`/tutor/classes/${classId}`} className="btn btn-ghost btn-sm text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to class
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone} label={statusLabel} size="sm" />
          {status === "PUBLISHED" && sessionStatus === "SCHEDULED" && !pretestClosed && !posttestOpen && (
            <button type="button" onClick={() => setConfirmPretestClose(true)} disabled={busy} className="btn btn-warning btn-sm min-h-11 text-xs font-semibold">
              Close pre-test
            </button>
          )}
          {status === "PUBLISHED" && sessionStatus !== "CANCELLED" && !posttestOpen && (
            <button type="button" onClick={() => setConfirmPosttestOpen(true)} disabled={busy} className="btn btn-primary btn-sm min-h-11 text-xs font-semibold">
              Publish post-test
            </button>
          )}
          {status !== "DRAFT" && (
            <Link
              href={`/tutor/classes/${classId}/sessions/${sessionId}/test/results`}
              className="btn btn-outline btn-primary btn-sm text-xs"
            >
              View results
            </Link>
          )}
        </div>
      </div>

      <p className="font-mono text-2xs font-semibold uppercase tracking-wider text-primary/80">
        {classSubject} · pre/post test
      </p>
      {status === "PUBLISHED" && (
        <p className="text-xs text-base-content/65">
          {sessionStatus === "CANCELLED" ? "This session was cancelled; no new test attempts can start." : posttestOpen ? "Post-test available to enrolled learners." : pretestClosed || sessionStatus === "COMPLETED" ? "Pre-test closed. Post the post-test when it is ready." : "Pre-test open to enrolled learners. Post the post-test when it is ready."}
        </p>
      )}

      <FeedbackBanner variant="success" message={notice || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {/* ── Meta ── */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Test details</h2>
          <ValidatedForm className="space-y-4" onSubmit={(e) => { e.preventDefault(); void saveMeta(e.currentTarget); }}>
          <FormField label="Title" required>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!editable}
              maxLength={120}
              className="input input-bordered input-sm w-full text-xs focus:input-primary"
            />
          </FormField>
          <FormField label="Instructions" hint="Shown to learners before they start (optional)">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={!editable}
              rows={3}
              maxLength={2000}
              className="textarea textarea-bordered textarea-sm w-full text-xs focus:textarea-primary"
            />
            <CharCount value={instructions} max={2000} />
          </FormField>
          {editable && (
            <div className="flex justify-end">
              <button type="submit" disabled={busy} className="btn btn-neutral btn-sm text-xs">
                {busy && <span className="loading loading-spinner loading-xs" />}
                Save details
              </button>
            </div>
          )}
          </ValidatedForm>
        </div>
      </section>

      {/* ── Questions ── */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="card-title text-sm font-bold">Questions ({items.length})</h2>
            {editable && (
              <div className="flex gap-2">
                <button onClick={() => setShowBank(true)} className="btn btn-outline btn-xs min-h-11 sm:min-h-0 text-2xs font-bold">
                  Add from bank
                </button>
                <button onClick={() => setShowMine(true)} className="btn btn-outline btn-xs min-h-11 sm:min-h-0 text-2xs font-bold">
                  My questions
                </button>
                <button
                  onClick={() => setShowWrite(true)}
                  className="btn btn-outline btn-primary btn-xs min-h-11 sm:min-h-0 text-2xs font-bold"
                >
                  Write a question
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
              No questions yet. Add some from the bank or write your own.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((q, idx) => (
                <li key={q.questionId} className="flex items-start gap-2 p-3 border border-base-200 rounded-xl text-xs">
                  <span className="text-2xs text-base-content/40 pt-0.5 shrink-0">Q{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base-content/80">{q.prompt}</div>
                    <div className="text-2xs text-base-content/40 mt-0.5">
                      {q.topic} ·{" "}
                      <span className={q.origin === "TUTOR" ? "text-accent" : "text-primary"}>
                        {q.origin === "TUTOR" ? "Custom" : "Bank"}
                      </span>
                    </div>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="btn btn-ghost btn-xs min-h-11 sm:min-h-0"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="btn btn-ghost btn-xs min-h-11 sm:min-h-0"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeAt(idx)} className="btn btn-ghost btn-xs min-h-11 sm:min-h-0 text-error" aria-label="Remove">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <button onClick={saveQuestions} disabled={busy || !dirty} className="btn btn-neutral btn-sm text-xs">
                {busy && <span className="loading loading-spinner loading-xs" />}
                {dirty ? "Save question set" : "Saved"}
              </button>
              <button
                onClick={() => setConfirmPublish(true)}
                disabled={busy || items.length === 0 || dirty}
                title={dirty ? "Save the question set first" : undefined}
                className="btn btn-primary btn-sm text-xs"
              >
                Publish test
              </button>
            </div>
          )}

          {status === "PUBLISHED" && (posttestOpen || sessionStatus === "CANCELLED") && (
            <div className="flex justify-end pt-1">
              <button onClick={() => setConfirmClose(true)} disabled={busy} className="btn btn-outline btn-warning btn-sm text-xs">
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
          contextLabel={classSubject}
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
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<
    { id: string; prompt: string; topic: string; reviewStatus?: string; options: { text: string; isCorrect: boolean }[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ subject, pageSize: "50" });
      if (topic) params.set("topic", topic);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/tutor/question-bank?${params}`);
      const data = await res.json();
      if (!res.ok) throw new FormValidationError(data, "Failed to load questions.");
      setRows(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const commit = () =>
    onAdd(
      rows.filter((r) => picked.has(r.id)).map((r) => ({ questionId: r.id, prompt: r.prompt, origin: "BANK", topic: r.topic })),
    );

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg p-6 kt-card space-y-4">
        <h3 className="font-bold text-sm text-base-content">Add from the question bank</h3>
        <p className="text-xs text-base-content/60">
          Bank questions are available for topics you are already certified in.
          You can also write your own questions for this session.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select aria-label="Filter question bank by topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="select select-bordered select-xs min-h-11 sm:min-h-0 text-xs sm:col-span-1 truncate">
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            aria-label="Search question prompts"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompt..."
            className="input input-bordered input-xs min-h-11 sm:min-h-0 text-xs sm:col-span-1"
          />
          <button onClick={search} disabled={loading} className="btn btn-neutral btn-xs min-h-11 sm:min-h-0 text-2xs sm:col-span-1">
            {loading ? <span className="loading loading-spinner loading-xs" /> : "Search"}
          </button>
        </div>

        <FeedbackBanner variant="error" message={error || null} />

        <div className="max-h-[45vh] overflow-y-auto space-y-1.5 pr-1">
          {rows.length === 0 ? (
            <p className="text-2xs text-base-content/40 italic text-center py-6">
              Run a search to list bank questions for {subject}.
            </p>
          ) : (
            rows.map((r) => {
              const already = existingIds.has(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    already ? "opacity-40" : "cursor-pointer hover:border-base-300"
                  } border-base-200`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary mt-0.5"
                    disabled={already}
                    checked={picked.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <span>
                    <span className="text-base-content/80">{r.prompt}</span>
                    <span className="block text-2xs text-base-content/40">
                      {r.topic} · {r.reviewStatus === "APPROVED" ? "Reviewed for qualification" : r.reviewStatus === "DEMO" ? "Demo — practice only" : "Unreviewed — practice only"}
                      {already && " · already on this test"}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="modal-action pt-1">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={commit} disabled={picked.size === 0}>
            Add {picked.size || ""} selected
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
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
    <div className="modal modal-open">
      <div className="modal-box max-w-lg p-6 kt-card space-y-4">
        <h3 className="font-bold text-sm text-base-content">Your custom questions</h3>
        <FeedbackBanner variant="error" message={error || null} />
        <div className="max-h-[45vh] overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-2xs text-base-content/40 italic text-center py-6">
              You haven&apos;t written any custom questions yet.
            </p>
          ) : (
            rows.map((r) => {
              const already = existingIds.has(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    already ? "opacity-40" : "cursor-pointer hover:border-base-300"
                  } border-base-200`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary mt-0.5"
                    disabled={already}
                    checked={picked.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <span>
                    <span className="text-base-content/80">{r.prompt}</span>
                    <span className="block text-2xs text-base-content/40">
                      {r.topic}
                      {already && " · already on this test"}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>
        <div className="modal-action pt-1">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={commit} disabled={picked.size === 0}>
            Add {picked.size || ""} selected
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} aria-label="Close" />
    </div>
  );
}
