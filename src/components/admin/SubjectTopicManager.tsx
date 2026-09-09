"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Check, X, MoreVertical, Pencil, ArrowUp, ArrowDown, ToggleLeft, Trash2 } from "lucide-react";
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

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const MENU_WIDTH = 176; // matches w-44

/**
 * A `⋯` row menu. The panel is rendered through a portal to `document.body` and
 * fixed-positioned from the trigger's rect, so it is never clipped by the
 * scrollable card the row lives in. Closes on outside-click / Escape / scroll.
 */
function RowMenu({ anchorId, busy, items }: { anchorId: string; busy: boolean; items: MenuItem[] }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const estHeight = menuRef.current?.offsetHeight ?? items.length * 34 + 12;
    const below = r.bottom + 4;
    const flip = below + estHeight > window.innerHeight && r.top - estHeight - 4 > 0;
    setPos({
      top: flip ? r.top - estHeight - 4 : below,
      left: Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  }, [items.length]);

  // Refine position once the panel has a real measured height.
  useEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn btn-ghost btn-xs btn-square"
        onClick={() => {
          if (!open) place();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            id={anchorId}
            role="menu"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="menu menu-xs z-[60] rounded-box border border-base-200 bg-base-100 p-1.5 shadow-lg"
          >
            {items.map((it) => (
              <li key={it.label}>
                <button
                  type="button"
                  disabled={busy || it.disabled}
                  onClick={() => {
                    setOpen(false);
                    it.onClick();
                  }}
                  className={`gap-2 text-xs ${it.danger ? "text-error" : ""}`}
                >
                  {it.icon}
                  {it.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

export default function SubjectTopicManager() {
  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, "");
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

  const sortedSubjects = [...subjects].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* subjects — header fixed, list scrolls, add-form pinned to the bottom */}
        <section className="card kt-card flex max-h-[32rem] flex-col overflow-hidden lg:max-h-[calc(100vh-9rem)]">
          <div className="card-body flex min-h-0 flex-col gap-3 overflow-hidden">
            <h2 className="shrink-0 text-sm font-medium text-base-content/80">Subjects</h2>

            <ul className="-mx-2 min-h-0 flex-1 divide-y divide-base-200 overflow-y-auto px-2">
              {sortedSubjects.map((s, idx) => (
                <li key={s.id}>
                  <div
                    className={`flex items-center gap-1 rounded-lg py-1.5 pl-2 pr-1 ${
                      s.id === selectedId ? "bg-primary/5" : "hover:bg-base-200/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-xs ${
                          s.active ? "" : "text-base-content/40 line-through"
                        }`}
                      >
                        {s.name}
                      </span>
                      <span className="block truncate font-mono text-2xs text-base-content/40">
                        {s.slug} · {s.topics.length} {s.topics.length === 1 ? "topic" : "topics"}
                      </span>
                    </button>

                    <RowMenu
                      anchorId={`${idBase}-s-${s.id}`}
                      busy={busy}
                      items={[
                        {
                          label: "Move up",
                          icon: <ArrowUp className="h-3.5 w-3.5" />,
                          onClick: () => moveSubject(s, -1),
                          disabled: idx === 0,
                        },
                        {
                          label: "Move down",
                          icon: <ArrowDown className="h-3.5 w-3.5" />,
                          onClick: () => moveSubject(s, 1),
                          disabled: idx === sortedSubjects.length - 1,
                        },
                        {
                          label: s.active ? "Disable" : "Enable",
                          icon: <ToggleLeft className="h-3.5 w-3.5" />,
                          onClick: () => call(`/api/admin/subjects/${s.id}`, "PATCH", { active: !s.active }),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          onClick: () => setDeleteSubject(s),
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 space-y-2 border-t border-base-200 pt-3">
              <p className="text-2xs text-base-content/60">Add a subject</p>
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
                className="input input-bordered input-xs w-full font-mono text-xs"
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

        {/* topics of the selected subject — same fixed-header / scroll / pinned-add layout */}
        <section className="card kt-card flex max-h-[32rem] min-w-0 flex-col overflow-hidden lg:max-h-[calc(100vh-9rem)]">
          <div className="card-body flex min-h-0 flex-col gap-3 overflow-hidden">
            <h2 className="shrink-0 text-sm font-medium text-base-content/80">
              {selected ? `${selected.name} — topics` : "Topics"}
            </h2>

            {selected ? (
              <>
                <ul className="min-h-0 flex-1 divide-y divide-base-200 overflow-y-auto">
                  {[...selected.topics]
                    .sort((a, b) => a.order - b.order)
                    .map((t, idx, arr) => (
                      <li key={t.id} className="flex items-center gap-1 py-1.5 text-xs">
                        {editingTopicId === t.id ? (
                          <>
                            <input
                              value={editingTopicName}
                              onChange={(e) => setEditingTopicName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTopicName(t);
                                if (e.key === "Escape") setEditingTopicId(null);
                              }}
                              className="input input-bordered input-xs min-w-0 flex-1 text-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => saveTopicName(t)}
                              className="btn btn-ghost btn-xs btn-square shrink-0 text-success"
                              aria-label="Save"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTopicId(null)}
                              className="btn btn-ghost btn-xs btn-square shrink-0"
                              aria-label="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`min-w-0 flex-1 truncate ${
                                t.active ? "" : "text-base-content/40 line-through"
                              }`}
                            >
                              {t.name}
                            </span>
                            <RowMenu
                              anchorId={`${idBase}-t-${t.id}`}
                              busy={busy}
                              items={[
                                {
                                  label: "Rename",
                                  icon: <Pencil className="h-3.5 w-3.5" />,
                                  onClick: () => {
                                    setEditingTopicId(t.id);
                                    setEditingTopicName(t.name);
                                  },
                                },
                                {
                                  label: "Move up",
                                  icon: <ArrowUp className="h-3.5 w-3.5" />,
                                  onClick: () => moveTopic(t, -1),
                                  disabled: idx === 0,
                                },
                                {
                                  label: "Move down",
                                  icon: <ArrowDown className="h-3.5 w-3.5" />,
                                  onClick: () => moveTopic(t, 1),
                                  disabled: idx === arr.length - 1,
                                },
                                {
                                  label: t.active ? "Disable" : "Enable",
                                  icon: <ToggleLeft className="h-3.5 w-3.5" />,
                                  onClick: () =>
                                    call(`/api/admin/topics/${t.id}`, "PATCH", { active: !t.active }),
                                },
                                {
                                  label: "Delete",
                                  icon: <Trash2 className="h-3.5 w-3.5" />,
                                  onClick: () => setDeleteTopic(t),
                                  danger: true,
                                },
                              ]}
                            />
                          </>
                        )}
                      </li>
                    ))}
                  {selected.topics.length === 0 && (
                    <li className="py-6 text-center text-2xs italic text-base-content/40">No topics yet.</li>
                  )}
                </ul>

                <div className="flex shrink-0 flex-wrap gap-2 border-t border-base-200 pt-3">
                  <input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTopic()}
                    placeholder="New topic name"
                    className="input input-bordered input-xs min-w-0 flex-1 text-xs"
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
              <p className="py-6 text-center text-xs italic text-base-content/40">
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
