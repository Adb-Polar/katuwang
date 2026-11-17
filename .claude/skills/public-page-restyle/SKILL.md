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
- **Public vs. portal.** Since 2026-11-17 the whole app runs on the landing theme
  (`katuwang-public` on `<html>`, IBM Plex at the root), portals included, with learner = coral
  and tutor = ube everywhere. Public pages (anything a signed-out visitor sees) also use
  `PublicShell` / `AuthLayout` for the landing header, footer and white page. Portal pages keep
  `PortalLayout` (sidebar, white cards on the tinted page) — restyle them with portal pieces
  (`PageHeader`, `kt-card`, `--kt-*` tokens) rather than wrapping them in `PublicShell`.
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
- **Portal pages** are already on the landing theme through the root. Keep them inside
  `PortalLayout`: use `PageHeader` for the `h1` (serif title, italic kicker), `kt-card` sections,
  the `--kt-*` tokens and DaisyUI classes. The `/learner` dashboard is the worked example: one
  `h1`, one line of linked numbers, one day-grouped list, no nested boxes.
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
- **Stale dev output.** If a CSS or markup change doesn't show up, check the element's actual
  `className` first. `next.config.ts` pins `turbopack.root` because a stray lockfile in a parent
  folder once made the watcher miss edits. Edits to `src/app/globals.css` in particular may not
  reach the browser until a restart: stop the dev server, delete `.next/dev`, start it — one
  after the other, not in parallel. Confirm by reading the rule in `document.styleSheets`.
- **Portal links on phones.** `globals.css` turns every `.kt-portal main a` into a centred
  `inline-flex` 44px touch target below 48rem. A link that wraps a multi-line block needs
  `flex! flex-col! items-stretch!` (and a width) to stay stacked.
- **Seeing a signed-in page.** Portal pages need a session. Use the demo test accounts listed
  under "Test accounts" in the main checkout's `CLAUDE.md` (`/home/hikaru/Capstone/katuwang/
  CLAUDE.md` — a worktree's copy may not have them): demo learner, demo tutor, super admin. Sign
  in through `/login` on the local server only. Never use `/dev/login` to act as a real student,
  and don't repeat the passwords in replies. If no test account fits, audit from code and say so.

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
