"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MIN_QUERY_LENGTH,
  PAGE_RESULTS_PER_GROUP,
  fallbackScope,
  scopesFor,
  searchPageHref,
  type Scope,
  type SearchAudience,
} from "@/lib/searchScopes";

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}
interface SearchGroup {
  kind: string;
  label: string;
  items: SearchItem[];
}

type Result = { status: "loading" } | { status: "error" } | { status: "done"; groups: SearchGroup[] };

/**
 * The search form and full result list for `/learner/search` and `/admin/search`.
 * The form is a plain GET, so the query lives in the URL; the page remounts this
 * component (by `key`) for each new query, which is why it can start in "loading".
 */
export default function SearchResults({
  audience,
  q,
  scope,
}: {
  audience: SearchAudience;
  q: string;
  scope: Scope;
}) {
  const scopes = scopesFor(audience);
  const canSearch = q.length >= MIN_QUERY_LENGTH;
  const [result, setResult] = useState<Result>({ status: "loading" });

  useEffect(() => {
    if (!canSearch) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}&scope=${scope}&limit=${PAGE_RESULTS_PER_GROUP}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Search failed with ${res.status}`);
        const json = await res.json();
        setResult({ status: "done", groups: Array.isArray(json.groups) ? json.groups : [] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ status: "error" });
      });
    return () => controller.abort();
  }, [canSearch, q, scope]);

  const fallback = fallbackScope(audience, scope);

  return (
    <div className="space-y-6">
      <form method="get" role="search" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Search in</span>
          <select name="scope" defaultValue={scope} className="select select-bordered w-full sm:w-44">
            {scopes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Search for</span>
          <input
            name="q"
            type="text"
            defaultValue={q}
            minLength={MIN_QUERY_LENGTH}
            maxLength={100}
            required
            autoComplete="off"
            className="input input-bordered w-full"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {!canSearch ? (
        <p className="text-(--kt-muted)">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
      ) : result.status === "loading" ? (
        <p role="status" className="text-(--kt-muted)">
          Searching…
        </p>
      ) : result.status === "error" ? (
        <p role="alert">Search isn’t working right now. Try again in a moment.</p>
      ) : result.groups.length === 0 ? (
        <div role="status">
          <p>No matches for “{q}”.</p>
          {fallback && (
            <Link href={searchPageHref(audience, q, fallback.scope)} className="link link-primary">
              {fallback.label}
            </Link>
          )}
        </div>
      ) : (
        result.groups.map((group) => (
          <section key={group.kind + group.label} className="card kt-card">
            <div className="card-body gap-1 p-5">
              <h2 className="font-serif text-xl font-medium leading-tight">{group.label}</h2>
              <p className="text-sm text-(--kt-muted)">
                {group.items.length >= PAGE_RESULTS_PER_GROUP
                  ? `First ${PAGE_RESULTS_PER_GROUP} matches. Add more letters to narrow it down.`
                  : `${group.items.length} ${group.items.length === 1 ? "match" : "matches"}`}
              </p>
              <ul className="mt-2 divide-y divide-base-300">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex! flex-col! items-stretch! w-full py-3 hover:bg-base-200">
                      <span className="font-medium text-base-content">{item.title}</span>
                      {item.subtitle && <span className="text-sm text-(--kt-muted)">{item.subtitle}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
