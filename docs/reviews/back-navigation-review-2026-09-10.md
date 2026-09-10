# Back-Navigation Review — modals, detail pages, and the browser Back button

- **Date:** 2026-09-10
- **Scope:** how the app responds to the **Back** gesture — browser Back/Forward,
  Android hardware Back, iOS Safari edge-swipe. Covers modals/overlays, list →
  detail → list round-trips, tabs, and in-progress forms.
- **Method:** static reading of routing (`src/proxy.ts`, `src/app/**`),
  `next/navigation` usage, the modal components, and `usePaginatedList` /
  `useTableSort`.

---

## The rule this review measures against

> **Back undoes the last thing the user saw happen.**
>
> 1. If an overlay is open (modal, sheet, dropdown, mobile nav, chat panel),
>    Back **closes the overlay** and stays on the page.
> 2. Otherwise Back returns to the **previous screen** — and if that screen was a
>    list, it comes back with its tab, filters, search, sort, page, and scroll
>    position **as they were left**.
> 3. Leaving a screen with **unsaved input** asks first.

On mobile there is no visible Back control — the hardware/edge-swipe gesture *is*
the primary way out of a modal. So (1) is not a nice-to-have.

---

## TL;DR — the app does almost none of this

| # | Sev | Finding |
|---|---|---|
| B1 | 🔴 High | No overlay is a history entry. Back with a modal / chat panel / dropdown open **leaves the page** (or exits the app on mobile) instead of closing the overlay |
| B2 | 🔴 High | List state is lost on Back. `usePaginatedList` persists only `page`/`pageSize` to the URL; **tab, filters, search, and sort live in `useState`** and are gone when you return from a detail page |
| B3 | 🟠 Med | Every page-flip is its own history entry — Back from a list walks backwards through pagination one step at a time |
| B4 | 🟠 Med | Detail-page "Back" is a hardcoded `href`, not "where you came from". The one `?from=` special-case covers 1 of ~7 detail routes and 2 of its possible origins |
| B5 | 🟠 Med | Tabs are not in the URL (`TutorProfileClassTabs`, `AssessmentsTabs`, every admin-table tab) — Back never restores the tab, and tabs can't be linked |
| B6 | 🟠 Med | ~15 hand-rolled modals + `ConfirmDialog` have **no Escape handler** — the keyboard equivalent of "back out" is also missing |
| B7 | 🟠 Med | No unsaved-work guard. Accidental Back on `NewClassForm` / `EditClassForm` / `AcceptRequestForm` / `ProfileEditForm` / the big modals silently discards input |
| B8 | 🟡 Low | Client-fetched lists can't restore scroll on Back — the list is empty during the refetch, so the browser has no row to scroll to |
| B9 | 🟡 Low | `/learner/classes/[id]` ships two different back affordances with two labels on one route |

Confirmed by grep: **0** uses of `router.back()`, `history.back()`,
`history.pushState`, `popstate`, or `beforePopState` anywhere in `src/`.

---

## B1 — Overlays are not history entries (🔴 High)

Every modal in the app is `useState`-driven:

- The ~15 hand-rolled `modal modal-open` blocks (`AddSessionModal`,
  `QuestionFormModal`, `SessionTestBuilder`, `SessionTestResults`, `ReportButton`,
  `RequestTopicButton`, and the 8 admin "confirm + note" copies — see
  `component-reuse-review` R2/R3);
- `ConfirmDialog` (`open` prop from parent state);
- `ChatWidget` panel (`const [open, setOpen] = useState(false)`);
- `NotificationBell` dropdown, `GlobalSearch` results panel, `PortalLayout`
  mobile nav drawer.

None push a history entry when they open. So:

- **Desktop:** Back with a modal open navigates to the previous *page* — the modal
  and any typed input vanish, and the user is somewhere they didn't expect.
- **Mobile (the real problem):** the Android Back button and the iOS left-edge
  swipe are how users dismiss sheets. Here they navigate away from the page
  entirely, and if the modal was opened on the first page of the session, the
  gesture **leaves the site**.

Only `ChatWidget`, `GlobalSearch`, `NotificationBell`, `PortalLayout` (mobile
nav), and `SubjectTopicManager`'s row menu handle **Escape**; nothing handles the
Back gesture.

**Fix.** A shared `useDismissableLayer({ open, onClose })` that, while `open`:

1. `history.pushState` a marker state on open;
2. listens for `popstate` → calls `onClose()` (so Back closes the layer and
   *stays on the page*);
