# UI Redesign — Port the Katuwang design system into the app

## Context

The redesign was explored and approved as static mockups in `design/` (direction E
typography on a card-based dashboard shell, palette mapped to the current DaisyUI
"katuwang theme"). Authority: `design/STYLEGUIDE.html`, `design/ROUND-2-CONTEXT.md`,
`design/PRODUCTION-BASELINE.md`, `design/round-2/base.css`.

This plan ports that language into the running Next.js 16 + Tailwind 4 + DaisyUI 5
app, system-wide. No behaviour changes — components keep their props and data
flow; only markup/classes change. No commits, no DB changes.

Key facts (from exploration):
- Tailwind 4 CSS-first, **no `tailwind.config`**, no `content` array → keep the
  existing **static class-string maps** pattern (scanner needs literal classes).
- **No component/DOM tests** — 39 test files are API-route + lib unit tests, none
  render markup. A restyle carries no test-breakage risk.
- Fonts load via `next/font/google` in `src/app/layout.tsx` (Fraunces / Manrope /
  IBM Plex Mono → `--font-fraunces|manrope|plex-mono`, mapped in `@theme inline`).
- Canonical card idiom in the app: `card bg-base-100 shadow-md border border-base-200`
  + `card-body` + `card-title text-sm font-bold`.
- Shell: `src/components/layout/PortalLayout.tsx` — DaisyUI `drawer lg:drawer-open`,
  props `{ navItems, anonymousId, portalLabel, accent, idRole?, children }`,
  `NavItem { label, href, icon }`, per-portal nav arrays in `*/layout.tsx`.

## Status — 2026-09-01

Phases 1–6 landed. `pnpm exec tsc --noEmit`, `pnpm lint` (pre-existing warnings
only), and `pnpm build` all pass. Visually verified on the dev server: learner /
tutor / admin dashboards, admin Users + Classes tables, login page.

58 files changed. New: `src/app/fonts/*` (6 OFL woff2), `docs/plans/`.
No commits, no DB changes.

**Note:** a stale Turbopack CSS cache meant the first `@layer components` block
was not emitted until the dev server was restarted with `.next` cleared. If styles
look unapplied after pulling, restart `next dev` (kill + `rm -rf .next` + start).

Known follow-ups (non-blocking, all still inherit the new look via `kt-card` +
shared primitives): auth forms still carry DaisyUI-4 `form-control` / `label-text`
classes (harmless in v5); `font-serif` remains in some headings (maps to Apfel);
deep forms (`EditClassForm`, `MatchFinder`) and `ReportsView` charts not
individually restyled.

## Approach — phased, verify between phases

### Phase 1 — Foundation (`src/app/globals.css`, `src/app/layout.tsx`, `src/app/fonts/`)
- Vendor the two OFL fonts (done): `src/app/fonts/ApfelGrotezk-{Regular,Mittel,Fett,Satt}.woff2`,
  `FragmentMono-{Regular,Italic}.woff2` (SIL OFL 1.1).
- `layout.tsx`: replace the 3 `next/font/google` calls with `next/font/local`:
  - `--font-sans` → Apfel Grotezk (400/500/700/900)
  - `--font-mono` → Fragment Mono (400 + italic)
  - `--font-serif` → also Apfel Grotezk (so existing `font-serif` headings render
    the display face; a later cleanup can sweep `font-serif` → `font-sans`).
  Keep `data-theme="katuwang theme"`, `h-full antialiased`, body classes.
- `globals.css`: after the theme block add design tokens + a `@layer components`
  set (literal classes so the Tailwind 4 scanner keeps them):
  - tokens: `--surface`, `--surface-2`, `--tint-*` (learner/tutor/info/success/
    warning/error/ink), `--shadow-card`, `--shadow-pop` — all `oklch`/`color-mix`
    off the existing `--color-*` theme vars.
  - components: `.kt-card`, `.kt-card-head`, `.kt-badge` + `.kt-badge--{info,
    success,warning,error,neutral,learner,tutor}`, `.kt-id--{learner,tutor}`,
    `.kt-tile` / `.kt-ic` (letter tiles), `.kt-sidebar`, `.kt-nav-item`
    (+ active), `.kt-nav-label`, `.kt-topbar`, `.kt-search`, `.kt-icon-btn`,
    `.kt-avatar`, `.kt-stat` / `.kt-stat-value` / `.kt-delta`, `.kt-alert`
    (+ variants), `.kt-chart` bar chart, `.kt-promo`.
  - Base tweaks: `body { background: var(--surface-2) }`; soften DaisyUI
    `.card` shadow to `--shadow-card`.
- Verify: `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm dev` → home page renders,
  fonts load (network tab shows the woff2s, no Google Fonts requests).

### Phase 2 — Shared UI primitives (`src/components/ui/*`, same props)
- `BrandMark` → rounded teal tile with `K` (or keep `BookOpen`), `--radius-field`.
- `AnonymousIdBadge` → `.kt-id--learner` / `.kt-id--tutor` mono token
  (violet `STU`, darkened-marigold `TUT`); `showIcon` keeps `ShieldCheck`.
- `StatusBadge` → `.kt-badge`; add a `code?` prop (3-letter) rendered before the
  label; map `tone` → `.kt-badge--{tone}`.
