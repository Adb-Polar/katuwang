# Katuwang — Consolidated Code & Design Reviews

> Merged 2026-09-10 from six standalone review docs that previously lived as separate
> files in `docs/reviews/`. Each section below is the original document — verbatim
> apart from headings demoted one level and links to relocated docs repointed
> (e.g. `docs/TOTEST.txt` → `docs/backlog/`). Ordered newest first.

## Contents

| Review | Date | Focus |
|---|---|---|
| [Design Review](#design-review--katuwang-ui) | 2026-09-10 | Shipped visual system vs. frozen design language |
| [Back-Navigation Review](#back-navigation-review--modals-detail-pages-and-the-browser-back-button) | 2026-09-10 | Browser/OS Back gesture, list-state restoration |
| [Repeated-Markup Scan](#repeated-markup-scan--chunks-that-should-be-components) | 2026-09-10 | Small JSX chunks that should be components |
| [Component Reuse & Duplication](#component-reuse--duplication-review--katuwang-srccomponents) | 2026-09-10 | Big duplicated assemblies in `src/components` |
| [Clean-Code Review](#clean-code-review--katuwang-src) | 2026-09-09 | Clean Code Ch. 17 pass over `src/` |
| [Security Review](#security-review--katuwang-codebase) | 2026-09-09 | Auth, RBAC, injection, data exposure |


---

## Design Review — Katuwang UI

- **Date:** 2026-09-10
- **Scope:** the shipped visual system — `src/app/globals.css`, `src/app/layout.tsx`,
  `src/components/ui/*`, and how portal pages apply them. Cross-checked against the
  frozen design language in `design/ROUND-2-CONTEXT.md` and `docs/reference/theme.md`.
- **Method:** static reading of the token layer, component primitives, and a sample
  of pages. No screenshots taken.
- **Lens:** is the design *specific to this product*, does the typography carry
  personality, does structure encode meaning, and is the boldness spent in one place.

---

### Executive summary

Katuwang has a genuinely ownable design **concept**: the interface is the *legend*
for an anonymity notation. Real names never appear, so `STU-XXXX` / `TUT-XXXX`,
grade, section, and status codes *are* the identity, and the type system splits
into **Fragment Mono for notation** (IDs, dates, counts, status) and **Apfel
Grotezk for speech** (titles, sentences, labels). Colour runs in two families that
never mix — **identity** (violet = learner, gold = tutor, grey = system) for *who*,
and **state** (info / success / warning / error) for *what is happening*. That is a
thesis derived from the RA 10173 double-blind mandate, not a mood board. It is the
right idea.

The **implementation has sanded that thesis down** toward the generic
"soft white cards on a warm-grey page, teal accent, everything restrained" look
that every AI-assisted admin UI converges on. The concept is still legible if you
know to look for it, but nothing on screen makes it *loud*. The causes are
concrete and fixable:

| # | Severity | Finding |
|---|---|---|
| D1 | 🟠 High | Emphasis weights are all collapsed to 500 — the type system has one weight for "bold", so hierarchy rests entirely on size + colour |
| D2 | 🟠 Medium | The Apfel migration is half-done: `--font-serif` is aliased to Apfel and `font-serif` still ships in 37 files |
| D3 | 🟠 Medium | Fragment Mono is under-deployed against its own "notation" brief — nav items, buttons, and audit strings render in Apfel |
| D4 | 🟠 Medium | The "every colour has a non-colour cue" promise is opt-in: `StatusBadge`'s 3-letter code is an optional prop and mostly unset |
| D5 | 🟡 Medium | Design docs no longer match the build — `docs/reference/theme.md` is a different palette, and the "no SVG icons" invariant is abandoned (Lucide in 70 files) with no `decisions.md` entry |
| D6 | 🟡 Low | The card shell is the safe default; the signature ("interface as legend") isn't expressed anywhere with intent |
| D7 | 🟡 Low | ROUND-2's own open contrast questions (badge-on-tint, muted-on-surface, white-on-teal) were never closed |

---

### What's already working — keep it

- **The typographic concept is real and specific.** Fragment Mono on every ID /
  time / count is a choice you would not make on a generic dashboard, and it ties
  directly to the product's reason for existing. `AnonymousIdBadge`
  (`src/components/ui/AnonymousIdBadge.tsx`) executes the identity-colour rule
  cleanly — a learner's ID stays violet inside the tutor portal.
- **Two disciplined colour families.** `globals.css` documents the split at the top
  and the `--kt-tint-*` / `--kt-badge--*` tokens enforce it. Identity never marks a
  state; state never marks a person. This is genuinely good system design.
- **Restraint in the shell.** `--depth: 0`, `--noise: 0`, one radius (`0.5rem`),
  soft single-layer shadow (`--kt-shadow-card`), no gradients. The card layer
  (`.kt-card`, `.kt-card-body`, `.kt-card-head`) is consistent and quiet.
- **Accessibility floor is mostly there.** `prefers-reduced-motion` gates the one
  animation (`.kt-swap`), motion is capped at ~180ms, focus styling is defined.
- **Palette is warm, not the cliché cream.** `oklch(99% 0.003 80)` surface on an
  `oklch(97%)` page is a hair of warmth, not the `#F4F1EA` default.

---

### Findings

#### D1 — All emphasis weights collapsed to 500 (🟠 High)

`globals.css`:

```css
--font-weight-medium: 500;
--font-weight-semibold: 500;
--font-weight-bold: 500;
```

The comment explains it: Apfel ships 400 / 500 / 700 / 900, there is no 600, so
`font-semibold` was snapping to 700 (Fett) and "every emphasised run rendered as
heavy". The fix taken was to pin *all three* emphasis utilities to 500 (Mittel).

**Consequence:** `font-medium`, `font-semibold`, and `font-bold` are now the same
weight everywhere. A page `<h1>` (`PageHeader.tsx`: `font-bold`), a card title
(`.kt-card-head > h2`: `--font-weight-bold`), a table header, and an emphasised
word in a sentence all render at 500. Typographic hierarchy has lost an entire
axis — it now rests only on size, colour, and letter-spacing. The 700 Fett and 900
Satt faces are loaded (`layout.tsx`) and never used. For a product whose thesis is
"typography carries the identity", flattening the weight scale is the single
biggest thing muting it.

**Fix.** Stop treating 500 and 700 as interchangeable. Restore a real two-step
emphasis:

- `--font-weight-medium: 500` (Mittel) — emphasised words in prose, table headers,
  form labels, nav.
- `--font-weight-semibold: 500` — keep, or drop the utility entirely so it isn't a
  silent alias.
- `--font-weight-bold: 700` (Fett) — **page H1 and card titles only**, which the
  type-scale contract already says should be the sole heavy elements ("text-xl and
  up … page-level H1 only"). Fett at 24–28px reads as confident, not shouty; the
  original "everything is Fett" problem came from `font-semibold` on small UI text,
  not from H1s.
- Reserve 900 Satt for a single hero moment if D6 gets addressed, else remove it
  from the `localFont` src array so it isn't downloaded.

This is ~4 token lines plus spot-checking that no small-text component uses
`font-bold` (they should use `font-medium`).

---

#### D2 — The Apfel migration is half-finished (🟠 Medium)

`globals.css`:

```css
/* --font-serif kept pointing at the display face so existing `font-serif`
   headings render Apfel until they are swept to `font-sans`. */
--font-serif: var(--font-apfel), ui-sans-serif, system-ui, sans-serif;
```

`font-serif` still appears in **37 files** (`grep -rl 'font-serif' src/`).
`PageHeader.tsx` was migrated to `font-sans`; most auth forms, dev pages, and
several admin tables were not. Because `--font-serif` is aliased to Apfel, they
render identically — so this is invisible today, but:

- it is a latent trap: anyone who "fixes" the alias to an actual serif silently
  restyles 37 files;
- `font-serif` in the codebase implies a serif/sans pairing that does not exist,
  which misleads the next person reading the design system.

**Fix.** Finish the sweep: `font-serif` → `font-sans` across the 37 files
(mechanical), then delete the `--font-serif` alias from `@theme inline`. If a
display serif is ever wanted (see D6), introduce it as a *new* named token, not by
un-aliasing this one.

---

#### D3 — Fragment Mono is under-deployed against its own brief (🟠 Medium)

`ROUND-2-CONTEXT.md` lists what Fragment Mono governs: "IDs, dates, times, counts,
status codes, **navigation items**, audit strings, code fields, **buttons**."

In the build, mono is applied to `.kt-badge`, `.kt-id`, `.kt-stat-value`,
`.kt-tile`, `.kt-slot`, `.kt-avatar`, and the nav *letter-tile* (`.kt-ic`) — but
**not** to:

- **nav item labels** (`.kt-nav-item` sets no `font-family` → Apfel);
- **buttons** (DaisyUI `.btn` → Apfel);
- **audit-log strings** (render as prose).

So the "notation" half of the concept is quieter than specified. The nav in
particular is a missed opportunity — a monospace nav column is distinctive and
on-thesis, and it is one selector.

**Fix.** Add `font-family: var(--font-mono)` to `.kt-nav-item` and to the button
recipe (or a `.btn` override in the components layer). Consider mono for
audit-log rows — they are notation, not speech. Keep it off anything that is a
full sentence.

---

#### D4 — The non-colour cue is optional and mostly absent (🟠 Medium)

`ROUND-2-CONTEXT.md` invariant #3: "Every colour paired with a non-colour cue" —
IDs carry a `STU-`/`TUT-` prefix (done), and **status = a 3-letter Fragment Mono
code plus the full word** (`OPN Open`, `SUS Suspended`, `CMP Completed`, …).

`src/components/ui/StatusBadge.tsx` makes `code` an **optional** prop:

```ts
/** optional 3-letter notation code shown before the label (e.g. "OPN") */
code?: string;
```

Most call sites pass only `tone` + `label`. The only guaranteed non-colour signal
on a badge is then the `●` glyph from `.kt-badge::before`, which is identical
across every tone. So `● Suspended` (red) and `● Completed` (grey) differ almost
entirely by hue — the exact failure mode the invariant was written to prevent, and
a WCAG 1.4.1 (use of colour) problem for the ~1-in-12 users with a colour vision
deficiency.

**Fix.** Make the code mandatory: a `STATUS_META` map (`{ open: { code: "OPN",
label: "Open", tone: "success" }, … }`) as the single source, and have callers
pass a status key, not a free `tone`+`label`+maybe-`code`. That also kills the
current drift where the same status can be spelled differently per screen.

---

#### D5 — The design docs have drifted from the build (🟡 Medium)

Two concrete mismatches:

1. **`docs/reference/theme.md` is a different palette than what ships.** It
   documents `--color-primary: oklch(69% 0.17 162.48)` (bright emerald),
   `--color-secondary: oklch(0% 0 0)` (pure black), `--color-accent: oklch(62%
   0.265 303.9)` (vivid violet). The live `globals.css` theme is
   `--color-primary: oklch(40% 0.09 174)` (muted deep teal), `secondary: oklch(48%
   0.16 300)` (ube), `accent: oklch(76% 0.14 80)` (marigold). Anyone building from
   `theme.md` gets the wrong colours.

2. **The "no pictographic SVG icons" invariant is abandoned.** `ROUND-2-CONTEXT.md`
   invariant #6 and "Prohibited normalisation" both ban an SVG icon set in favour
   of letter-tiles and text glyphs. `lucide-react` is imported in **70 files**
   (`ShieldCheck` in `AnonymousIdBadge`, `Flag`, `ArrowRight`, `CalendarClock`, …).
   ROUND-2's own open issues flagged the letter-tiles as "a placeholder — decide
   keep-letters vs icon-font vs CSS icons", so choosing Lucide is defensible — but
   the decision was never written down, and the frozen doc still says the opposite.

Per `CLAUDE.md` ("when a decision diverges from the thesis reference doc … log it
in `docs/reference/decisions.md`"), both of these need a `decisions.md` entry, and
`theme.md` should either be regenerated from `globals.css` or deleted in favour of
pointing at the CSS as the single source.

**Fix.** Add two `decisions.md` entries (palette supersedes `theme.md`; Lucide
supersedes letter-tiles / the no-SVG rule). Regenerate or retire `theme.md`.
Update `ROUND-2-CONTEXT.md` invariant #6 (or mark it superseded) so the frozen doc
isn't actively wrong. If the letter-tiles are fully gone, remove
`.kt-nav-item .kt-ic` / `.kt-letter-tile` from `globals.css`.

---

#### D6 — The signature idea isn't expressed anywhere loud (🟡 Low)

Round 1's premise: *"the interface is the key to that notation — calm, centred,
symmetric, like a map legend."* That is a strong, specific concept. The shipped UI
is a competent card dashboard that could belong to any SaaS admin tool; the
"legend" idea survives only in the ID badges.

Nothing anchors it. There is no moment on the dashboard, the login page, or an
empty state that says *this product turns people into a notation and that is the
point*. The `design/round-3/` studies (02 "School ID card", 08 "Field guide", 09
"Ledger book") are all reaching for exactly this — a hero/anchor that *is* the
identity pairing.

**Fix (pick one, keep everything else quiet):**

- A **legend block** on each portal dashboard header: the viewer's own token set
  rendered like a map key — `TUT-0148 · Grade 9 · Section Rizal · Tue 16:00` in
  Fragment Mono, with a one-line "This is how learners see you." It is honest,
  on-thesis, and costs one component.
- Or the **login / marketing hero** as the `STU-XXXX ⇄ TUT-XXXX` pairing set large
  in mono (round-3 sample 02), with the tagline as the only Apfel on the screen.

Spend the boldness there; leave the cards exactly as restrained as they are.

---

#### D7 — ROUND-2's open contrast questions were never closed (🟡 Low)

`ROUND-2-CONTEXT.md` → "Open issues carried into Round 2 verification" lists four
contrast checks at shipped sizes (target 4.5:1) that do not appear to have been
run:

- badge text on its own tint (`.kt-badge--warning` uses `--kt-warning-text` =
  `color-mix(warning 80%, black)` on a 20%-warning tint — likely fine, but
  `--kt-badge--tutor` text `--kt-tutor-text: oklch(50% 0.12 80)` on a 24%-accent
  tint at `0.72rem` is the risky one);
- `--kt-muted` (`base-content` at 60%) on `--color-base-100` for body-adjacent
  text at `text-xs` / `text-2xs`;
- green nav-pill text (`--color-primary` on `--kt-tint-primary`);
- white on `--brand` (`--color-primary-content` on `--color-primary` — primary is
  `oklch(40%)` so this is probably safe).

**Fix.** Run the four pairs through a contrast checker at the exact sizes they
ship at. `text-2xs` (0.6875rem) is below the 14px "large text" threshold, so those
need the full 4.5:1. Darken `--kt-tutor-text` and `--kt-faint` if they miss.

---

### Two ways forward

**Path A — recommit to Direction E, executed tight.** D1–D4 are the whole job:
restore weight contrast, finish the font sweep, push mono into nav + buttons, make
the status code mandatory, add the legend block (D6). This is maybe a day of work
and it turns the existing system from "fine" into "distinct" without a redesign.
`design/round-3/15-quiet-cards.html` ("the frozen Round 2 direction, executed
tighter") is this path.

**Path B — adopt a Round 3 direction with a real point of view.** Samples 02
(ID card), 08 (field guide), and 09 (ledger) each commit to one idea that serves
the double-blind premise. This is a bigger change and should only happen if the
team wants a visual reset, not a polish pass. If so, decide *before* touching the
app, and log it as a Round 3 lock in `design/`.

Given the amount of shipped surface, **Path A is the recommendation.** The concept
is already right; it just isn't turned up.

---

### Quick wins (do these regardless of path)

1. **D1** — set `--font-weight-bold: 700`, audit small-text `font-bold` → `font-medium`. (~1h)
2. **D5** — two `decisions.md` entries (palette, icons); regenerate or delete `theme.md`. (~30m)
3. **D4** — `STATUS_META` map, make `StatusBadge` take a status key. (~2h, also de-drifts status labels)
4. **D2** — codemod `font-serif` → `font-sans`, delete the `--font-serif` alias. (~30m)
5. **D3** — `font-family: var(--font-mono)` on `.kt-nav-item` and the button recipe. (~15m + eyeball)
6. **D7** — contrast-check the four token pairs at shipped sizes; darken the misses. (~1h)

None of these change the layout or the component API surface except D4, which is a
net simplification.


---

## Back-Navigation Review — modals, detail pages, and the browser Back button

- **Date:** 2026-09-10
- **Scope:** how the app responds to the **Back** gesture — browser Back/Forward,
  Android hardware Back, iOS Safari edge-swipe. Covers modals/overlays, list →
  detail → list round-trips, tabs, and in-progress forms.
- **Method:** static reading of routing (`src/proxy.ts`, `src/app/**`),
  `next/navigation` usage, the modal components, and `usePaginatedList` /
  `useTableSort`.

---

### The rule this review measures against

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

### TL;DR — the app does almost none of this

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

### B1 — Overlays are not history entries (🔴 High)

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

### B2 — List state is lost when you come back (🔴 High)

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

### B3 — Pagination changes pollute history (🟠 Med)

`usePaginatedList.syncUrl` uses `router.push(...)` for `setPage` / `setPageSize`.
Each is a history entry, so after clicking through to page 4 of a list and opening
a row, the user has to press Back **five times** (page 4→3→2→1→list-origin) to get
off the list.

**Fix.** Use `router.replace` for *in-place* list state (page, size, filters,
sort, tab) and reserve `router.push` for real navigations (row → detail,
list → "new" form). One-line change in `syncUrl`, plus the same convention in the
B2 `useUrlState`.

---

### B4 — "Back" on a detail page is hardcoded, not contextual (🟠 Med)

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

### B5 — Tabs aren't in the URL (🟠 Med)

`TutorProfileClassTabs` (`active` / `completed`), `AssessmentsTabs`
(`topics` / `history`), and the `<Tabs>` in every admin table store the selection
in `useState`. Consequences: Back never restores the tab you were on; you can't
send someone "the History tab of my assessments"; a page refresh resets to the
first tab.

**Fix.** `?tab=` via the B2 `useUrlState`. The shared `<Tabs>` component
(`src/components/ui/Tabs.tsx`) can take an optional `urlKey` prop and do the
read/write itself, so callers opt in with one prop.

---

### B6 — Dialogs don't close on Escape (🟠 Med)

Tracked in `component-reuse-review` R3, repeated here because it is the same
user-need as B1: **no keyboard way to back out of a dialog.** `ConfirmDialog` and
all ~15 hand-rolled modals lack an Escape handler (only the chat panel, global
search, notification dropdown, and mobile nav have one). The B1 `<Modal>` /
`useDismissableLayer` primitive fixes Escape, focus-trap, focus-restore, **and**
the Back gesture together — do them in one component, not four.

---

### B7 — Nothing guards unsaved input (🟠 Med)

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

### B8 — Scroll position is lost returning to a list (🟡 Low)

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

### B9 — `/learner/classes/[id]` has two back affordances (🟡 Low)

`src/app/learner/classes/[classId]/page.tsx` renders a `<Link href="/learner/my-classes"
class="btn btn-neutral btn-sm">Back to my classes</Link>` in the *not-published*
branch (line 98) and separately passes `backHref={backHref}` to
`ClassDetailsView` in the normal branch (line 112) — two mechanisms, two labels
("Back to my classes" vs `ClassDetailsView`'s "Back to Classes"), on one route.
Collapse to one `<BackLink>` (B4).

---

### Recommended plan

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
Vitest suite doesn't cover — they need the `docs/backlog/TOTEST.txt` back-button checklist
this review implies (open a modal → press Back → modal closes, page stays;
filter a list → open a row → Back → list is exactly as left; start a form → Back →
"discard?" prompt).


---

## Repeated-Markup Scan — chunks that should be components

- **Date:** 2026-09-10
- **Scope:** `src/components/**` and `src/app/**/*.tsx`. Pattern search for JSX
  chunks that appear near-verbatim in 3+ files.
- **Relationship to the other reviews:** this is the fine-grained companion to
  `component-reuse-review-2026-09-10.md`. That one covers the big assemblies
  (R1 data-table shell, R2 prompt modal, R3 modal shell, R4 loading/empty,
  R5 card section). This one lists the smaller repeated blocks it didn't — the
  ones that are one component each, not a system.

---

### TL;DR

| # | Conf. | The chunk | Appears in | Extract |
|---|---|---|---|---|
| C1 | 🟢 High | The `kt-stat` stat card | 3 dashboards (verbatim) + 2 more | `<StatCard label value icon tint href?>` |
| C2 | 🟢 High | `‹— Back to X` ghost-button link | 12 files | `<BackLink href label>` |
| C3 | 🟠 Med | `gradeLevel.replace("_", " ") · section` | ~12 files (2 different impls) | `gradeLabel()` helper (+ `<GradeSection>`) |
| C4 | 🟠 Med | The search-input pill (`input-bordered` + `<Search>` + `<input class="grow">`) | 3 files verbatim | `<SearchInput value onChange placeholder>` |
| C5 | 🟠 Med | The Approve / Reject `btn-outline btn-xs` pair | 6 admin tables | `<ApproveRejectButtons>` (or fold into R1) |
| C6 | 🟡 Med | `<div class="flex flex-wrap gap-1">{xs.map(chip)}</div>` | 8 files | `<ChipList>` / `<TopicChipList>` |
| C7 | 🟠 Med | The notification row + its fetch / mark-read logic | `NotificationBell` + `NotificationList` | `<NotificationItem>` + `useNotifications()` |

C1 + C2 + C4 are pure copy-paste and safe to lift today; the rest need a small
judgement call on the prop shape.

---

### C1 — The stat card (🟢 High)

`src/app/admin/page.tsx:83-96`, `src/app/tutor/page.tsx:153-194`,
`src/app/learner/page.tsx:101-115` — and again in
`src/components/learner/MyProgressView.tsx` and
`src/components/tutor/SessionTestResults.tsx`.

The exact block, three times:

```tsx
<div className="card kt-card kt-stat p-4 flex-row items-start justify-between gap-2">
  <div>
    <span className="kt-stat-title">{label}</span>
    <span className="kt-stat-value">{value}</span>
  </div>
  <span className={`p-2 rounded-lg shrink-0 ${tint}`}>
    <Icon className="h-4 w-4" />
  </span>
</div>
```

`learner/page.tsx` and `admin/page.tsx` at least `.map()` it; `tutor/page.tsx`
**hand-unrolls it four times** (two `<div>` + two `<Link>` variants) — 42 lines
that should be four lines of data. The only variations are: wrapper is `<div>` or
`<Link href>` (`+ hover:border-primary/40 transition-colors`), and the tint class.

```tsx
<StatCard label="Learners" value={learnerCount} icon={Users} tint="primary" />
<StatCard label="Enrolled Learners" value={n} icon={Users} tint="secondary" href="/tutor/students" />
```

`tint` as a token name (`primary` / `secondary` / `accent` / `success` / `error`)
mapping to `bg-{tint}/10 text-{tint}` inside the component — the current inline
`bg-primary/10 text-primary` strings are also un-Tailwind-scannable if ever
interpolated. ~90 lines out across the three dashboards.

---

### C2 — The back link (🟢 High)

Twelve files render the same thing:

```tsx
<Link href={target} className="btn btn-ghost btn-sm text-xs gap-1.5">
  <ArrowLeft className="h-3.5 w-3.5" />
  Back to {where}
</Link>
```

`src/app/admin/users/[id]/page.tsx`, `src/app/tutor/students/[studentId]/page.tsx`,
`src/app/learner/tutors/[tutorId]/page.tsx`, `src/components/profile/ProfileEditView.tsx`,
`src/components/tutor/EditClassForm.tsx`, `src/components/classes/ClassDetailsView.tsx`,
`src/components/quiz/SessionTestRunner.tsx`, `src/components/tutor/AssessmentQuizRunner.tsx`,
`src/components/tutor/SessionTestBuilder.tsx`, `src/components/tutor/SessionTestResults.tsx`,
`src/app/account-declined/page.tsx`, `src/app/pending-approval/page.tsx`
(the last two use plain text instead of a real target).

```tsx
<BackLink href="/admin/users">Back to accounts</BackLink>
```

Trivial, and it becomes the one place to add e.g. a keyboard shortcut or a
`router.back()` fallback later.

---

### C3 — Grade-level label (🟠 Med)

`gradeLevel.replace("_", " ")` appears in **10 component/page files**
(`RegistrationApprovalTable:177`, `UserManagementTable:218`, `StudentRoster:151`,
`TopicRequestBrowser:135`, `TopicRequestManager:282`, `ClassCard:101`,
`EnrolledLearnersTable:60`, `admin/users/[id]/page.tsx:79`,
`admin/classes/[id]/page.tsx:117`, `tutor/students/[studentId]/page.tsx:65`),
usually as `{grade.replace("_", " ")} · {section}`.

`src/components/charts/BarChartCard.tsx` does the same job with a **different
implementation** — `labelize(v) = String(v).replace(/_/g, " ")` (global). The
one-argument `.replace("_", " ")` only swaps the *first* underscore; it happens to
be safe for `GRADE_10` but it's a bug-shaped pattern to have copied 10 times.

**Fix.** `gradeLabel(g: GradeLevel): string` in `src/lib/gradeLevels.ts` (the file
already exists for `GRADE_LEVELS`). Optionally a `<GradeSection grade section />`
for the `"{grade} · {section}"` pair. Also gives the app one place to switch to
`"Grade 10"` vs `"G10"` if the design ever wants it.

---

### C4 — Search-input pill (🟠 Med)

`src/components/learner/ClassBrowser.tsx:115-124` and
`src/components/learner/TutorBrowser.tsx:69-78` are byte-identical except the
placeholder and one `.toUpperCase()`:

```tsx
<label className="input input-bordered input-sm flex items-center gap-2 text-xs">
  <Search className="h-3.5 w-3.5 opacity-50" />
  <input type="text" className="grow" placeholder={...} value={q} onChange={...} />
</label>
```

`src/components/help/HelpCenter.tsx` has a close variant. `GlobalSearch` is its own
thing (the `.kt-search` topbar pill) — leave that.

```tsx
<SearchInput value={q} onChange={setQ} placeholder="Search code, subject, or topic…" transform="upper" />
```

---

### C5 — Approve / Reject action pair (🟠 Med)

`btn btn-outline btn-success btn-xs text-2xs font-bold` + the `btn-error` twin, as
a right-aligned `<td className="flex gap-2 justify-end">`, in
`ClassAppealTable`, `AbuseReportTable`, `CertificationReviewTable`,
`ClassModerationTable`, `TopicRequestModerationTable`, `QuestionBankManager` — six
admin tables, same two buttons, only the verbs and the two `onClick` targets
differ.

If `component-reuse-review` **R1** (`<DataTableCard>`) happens, this is just the
`rowActions` render prop and needs no separate component. If R1 is deferred,
`<ApproveRejectButtons approveLabel rejectLabel onApprove onReject />` on its own
still removes ~12 lines × 6.

---

### C6 — Chip list wrapper (🟡 Med)

`<div className="flex flex-wrap gap-1">{items.map(x => <span className="badge
badge-outline badge-sm text-2xs …">{x}</span>)}</div>` recurs in
`AbuseReportTable`, `MyReportsList`, `TopicRequestManager`, `AssessmentHistory`,
`ClassScheduleFields`, `StudentRoster`, `TopicRequestBrowser`,
`WeeklyScheduleView`. `src/components/ui/TopicChip.tsx` already exists for the
*item*, but every caller re-writes the wrapper and (for topics) the
`verifiedTopics.includes(t)` check.

**Fix.** `<TopicChipList topics={topics} verified={verifiedSet} />` for the topic
case (the most common), and a bare `<ChipList>` for the class-code / violation
variants if worth it. Lower priority — the item styling already varies (`font-mono`
for codes vs not), so don't force one component over all of them.

---

### C7 — Notification row + read-state logic (🟠 Med)

`NotificationBell` (189 lines) and `NotificationList` (mark-read view) both:

- fetch `/api/notifications` in a `useEffect` with a `cancelled` flag;
- `markRead(id)` / `markAllRead()` → `PATCH /api/notifications/read`, optimistic
  `setState(prev => prev.map(... readAt ...))`;
- render a row: icon from `notificationMeta`, title, `relativeTime(n.createdAt)`,
  an unread dot, an optional `href`;
- show `"No notifications yet."` when empty.

`notificationMeta.tsx` shares the *icon / label / relativeTime* — but the **row
markup** and the **fetch + mutate logic** are two copies.

**Fix.** `useNotifications({ take? })` → `{ items, unreadCount, loading, error,
markRead, markAllRead }`, and `<NotificationItem notification compact? />` for the
row. The bell renders `<NotificationItem compact>` in a dropdown; the list page
renders the full row. Removes the second copy of the mutation code (the riskier
half to keep in sync).

---

### Already fine — don't extract

- **`src/components/charts/*`** — `BarChartCard` ("extracted verbatim from
  ReportsView"), `RateBarChart` / `GroupedBarChart` (thin specialisations),
  `DataTable`, `useThemeColors`. This directory is already factored; the only
  crossover is `labelize` → C3.
- **`AuthLayout`** — one shell for all five auth screens, already shared.
- **`PortalLayout`** — one shell for all three portals.
- **One-offs that look similar but aren't:** `ClassCard` vs a table row,
  `WeeklyTimetable` vs `WeeklyScheduleView` (the latter is on its way out per
  Changes.md Part 52), `AssessmentQuizRunner` vs `SessionTestRunner` (different
  domains, different data shapes — a shared runner would be a forced abstraction).

---

### Order

1. **C2 BackLink**, **C1 StatCard**, **C4 SearchInput** — pure copy-paste, ~half a
   day total, no behaviour change.
2. **C3 gradeLabel()** — helper first (mechanical codemod), `<GradeSection>` only
   if the pair shows up more after C1/C5.
3. **C7** — `useNotifications` + `<NotificationItem>`; do it when next touching the
   notification code.
4. **C5**, **C6** — after deciding on `component-reuse-review` R1. C5 disappears
   into R1; C6 is opportunistic.

All are testable against the existing Vitest suite — they move markup, not logic
or API surface (C7 moves logic, so it needs the notification tests re-run).


---

## Component Reuse & Duplication Review — Katuwang `src/components`

- **Date:** 2026-09-10
- **Scope:** all 96 files in `src/components/**`, plus `src/hooks/**`. Static reading
  + pattern search.
- **Goal:** find duplicated component code and markup that a shared component or
  hook could absorb, to cut the ~16.9k lines of component code.

---

### TL;DR

The **primitive layer is good** — `src/components/ui/*` (`ConfirmDialog`, `Tabs`,
`Pagination`, `SortableTh`, `FeedbackBanner`, `FormField`, `CharCount`,
`StatusBadge`, `AnonymousIdBadge`) and `src/hooks/*` (`usePaginatedList`,
`useTableSort`, `useFetchList`) are the right primitives and are widely used.

The **duplication is one level up** — the *assemblies* built from those
primitives are copy-pasted. The admin portal has ~12 list tables that each
re-implement the same shell (banner + card + tabs + spinner + `<table>` +
empty-state + pagination), and 8 of them re-implement the same "confirm + type a
note" modal verbatim. `AbuseReportTable` and `ClassAppealTable` are ~90% identical
(Changes.md Part 55 already flagged the second as "a near-copy of" the first).

| # | Payoff | What is duplicated | Fix |
|---|---|---|---|
| R1 | 🟢 High | The admin list-table shell, ~12× | `<DataTableCard>` assembly |
| R2 | 🟢 High | "Confirm + optional note" modal, 8× verbatim | `<PromptDialog>` |
| R3 | 🟠 Med | `modal modal-open` + backdrop markup, 15× hand-rolled | `<Modal>` shell (also closes an a11y gap) |
| R4 | 🟠 Med | Centered loading spinner (29×) and empty-state row (22×) | `<LoadingRow>` / `<EmptyState>` |
| R5 | 🟡 Med | `card kt-card` + `card-body` + `card-title` wrapper, 33× | `<CardSection>` |
| R6 | 🟡 Low | `AuditLogTable` + `ChatbotMissesTable` roll their own sort `<th>` | use `SortableTh` + `useTableSort` |
| R7 | 🟡 Low | fetch + `useEffect` + loading/error/cancel dance, 13× | widen `useFetchList` / new `useResource` |
| R8 | 🟡 Low | `VIOLATION_LABEL[x] ?? x`, the "View audit log" link | one-liner helpers |

Rough envelope: **R1 + R2 alone remove ~1,200–1,500 lines** and make every future
admin table a config object instead of a 300-line file.

---

### R1 — The admin list-table shell is written ~12 times (🟢 High)

**Files:** `AbuseReportTable`, `ClassAppealTable`, `CertificationReviewTable`,
`ClassModerationTable`, `RegistrationApprovalTable`, `TopicRequestModerationTable`,
`UserManagementTable`, `SessionTestsTable`, `AuditLogTable`, `ChatbotMissesTable`
(admin); `StudentRoster`, `TopicRequestBrowser` (tutor); partly `ClassBrowser`,
`TutorBrowser` (learner).

Every one of them is this skeleton, in this order:

```tsx
<div className="space-y-6">
  <FeedbackBanner variant="success" message={success || null} />
  <FeedbackBanner variant="error" message={modalOpen ? null : error || null} />
  <section className="card kt-card">
    <div className="card-body gap-4">
      <h2 className="card-title text-sm font-bold">{Title}</h2>
      <Tabs ... />                                  {/* most of them */}
      {loading
        ? <div className="flex justify-center items-center py-10">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        : <div className="overflow-x-auto border border-base-200 rounded-xl">
            <table className="table table-sm"> <thead>...</thead> <tbody>
              {rows.map(...)}
            </tbody></table>
            {rows.length === 0 && (
              <div className="text-center py-8 text-base-content/40 italic text-sm">
                {emptyCopy}
              </div>
            )}
          </div>}
      <Pagination page={page} pageSize={pageSize} total={total}
        onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  </section>
  {/* modals */}
</div>
```

`ClassAppealTable` (277 lines) and `AbuseReportTable` (340 lines) differ only in:
the interface, the tab labels, three column `<td>`s, and the copy in two modals.
Everything else — state (`tab`, `success`, two `*Target`s, `note`, `saving`),
the `useTableSort(dateField, …)` call, the `review()` fetch-PATCH-refetch-toast
function, the whole return skeleton — is identical.

**Fix.** A `<DataTableCard>` assembly that owns the skeleton:

```tsx
<DataTableCard
  title="Abuse Reports"
  actions={<TargetFilterSelect .../>}          // optional right-of-tabs slot
  tabs={{ items: [...], active: tab, onChange: setTab }}
  query={{ endpoint: "/api/admin/abuse-reports", key: "reports",
           params: { status, sort, dir, ...filter }, pageSize: ADMIN_PAGE_SIZE }}
  columns={[
    { header: "Target",   cell: (r) => <TargetCell r={r} /> },
    { header: "Reporter", cell: (r) => <AnonymousIdBadge id={r.reporter.anonymousId} role="LEARNER" /> },
    { header: "Reasons",  cell: (r) => <ReasonsCell r={r} /> },
    { header: tab === "pending" ? "Filed" : "Reviewed", sort: dateField, cell: (r) => ... },
    ...
  ]}
  empty={tab === "pending" ? "No reports awaiting review." : `No ${tab} reports.`}
  rowActions={tab === "pending" ? (r) => <ResolveDismissButtons r={r} /> : undefined}
/>
```

It composes the existing primitives — `usePaginatedList`, `useTableSort`,
`FeedbackBanner`, `Tabs`, `Pagination`, plus the R4 `LoadingRow`/`EmptyState`.
Each table then declares its columns and its per-row cells and nothing else.
Estimated: `ClassAppealTable`/`AbuseReportTable` → ~120 lines each; the plainer
ones (`StudentRoster`, `SessionTestsTable`) → ~80.

Keep the two learner *browser* grids (`ClassBrowser`, `TutorBrowser`) out of scope
for the first pass — they render cards, not a `<table>`, so they only share the
banner/spinner/empty/pagination bits (covered by R4).

---

### R2 — The "confirm + optional note" modal is copy-pasted 8× (🟢 High)

**Files:** `ClassAppealTable`, `AbuseReportTable`, `CertificationReviewTable`,
`ClassModerationTable`, `RegistrationApprovalTable`, `TopicRequestModerationTable`,
`UserManagementTable`, `QuestionBankManager` — each has a `{rejectTarget && (…)}`
block that is the same ~45 lines:

```tsx
<div className="modal modal-open">
  <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl shadow-xl space-y-3">
    <h3 className="font-semibold text-sm text-base-content">{question}</h3>
    <p className="text-xs text-base-content/60">{consequence}</p>
    <label className="form-control">
      <span className="label-text text-2xs font-semibold text-base-content/70 pb-1">{noteLabel}</span>
      <textarea value={note} onChange={...} rows={3} maxLength={500}
        placeholder={...} className="textarea textarea-bordered text-xs w-full focus:textarea-primary" />
    </label>
    <div className="modal-action pt-1">
      <button className="btn btn-ghost btn-sm" onClick={cancel} disabled={saving}>Cancel</button>
      <button className="btn btn-error btn-sm" onClick={submit} disabled={saving}>
        {saving && <span className="loading loading-spinner loading-xs" />}{verb}
      </button>
    </div>
  </div>
  <label className="modal-backdrop" onClick={cancel} aria-label="Close" />
</div>
```

Only `question`, `consequence`, `noteLabel`, `placeholder`, `verb`, and the tone
change between copies. Note `ConfirmDialog` already exists and is used *right next
to* this block for the no-note case — this is the same thing plus a textarea.

**Fix.** `<PromptDialog>` = `ConfirmDialog` + a `<textarea>` (+ `CharCount`, which
these blocks currently skip despite `maxLength={500}`), calling
`onConfirm(noteText)`:

```tsx
<PromptDialog
  open={rejectTarget !== null}
  title="Reject this appeal?"
  description="… stays moderated. The tutor is notified and can appeal again."
  noteLabel="Note for the tutor (optional)"
  notePlaceholder="Why the moderation stands."
  noteMax={500}
  confirmLabel="Reject"
  tone="danger"
  loading={saving}
  onConfirm={(note) => review(rejectTarget, "REJECT", note)}
  onCancel={() => setRejectTarget(null)}
/>
```

Removes ~350 lines and gives every note-modal the `CharCount` + focus handling for
free.

---

### R3 — 15 components hand-roll the `modal` shell; there is no `<Modal>` (🟠 Med)

`grep 'modal modal-open'` hits 15 non-`ConfirmDialog` files (`AddSessionModal`,
`SessionActions`, `SessionTestBuilder`, `SessionTestResults`, `QuestionFormModal`,
`ReportButton`, `RequestTopicButton`, plus the 8 from R2). Each repeats the
`modal modal-open` / `modal-box …` / `modal-backdrop` scaffold with its own
class-string variations (`rounded-2xl shadow-xl` vs `kt-card` vs `rounded-2xl
border`), and **none of the hand-rolled ones trap focus or close on Escape** —
only `ConfirmDialog` is consistent, and even it has no focus trap. The design
review (`design-review-2026-09-10.md`, ROUND-2 open issue "dialogs trap focus
while open and restore it on close") flags the same gap.

**Fix.** One `<Modal open onClose title size>` primitive that renders the
backdrop + box + a close affordance, traps focus, restores it on close, and closes
on Escape / backdrop click. `ConfirmDialog` and the R2 `PromptDialog` become thin
wrappers over it; `AddSessionModal` / `QuestionFormModal` / `ReportButton` etc.
render their body as children. Fixes the a11y gap once, everywhere.

---

### R4 — `LoadingRow` and `EmptyState` one-liners, 29× and 22× (🟠 Med)

- `<div className="flex justify-center items-center py-10"><span className="loading
  loading-spinner loading-md text-primary" /></div>` — **29 copies** (sizes vary
  between `py-10` / `py-12`, `loading-md` / `loading-lg`).
- `<div className="text-center py-8 text-base-content/40 italic text-sm">{msg}</div>`
  — **22 copies**.

**Fix.** `<LoadingRow />` (optional `size` / `label`) and
`<EmptyState>{message}</EmptyState>` (optional `icon`, `action`). Trivial, and it
lets R1's `DataTableCard` stay small. Do this one first — it's a mechanical
find-and-replace and unblocks the rest.

---

### R5 — `<CardSection>` wrapper, 33× (🟡 Med)

`<section className="card kt-card"><div className="card-body gap-{3,4}"><h2
className="card-title text-sm font-bold">{title}</h2> …` appears 33 times. The
redesign CSS already ships `.kt-card`, `.kt-card-body`, `.kt-card-head` for
exactly this (see `globals.css`), but the components use the DaisyUI `card` /
`card-body` / `card-title` classes instead, so the CSS recipe is dead and the
markup is repeated.

**Fix.** `<CardSection title actions gap>` rendering `.kt-card` > `.kt-card-body`
(+ `.kt-card-head` when `title`/`actions` are present). Aligns the components with
the design layer and removes the wrapper boilerplate. Pairs naturally with R1.

---

### R6 — Two tables reimplement `SortableTh` (🟡 Low)

`AuditLogTable` and `ChatbotMissesTable` each carry a local `sortHeader(label, k)`
helper + a `toggleSort` that duplicates `useTableSort` + `SortableTh` (which every
*other* admin table already uses). `ChatbotMissesTable`'s version even renders no
neutral "unsorted" chevron, so its headers look different from the rest of the
portal.

**Fix.** Delete the local helpers; use `useTableSort` + `<SortableTh>`. ~20 lines
each and the portal's sort affordance becomes uniform.

---

### R7 — fetch + `useEffect` + loading/error/cancel dance, 13× (🟡 Low)

`useFetchList` exists (used in 4 files) but 13 components hand-roll the same
pattern — `let cancelled = false; (async () => { try { setLoading(true); const res
= await fetch(...); ... } catch ... finally ... })(); return () => { cancelled =
true }`. Clean candidates: `MyReportsList`, `MyProgressView`, `ClassProgressPanel`,
`SessionTestResults` (single GET → `{data, loading, error}`).

**Fix.** Either widen `useFetchList` to a general `useResource<T>(url)` returning
`{ data, loading, error, refetch }`, or just point the 4 simple ones at the
existing hook. Lower priority — the other 9 (`GlobalSearch`, `NotificationBell`,
`SessionTestBuilder`, …) have bespoke debounce/polling/multi-request shapes and
shouldn't be forced into one hook.

---

### R8 — Two trivial shared helpers (🟡 Low)

- `VIOLATION_LABEL[x as keyof typeof VIOLATION_LABEL] ?? x` is written inline in
  `MyReportsList`, `AbuseReportTable` (as `label()`), and `ReportButton`. Export
  `violationLabel(type: string): string` from `src/lib/reportViolations.ts`
  (where `VIOLATION_LABEL` already lives).
- `<Link href={`/admin/audit-log?q=${id}`} className="text-2xs text-primary
  hover:underline …">View audit log</Link>` is in `ClassAppealTable`,
  `AbuseReportTable`, and `src/app/admin/users/[id]/page.tsx`. A
  `<AuditLogLink targetId>` removes the magic query-string.

---

### What's already clean — don't touch

- `src/components/ui/*` — right set of primitives, single-responsibility, already
  reused. `ConfirmDialog`, `SortableTh`, `FeedbackBanner`, `Pagination`, `Tabs`,
  `FormField`, `CharCount`, `StatusBadge`, `AnonymousIdBadge`, `PageHeader`.
- `src/hooks/*` — `usePaginatedList` / `useTableSort` / `useFetchList` /
  `useSubjectCatalog` / `useTopicCertifications` are small and cleanly scoped
  (35–52 lines each per the clean-code review).
- `PortalLayout` is the one shell for all three portals — no per-portal copy.
- `WeeklyTimetable` was already de-duplicated (moved to `src/components/schedule/`
  with an `hrefFor` prop) in Changes.md Part 52.
- Date formatting was consolidated into `src/lib/datetime.ts` in Part 56 — no
  action here.

---

### Suggested order

1. **R4** — `LoadingRow` + `EmptyState`. Mechanical, unblocks everything else. (~1h)
2. **R2** — `PromptDialog`. Self-contained, removes ~350 lines, improves 8 modals. (~2h)
3. **R3** — `Modal` shell; refactor `ConfirmDialog` + `PromptDialog` onto it, then
   the 7 bespoke modals. Closes the focus-trap a11y gap. (~half day)
4. **R5** — `CardSection`. (~2h, codemod-ish)
5. **R1** — `DataTableCard`; migrate the two near-identical tables
   (`ClassAppealTable`, `AbuseReportTable`) first as the proof, then the rest one
   per PR. (~1 day for the component + first two, then incremental)
6. **R6 / R7 / R8** — opportunistic, when next touching those files (Boy-Scout).

Each step is independently shippable and testable against the existing Vitest
suite — none changes an API or a rendered outcome, only where the markup lives.


---

## Clean-Code Review — Katuwang `src/`

**Date:** 2026-09-09
**Standard:** Robert C. Martin, *Clean Code* Ch. 17 (TypeScript adaptation — see `.claude/skills/typescript-clean-code`)
**Scope:** `src/**` (396 `.ts`/`.tsx` files, ~43k LOC). Review is static reading + pattern search, not a full line-by-line audit.

---

### TL;DR

The codebase is **in good shape**. No `any` at boundaries, no `@ts-ignore`, no `eslint-disable`, no commented-out code, no stray `console.log`, no dead-obvious duplication of business rules. Scoring/matching logic is well-factored with named weight constants and TSDoc.

Findings are almost all **low-severity polish**: scattered constants that should be shared, a few oversized client components, and repeated date-math and date-formatting that wants a helper. Nothing here blocks a commit; treat this as a cleanup backlog.

| Severity | Count | Nature |
|---|---|---|
| 🔴 High | 0 | — |
| 🟠 Medium | 3 | Oversized components (G30/G34), duplicated scoring ladder (G5), duplicated role→href logic (G5) |
| 🟡 Low | 6 | Magic date arithmetic (G25), scattered `PAGE_SIZE` (G25/G5), inline `toLocaleString` vs helper (G5), repeated `Object.keys(...) as string[]` (TS3), local `formatDate` copies (G5), `SESSION_MS` naming spread |
| ✅ Good | — | See "What's already clean" |

---

### 🟠 Medium

#### M1 — Two oversized "god" client components (G30, G34, G5)

| File | LOC | `useState` calls |
|---|---|---|
| `src/components/admin/QuestionBankManager.tsx` | 1037 | 19 |
| `src/components/tutor/SessionTestBuilder.tsx` | 735 | 29 |
| `src/components/admin/SubjectTopicManager.tsx` | 526 | 17 |

**Rule:** G30 (functions/components do one thing), G34 (one abstraction level), F1 (a component juggling 20–29 pieces of local state is past the argument/So-C budget).

**Why it matters:** `SessionTestBuilder` with 29 `useState` hooks mixes form state, modal state, async submit state, question-picker state and validation in one function body. Every edit touches an 700-line file and risks unrelated regressions; the render tree can't be reasoned about locally.

**Fix (incremental, no behaviour change):**
- Extract cohesive state groups into custom hooks: `useSessionTestForm()`, `useQuestionPicker()`, `useSubmitState()`.
- Split sub-views into child components (`<QuestionList>`, `<AddQuestionModal>`, `<TestHeaderForm>`).
- `QuestionBankManager` already has an internal `// ─── Types ───` section — that's a signal it should be 3–4 files (`questionBank.types.ts`, `<CoverageTab>`, `<RequestsTab>`, `<AttemptsTab>`).

Target: no client component over ~300 LOC / ~10 `useState`.

---

#### M2 — The grade-match scoring ladder is duplicated (G5, G25)

**Locations:**
- `src/lib/matching.ts:8-9,144-152` — `WEIGHTS.gradeExact/gradeAdjacent/gradeAny` + the `exact ? … : adjacent ? … : any ? … : 0` ternary.
- `src/lib/browseRanking.ts:16-18,52-60` — the **same** three weights (identical values `6 / 3 / 2`) and the **same** ternary shape.

**Why it matters:** Two files encode the same rule ("exact grade beats adjacent beats open beats none") with copy-pasted weights. If the product decides adjacent-grade should score 4, someone will change one and miss the other — a silent ranking bug.

**Fix:** Add to `src/lib/matching.ts`:
```ts
export const GRADE_WEIGHTS = { exact: 6, adjacent: 3, any: 2, none: 0 } as const;
export function gradeScore(match: GradeMatch): number {
  return GRADE_WEIGHTS[match];
}
```
Then both `scoreClass` and `scoreBrowseClass` call `gradeScore(gradeMatchFor(...))`. `browseRanking.ts` already imports `gradeMatchFor` from `matching.ts`, so the dependency direction is fine.

---

#### M3 — Role → portal-path mapping is re-implemented per call site (G5, G23, G28)

**Locations:**
- `src/app/api/search/route.ts:99-104` — `role === "STUDENT_LEARNER" ? "/learner/classes?q=…" : role === "STUDENT_TUTOR" ? "/tutor/classes?q=…" : "/admin/classes?q=…"`.
- Same three-way `role` ternary repeats for the class/tutor/topic result groups within that one file, and the `intents.ts` links (`src/lib/chatbot/intents.ts:99,110-115,129-134,162-166`) hand-roll `role === LEARNER ? "/learner/…" : … : "/admin/…"` over and over.

**Why it matters:** The portal prefix (`/learner` | `/tutor` | `/admin`) is a first-class concept with no single source of truth. Adding a role or renaming a portal segment is a shotgun edit.

**Fix:** One helper:
```ts
// src/lib/portalPaths.ts
const PREFIX: Record<Role, string> = {
  STUDENT_LEARNER: "/learner",
  STUDENT_TUTOR: "/tutor",
  ADMIN: "/admin",
};
export const portalPath = (role: Role, sub: string) => `${PREFIX[role]}${sub}`;
```
`portalPath(role, "/classes?q=" + encodeURIComponent(t.name))`. Removes ~4 ternaries in `search/route.ts` alone.

---

### 🟡 Low

#### L1 — Magic millisecond arithmetic for "a day" / "a week" (G25, G33)

`24 * 60 * 60 * 1000` and friends appear hand-written in 8+ places with slightly different orderings:

| File:line | Expression |
|---|---|
| `src/lib/moderation.ts:5` | `durationDays * 24 * 60 * 60 * 1000` |
| `src/lib/browseRanking.ts:68` | `(nextMs - now) / (1000 * 60 * 60 * 24)` |
| `src/lib/matching.ts:154` | `(…getTime() - now) / (1000 * 60 * 60 * 24)` |
| `src/app/learner/page.tsx:19` | `now.getTime() + 7 * 24 * 60 * 60 * 1000` |
| `src/app/learner/tutors/[tutorId]/page.tsx:110` | same `7 * 24 * 60 * 60 * 1000` |
| `src/app/tutor/page.tsx:88` | same `7 * 24 * 60 * 60 * 1000` |
| `src/lib/passwordReset.ts:10` | `30 * 60 * 1000` (has a `// 30 minutes` comment — the good pattern) |
| `src/lib/classSessions.ts:25,34,37` | `s.duration * 60_000` (uses `60_000` — inconsistent with `60 * 1000` elsewhere) |

**Fix:** `src/lib/datetime.ts` (already exists) gains:
```ts
export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;
export const daysBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY_MS;
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
```
`const weekAhead = addDays(now, 7);` reads its own intent. Also standardise on `MINUTE_MS` vs the `60_000` / `60 * 1000` split.

---

#### L2 — `PAGE_SIZE` / `DEFAULT_PAGE_SIZE` redeclared ~30 times (G25, G5, G11)

`DEFAULT_PAGE_SIZE = 10` is declared independently in ~20 API routes; `PAGE_SIZE = 10` in ~10 admin table components (`RegistrationApprovalTable`, `ClassModerationTable`, `UserManagementTable`, `QuestionBankManager`, …). Values also disagree: `10`, `12`, `25`, `8`, and bare `take: 5` / `take: 8` / `take: 100` literals in page components (`src/app/learner/page.tsx:31`, `src/app/admin/page.tsx:45`, `src/app/api/dev/route.ts:89`).

**Why it matters:** Not a bug, but "the admin list page size" has no canonical definition, and the client `PAGE_SIZE` must be kept in lockstep with the server `DEFAULT_PAGE_SIZE` by hand.

**Fix:** `src/lib/pagination.ts` exporting `ADMIN_PAGE_SIZE = 10`, `BROWSE_PAGE_SIZE = 12`, `AUDIT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 50`. Import on both sides. Replace bare `take: 5` literals with a named `DASHBOARD_PREVIEW_COUNT`.

---

#### L3 — Inline `toLocaleDateString`/`toLocaleString` instead of the shared helper (G5, G6)

`src/lib/datetime.ts` exports `formatDateTime(iso)` — but 33 call sites across 24 files call `date.toLocaleDateString(...)` / `.toLocaleString(...)` directly with their own option objects (e.g. `src/components/admin/AuditLogTable.tsx`, `ClassAppealTable.tsx`, `QuestionBankManager.tsx`, `src/components/classes/ClassCard.tsx`, `SessionsList.tsx`, `src/app/admin/page.tsx`).

**Why it matters:** Date presentation drifts — some show `"Aug 30, 2026"`, some `"August 30, 2026 at 3:00 PM"`, some `"8/30/2026"`. A locale/format policy change can't be made in one place.

**Fix:** Grow `datetime.ts` into the single formatting module: `formatDate`, `formatDateTime`, `formatTime`, `formatRelative`. Codemod the 33 call sites. Delete the local one-off helpers in L4.

---

#### L4 — Copy-pasted local `formatDate` helpers (G5, F4-adjacent)

- `src/app/tutor/students/[studentId]/page.tsx:14` — `function formatDate(d: Date)`
- `src/components/tutor/AssessmentHistory.tsx:29` — `function formatDate(dateStr: string)`
- `src/components/admin/ChatbotMissesTable.tsx:28` — `const formatWhen = (iso: string) => …`

Three private near-identical date formatters. Fold into L3's `datetime.ts` and delete.

---

#### L5 — `Object.keys(SUBJECT_TOPICS) as string[]` repeated 7× (TS3, G5)

**Locations:** `src/lib/subjects.ts:36`, `src/lib/chatbot/recommend.ts:21`, `src/app/api/dev/route.ts:32`, `src/app/api/admin/assessment-questions/coverage/route.ts:39`, `src/hooks/useSubjectCatalog.ts:14`, `src/components/admin/QuestionBankManager.tsx:19`, plus `Object.values(Role) as string[]` in `src/app/api/admin/chatbot-misses/route.ts:26`.

**Why it matters:** The `as string[]` cast is a smell — it papers over `SUBJECT_TOPICS`'s key type. Each copy is a place the cast could go wrong if the source type changes.

**Fix:** Export the derived list once from where the data lives:
```ts
// src/lib/subjectTopics.ts
export const SUBJECT_SLUGS = Object.keys(SUBJECT_TOPICS) as Array<keyof typeof SUBJECT_TOPICS>;
```
Import `SUBJECT_SLUGS` everywhere; no re-casting. Consider `satisfies` on `SUBJECT_TOPICS` so the keys are a real union.

---

#### L6 — `60_000` vs `60 * 1000` vs `1000 * 60 * 60 * 24` ordering inconsistency (G11)

Covered by L1's fix, called out separately because it's purely a **consistency** issue: `classSessions.ts` uses `60_000`, the API session routes use `duration * 60 * 1000`, the ranking files use `1000 * 60 * 60 * 24`. Pick one convention (named constants) and apply everywhere.

---

### ✅ What's already clean (keep doing this)

- **Boundaries are typed.** Zero `: any` / `as any` in non-test `src/`. Public helpers in `src/lib/` have explicit interfaces and return types (`MatchResult<T>`, `BrowseRankContext`, `SearchGroup`).
- **No suppression debt.** No `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, or `eslint-disable` anywhere in `src/`.
- **No commented-out code**, no author/ticket/date metadata in comments (C1, C5). The `XXX` grep hits are all legitimate (`STU-XXXX` ID templates, phone-format docs).
- **Scoring logic is exemplary (G25, C4).** `matching.ts` / `browseRanking.ts` name every weight as a `const WEIGHTS = { … } as const` with a rationale comment per line, and `SOONNESS_HORIZON_DAYS` is named. M2 is the only blemish.
- **Comments explain *why*, not *what*** — e.g. `moderation.ts:8` ("there is no background job in this app, so this runs on the read paths"), `search/route.ts:13` (scope rationale). This is the C4 ideal.
- **Env is one-command (E1, E2):** `pnpm build`, `pnpm test` (`vitest run`), `pnpm lint`. `package.json` scripts are minimal and standard.
- **Small focused hooks** — `useFetchList` (35 LOC), `useTableSort` (41), `useTopicCertifications` (52) each do one thing with a clean cancellation guard.
- **Law of Demeter respected** — no `a.b.c.d` train-wrecks or deep `?.?.?.` chains found.
- **DRY where it counts** — no duplicated auth/RBAC guards, validation, or business rules across routes; shared logic already lives in `src/lib/` (`classQueries`, `topicRequestVisibility`, `subjects`, `settings`).

---

### Suggested order of work

1. **M2** — dedupe grade scoring (30 min, prevents a real ranking bug). ✅ highest value.
2. **L1 + L6** — add `DAY_MS`/`MINUTE_MS`/`addDays`/`daysBetween` to `datetime.ts`, codemod. (1 h)
3. **L3 + L4** — consolidate date formatting into `datetime.ts`, delete local copies. (1–2 h)
4. **M3** — `portalPath()` helper, refactor `search/route.ts` + `intents.ts`. (1 h)
5. **L2 + L5** — shared `pagination.ts` and `SUBJECT_SLUGS` exports. (1 h)
6. **M1** — split `SessionTestBuilder` / `QuestionBankManager` / `SubjectTopicManager`. Schedule as its own task; do it opportunistically when next touching those files (Boy-Scout rule).

None of the above changes runtime behaviour; each is independently testable against the existing Vitest suite.


---

## Security Review — Katuwang codebase

> **Status:** all six findings addressed in **Changes.md Part 57** (2026-09-10) —
> rate limiting, `/api/dev` ADMIN gate, generic login error + dummy compare,
> security headers + `next.config` fix, JWT role/status re-sync, password
> max-72-bytes + common-password blocklist. Nonce-based CSP and `/api/**`
> status enforcement remain as noted follow-ups.

- **Date:** 2026-09-09
- **Scope:** local repo, `cleanup` branch
- **Method:** static analysis only — no code executed, no live target contacted
- **Reviewer:** Claude Code (`/01-recon-osint` invoked; redirected to a source audit since the ask was "check the security of this codebase")

---

### Executive summary

The codebase is in good shape on the fundamentals: all DB access goes through
parameterized Prisma (zero raw SQL), no `dangerouslySetInnerHTML`, bcrypt cost 12,
RBAC checks are applied consistently in every API route, and object-ownership
checks return 404-not-403 to avoid ID confirmation. The double-blind anonymity
mandate (RA 10173) is enforced by gating real-name exposure behind an admin
setting.

The gaps are concentrated in **abuse resistance** (no rate limiting anywhere) and
a **dev-only endpoint that is dangerous if deployed outside production**. No
critical remote-code or injection issues were found.

---

### Findings

#### 1. No rate limiting on any endpoint — MEDIUM/HIGH

A search for rate-limit / throttle / 429 across `src/` returns nothing.
Consequences:

- **`/api/auth/[...nextauth]` (login)** — unlimited password guessing /
  credential stuffing against a K-12 user base likely to have weak passwords.
- **`/api/auth/forgot-password`** — email-bombing any address, and unbounded
  `passwordResetToken` row creation.
- **`/api/register`** — automated bulk account creation.
- **`/api/chatbot`, `/api/search`** — cheap DB-load amplification per
  authenticated user.

**Fix:** add an IP + identifier limiter (e.g. `@upstash/ratelimit`, or a small
in-memory / DB token bucket in `src/proxy.ts` or a shared helper) on the auth and
public routes at minimum.

---

#### 2. `/api/dev` has no authentication — MEDIUM (deployment-dependent)

`src/app/api/dev/route.ts` is guarded **only** by
`process.env.NODE_ENV === "production"`. On any staging / preview / `next start`
deploy where `NODE_ENV` is not exactly `"production"`:

- `GET /api/dev` returns **first name, last name and email of every user**
  (tutors + learners) — a direct breach of the anonymity design.
- `POST /api/dev` with `{"action":"createUsers","role":"ADMIN"}` creates a working
  **ADMIN account** (`consentGiven: true`, known password `password123`) with no
  auth at all.

**Fix:** also require an `ADMIN` session, or gate behind an explicit
`ENABLE_DEV_ROUTES` env flag that is unset everywhere but local dev, and never
register the route in the production build.

---

#### 3. User enumeration in `authorize()` — LOW/MEDIUM

`src/lib/auth.ts:23-33` throws distinct messages:
`"No account found with that email."` vs `"Incorrect password."`, and skips
`bcrypt.compare` entirely when the user is absent (timing side-channel). An
attacker can enumerate valid accounts. The forgot-password route, by contrast, is
correctly neutral — mirror that here: one generic
`"Invalid email or password."` and run a dummy `bcrypt.compare` against a fixed
hash on the no-user path.

---

#### 4. No security headers / malformed `next.config` — LOW/MEDIUM

`next.config.ts` sets no `headers()` — missing `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options` / `frame-ancestors` (clickjacking),
`X-Content-Type-Options`, `Referrer-Policy`.

The file is also structurally broken: it assigns
`module.exports = { allowedDevOrigins: [...] }` **and** `export default nextConfig`.
Next uses the default export, so `allowedDevOrigins` is silently dropped.

**Fix:** consolidate into the single `nextConfig` object and add an
`async headers()` block.

---

#### 5. JWT sessions are not revocable — LOW

Session strategy is JWT with `maxAge: 8h` (`src/lib/auth.ts:107-110`). The `jwt`
callback only populates on sign-in and the `session` callback never re-reads the
DB, so an admin who **suspends or bans** a user (a real feature here) does not cut
off that user's existing session for up to 8 hours.

**Fix:** a lightweight per-request status check (middleware hitting a cached
`user.status`) or a shorter `maxAge`.

---

#### 6. Weak password policy — LOW

`src/lib/validations/auth.ts`: `password: z.string().min(8)` — no complexity, no
breach-list check, and **no max length** (bcrypt truncates silently at 72 bytes).

**Fix:** add `.max(72)` and consider a minimal common-password blocklist.

---

### Confirmed-good (no action needed)

- **Password reset:** 256-bit random token, SHA-256 stored, single-use, 30-min
  TTL, prior tokens invalidated, neutral response even on mail failure
  (`passwordReset.ts`, `forgot-password/route.ts`).
- **No SQL injection surface** — every query is Prisma query-builder;
  `search/route.ts` uses `contains` filters, not raw strings.
- **API RBAC is consistent:** all 31 admin route files check `role === "ADMIN"`;
  IDOR-sensitive routes verify `learnerId` / `tutorProfileId` ownership before
  acting, returning 404 rather than 403.
- **Registration cannot escalate role** — `type` is a Zod discriminated union
  (`LEARNER` | `TUTOR` only), mapped server-side in `registerAccount()`.
- **Secrets:** `.env*` is gitignored; no secrets committed.
- **No XSS sinks:** no `dangerouslySetInnerHTML` anywhere in `src/`.
- **Chatbot** is intent/keyword-based, not an LLM — no prompt-injection surface.

---

### Recommended next steps

1. Add rate limiting (Finding 1) — highest ROI.
2. Lock down or remove `/api/dev` before any non-local deploy (Finding 2).
3. Add `headers()` and fix `next.config` (Finding 4).
4. Neutralize the login error messages (Finding 3).

