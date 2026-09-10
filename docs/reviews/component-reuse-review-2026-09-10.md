# Component Reuse & Duplication Review — Katuwang `src/components`

- **Date:** 2026-09-10
- **Scope:** all 96 files in `src/components/**`, plus `src/hooks/**`. Static reading
  + pattern search.
- **Goal:** find duplicated component code and markup that a shared component or
  hook could absorb, to cut the ~16.9k lines of component code.

---

## TL;DR

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

## R1 — The admin list-table shell is written ~12 times (🟢 High)

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

## R2 — The "confirm + optional note" modal is copy-pasted 8× (🟢 High)

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

## R3 — 15 components hand-roll the `modal` shell; there is no `<Modal>` (🟠 Med)

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

## R4 — `LoadingRow` and `EmptyState` one-liners, 29× and 22× (🟠 Med)

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

## R5 — `<CardSection>` wrapper, 33× (🟡 Med)

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

## R6 — Two tables reimplement `SortableTh` (🟡 Low)

`AuditLogTable` and `ChatbotMissesTable` each carry a local `sortHeader(label, k)`
helper + a `toggleSort` that duplicates `useTableSort` + `SortableTh` (which every
*other* admin table already uses). `ChatbotMissesTable`'s version even renders no
neutral "unsorted" chevron, so its headers look different from the rest of the
portal.

**Fix.** Delete the local helpers; use `useTableSort` + `<SortableTh>`. ~20 lines
each and the portal's sort affordance becomes uniform.

---

## R7 — fetch + `useEffect` + loading/error/cancel dance, 13× (🟡 Low)

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

## R8 — Two trivial shared helpers (🟡 Low)

- `VIOLATION_LABEL[x as keyof typeof VIOLATION_LABEL] ?? x` is written inline in
  `MyReportsList`, `AbuseReportTable` (as `label()`), and `ReportButton`. Export
  `violationLabel(type: string): string` from `src/lib/reportViolations.ts`
  (where `VIOLATION_LABEL` already lives).
- `<Link href={`/admin/audit-log?q=${id}`} className="text-2xs text-primary
  hover:underline …">View audit log</Link>` is in `ClassAppealTable`,
  `AbuseReportTable`, and `src/app/admin/users/[id]/page.tsx`. A
  `<AuditLogLink targetId>` removes the magic query-string.

---

## What's already clean — don't touch

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

## Suggested order

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
