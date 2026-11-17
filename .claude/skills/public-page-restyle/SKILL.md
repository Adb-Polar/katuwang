---
name: public-page-restyle
description: Audit a Katuwang page for generic "AI slop" UI, propose fixes, then restyle it to match the landing page (IBM Plex Serif + Plex Sans, Dagat palette, ube tutors, flat 0.25rem shapes, PublicShell header/footer, katuwang-public DaisyUI theme). Use this whenever the user asks to unslop, declutter, de-AI, clean up, modernise or "make it look like the landing page" for any Katuwang page or component — login/register/auth screens, the privacy policy, error or status pages, new public pages, or a portal page they want brought in line — even if they only say "this page looks off", "match the new design", "redesign X" or paste a screenshot of a page in this repo.
---

# Unslop a page and match it to the landing page

Katuwang's landing page (`src/components/landing/`) is the design reference. The pages linked from
it were brought in line in three passes — audit, fix, match — and this skill repeats that for any
other page. The output the user expects, in order:

1. **An unslop audit** of the target page (evidence, severity, what to keep).
2. **Proposed fixes**, page by page.
3. **The restyle**, built on the shared public pieces — only after the user agrees, unless they
   already asked for the change outright.
4. **Verification and the project's paperwork** (Changes.md, TOTEST, plan doc).

Read `references/theme.md` before step 3; it lists every token, class and component to reuse.
Read `references/unslop-rubric.md` for step 1.

## Step 0 — Scope it before touching anything

- **Find the real files.** A route is usually a thin `src/app/**/page.tsx` plus a component in
  `src/components/**`. Grep for who else imports that component: shared wrappers (`AuthLayout`
  wraps 13 routes; `FormField`, `FeedbackBanner`, `BrandMark` are used all over the portals).
  Tell the user when a change will ripple to pages they didn't name, and ask which set they want.
- **Public vs. portal.** Public pages (anything a signed-out visitor sees) get the full landing
  look via `PublicShell` / `AuthLayout`. Portal pages (`/learner`, `/tutor`, `/admin`, everything
  inside `PortalLayout`) still run the original app theme (Apfel Grotezk, teal). Restyling one
  portal page alone would make the portal inconsistent, so for portal pages do the audit and
  fixes, then *ask* whether they want the whole portal moved to the public theme before applying
  Plex/Dagat there. Don't quietly mix the two themes on one screen.
- **Role colours mean different things in the two themes.** Portal: learner = violet
  (`--color-secondary`, `kt-id--learner`), tutor = marigold (`--kt-tutor-text`). Public: learner =
  coral, tutor = ube (violet). Moving any portal page to the public theme turns learner IDs from
  violet to coral and makes violet mean *tutor* — on a platform built on anonymous IDs that's a
  real confusion risk, so it has to happen across all three portals at once, and the user must
  hear about it before agreeing.
- **Tests that pin the markup.** Look in `__tests__` next to the component. Note any text,
  placeholder, `name`, `data-form-field` label, role or DOM order a test asserts on — the restyle
  must keep those. If nothing covers the page, say so: the restyle is then only checked by eye,
  which is worth adding to TOTEST.
- **Plan file.** Project rules: every plan goes in `docs/plans/<name>.md`. Write one for anything
  bigger than a single page.

## Step 1 — Unslop audit

Run the rubric in `references/unslop-rubric.md` against the page's actual code and, if the dev
server is up, a screenshot. Quote class names and copy as evidence; give each tell a severity
(Critical / High / Medium). Also list 3–5 things that already work so they aren't rewritten for
sport. Keep the audit to the page in question — a short table beats an essay.

Reading the page closely often turns up things that aren't styling: a count that includes
withdrawn rows, a wrong date, a broken link. Put those in the audit too (they're usually the
most valuable finding), marked as bugs, and fix them only with the user's OK — they may want them
in a separate commit.

## Step 2 — Propose fixes

For each tell, say what replaces it, preferring delete-and-simplify over new decoration. The
recurring fixes on this project, which are usually right:

- Drop the card-on-grey wrapper; content sits on the white page.
- Drop in-card logos (the header carries the logo).
- Raise `text-xs`/`input-sm`/`btn-sm` body UI to readable sizes (inputs and buttons at the default
  `md` size, labels ~0.9rem, `FormField size="md"`).
- Replace generic headings ("Welcome Back", "Join Katuwang") with plain, specific ones under a
  short Tagalog kicker via `AuthHeading`.
- Remove controls that do nothing (an unwired "Keep me signed in" was one).
- Nested cards → one level: bordered rows or plain sections with dividers.
- Alerts used for non-warnings (consent, info) → a quiet `lp-note`.
- Status screens → small icon + heading + text, no card.
- Long forms → a few sub-headings (`lp-section-title`) instead of one long column.

