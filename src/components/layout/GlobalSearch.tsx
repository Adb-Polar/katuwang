"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { MIN_QUERY_LENGTH, fallbackScope, scopesFor, searchPageHref, type Scope } from "@/lib/searchScopes";

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

const DEBOUNCE_MS = 220;
const LISTBOX_ID = "global-search-results";
const optionId = (index: number) => `global-search-option-${index}`;

type Status = "idle" | "loading" | "done" | "error";

export default function GlobalSearch({ audience = "admin" }: { audience?: "learner" | "admin" }) {
  const router = useRouter();
  const scopes = scopesFor(audience);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>(scopes[0].value);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = q.trim();
  const canSearch = term.length >= MIN_QUERY_LENGTH;
  const resultCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  // The row after the last result opens the full results page.
  const seeAllIndex = resultCount;
  const optionCount = resultCount + 1;
  const seeAllHref = searchPageHref(audience, term, scope);

  // Debounced fetch. State changes happen inside the timeout so the effect body
  // never calls setState synchronously; the abort drops a superseded request.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        if (!canSearch) {
          setGroups([]);
          setStatus("idle");
          return;
        }
        setStatus("loading");
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&scope=${scope}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Search failed with ${res.status}`);
          const json = await res.json();
          setGroups(Array.isArray(json.groups) ? json.groups : []);
          setActive(0);
          setStatus("done");
        } catch {
          if (controller.signal.aborted) return;
          setGroups([]);
          setStatus("error");
        }
      },
      canSearch ? DEBOUNCE_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, canSearch, scope]);

  // Ctrl+K / ⌘K, or "/" outside a text field, focuses the box from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isShortcut || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Keep the keyboard-highlighted result in view when the list scrolls.
  useEffect(() => {
    listRef.current?.querySelector(`#${optionId(active)}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const changeScope = (next: Scope) => {
    setScope(next);
    setGroups([]);
    setActive(0);
    setOpen(true);
  };

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    setGroups([]);
    inputRef.current?.blur();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || resultCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + optionCount) % optionCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = groups.flatMap((g) => g.items)[active];
      go(item ? item.href : seeAllHref);
    }
  };

  const showPanel = open && canSearch && status !== "idle";
  const showResults = showPanel && resultCount > 0;
  const currentScope = scopes.find((s) => s.value === scope) ?? scopes[0];
  const fallback = fallbackScope(audience, scope);

  let message: string | null = null;
  if (status === "error") message = "Search isn’t working right now. Try again in a moment.";
  else if (resultCount === 0) message = status === "loading" ? "Searching…" : `No matches for “${term}”.`;

  let nextIndex = 0;

  return (
    <div
      ref={rootRef}
      className="kt-search relative hidden sm:flex"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <span className="relative flex shrink-0 items-center self-stretch border-r border-base-300">
        <select
          aria-label="Search in"
          value={scope}
          onChange={(e) => changeScope(e.target.value as Scope)}
          className="h-full cursor-pointer appearance-none bg-transparent pr-7 text-sm text-base-content focus:outline-none"
        >
          {scopes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-(--kt-muted)" aria-hidden="true" />
      </span>
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        // `type="text"`, not "search": a search input adds a native clear "x"
        // and native Escape-to-clear, which fights our Escape-to-close.
        type="text"
        role="combobox"
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={LISTBOX_ID}
        aria-activedescendant={showResults ? optionId(active) : undefined}
        autoComplete="off"
        placeholder={currentScope.placeholder}
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
          className="-mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-field text-(--kt-muted) hover:text-base-content"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      <p role="status" className="sr-only">
        {showResults ? `${resultCount} ${resultCount === 1 ? "result" : "results"}` : ""}
      </p>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-field border border-base-300 bg-base-100 py-1.5 shadow-md">
          {message && (
            <div className="px-3 py-2.5 text-sm" role="status">
              <p className="text-(--kt-muted)">{message}</p>
              {status === "done" && fallback && (
                <button
                  type="button"
                  className="link link-primary mt-1"
                  // Safari doesn't focus a clicked button, so the blur would close the panel first.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    changeScope(fallback.scope);
                    inputRef.current?.focus();
                  }}
                >
                  {fallback.label}
                </button>
              )}
            </div>
          )}
          <div ref={listRef} id={LISTBOX_ID} role="listbox" aria-label="Search results">
            {groups.map((g) => {
              const headingId = `global-search-group-${g.kind}`;
              return (
                <div key={g.kind + g.label} role="group" aria-labelledby={headingId}>
                  <p id={headingId} className="px-3 pb-1 pt-2 text-sm font-medium text-(--kt-muted)">
                    {g.label}
                  </p>
                  {g.items.map((item) => {
                    const index = nextIndex++;
                    return (
                      <button
                        key={item.id}
                        id={optionId(index)}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        aria-selected={index === active}
                        // Keep focus in the input so arrow keys keep working after a hover.
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item.href)}
                        className={`block w-full px-3 py-2 text-left text-sm text-base-content ${index === active ? "bg-base-200" : ""}`}
                      >
                        <span className="block truncate">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-(--kt-muted)">{item.subtitle}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {showResults && (
              <button
                id={optionId(seeAllIndex)}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={active === seeAllIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(seeAllIndex)}
                onClick={() => go(seeAllHref)}
                className={`mt-1.5 block w-full border-t border-base-300 px-3 py-2.5 text-left text-sm font-medium text-primary ${
                  active === seeAllIndex ? "bg-base-200" : ""
                }`}
              >
                See all results for “{term}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
