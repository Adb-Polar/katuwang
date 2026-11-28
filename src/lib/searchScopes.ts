/** Scope choices for the top-bar search box and the search results page. Values match `/api/search?scope=`. */
export const ADMIN_SCOPES = [
  { value: "tutor", label: "Tutor", placeholder: "Name, email or TUT code…" },
  { value: "student", label: "Student", placeholder: "Name, email or STU code…" },
  { value: "class", label: "Class", placeholder: "Subject, topic or class code…" },
] as const;
export const LEARNER_SCOPES = [
  { value: "tutor", label: "Tutor", placeholder: "Name or TUT code…" },
  { value: "class", label: "Class", placeholder: "Subject or class code…" },
] as const;

export type SearchAudience = "learner" | "admin";
export type Scope = (typeof ADMIN_SCOPES)[number]["value"] | (typeof LEARNER_SCOPES)[number]["value"];

export const MIN_QUERY_LENGTH = 2;
/** Rows per group in the top-bar dropdown, and the most the results page asks for. */
export const QUICK_RESULTS_PER_GROUP = 6;
export const PAGE_RESULTS_PER_GROUP = 30;

export function scopesFor(audience: SearchAudience) {
  return audience === "learner" ? LEARNER_SCOPES : ADMIN_SCOPES;
}

/** The scope from a URL, or the audience's default when it's missing or not one of theirs. */
export function parseScope(audience: SearchAudience, raw: string | undefined): Scope {
  const scopes = scopesFor(audience);
  return scopes.find((s) => s.value === raw)?.value ?? scopes[0].value;
}

/** Where to send a search that found nothing in the chosen scope, if anywhere wider or different exists. */
export function fallbackScope(audience: SearchAudience, scope: Scope): { scope: Scope; label: string } | null {
  if (audience === "learner") {
    return scope === "tutor"
      ? { scope: "class", label: "Search classes instead" }
      : { scope: "tutor", label: "Search tutors instead" };
  }
  if (scope === "tutor") return { scope: "student", label: "Search students instead" };
  if (scope === "student") return { scope: "tutor", label: "Search tutors instead" };
  return null;
}

export function searchPageHref(audience: SearchAudience, q: string, scope: Scope): string {
  return `/${audience}/search?q=${encodeURIComponent(q)}&scope=${scope}`;
}
