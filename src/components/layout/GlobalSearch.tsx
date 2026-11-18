"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, UserRound, Tag, CornerDownLeft, X, ChevronDown } from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}
interface SearchGroup {
  kind: "class" | "tutor" | "topic";
  label: string;
  items: SearchItem[];
}

const KIND_ICON: Record<SearchGroup["kind"], React.ReactNode> = {
  class: <GraduationCap className="h-3.5 w-3.5 text-primary" />,
  tutor: <UserRound className="h-3.5 w-3.5 text-(--kt-tutor-text)" />,
  topic: <Tag className="h-3.5 w-3.5 text-(--kt-muted)" />,
};

const ADMIN_SCOPES = [
  { value: "all", label: "Everything", placeholder: "Classes, tutors, topics…" },
  { value: "tutorCode", label: "Tutor code", placeholder: "e.g. TUT-0007" },
  { value: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
  { value: "topic", label: "Topic", placeholder: "e.g. Fractions" },
  { value: "classCode", label: "Class code", placeholder: "e.g. CUR-0086" },
] as const;
const LEARNER_SCOPES = [
  { value: "tutor", label: "Tutor", placeholder: "Name or TUT code…" },
  { value: "class", label: "Class", placeholder: "Subject or class code…" },
] as const;
type Scope = (typeof ADMIN_SCOPES)[number]["value"] | (typeof LEARNER_SCOPES)[number]["value"];

export default function GlobalSearch({ audience = "admin" }: { audience?: "learner" | "admin" }) {
  const router = useRouter();
  const scopes = audience === "learner" ? LEARNER_SCOPES : ADMIN_SCOPES;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>(scopes[0].value);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Flatten for keyboard navigation.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Debounced fetch. All state changes happen inside the timeout so the effect
  // body never calls setState synchronously.
  useEffect(() => {
    const term = q.trim();
    let cancelled = false;
    const t = setTimeout(async () => {
      if (term.length < 2) {
        if (!cancelled) {
          setGroups([]);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&scope=${scope}`,
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (cancelled) return;
        setGroups(Array.isArray(json.groups) ? json.groups : []);
        setActive(0);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, term.length < 2 ? 0 : 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, scope]);

  // ⌘K / Ctrl+K / "/" focuses the box from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((mod && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (item: SearchItem) => {
    setOpen(false);
    setQ("");
    setGroups([]);
    inputRef.current?.blur();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) go(item);
    }
  };

  const term = q.trim();
  const showPanel = open && term.length >= 2;
  const scopePlaceholder =
    scopes.find((s) => s.value === scope)?.placeholder ?? "Search…";

  return (
    <div ref={rootRef} className="kt-search relative hidden sm:flex">
      <span className="relative shrink-0 self-stretch flex items-center border-r border-base-300 -ml-0.75 mr-1">
      <select
        aria-label="Search scope"
        value={scope}
        onChange={(e) => {
          setScope(e.target.value as Scope);
          setGroups([]);
          setActive(0);
          setLoading(q.trim().length >= 2);
          setOpen(true);
        }}
        className="h-full appearance-none bg-transparent pl-0.75 pr-7 text-sm text-base-content cursor-pointer focus:outline-none"
      >
        {scopes.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-(--kt-muted)" aria-hidden="true" />
      </span>
      <Search className="h-4 w-4 shrink-0" />
      <input
        ref={inputRef}
        // `type="text"`, not "search": a search input adds a native clear "x"
        // (styled by the browser, not us) and native Escape-to-clear, which
        // fights our Escape-to-close. We render our own clear button below.
        type="text"
        role="combobox"
        aria-keyshortcuts="Control+K Meta+K"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        placeholder={scopePlaceholder}
        aria-label="Search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {q ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQ("");
            setGroups([]);
            inputRef.current?.focus();
          }}
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-(--kt-muted) hover:text-base-content"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-field border border-base-300 bg-base-100 py-1.5 shadow-md"
        >
          {loading && flat.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-(--kt-muted)">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-(--kt-muted)">
              No matches for “{term}”.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.kind + g.label}>
                <p className="px-3 pb-1 pt-2 text-sm font-medium text-(--kt-muted)">
                  {g.label}
                </p>
                {g.items.map((item) => {
                  const idx = flat.findIndex((f) => f === item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={idx === active}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                        idx === active ? "bg-base-200/70" : ""
                      }`}
                    >
                      <span className="shrink-0">{KIND_ICON[g.kind]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-sm text-(--kt-muted)">{item.subtitle}</span>
                        )}
                      </span>
                      {idx === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-(--kt-muted)" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
