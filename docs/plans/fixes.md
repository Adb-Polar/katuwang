# Fixes & Redesign Backlog — Plan

## Context

`docs/plans/fixes.txt` is a raw, unordered dump of ~55 fix/redesign items collected
over the Sept 5–6 review sessions plus later "Additions" and a "Redesign" wishlist.
Most Sept 5/6 items were already shipped (Changes.md Parts 29–35) but the txt file
was never reconciled. This doc audits every line, then sequences the remaining work
into low-risk, dependency-ordered phases. Each phase is committed separately.

`fixes.txt` stays as the raw source until an item actually ships.

Legend: ✅ done · 🟡 partial · ⬜ not started

**Status (2026-09-06): Phases 1–6 all shipped** — Changes.md Parts 37–44
(commits after `1f8bc8c`). Phase 6 needed no migration after all
(`Notification.type` is a free-text column). Remaining `fixes.txt` items not
picked up by a phase are lower-priority visual polish (dashboard card copy,
403 page styling) — leave in `fixes.txt` for a later pass.

---

## Status audit

### Sept 5 updates — all shipped in Changes.md Part 31

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | `/learner/match` auto-match, reveal result | ✅ | `MatchFinder` form↔results `.kt-swap` fade (a 3-D flip was tried, dropped as distracting) |
| 2 | `/register/learner` password reveal (eye) | ✅ | `RegisterForm` eye toggles on both fields |
| 3 | `/learner/profile` contact validation + redesign | ✅ | `ProfileView` 2-col split; `src/lib/contactInfo.ts` |
| 4 | Global search shows tutor real name when admin setting on | ✅ | `GET /api/search` reads `showTutorRealNames` |
| 5 | `/tutor/assessments` request button reverts on tab switch | ✅ | `AssessmentsTabs` lifts the `requested` Set up |
| 6 | `/admin/notifications` — tutor question request not reflected | ✅ | `notifyMany` admins with `QUESTION_REQUEST_NEW` |
| 7 | `/tutor/profile` grade level + section editable | ✅ | Part 31 + `decisions.md` 2026-09-06 |
| 8 | `/admin/classes` suspend/ban button placement | ✅ | `ClassModerationTable` action `<td>` flex-wrap |
| 9 | `/admin/topic-requests` same | ✅ | `TopicRequestModerationTable` same fix |

### Sept 6 updates — shipped in Part 31 follow-ups

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Add-session UI not responsive | ✅ | `ClassScheduleFields` rows wrap on narrow screens |
| 2 | Add-class modal too big → whole page | ✅ | `/tutor/classes/new` + `/tutor/requests/[id]/accept` full pages |

Also shipped: nested-`<form>` / self-closing modals on the Edit Class page (Part 35).

### Additions

| # | Item | Status | Phase | Notes |
|---|---|---|---|---|
| 1 | Can't re-click sort on tables | ⬜ BUG | 1 | `useTableSort.toggle` calls `setDir` inside the `setSort` updater (impure; double-invoked in dev) |
| 2 | Class + users tables: sortable "code" column | 🟡 | 4 | Classes render `code`; make it a `SortableTh`. Users show `anonymousId` only in a badge — give it its own sortable "Code" column + `sort=anonymousId` on `/api/admin/users` |
| 3 | Character count on the appeal input | 🟡 | 2 | `ClassAppealCard` has `maxLength={500}`, no visible counter |
| 4 | Appeals should notify admin | ⬜ | 6 | New `NotificationType.CLASS_APPEAL_NEW` + `notifyMany` in the appeal POST route — **DB change** |
| 5 | `/admin/class-appeals` "View" button → related audit logs | ⬜ | 4 | `AuditLog` + `AuditLogTable` already exist; add a view panel filtered to the class |
| 6 | Visual timetable for upcoming sessions | ⬜ | 4 | `WeeklyScheduleView` is list-style; build a grid timetable |
| 7 | Verified badge green border | 🟡 | 2 | `BadgeCheck` is `text-success`, no border; extract a shared `VerifiedBadge` |
| 8 | `/tutor/assessments` | ⬜ | 4 | **Resolved:** take a topic's assessment without owning a class for it |
| 9 | Public vs Directed-to-me topic requests, tabs | 🟡 | 4 | `TopicRequestBrowser` tabs are Open/Accepted; add a Public / Directed split |
| 10 | `/tutor/classes/new` labels too small | 🟡 | 2 | `variant="page"` enlarged controls; `FormField` label still `text-2xs` |
| 11 | BUG: create-class duplicate-topic check case-sensitive | ⬜ BUG | 1 | `ClassScheduleFields` — checkbox `checked` uses exact-case `.includes`, dedup uses case-insensitive |

### Redesign — General

| Item | Status | Phase | Notes |
|---|---|---|---|
| All sentence inputs → char limit + counter | ⬜ | 3 | Build `CharCountField` (or extend `FormField`), roll out to description/instructions/reason/bio |
| Clear chat data on logout | ⬜ | 3 | `ChatWidget` persists `localStorage`; clear on logout in `PortalLayout` |
| Rename "Topic request" → "Class request" (UI copy only) | ⬜ | 5 | Label sweep, ~10 components; keep model/enum/route names |
| Edit profile → its own page (like edit class) | ⬜ | 4 | Move `ProfileEditForm` to `/{role}/profile/edit` |

### Redesign — Tutor

