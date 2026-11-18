# Admin portal unslop audit — 2026-11-18

Scope: every route under `src/app/admin/`, the modals and dialogs reachable from them, the admin components in
`src/components/admin/`, and the shared pieces only admin pages use (`PromptDialog`, `ActionMenu`, `SortableTh`,
`StatCard`, `AuditLogLink`, `EmptyState`, `RecommendClassForm`, `charts/DataTable`, `charts/BarChartCard`).
Method: grep for the rubric's tells, then a look in the browser as the demo super admin (1280px and 375px).
Reference: `.claude/skills/public-page-restyle/references/unslop-rubric.md`. Rules applied:
`docs/plans/admin-portal-unslop.md`.

## Findings

| Where | Tells (before) | Severity |
|---|---|---|
| Whole portal | 10–12px body text everywhere (`text-2xs`, `text-xs`, `btn-xs … text-2xs` row actions, `input-sm`/`select-sm`/`textarea-sm … text-xs` fields, `table-sm` + `tr text-xs`) | Critical |
| `/admin` dashboard | 4 identical stat tiles with tinted icon chips; "Flagged accounts" and "Active classes" shown twice (tiles + list); `order-*` swapped the two columns so reading/tab order differed from the screen (WCAG 1.3.2 / 2.4.3); italic dashed empty box; 11px "By ADM-0001"; "Admin" pill next to the title; "Signed in as…" filler | Critical |
| Every table page | `card-title text-sm font-bold` heading inside the card repeating the page `h1` ("All Classes" under "All Classes", "Pending Registrations", "Abuse Reports"…); `rounded-xl border` table box inside the card; mobile rows as boxed cards | High |
| Status and IDs | `StatusBadge size="xs"` 10.5px pills; `AnonymousIdBadge` 10px mono pills; count pills ("15 req", "15/15 ready"); `kt-badge` role pills | High |
| `/admin/classes` | class codes in `font-mono` split "CUR-0402" over two lines; three stacked 10px View/Suspend/Ban buttons per row | High |
| `/admin/assessment/question-bank` | raw subject slugs as headings ("JHS_ARALING_PANLIPUNAN") and in the breadcrumb; boxes in boxes (breadcrumb box, list boxes, coverage box) | Critical |
| `/admin/reports` | DaisyUI `stats` tile strip with 11px titles; uppercase tracked eyebrow; gradient area fill; 9–10px axis ticks; Title Case chart titles; chart titles as `h3` under the `h1` (skipped level) | High |
| `/admin/users/[id]` | raw enums ("USER STATUS CHANGE", "tutor") and raw audit JSON in the history; italic dashed empty box; `AnonymousIdBadge showIcon` | High |
| `/admin/subjects` | `font-mono text-2xs` code lines, `input-xs` fields, `btn-xs` buttons, `menu-xs`; italic faint empty states; `CurriculumCoverage` legend at 11px | Critical |
| `/admin/settings` | 11px help text, `select-sm`/`input-sm`; raw enums in copy ("CERTIFIED certification", "created as PENDING") | High |
| `/admin/admins` + create modal | 3 stat tiles; tinted success/notice boxes; jargon ("Provision Admin Account"); mono email | High |
| Dialogs (`PromptDialog`, modals) | 14px bold title, 11px note label, `btn-sm` actions; Cancel as `btn-neutral btn-outline` | Medium |
| Copy | Title Case headings, labels, buttons and select placeholders ("All Statuses", "Manage Account"); sidebar "Certificate Management" | Medium |
| `Pagination` (shared) | `font-mono` + 12px page count | Medium |

## Keep (left alone)

- Real data tables with sortable headers (`SortableTh`, `aria-sort`) and the `usePaginatedList` paging.
- `min-h-11` touch targets and the portal's phone rules.
- `ConfirmDialog` / `Modal` (already restyled in the tutor pass), `FeedbackBanner`, `LoadErrorState`.
- Notifications, Help, Completion certificates list (restyled in earlier passes).
- `StatusBadge` and `AnonymousIdBadge` themselves — the landing page and learner/tutor pages use them.

## What changed

- New `StatusText` (coloured text + dot) and `AnonymousIdText` (serif `kt-id`, role colour) replace the pills on
  admin pages. `StatCard` is deleted.
- Dashboard on the `/tutor` pattern: one line of linked numbers, "Needs attention" first in the DOM, readable
  activity rows; no tiles, no `order-*`.
- Every table: inner duplicate headings removed, one card level, divided rows on phones, default-size fields and
  buttons, 14–16px text, sentence case. `/admin/classes` rows: View + a "⋮" moderation menu on desktop.