If the page's copy makes a promise the code doesn't keep (privacy wording vs. the
`showTutorRealNames` setting, for example), point it out; change legal/policy wording only with
the user's OK.

## Step 3 — Match the landing page

Use what already exists; don't fork the theme.

- Wrap public pages in `AuthLayout` (column pages; `width="wide"` for long forms) or `PublicShell`
  (full-width pages like the privacy policy). Both give the header, footer, Plex fonts, the
  `.kt-public` tokens and `data-theme="katuwang-public"`.
- **Portal pages, only after the user chose to move the portal:** don't use `PublicShell` (its
  header/footer are for signed-out visitors). Put `data-theme="katuwang-public"`, the `kt-public`
  class and `publicFontVariables` on `PortalLayout`'s root instead, and re-check every portal
  page, not just the one asked about — the `public.css` base rules (heading sizes, `p` margins)
  and the `--kt-*` bridges will reach all of them. Decide role colours and kickers for the portal
  with the user first. If they'd rather keep the portal theme, apply the de-clutter fixes with
  the existing `kt-` tokens and stop there.
- Inside that wrapper, DaisyUI classes (`btn btn-primary`, `input input-bordered`, `select`,
  `checkbox`, `loading`) already render in the Dagat palette, and the shared components that read
  `--kt-muted`, `--kt-border`, `font-sans`/`font-mono` are bridged — so most fixes are deletions
  plus size changes, not new styling.
- Use the `lp-` classes from `public.css` (`lp-link`, `lp-kicker`, `lp-note`, `lp-form`,
  `lp-form-foot`, `lp-section-title`, `lp-status-icon`, `lp-id lp-id-learner|tutor`, `lp-btn`).
  Add new shared classes to `src/components/public/public.css`, landing-only ones to
  `landing.css`.
- Keep to the brief that survived several rounds of user feedback:
  - Two fonts only: IBM Plex Serif for headings and IDs, IBM Plex Sans for everything else. No
    monospace anywhere on public pages.
  - Colours only from the tokens. Learner = coral, tutor = ube, brand = sea blue `#005770`.
    Role colour goes on the role's own name/ID, never on the other role's row.
  - Personality stays small: one italic accent at most, Tagalog kickers, one tinted band.
  - No mention of RA 10173 / the Data Privacy Act on the landing page itself (the privacy policy
    and consent text keep it).
  - No gradients, sparkle icons, hover lift/scale, blur, uppercase spaced eyebrows, nested cards.

### Gotchas that cost time before

- **Class collisions.** DaisyUI owns `.btn`, `.hero`, `.steps`, `.join`, `.link`, `.table`,
  `.card`, `.menu`. Anything new and bespoke gets an `lp-` prefix — including class names on SVG
  shapes (`.table { width: 100% }` once stretched an illustration's rectangles).
- **Unlayered CSS beats Tailwind utilities.** Element-level rules in `public.css` sit in
  `@layer base`; component-ish rules a utility might need to override go in `@layer components`.
  A plain `.kt-public p { margin: 0 }` silently killed every `mt-6` on those pages.
- **Specificity inside `.kt-public`.** `.kt-public h2` (0,1,1) outranks a bare `.lp-something`
  (0,1,0); scope new heading-ish classes as `.kt-public .lp-something`.
- **Contrast on tints.** A colour that passes 4.5:1 on white can fail on `--lp-tint`/`--lp-band`.
  Check both with `scripts/contrast.py` before settling on any new colour (it also handles
  translucent tints like `bg-accent/10`: `contrast.py FG TINT_COLOUR 0.1`).
- **Next.js fonts.** Plex comes from `next/font/google` in `src/components/public/fonts.ts`
  (fetched at build time). Don't add a third family; don't load fonts per page.
- **Checking pages in the browser.** The app sends frame-blocking headers, so iframe-based
  checks return no document — load each route directly. `.env` points at the shared Aiven
  database: flows that write (sign-up, password reset, login with a real account) need the user's
  go-ahead first; unknown-email login is a safe read-only probe.

## Step 4 — Verify and record

- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`. One test is known to fail on develop
  (`ValidatedForm.test.tsx`, the add-session case) — say so rather than claiming a clean run.
- In the browser at desktop and 375px for every touched route: only the two Plex families render
  (walk the text nodes' computed `font-family`), primary buttons resolve to the brand blue, no
  horizontal scroll, no console/server errors, the landing page unchanged.
- Project rules: log in `Changes.md`; add `[ ]` lines to `docs/backlog/TOTEST.txt` for anything
  not verified (and `[Good]` for what was); update `docs/reference/decisions.md` +
  `feature-checklist.md` only if the change diverges from the thesis. Commit and push only when
  the user says so, and confirm before committing.

## Report format

```
### Audit — <route>
| Tell | Evidence | Severity |
### Keep
- ...
### Fixes
- ...
### What changed (after applying)
- files, what was removed, what was matched
### Checks
- passed / not run, and why
```
