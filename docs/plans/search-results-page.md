# Search results page

**Goal:** give the top-bar quick search a full page, so a search can show more than six rows per group, be
bookmarked or shared as a URL, and be used on phones (where the top-bar box is hidden).

## Scope
- `/learner/search` and `/admin/search` (`?q=&scope=`). Tutors have no top-bar search, so no tutor page.
- Reuse `GET /api/search`; add `limit` (1–30, default 6) instead of a second endpoint. Same role scoping,
  same privacy rules (learners see tutor names only when `showTutorRealNames` is on), same rate limit.
- No schema or database change.

## Pieces
- `src/lib/searchScopes.ts` — scope lists, `parseScope`, `fallbackScope`, `searchPageHref` (shared by the
  dropdown and the page).
- `src/components/search/SearchResults.tsx` — GET form (scope + query) and grouped result list.
- `src/app/{learner,admin}/search/page.tsx` — thin server pages that read the URL and render the component.
- `GlobalSearch` — last row "See all results for …" opens the page; Enter on it does the same.

## Not included
- Paging past 30 rows per group (the page tells the user to narrow the search).
- A phone entry point in the sidebar or top bar; the page is reachable by URL and from the desktop dropdown.
