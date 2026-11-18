# Admin portal unslop pass

Bring every `/admin` page, modal and admin-only component in line with the landing theme, the same way the learner
and tutor portals were done (see `docs/reports/tutor-portal-unslop-audit-2026-11-18.md`). Rubric and theme map:
`.claude/skills/public-page-restyle/references/{unslop-rubric,theme}.md`. Audit and outcome:
`docs/reports/admin-portal-unslop-audit-2026-11-18.md`.

## Shared pieces (done first, by hand)

- New `StatusText` (`src/components/ui/StatusText.tsx`): coloured text with a dot, `text-sm`. Admin tables use it
  instead of `StatusBadge` pills. `StatusBadge` itself is unchanged (learner/tutor pages and the landing sample use it).
- New `AnonymousIdText`: anonymous ID in the serif `kt-id` face, coloured by owner role. Admin pages use it instead of
  the 10px mono `AnonymousIdBadge` pill. The badge is unchanged (landing uses it).
- `Pagination` (no mono, 14px), `PromptDialog` (serif title like `ConfirmDialog`, full-size label/textarea/buttons),
  `ActionMenu` (14px items), `EmptyState` (no italic), `AuditLogLink`, `CatalogLoadState` (14px).
- `StatCard` deleted: the dashboard and Administrators page use a line of linked numbers instead of tile grids.
- Dashboard rewritten on the `/tutor` pattern; sidebar labels and page titles in sentence case.

## Per-component rules

1. **Sizes.** No `text-2xs`, `text-[0.66rem]`, or `text-xs` for real content (row text, labels, notes, buttons,
   timestamps). Body = default (1rem), secondary = `text-sm text-(--kt-muted)`. `text-xs` is acceptable only for a
   character counter. Remove `btn-xs`; `btn-sm` only for compact secondary actions inside dense table rows
   (prefer default size). Remove `input-sm`/`input-xs`/`select-sm`/`textarea-sm` and the `text-xs` on fields.
   Drop `table-sm`/`table-xs` and the `text-xs` on `<tr>`.
2. **Card headings.** `<h2 className="card-title text-sm font-bold">X</h2>` inside a card under a page `h1` that
   already says X → delete the h2. When a section heading is genuinely needed (several sections on one page),
   use `font-serif text-xl font-medium`.
3. **Boxes.** `card kt-card` > `card-body` wrapping a whole table: keep one `kt-card` level; no rounded bordered
   boxes inside it (`rounded-xl border` table wrappers inside a card → plain `overflow-x-auto`). Mobile card lists
   (`md:hidden` `article` with `rounded-xl border`) become divided rows (`border-b border-(--kt-border)`), not boxes.
4. **Status.** `StatusBadge` → `StatusText` (same `tone`/`label`, drop `size`). Count pills (`kt-badge`) in rows →
   plain text ("15 open requests").
5. **IDs.** `AnonymousIdBadge` → `AnonymousIdText` (same `id`/`role`; drop `size`/`showIcon`). Class codes:
   no `font-mono`; `font-medium` text, `whitespace-nowrap` so "CUR-0402" doesn't split.
6. **Copy.** Sentence case for headings, labels, buttons, table headers and select placeholders
   ("All statuses", not "All Statuses"). Raw enum/slug text shown to people → readable text
   (`subjectDisplayLabel` from `@/lib/displayLabels` for subject slugs like `JHS_ARALING_PANLIPUNAN`;
   `statusDisplayLabel` for statuses). Don't change strings that tests assert on unless you update the test.
7. **Uppercase / tracking / mono / italic.** Remove `uppercase`, `tracking-wide(r|st)`, `font-mono` (except a
   one-time password/credential value that must be copied exactly), and italic+dashed empty boxes
   (`italic border border-dashed`) → `EmptyState` or a plain muted `<p>`.
8. **Grey by opacity.** `text-base-content/40…/70`, `opacity-60` on text → `text-(--kt-muted)`.
   `text-(--kt-faint)` on content → `text-(--kt-muted)`.
9. **Forms in modals.** `FormField` → pass `size="md"`. Modal footers: `btn` default size; Cancel `btn-ghost`.
10. **Tabs, filters.** Fine as they are once sizes are fixed.
11. **Keep** behaviour, props, `aria-*`, `name`s, test-asserted text and roles. No new colours; tokens only.
    No hover lift/scale, no gradients, no new icons.
