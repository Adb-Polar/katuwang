# Repeated-Markup Scan — chunks that should be components

- **Date:** 2026-09-10
- **Scope:** `src/components/**` and `src/app/**/*.tsx`. Pattern search for JSX
  chunks that appear near-verbatim in 3+ files.
- **Relationship to the other reviews:** this is the fine-grained companion to
  `component-reuse-review-2026-09-10.md`. That one covers the big assemblies
  (R1 data-table shell, R2 prompt modal, R3 modal shell, R4 loading/empty,
  R5 card section). This one lists the smaller repeated blocks it didn't — the
  ones that are one component each, not a system.

---

## TL;DR

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

## C1 — The stat card (🟢 High)

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

## C2 — The back link (🟢 High)

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

## C3 — Grade-level label (🟠 Med)

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

## C4 — Search-input pill (🟠 Med)

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

## C5 — Approve / Reject action pair (🟠 Med)

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

## C6 — Chip list wrapper (🟡 Med)

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

## C7 — Notification row + read-state logic (🟠 Med)

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

## Already fine — don't extract

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

## Order

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