| Item | Status | Phase | Notes |
|---|---|---|---|
| Global search covers public class requests + placeholder copy | ⬜ | 4 | Extend `GET /api/search` tutor branch |
| Dashboard: card redesign + icon per card | 🟡 | 4 | |
| Dashboard: upcoming-session card more readable | ⬜ | 4 | |
| Dashboard: weekly schedule → timetable | ⬜ | 4 | Same component as Additions #6 |
| Classes: "class schedule" header too small | ⬜ | 2 | Typography |
| Classes: hover effect on class card | 🟡 | 2 | Make consistent |
| Classes: "Active" badge shows even when unpublished | ⬜ BUG | 1 | `activeLabel` shown regardless of `published` |
| Classes: disable all buttons when SUSPENDED/BANNED | 🟡 | 1 | Part 33 did the appeal card; audit other actions |
| Classes: 403 fallback page | 🟡 | 2 | `/app/unauthorized` exists; styling pass |
| Lock editing of a finished class | ⬜ | 1 | **Resolved: no editing** — `/tutor/classes/[classId]/edit` redirects for `COMPLETED` |
| Add-class page: topic search box | ⬜ | 3 | Filter over the topic checklist |
| Add-class page: description char counter | ⬜ | 3 | Covered by `CharCountField` rollout |
| Add-class page: session card contrast | ⬜ | 2 | Style pass on the session-rows block |
| Require-certification: only certified topics selectable on create-class | 🟡 | 4 | Accept flow already restricts; create flow needs the same gate on the platform setting |
| Roster "enrolled in" column = class code, not subject | ⬜ | 4 | `StudentRoster` column change |
| Take a topic's assessment without owning a class | ⬜ | 4 | New entry point in `AssessmentsTabs` |
| Profile: list certified topics | ⬜ | 4 | Add to `ProfileView` tutor variant |

### Redesign — Learner

| Item | Status | Phase | Notes |
|---|---|---|---|
| Enrolled learner can view an unpublished class | ⬜ | 1 | **Resolved:** show a "not published yet" placeholder instead of the full view; non-enrolled still 404 |

---

## Phases (one commit each)

### Phase 1 — Confirmed bugs & guardrails (no schema)
1. `useTableSort` re-click toggle — `src/hooks/useTableSort.ts`
2. Create-class case-insensitive topic dedup — `src/components/tutor/ClassScheduleFields.tsx`
3. "Active" badge on unpublished class — `src/components/tutor/ClassManagement.tsx` (+ class card component)
4. Disable row/detail actions on a SUSPENDED/BANNED class — audit `ClassDetailsView` / class page
5. Lock editing of a `COMPLETED` class — `src/app/tutor/classes/[classId]/edit/page.tsx` guard
6. Enrolled learner + unpublished class → placeholder — `src/app/learner/classes/[classId]/page.tsx`

### Phase 2 — Small isolated UI polish (no schema)
- Appeal input char counter — `ClassAppealCard`
- Shared `VerifiedBadge` with green border — new `src/components/ui/VerifiedBadge.tsx`, use in `TutorBrowser`/`ProfileView`
- `/tutor/classes/new` label size — `FormField` page variant
- Class-schedule header size, class-card hover consistency, session-card contrast
- 403/unauthorized page styling pass

### Phase 3 — Shared building blocks (no schema)
- `CharCountField` (or `FormField` `maxLength`+counter) + roll out to all free-text inputs
- Clear chat `localStorage` on logout — `PortalLayout` logout handler
- Topic search box over the add-class topic checklist — `ClassScheduleFields`

### Phase 4 — Feature-level (no schema)
- Sortable "Code" column: users table (+ `sort=anonymousId` on `/api/admin/users`); classes table `SortableTh` on code
- Public / Directed-to-me tabs — `TopicRequestBrowser`
- Tutor global search covers public class requests — `GET /api/search` + `GlobalSearch` placeholder
- Require-certification gate on create-class — `NewClassForm` / `ClassScheduleFields`
- Roster "enrolled in" = class code — `StudentRoster`
- Profile: certified topics (tutor) — `ProfileView`
- Take a topic's assessment without a class — `AssessmentsTabs` (+ check cert route doesn't assume a class)
- "View audit logs" on `/admin/class-appeals` — `ClassAppealTable` + `AuditLogTable`
- Tutor dashboard: icons + card redesign, readable upcoming-session card
- Upcoming-sessions timetable component (Additions #6 / weekly schedule)
- Edit profile → its own `/{role}/profile/edit` page

### Phase 5 — Copy rename sweep (last; mechanical)
- "Topic request" → "Class request" across UI strings only

### Phase 6 — Appeals notify admin ✅ (Part 44 — no migration; `Notification.type` is free-text)
- `"CLASS_APPEAL_NEW"` added to the `NotificationType` union + `notifyMany` of all active admins in `POST /api/tutor/classes/[classId]/appeal`

---

## Per-phase rules
- One `Changes.md` entry per phase; add `docs/TOTEST.txt` lines for every non-docs item.
- Phases 1–5 need no DB confirmation; Phase 6 does — stop and ask before the migration.
- Run `pnpm exec tsc --noEmit && pnpm lint && pnpm test` before each commit.
- Re-check `decisions.md` / `feature-checklist.md` when a rename or scope item lands.
- Commit after each phase; do not push unless asked.

## Verification highlights
- Phase 1: `useTableSort` unit test (repeat-click flips direction); manual — 3× click a header on `/admin/users`; add two case-differing topics on `/tutor/classes/new`, second rejected with no ghost count; open a `COMPLETED` class edit URL → redirected; enrolled learner opens an unpublished class → placeholder.
- Phases 2–4: tsc + lint + test green; the TOTEST lines added with each item.
- Phase 6: migration applied locally, tests green, manual — file an appeal → every admin notified with a link to `/admin/class-appeals`.

## Remaining open question (non-blocking)
- Sept 5 #1 shipped as a fade, not a literal flip card — cosmetic; left ✅ with a note.