- `PageHeader` → title in `font-sans font-bold` (display), eyebrow uppercase mut.
- `Tabs` → segmented pill group (`.kt-tabs`); drop DaisyUI `tabs-lifted`.
- `Pagination` → `.btn btn-ghost btn-xs` + mono counts, unchanged layout.
- `FormField` → drop `form-control`/`label-text` (removed in DaisyUI 5); plain
  `label` + `text-xs font-semibold`, hint/error `text-2xs`.
- `FeedbackBanner` → `.kt-alert--{variant}` (left rule + tint + glyph), keep icons.
- `ConfirmDialog` → `.kt-card` panel + `--shadow-pop`, keep `modal modal-open`.
- Verify: `tsc`, `build`.

### Phase 3 — Shell (`src/components/layout/PortalLayout.tsx` + `*/layout.tsx`)
- Replace the drawer with: `.kt-sidebar` (brand row, grouped `.kt-nav-label` +
  `.kt-nav-item` with a `.kt-ic` letter tile, active = teal-tint pill; a `.kt-promo`
  card; footer with `AnonymousIdBadge` + logout) and a sticky `.kt-topbar`
  (`.kt-search` with `⌘K`, `.kt-icon-btn` help/bell, `.kt-avatar`).
- Keep props identical. Extend `NavItem` with optional `group?: string` and
  `tile?: string` (2-char); update the three `*/layout.tsx` nav arrays to add
  group names + tiles. Mobile: `<details>` disclosure (replace drawer toggle).
- Fix the admin active-item bug (`/admin` matches every `/admin/*`): exact-match
  the portal roots.
- Verify: `tsc`, `build`, `pnpm dev` → log in via `/dev/login`, click through
  each portal, check active state + mobile nav.

### Phase 4 — Card idiom sweep (repo-wide, mechanical)
- Replace `card bg-base-100 shadow-md border border-base-200` → `kt-card` and
  `card-body gap-N` → `kt-card-body` (keep the `gap-N`), across
  `src/components/**` and `src/app/**` (~15–20 files: `ClassDetailsView`, all
  `admin/*Table`, `ClassManagement`, dashboards, profile, etc.). `card-title
  text-sm font-bold` → `kt-card-head`.
- Verify: `tsc`, `build`, spot-check class detail + an admin table.

### Phase 5 — Landing + auth (`src/app/page.tsx`, `src/components/auth/*`)
- `page.tsx` → the `01-landing.html` layout (topbar, hero, the "how names stay
  hidden" key list as `.kt-card`s, the sample-class `.kt-card`).
- `AuthLayout` → keep centered; forms get `.kt-card` panels, `.kt-tabs`,
  `.kt-alert` for errors, the identity option-rows.
- Verify: `pnpm dev` → `/`, `/login`, `/register`.

### Phase 6 — Dashboards + detail pages
- `learner/page.tsx`, `tutor/page.tsx`, `admin/page.tsx` → `.kt-stat` cards
  (tile + title + mono value + `.kt-delta`), `.kt-card` sections, week grid.
- Sweep remaining ad-hoc `badge badge-*` → `StatusBadge`/`.kt-badge`,
  `btn btn-primary` stays (DaisyUI `--color-primary` already teal), destructive →
  `btn-error`.
- Verify: `pnpm dev` → each dashboard at 375px and 1280px; `pnpm build`; `pnpm lint`.

## Files (representative, not exhaustive)

- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/fonts/*` (new)
- `src/components/ui/{BrandMark,AnonymousIdBadge,StatusBadge,PageHeader,Tabs,Pagination,FormField,FeedbackBanner,ConfirmDialog}.tsx`
- `src/components/layout/PortalLayout.tsx`; `src/app/{admin,tutor,learner}/layout.tsx`
- `src/components/classes/{ClassCard,ClassDetailsView}.tsx`
- `src/components/admin/*Table.tsx`, `src/components/admin/ReportsView.tsx` (chart colours off theme vars — already does this)
- `src/components/{tutor,learner}/*`, `src/components/profile/*`, `src/components/auth/*`
- `src/app/page.tsx`, `src/app/{learner,tutor,admin}/page.tsx`

## Guardrails

- No commits / pushes / DB changes.
- Keep every static Tailwind class literal (no dynamic string building) — the
  Tailwind 4 scanner has no `content` config.
- Component props and behaviour unchanged; this is markup/CSS only.
- Keep `data-theme="katuwang theme"`; the DaisyUI palette is the source of truth
  for colour — new tokens are `color-mix`/`oklch` derived from `--color-*`.

## Verification (end to end)

1. `pnpm exec tsc --noEmit` — clean.
2. `pnpm lint` — clean.
3. `pnpm build` — succeeds.
4. `pnpm dev`, then via `/dev/login` sign in as a learner, a tutor, an admin:
   - shell: sidebar groups, active pill, promo, topbar, mobile `<details>`.
   - primitives: badges show code+word, IDs are violet/marigold, alerts tinted.
   - pages: dashboards (stat cards + chart), a browse grid, a class detail, an
     admin table + confirm dialog, a long create form, landing, login/register.
   - check 375px and 1280px; tab through for visible focus.
5. Confirm no `fonts.googleapis.com` requests in the network panel.
