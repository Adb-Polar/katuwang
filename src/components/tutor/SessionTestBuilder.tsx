"use client";

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
  /** null when no test has been created for this session yet. */
  test: {
    id: string;
    title: string;
    instructions: string | null;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
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

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create test.");
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
            One question set — learners take it once before the session (pre-test) and once after
            it&apos;s marked complete (post-test), so you can see the gain.
          </p>
          <FeedbackBanner variant="error" message={error || null} />
          <FormField label="Title" required>
            <input
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
            <button onClick={create} disabled={busy || title.trim().length < 3} className="btn btn-primary btn-sm text-xs">
              {busy && <span className="loading loading-spinner loading-xs" />}
              Create test
            </button>
          </div>
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
  attemptCount,
}: {
  classId: string;
  sessionId: string;
  classSubject: string;
  classTopics: string[];
  test: NonNullable<SessionTestBuilderProps["test"]>;
  attemptCount: number;
}) {
  const editable = test.status === "DRAFT" && attemptCount === 0;

  const [title, setTitle] = useState(test.title);
  const [instructions, setInstructions] = useState(test.instructions ?? "");
  const [items, setItems] = useState<BuilderQuestion[]>(test.questions);
  const [savedIds, setSavedIds] = useState<string[]>(test.questions.map((q) => q.questionId));
  const [status, setStatus] = useState(test.status);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showBank, setShowBank] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [writeTopic, setWriteTopic] = useState<string>(classTopics[0] ?? "");
  const [confirmPublish, setConfirmPublish] = useState(false);
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

  const saveMeta = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}/sessions/${sessionId}/test`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
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
      if (!res.ok) throw new Error(data.error || "Failed to save questions.");
      setSavedIds(items.map((i) => i.questionId));
      flash("Questions saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save questions.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: "PUBLISHED" | "CLOSED") => {
    setConfirmPublish(false);
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
      if (!res.ok) throw new Error(data.error || "Failed to update status.");
      setStatus(data.status);
      flash(next === "PUBLISHED" ? "Test published — learners can take the pre-test now." : "Test closed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const statusTone = status === "PUBLISHED" ? "success" : status === "CLOSED" ? "warning" : "neutral";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href={`/tutor/classes/${classId}`} className="btn btn-ghost btn-sm text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to class
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone} label={status.toLowerCase()} size="sm" />
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

      <FeedbackBanner variant="success" message={notice || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {/* ── Meta ── */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Test details</h2>
          <FormField label="Title" required>
            <input
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
              <button onClick={saveMeta} disabled={busy} className="btn btn-neutral btn-sm text-xs">
                {busy && <span className="loading loading-spinner loading-xs" />}
                Save details
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Questions ── */}
      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="card-title text-sm font-bold">Questions ({items.length})</h2>
            {editable && (
              <div className="flex gap-2">
                <button onClick={() => setShowBank(true)} className="btn btn-outline btn-xs text-2xs font-bold">
                  Add from bank
                </button>
                <button onClick={() => setShowMine(true)} className="btn btn-outline btn-xs text-2xs font-bold">
                  My questions
                </button>
                <button
                  onClick={() => setShowWrite(true)}
                  className="btn btn-outline btn-primary btn-xs text-2xs font-bold"
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
                        className="btn btn-ghost btn-xs"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="btn btn-ghost btn-xs"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeAt(idx)} className="btn btn-ghost btn-xs text-error" aria-label="Remove">
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

          {status === "PUBLISHED" && (
            <div className="flex justify-end pt-1">
              <button onClick={() => setConfirmClose(true)} disabled={busy} className="btn btn-outline btn-warning btn-sm text-xs">
                Close test
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
            if (!res.ok) throw new Error(data.error || "Failed to add question.");
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
        open={confirmClose}
        title="Close this test?"
        description="Learners who haven't started a run will no longer be able to take it."
        confirmLabel="Close test"
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
    { id: string; prompt: string; topic: string; options: { text: string; isCorrect: boolean }[] }[]
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
      if (!res.ok) throw new Error(data.error || "Failed to load questions.");
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="select select-bordered select-xs text-xs sm:col-span-1 truncate">
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompt..."
            className="input input-bordered input-xs text-xs sm:col-span-1"
          />
          <button onClick={search} disabled={loading} className="btn btn-neutral btn-xs text-2xs sm:col-span-1">
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
        if (!res.ok) throw new Error(data.error || "Failed to load your questions.");
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