3. on a normal close (button / backdrop / Escape), does `history.back()` once to
   pop its own marker so Forward doesn't reopen it;
4. handles Escape and focus-trap/restore in the same place.

The `<Modal>` primitive proposed in `component-reuse-review` **R3** is the right
home for this — build it once, and `ConfirmDialog`, the R2 `PromptDialog`,
`AddSessionModal`, `QuestionFormModal`, `ReportButton`, the chat panel, and the
notification dropdown all inherit correct Back behaviour.

For the two genuinely page-sized modals (`SessionTestBuilder`, the quiz runners)
consider Next.js **intercepting routes** (`(.)`) instead, so they get a real URL
and Back is automatic.

---

## B2 — List state is lost when you come back (🔴 High)

`usePaginatedList` (`src/hooks/usePaginatedList.ts`) writes **only**
`?<key>Page=` and `?<key>Size=` to the URL. Everything else that shapes the list —

- the active **tab** (`ClassAppealTable`, `AbuseReportTable`,
  `CertificationReviewTable`, … all `const [tab, setTab] = useState(...)`),
- **filter** dropdowns (subject, status, grade, target-type),
- the **search** box,
- **sort** field + direction (`useTableSort` is pure `useState`),

— lives in component state and is passed into the hook's `params`. `params`
drives the fetch but is never persisted. So the round-trip **list → open a row →
Back** lands you on the list at the right *page number* but with the tab reset,
the filters cleared, and the search box empty. On the admin moderation tables
(where you routinely open 5–10 rows in a row) this is a constant papercut.

**Fix.** Move all list UI state into the URL query string. A `useUrlState` helper
(read from `useSearchParams`, write with `router.replace`, see B3) backing:

```ts
const [tab, setTab]       = useUrlState("tab", "pending");
const [subject, setSub]   = useUrlState("subject", "");
const [q, setQ]           = useUrlState("q", "");
const { sort, dir, toggle } = useUrlTableSort();   // ?sort= ?dir=
```

Then Back from a detail page restores the exact list view for free (the URL *is*
the state), and every filtered list becomes a shareable link. `usePaginatedList`
already does this for pagination — this is finishing the job it started.

---

## B3 — Pagination changes pollute history (🟠 Med)

`usePaginatedList.syncUrl` uses `router.push(...)` for `setPage` / `setPageSize`.
Each is a history entry, so after clicking through to page 4 of a list and opening
a row, the user has to press Back **five times** (page 4→3→2→1→list-origin) to get
off the list.

**Fix.** Use `router.replace` for *in-place* list state (page, size, filters,
sort, tab) and reserve `router.push` for real navigations (row → detail,
list → "new" form). One-line change in `syncUrl`, plus the same convention in the
B2 `useUrlState`.

---

## B4 — "Back" on a detail page is hardcoded, not contextual (🟠 Med)

Detail routes each hardcode their back target:

| Route | Back goes to |
|---|---|
| `/admin/users/[id]` | always `/admin/users` |
| `/admin/classes/[id]` | always `/admin/classes` |
| `/tutor/students/[studentId]` | always `/tutor/students` |
| `/tutor/classes/[classId]` | always `/tutor/classes` |
| `/learner/tutors/[tutorId]` | always `/learner/classes` |
| `/learner/classes/[classId]` | `?from=` → `/learner/my-classes` **or** `/learner/classes` (only 2 values) |

Reach `/admin/users/[id]` from a **global search result**, a **notification**, or
the **audit log**, and "Back to accounts" still dumps you on the bare, unfiltered
`/admin/users`. The `?from=` mechanism on the learner class page is a partial
manual reimplementation of history that (a) covers one route, (b) knows only two
origins, (c) breaks on refresh / direct link, and (d) carries no list state.

**Fix.** The `<BackLink>` proposed in `repeated-markup-review` **C2** should:

- call `router.back()` when `window.history.length > 1` and the previous entry is
  same-origin (the common case — user came from a list, and with B2 that list URL
  still holds its filters);
- fall back to the supplied `href` for a cold load / external referrer / refresh.

Then delete the `?from=` param.

---

## B5 — Tabs aren't in the URL (🟠 Med)

`TutorProfileClassTabs` (`active` / `completed`), `AssessmentsTabs`
(`topics` / `history`), and the `<Tabs>` in every admin table store the selection
in `useState`. Consequences: Back never restores the tab you were on; you can't
send someone "the History tab of my assessments"; a page refresh resets to the
first tab.