- Question bank: subject names via `subjectDisplayLabel`; plain-text counts ("15 open requests · 15 of 15 topics
  ready"); boxes flattened.
- Analytics: numbers line instead of tiles, flat chart fill, 12px ticks, serif `h2` chart titles.
- Users/[id]: readable role, audit action and audit reason (same helpers as the dashboard).
- Dialogs: serif titles, full-size labels/fields/buttons, ghost Cancel, `FormField size="md"`.
- Sidebar labels and page titles in sentence case.

## Non-styling bugs found (not fixed — need a decision)

| Bug | Where |
|---|---|
| Reason hint says "Optional — shown for your own records", but class reasons are shown to tutors/learners (`suspendedReason`) and request reasons go into the learner's notification | `ClassModerationTable.tsx`, `TopicRequestModerationTable.tsx` (moderation modals) |
| User page subtitle says "Read-only … Moderate from the accounts table" but the page has avatar moderation actions | `src/app/admin/users/[id]/page.tsx` |
| "An activation email has been queued" even when `sendMail` fails (only `console.warn`) | `CreateAdminModal.tsx`, `src/app/api/admin/admins/route.ts` |
| "Removed and deleted from cloud storage" shown even when the UploadThing delete fails | `UserAvatarModerationCard.tsx`, `api/admin/users/[userId]/avatar-action/route.ts` |
| Class appeal row "was {status}" shows the class's *current* status (Approved tab reads "was Scheduled") | `ClassAppealTable.tsx` |
| Session tests sort only the current page in the browser; default sort field isn't a column | `SessionTestsTable.tsx` |
| Raw subject slugs in learner/tutor notification text | `api/admin/topic-requests/[id]/route.ts`, `api/tutor/classes/[classId]/appeal/route.ts` |
| Raw database ids shown: audit log target id, certification "Passing assessment" attempt id | `AuditLogTable.tsx`, `CertificationReviewTable.tsx` |
| Re-open request reuses reason text left from a cancelled Close dialog | `TopicRequestModerationTable.tsx` |
| Banned class shows "Duration: Indefinite" (a ban is permanent) | `src/app/admin/classes/[id]/page.tsx` |
| Recommendation note "shown only to you and other admins" is never displayed; dismissed recommendations look active; search input has no label | `RecommendClassForm.tsx` |
| "1 questions approved"; `?? 5` hard-coded min bank size; detail can show "undefined%"; list fetch runs before a subject is picked | `QuestionBankManager.tsx` |
| Approve modal can be closed mid-save; failed approve on an empty list shows "could not be loaded"; date sorts offered on Pending tab | `CertificationReviewTable.tsx` |
| Page copy: question bank "tune each topic's quiz" (tuning is platform-wide); results "completed attempts" (list includes in-progress/practice); chatbot "grouped by frequency" (grouped by wording) | `assessment/question-bank`, `assessment/results`, `chatbot` pages |
| Subject/topic reorder sends two PATCHes; a failed second one leaves duplicate `order` values | `SubjectTopicManager.tsx` |
| Browser-tab titles still Title Case and some don't match the `h1` ("Manage Classes", "Review Certifications") | `metadata` in admin pages |

Fixed in passing because they are raw enums shown to people (rule 6): "is now SUSPENDED" success messages, raw
subject slug in the qualification review modal, raw audit action/JSON on the user page.

## Sidebar and header (`PortalLayout`, `GlobalSearch`, `globals.css`) — shared by all three portals

| Tell (before) | Evidence | Severity |
|---|---|---|
| Avatar in tutor ube for admins and learners (role colour on the wrong role); 11.5px initials | `.kt-avatar` — `background: var(--kt-tint-tutor)`, `font-size: 0.72rem` | High |
| Grey tinted icon chip behind every nav icon; filled blue chip on the active item | `.kt-nav-item .kt-ic` | High |
| 13px nav items; 12.8px group labels in the faint grey | `.kt-nav-item` 0.82rem, `.kt-nav-label` 0.8rem `--kt-faint` | Critical |
| "⌘K" shortcut hint shown on Windows/Linux (Ctrl+K is what works there), 12px | `GlobalSearch` `<kbd>` | Medium |
| Unread count as a 10px red pill | `badge badge-error badge-xs` | Medium |
| "Log Out" in Title Case, faded red (alarm colour for a routine action) | `text-error/80` | Medium |
| 12px search-result group labels and subtitles; 30%-opacity enter icon | `GlobalSearch` | Medium |

Keep: collapsible nav groups with stored state, the drawer's focus trap, the serif "Your ID" footer, the sticky topbar.

Changed: avatar coloured by role (`kt-avatar--tutor` / `--learner`, brand blue for admins) at 13.6px; nav icons
without chips (active icon in the primary colour); nav items 15px; group labels 13.6px in the muted grey; unread
count as red text + "unread" for screen readers; "Log out" in muted text; ⌘K hint removed (`aria-keyshortcuts` on
the search box instead); search dropdown text 14px. Checked as admin (1280px, 375px drawer), tutor and learner
(1280px) after a dev-server restart.

Not changed: learner nav labels are still Title Case ("Browse Classes", "Find Tutors", "My Classes" …) — the
settings copy quotes some of them, so renaming them is a separate change.

## Checks

- `pnpm exec tsc --noEmit` clean; `pnpm lint` clean.
- `pnpm test`: 1432 passed, 1 failed — the known `ValidatedForm.test.tsx` add-session case, which already fails on develop.
- Browser (demo super admin): dashboard, users, classes (+ moderation menu and Suspend dialog, cancelled), question
  bank, analytics at 1280px; dashboard, users, classes, question bank, subjects, settings, admins, analytics at
  375px — only IBM Plex Serif/Sans render, no horizontal scroll, no console or server errors.
- Not exercised: any save/approve/decline/suspend flow (they write to the shared database) — listed in
  `docs/backlog/TOTEST.txt`.
