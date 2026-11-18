# Portals on the landing-page theme

## Context

The landing page and every public page now use the landing theme: IBM Plex Serif + Plex Sans,
the Dagat palette (brand `#005770`, learner coral, tutor ube), flat 0.25rem shapes. The learner,
tutor and admin portals still use the original theme (Apfel Grotezk + Fragment Mono, teal,
learner violet, tutor marigold). The user chose to move **all three portals** together, so role
colours mean the same thing on every screen, and to start the per-page unslop with the learner
dashboard (audit in the session, fixes below).

## Approach

**One theme for the whole app, set at the root**, instead of nesting the landing theme inside
`PortalLayout`. Reason: the portal's derived tokens (`--kt-tint-learner`, `--kt-tint-tutor`,
`--kt-tutor-text`, …) are computed at `:root` from the root theme, and charts
(`useThemeColors`) read colours from `<html>`; a nested theme would leave both on the old palette.

1. `src/app/layout.tsx`: `data-theme="katuwang-public"`; load IBM Plex (from
   `components/public/fonts.ts`) at the root; drop the Apfel Grotezk / Fragment Mono loaders.
2. `src/app/globals.css`:
   - `@theme inline`: `--font-sans` → Plex Sans, `--font-mono` → Plex Sans (no monospace
     anywhere), add `--font-serif` → Plex Serif.
   - Remove the old `katuwang theme` block (nothing uses it any more).
   - `:root` tokens: `--kt-tutor-text` → ube text `oklch(55% 0.16 300)`, `--kt-muted`/`--kt-faint`
     → the landing muted/faint, shadow and radius follow the theme.
   - `.kt-id` in Plex Serif like the landing page IDs.
3. Accent used as text (4 places: `StatCard` accent tint, `GlobalSearch` tutor icon,
   `SessionTestBuilder` origin label, tutor profile role label) → `--kt-tutor-text`, because the
   accent is the light ube fill.
4. Portal chrome: `PortalLayout` logo → the inline logo in brand blue (export it from
   `PublicShell`); `PageHeader` title in Plex Serif, eyebrow as a small italic kicker instead of
   uppercase spaced text.
5. **Learner dashboard** (`src/app/learner/page.tsx`), landing-style:
   - `PageHeader` with a real `h1` ("Your week") and one line of help.
   - Stats as one line of links instead of three tinted tiles (fixes the failing icon).
   - One list of this week's sessions grouped by day (replaces the duplicate "Upcoming" list
     and the truncating 7-column timetable on this page; `WeeklyTimetable` itself is unchanged
     for the tutor pages). Falls back to the next upcoming sessions when the week is empty.
   - Rows: time · length on the left, topic in body size, subject as muted text — no pills,
     no uppercase, no 11px text; time-zone note once; empty state links to Browse classes.
   - Sections as flat bordered blocks, no boxes inside boxes.
   - `CertificateList preview`: hide "Refresh" and delivery wording (learner preview only).
6. Not in this pass: per-page unslop of the other portal pages. They get the theme switch only;
   follow-ups are listed in TOTEST.

## Verification

- `tsc`, `lint`, `test` (known `ValidatedForm` add-session failure); update the dashboard test
  for the new structure (keep the withdrawn-count and no-`order-*` checks).
- Browser, local server, demo accounts from the main `CLAUDE.md`: `/learner`, `/tutor`,
  `/admin` and a few inner pages per portal at desktop and 375px — only Plex renders, role
  colours coral/ube, no horizontal scroll, charts recoloured, no console/server errors; public
  pages unchanged.
- Log in Changes.md, TOTEST (each portal page to eyeball), decisions.md if relevant.