**Fix.** `?tab=` via the B2 `useUrlState`. The shared `<Tabs>` component
(`src/components/ui/Tabs.tsx`) can take an optional `urlKey` prop and do the
read/write itself, so callers opt in with one prop.

---

## B6 — Dialogs don't close on Escape (🟠 Med)

Tracked in `component-reuse-review` R3, repeated here because it is the same
user-need as B1: **no keyboard way to back out of a dialog.** `ConfirmDialog` and
all ~15 hand-rolled modals lack an Escape handler (only the chat panel, global
search, notification dropdown, and mobile nav have one). The B1 `<Modal>` /
`useDismissableLayer` primitive fixes Escape, focus-trap, focus-restore, **and**
the Back gesture together — do them in one component, not four.

---

## B7 — Nothing guards unsaved input (🟠 Med)

No `beforeunload` listener and no route-change confirmation exists anywhere
(`grep beforeunload` → nothing). So an accidental Back / swipe silently discards:

- a half-filled `NewClassForm` / `EditClassForm` (page-level, multi-field with a
  schedule builder);
- `AcceptRequestForm`, `ProfileEditForm`;
- an in-progress `QuestionFormModal`, `AddSessionModal`, `ReportButton` note;
- `SessionTestBuilder` — which **already computes `dirty`** (line 185) but only
  uses it to disable the Save button, not to warn on leave.

**Fix.** A `useUnsavedGuard(dirty: boolean)` hook that, while `dirty`:

- sets `window.onbeforeunload` (covers tab close / refresh / hard nav);
- for SPA navigation, hooks the B1 `popstate` path to `confirm()` before letting
  the layer/route close.

Wire it into the four page forms and pass `dirty` where a modal has meaningful
input.

---

## B8 — Scroll position is lost returning to a list (🟡 Low)

The paginated lists fetch their rows in a `useEffect` on mount. On Back the
component remounts, the list renders **empty** for the duration of the refetch,
and the browser's scroll restoration has no row at the old offset to scroll to —
so you land at the top of a 40-row table you were halfway down.

**Fix (any one):**

- cache the last response per list URL in `sessionStorage` (or adopt SWR / React
  Query) so Back paints the previous rows immediately, then revalidates;
- or render the first page of each list from its server component so the markup
  exists on the restored navigation;
- Next's `experimental.scrollRestoration` is not set in `next.config.ts` — worth
  enabling regardless, but it can't help a not-yet-rendered row on its own.

---

## B9 — `/learner/classes/[id]` has two back affordances (🟡 Low)

`src/app/learner/classes/[classId]/page.tsx` renders a `<Link href="/learner/my-classes"
class="btn btn-neutral btn-sm">Back to my classes</Link>` in the *not-published*
branch (line 98) and separately passes `backHref={backHref}` to
`ClassDetailsView` in the normal branch (line 112) — two mechanisms, two labels
("Back to my classes" vs `ClassDetailsView`'s "Back to Classes"), on one route.
Collapse to one `<BackLink>` (B4).

---

## Recommended plan

**Adopt the rule at the top of this doc as a written convention**, then build two
primitives and migrate:

1. **`useUrlState` + `useUrlTableSort`** (B2, B3, B5) — one small hook family;
   `usePaginatedList` switches `push`→`replace`. Migrate the admin tables and the
   two browsers. This alone fixes the list round-trip.
2. **`<Modal>` / `useDismissableLayer`** (B1, B6) — owns history entry + Escape +
   focus-trap + focus-restore. `ConfirmDialog` and the `component-reuse-review`
   R2 `PromptDialog` build on it; then the bespoke modals; then the chat panel and
   notification dropdown.
3. **`<BackLink>` → `router.back()` with `href` fallback** (B4, B9); delete
   `?from=`.
4. **`useUnsavedGuard(dirty)`** (B7) into the four page forms.
5. **List response caching** (B8) — SWR/React Query, or sessionStorage, or
   server-render page 1.

Steps 1–3 are the bulk of the perceived quality gain and are independent of each
other. They also share primitives with `component-reuse-review` (R3 modal shell)
and `repeated-markup-review` (C2 BackLink) — build those once and all three
reviews' items collapse together.

None of this changes an API. Steps 1, 2, and 4 change client behaviour that the
Vitest suite doesn't cover — they need the `docs/TOTEST.txt` back-button checklist
this review implies (open a modal → press Back → modal closes, page stays;
filter a list → open a row → Back → list is exactly as left; start a form → Back →
"discard?" prompt).
