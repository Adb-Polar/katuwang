"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, X, Pencil } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TopicRow {
  id: string;
  name: string;
  order: number;
  active: boolean;
}
interface SubjectRow {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  topics: TopicRow[];
}

export default function SubjectTopicManager() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectSlug, setNewSubjectSlug] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const [deleteTopic, setDeleteTopic] = useState<TopicRow | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<SubjectRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/subjects");
        if (!res.ok) throw new Error("Could not load subjects.");
        const json = await res.json();
        if (cancelled) return;
        setSubjects(json.subjects);
        setSelectedId((cur) => cur ?? json.subjects[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load subjects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const call = async (url: string, method: string, body?: unknown) => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Request failed.");
      load();
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const selected = subjects.find((s) => s.id === selectedId) ?? null;

  const addSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectSlug.trim()) return;
    const r = await call("/api/admin/subjects", "POST", {
      name: newSubjectName.trim(),
      slug: newSubjectSlug.trim().toUpperCase(),
    });
    if (r) {
      setNewSubjectName("");
      setNewSubjectSlug("");
      flash("Subject added.");
    }
  };

  const moveSubject = async (s: SubjectRow, dir: -1 | 1) => {
    const sorted = [...subjects].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    await call(`/api/admin/subjects/${s.id}`, "PATCH", { order: sorted[j].order });
    await call(`/api/admin/subjects/${sorted[j].id}`, "PATCH", { order: sorted[i].order });
  };

  const addTopic = async () => {
    if (!selected || !newTopic.trim()) return;
    const r = await call(`/api/admin/subjects/${selected.id}/topics`, "POST", { name: newTopic.trim() });
    if (r) {
      setNewTopic("");
      flash("Topic added.");
    }
  };

  const saveTopicName = async (t: TopicRow) => {
    if (!editingTopicName.trim() || editingTopicName.trim() === t.name) {
      setEditingTopicId(null);
      return;
    }
    const r = await call(`/api/admin/topics/${t.id}`, "PATCH", { name: editingTopicName.trim() });
    if (r) {
      flash("Topic renamed everywhere it's used.");
      setEditingTopicId(null);
    }
  };

  const moveTopic = async (t: TopicRow, dir: -1 | 1) => {
    if (!selected) return;
    const sorted = [...selected.topics].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((x) => x.id === t.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    await call(`/api/admin/topics/${t.id}`, "PATCH", { order: sorted[j].order });
    await call(`/api/admin/topics/${sorted[j].id}`, "PATCH", { order: sorted[i].order });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* subjects */}
        <section className="card kt-card">
          <div className="card-body gap-3">
            <h2 className="card-title text-sm font-bold">Subjects</h2>
            <ul className="divide-y divide-base-200">
              {[...subjects]
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <li key={s.id}>
                    <div
                      className={`flex items-center gap-2 py-2 px-1 text-xs rounded-lg ${
                        s.id === selectedId ? "bg-primary/5" : "hover:bg-base-200/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className="flex-1 text-left"
                      >
                        <span className={`font-semibold ${s.active ? "" : "line-through text-base-content/40"}`}>
                          {s.name}
                        </span>
                        <span className="ml-1.5 font-mono text-2xs text-base-content/40">{s.slug}</span>
                        <span className="ml-1.5 text-2xs text-base-content/40">({s.topics.length})</span>
                      </button>
                      <button type="button" disabled={busy} onClick={() => moveSubject(s, -1)} className="btn btn-ghost btn-2xs btn-square" aria-label="Move up">
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button type="button" disabled={busy} onClick={() => moveSubject(s, 1)} className="btn btn-ghost btn-2xs btn-square" aria-label="Move down">
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => call(`/api/admin/subjects/${s.id}`, "PATCH", { active: !s.active })}
                        className="btn btn-ghost btn-2xs"
                      >
                        {s.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleteSubject(s)}
                        className="btn btn-ghost btn-2xs btn-square text-error"
                        aria-label="Delete subject"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>

            <div className="border-t border-base-200 pt-3 space-y-2">
              <p className="text-2xs font-semibold text-base-content/60">Add a subject</p>
              <input
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Name (e.g. Mathematics)"
                className="input input-bordered input-xs w-full text-xs"
              />
              <input
                value={newSubjectSlug}
                onChange={(e) => setNewSubjectSlug(e.target.value.toUpperCase())}
                placeholder="SLUG (e.g. MATH)"
                className="input input-bordered input-xs w-full text-xs font-mono"
              />
              <button
                type="button"
                onClick={addSubject}
                disabled={busy || !newSubjectName.trim() || !newSubjectSlug.trim()}
                className="btn btn-primary btn-xs w-full text-2xs"
              >
                <Plus className="h-3 w-3" /> Add subject
              </button>
            </div>
          </div>
        </section>

        {/* topics of the selected subject */}
        <section className="card kt-card">
          <div className="card-body gap-3">
            <h2 className="card-title text-sm font-bold">
              {selected ? `${selected.name} — topics` : "Topics"}
            </h2>

            {selected ? (
              <>
                <ul className="divide-y divide-base-200">
                  {[...selected.topics]
                    .sort((a, b) => a.order - b.order)
                    .map((t) => (
                      <li key={t.id} className="flex items-center gap-2 py-2 text-xs">
                        {editingTopicId === t.id ? (
                          <>
                            <input
                              value={editingTopicName}
                              onChange={(e) => setEditingTopicName(e.target.value)}
                              className="input input-bordered input-xs flex-1 text-xs"
                              autoFocus
                            />
                            <button type="button" disabled={busy} onClick={() => saveTopicName(t)} className="btn btn-ghost btn-2xs btn-square text-success" aria-label="Save">
                              <Check className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={() => setEditingTopicId(null)} className="btn btn-ghost btn-2xs btn-square" aria-label="Cancel">
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`flex-1 ${t.active ? "" : "line-through text-base-content/40"}`}>
                              {t.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTopicId(t.id);
                                setEditingTopicName(t.name);
                              }}
                              className="btn btn-ghost btn-2xs btn-square"
                              aria-label="Rename"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button type="button" disabled={busy} onClick={() => moveTopic(t, -1)} className="btn btn-ghost btn-2xs btn-square" aria-label="Move up">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button type="button" disabled={busy} onClick={() => moveTopic(t, 1)} className="btn btn-ghost btn-2xs btn-square" aria-label="Move down">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => call(`/api/admin/topics/${t.id}`, "PATCH", { active: !t.active })}
                              className="btn btn-ghost btn-2xs"
                            >
                              {t.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setDeleteTopic(t)}
                              className="btn btn-ghost btn-2xs btn-square text-error"
                              aria-label="Delete topic"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  {selected.topics.length === 0 && (
                    <li className="py-6 text-center text-2xs italic text-base-content/40">No topics yet.</li>
                  )}
                </ul>

                <div className="border-t border-base-200 pt-3 flex gap-2">
                  <input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTopic()}
                    placeholder="New topic name"
                    className="input input-bordered input-xs flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    disabled={busy || !newTopic.trim()}
                    className="btn btn-primary btn-xs text-2xs"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs italic text-base-content/40 py-6 text-center">
                Select a subject to manage its topics.
              </p>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteSubject !== null}
        title={`Delete "${deleteSubject?.name}"?`}
        description="Only works if no class, request, question, or certification uses it. Otherwise disable it instead."
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={async () => {
          if (deleteSubject) {
            const r = await call(`/api/admin/subjects/${deleteSubject.id}`, "DELETE");
            if (r) {
              flash("Subject deleted.");
              if (selectedId === deleteSubject.id) setSelectedId(null);
            }
          }
          setDeleteSubject(null);
        }}
        onCancel={() => setDeleteSubject(null)}
      />

      <ConfirmDialog
        open={deleteTopic !== null}
        title={`Delete "${deleteTopic?.name}"?`}
        description="If the topic is in use it will be deactivated (hidden from new dropdowns) instead of removed."
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={async () => {
          if (deleteTopic) {
            const r = await call(`/api/admin/topics/${deleteTopic.id}`, "DELETE");
            if (r) flash(r.soft ? "Topic is in use — deactivated." : "Topic deleted.");
          }
          setDeleteTopic(null);
        }}
        onCancel={() => setDeleteTopic(null)}
      />
    </div>
  );
}
