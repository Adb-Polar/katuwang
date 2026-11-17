# Landing-page theme reference

The source of truth is the code; this is a map of it. If a value here disagrees with
`src/components/public/public.css` or the `katuwang-public` block in `src/app/globals.css`,
trust the code and update this file.

## Files

| File | What it holds |
|---|---|
| `src/components/public/PublicShell.tsx` | `PublicShell` (theme wrapper + header + footer), `PublicHeader`, `PublicFooter`, inline logo in brand blue |
| `src/components/public/fonts.ts` | `publicFontVariables` — IBM Plex Serif (400/500, italic) as `--lp-serif`, IBM Plex Sans (variable) as `--lp-sans` |
| `src/components/public/public.css` | `.kt-public` tokens, bridges to app variables, base type, `lp-` classes, auth-page classes |
| `src/app/globals.css` | DaisyUI theme `katuwang-public` (the only theme, default) and the portal `kt-` layer |
| `src/components/auth/AuthLayout.tsx` | Public shell + centred column + back link; `width="narrow" \| "wide"` |
| `src/components/auth/AuthHeading.tsx` | Kicker (Tagalog, italic serif) + serif `h1` + one line of help |
| `src/components/auth/AuthBackButton.tsx` | Quiet "← Back" link (`lp-back`) |
| `src/components/landing/landing.css` | Landing-only sections and illustration tokens |

## Tokens (`.kt-public`)

| Token | Value | Use |
|---|---|---|
| `--lp-page` | `oklch(100% 0 0)` | page background (white) |
| `--lp-tint` | `oklch(97.5% 0.006 222)` | footer, `lp-note` |
| `--lp-band` | `oklch(97% 0.016 222)` | one tinted section per page at most |
| `--lp-ink` | `oklch(24% 0.02 230)` | body text, headings |
| `--lp-muted` | `oklch(46% 0.02 230)` | secondary text (≈7:1 on white) |
| `--lp-border` | `oklch(90% 0.01 225)` | all borders/dividers |
| `--lp-primary` | `oklch(42% 0.09 222)` ≈ `#005770` | brand: buttons, links, kicker, logo, italic accent |
| `--lp-primary-hover` | `oklch(36% 0.09 222)` | button hover |
| `--lp-learner` | `oklch(52% 0.16 30)` coral | learner name/ID text |
| `--lp-tutor` | `oklch(55% 0.16 300)` ube | tutor name/ID text (passes on tints too) |
| `--lp-radius` | `0.25rem` | every corner |
| fills (landing.css) | tutor `oklch(80% 0.15 300)`, learner arm `oklch(45% 0.15 30)` … | illustration, stripes |

Bridges set on the same wrapper so shared app components match without edits:
`--kt-muted`, `--kt-faint` → `--lp-muted`; `--kt-border` → `--lp-border`; `--kt-radius-*` →
`--lp-radius`; `--kt-shadow-card: none`; `--font-sans`/`--font-mono`/`--font-apfel`/
`--font-fragment-mono` → Plex Sans.

## DaisyUI theme `katuwang-public`

base-100 white · base-200 tint · base-300 border · base-content ink · primary brand blue ·
secondary = learner coral · accent = tutor ube fill (`oklch(80% 0.15 300)`, content
`oklch(28% 0.08 300)`) · radius 0.25rem · depth 0 · noise 0. So inside `.kt-public`,
`btn-primary`, `input`, `select`, `checkbox`, `loading`, `kt-alert`, `text-secondary` etc. are
already on-brand.

## Type scale

- `h1` 2.4–3.5rem (landing) / 1.9–2.25rem (auth pages via `.lp-auth-head h1`), Plex Serif 500,
  -0.02em, balanced wrapping.
- `h2` 1.6–2rem; inside forms use `lp-section-title` (1.2rem serif) instead.
- Body 1rem/1.6 Plex Sans; labels ~0.9rem; helper text 0.85rem in `--lp-muted`. Nothing smaller
  for real content.

## Classes (`lp-`)

| Class | Purpose |
|---|---|
| `lp-wrap` | 68rem centred container with 1.5rem gutters |
| `lp-btn`, `lp-btn-primary` | buttons outside DaisyUI forms (landing header/hero) |
| `lp-link` | brand-blue text link, underline on hover |
| `lp-kicker` | small italic serif label above a heading (Tagalog) |
| `lp-accent` | italic brand-blue run inside a heading (one per page) |
| `lp-muted` | secondary text colour |
| `lp-id`, `lp-id-learner`, `lp-id-tutor` | anonymous IDs in serif, coloured by owner |
| `lp-auth`, `lp-auth--narrow|wide` | auth column (28rem / 36rem) |
| `lp-auth-head` | heading block (via `AuthHeading`) |
| `lp-form` | form rhythm (1.25rem gaps) |
| `lp-section-title` | sub-heading inside a long form, with divider |
| `lp-form-foot` | footer line under a form ("Already have an account? Log in") |
| `lp-note` | quiet bordered box on tint (consent, info, reasons) |
| `lp-status-icon` | 2.75rem round icon chip for status pages (layered, so `mb-0` works) |
| `lp-back` | back link |
| `lp-doc` | long-form document (privacy policy) |

## Kickers used so far

Mag-log in · Sumali · Mag-sign up · Nakalimutan? · Bagong password · I-verify · Paalam ·
Hintay muna · Paumanhin · Bawal dito · Pribado · Paano? · Mga tanong. Keep new ones short and
plain; check meaning with the user if unsure.

## One theme everywhere

Since 2026-11-17 `katuwang-public` is set on `<html>` (app/layout.tsx) and IBM Plex loads at the
root, so the portals use the same palette and fonts; the old `katuwang theme` (Apfel, teal,
learner violet, tutor marigold) is gone. Root tokens that portal components read:
`--kt-tutor-text` (ube text), `--kt-tint-learner`/`--kt-tint-tutor` (derived from secondary/
accent), `--kt-muted`, `--kt-faint`, `--kt-border`. Use `--kt-tutor-text`, not `text-accent`,
for tutor text and icons — the accent is a light fill.

## Shared components — where a change ripples

Counts are files importing the component at the time of writing (excluding tests). Re-grep
before editing: `grep -rl "import.*\bName\b" src --include=*.tsx`.

| Component | Importers | Notes |
|---|---|---|
| `FeedbackBanner` | ~50 | everywhere; restyle only through tokens/theme |
| `PageHeader` | ~42 | portal page headings |
| `FormField` | ~28 | has `size="md"` for readable labels |
| `AnonymousIdBadge` | ~26 | role-coloured ID pills (portal colours) |
| `AuthLayout` | 13 | every auth/status page |
| `EmptyState` | ~11 | italic grey empty rows |
| `StatCard` | 4 | `/learner`, `/tutor`, `/admin`, admin tables |
| `WeeklyTimetable` | 3 | `/learner`, `/tutor`, tutor profile |
| `CertificateList` | 3 | dashboard preview + full lists |
| `PortalLayout` | 3 | the three portal shells |
| `BrandMark` | 3 | inline logo in the theme primary (blue) |
