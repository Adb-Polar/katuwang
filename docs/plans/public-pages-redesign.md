# Redesign landing-linked pages to match the landing page

## Context

The new landing page (`src/components/landing/LandingPage.tsx`, `landing.css`, on branch
`landing-redesign`) uses IBM Plex Serif + Plex Sans, the "Dagat" palette (primary
`oklch(42% 0.09 222)` / #005770, coral learner, ube tutor), a white page, flat 1px borders,
0.25rem radius and small Tagalog kickers. Every page it links to still uses the old app
theme: Apfel Grotezk + Fragment Mono, teal/violet/marigold DaisyUI theme, grey `bg-base-200`
page, shadowed cards and `text-xs` everywhere. Clicking "Log in" or "Find a tutor" today
feels like entering a different product.

Goal: audit each linked page for slop, fix it, and restyle it with the landing page's exact
fonts, colours and design variables. Scope (user decision): **all 13 pages wrapped by
`AuthLayout`** plus `/privacy-policy`. `/dashboard` is a redirect with no UI and is out of scope.
The student/admin portals are out of scope and must not change.

## Approach: one shared "public" theme, used by the landing page and the auth pages

1. **Extract the landing tokens into a shared public theme.**
   - Move the token block and shared primitives (`--lp-*` variables, `.lp-btn`, `.lp-link`,
     `.lp-kicker`, `.lp-muted`, header/footer, focus ring) out of `landing.css` into
     `src/components/public/public.css`, scoped to `.kt-public`. `landing.css` keeps only
     landing-specific sections (hero, steps, sees, join, faq, illustration).
   - Move the `next/font/google` IBM Plex setup out of `LandingPage.tsx` into
     `src/components/public/fonts.ts` (exports `publicFontClasses`).
   - Add a second DaisyUI theme in `src/app/globals.css`, `name: "katuwang-public"`, with the
     Dagat colours (primary/primary-content, secondary = learner coral, accent = tutor ube,
     base-100 white, base-200 = landing tint, base-content = landing ink), `--radius-box/field:
     0.25rem`, `--depth: 0`. Apply it with `data-theme="katuwang-public"` on the `.kt-public`
     wrapper. DaisyUI 5 supports nested themes, so `btn-primary`, `input`, `select`, `checkbox`,
     `loading` inside forms recolour automatically without rewriting their classes.
   - `.kt-public` also sets `font-family` to Plex Sans and overrides `.card` shadow to none
     (border only), so `kt-card` inside it reads flat like the landing page.

2. **Shared public shell.** New `src/components/public/PublicHeader.tsx` and `PublicFooter.tsx`
   (the landing header/footer, with the inline logo in `--lp-primary`). `LandingPage.tsx` uses
   them. `AuthLayout` and the privacy page use them too, so every public page has the same
   top bar and footer. On auth pages the header shows logo + "Log in"/"Create account" only
   (no section anchors); the page-specific Back button stays below it.

3. **Restyle `AuthLayout`** (`src/components/auth/AuthLayout.tsx`): wrap in
   `.kt-public` + `data-theme` + font classes; white page; header; centred column
   (`max-w-md`, `max-w-xl` for the sign-up form); footer. This restyles all 13 auth routes at once.
   Reuse `AuthBackButton` unchanged except for a quieter link style (`lp-link`, no ghost button chrome).

4. **Per-page unslop + fix + match** (below).

## Per-page audit, fix, match

### `/login` — `src/app/login/page.tsx`, `src/components/auth/LoginForm.tsx`
- **Slop:** generic "Welcome Back" / "Sign in to your account"; shadowed card floating on grey;
  every label/input/button at `text-xs` with `input-sm` (12px, hard to read); `BrandMark`
  nudged with `-translate-x-[3px]`; "Keep me signed in" checkbox that does nothing (not wired);
  success state stacks a check circle plus a ring spinner.
- **Fix:** title in Plex Serif with kicker *Mag-log in*; heading "Log in to Katuwang"; drop the
  dead checkbox (it promises behaviour that doesn't exist); inputs `input-md text-sm`, labels
  `text-sm`; one primary button full width; remove the logo from the card (the header carries it);
  success state = one line of text + the check, no ring.
- **Match:** flat bordered card (or no card, just the form on white with a top border), Plex,
  Dagat via theme, `lp-link` for "Forgot password?" and "Register".
- **Keep:** field order (email first, password second), `data-form-field="Email Address"` /
  `"Password"`, all query-param banners, every `signIn` error branch and redirect, 1500ms
  success delay, `/forgot-password` and `/register` links.

### `/register` (role chooser) — `src/app/register/page.tsx`
- **Slop:** cards inside a card; two tiles styled differently (solid violet vs 15% gold tint);
  rounded-xl icon boxes with `strokeWidth={2.5}`; `hover:shadow-md`; tiny `text-2xs` blurbs at
  `opacity-80` (fails contrast); generic "Join Katuwang".
- **Fix:** no outer card. Kicker *Sumali*, heading "How do you want to take part?". Two equal
  choice rows using the landing's join pattern: a bordered row each, role name in Plex Serif,
  one-sentence description in `--lp-muted` at `text-sm`, role colour only on the role name and
  a left border accent; same treatment for both roles. Drop icon boxes.
- **Match:** copy from the landing join section ("Need help?" / "Good at a subject?") so the two
  pages say the same thing.
- **Keep:** links to `/register/learner`, `/register/tutor`, `/login`.

### `/register/learner` and `/register/tutor` — `src/components/auth/RegisterForm.tsx`
- **Slop:** 12 fields in one long `text-xs` column; heading hack `[word-spacing:-0.2em]`;
  consent styled as an info alert (`alert alert-info`), which reads as a warning not an agreement;
  unused `ROLE_COPY.border`; "Already have an account?" placed outside the card, unlike login.
- **Fix:** group fields under three small Plex Serif sub-headings — *About you* (names, Student
  ID, adviser, grade, section), *Contact* (email, recovery email, contact info), *Password*
  (password, confirm) — with dividers, not nested boxes. Inputs `input-md text-sm`. Consent as a
  plain bordered row with the checkbox. Remove the word-spacing hack and the unused `border` key.
  Move "Already have an account? Log in" inside the form footer like login. Kicker
  *Mag-sign up*; heading "Sign up as a learner" / "Sign up as a tutor", role word in role colour.
- **Match:** wider column (`max-w-xl`), two-column grids kept for name and grade/section.
- **Keep:** every field `name`, `required`, placeholder text (tests assert "Enter your Student ID
  Number" and "Enter your adviser's full name"), `data-form-field` labels including `"Consent"`,
  client checks, `POST /api/register`, both redirect paths, privacy link `target="_blank"`, submit
  labels.

### `/privacy-policy` — `src/app/privacy-policy/page.tsx`
- **Slop:** a long document stuffed into a card; the whole policy in muted grey
  (`text-(--kt-muted)` on all body text); rounded-xl blue info callout; `font-mono` IDs;
  "Back to registration" assumes the reader came from sign-up.
- **Fix:** plain document on white, `max-w-2xl`, body text in ink (`--lp-ink`) at 1rem, H2s in
  Plex Serif, kicker *Pribado*; the callout becomes a quiet bordered note; IDs in Plex Serif
  with role colours like the landing page; replace "Back to registration" with the shared Back
  button.
- **Copy:** keep the legal content as is (only the landing page drops the RA 10173 mention; the
  policy itself should name the law). Confirm with the user before changing any policy wording.

### The other 9 `AuthLayout` pages (restyled mostly through the shell + theme)
`/forgot-password`, `/reset-password`, `/verify-email`, `/verify-email/check-email`,
`/account-unverified`, `/pending-approval`, `/account-declined`, `/unauthorized`, `/logout`.
- Pass over each card for the same tells: remove in-card `BrandMark` (header has it), raise
  `text-xs` body/inputs to `text-sm`, use Plex Serif headings with no `font-semibold` hacks,
  status icons (Clock/XCircle/AlertTriangle) kept small and in the theme colour, links → `lp-link`.
- Keep all strings asserted in `passwordRecovery.test.tsx` ("Verify code", "Invalid or expired
  verification", "Passwords do not match.", "Password updated", "Request a new code") and the
  `/reset-password` and `/login?reset=true` redirects.

## Files

- New: `src/components/public/public.css`, `fonts.ts`, `PublicHeader.tsx`, `PublicFooter.tsx`.
- Edit: `src/app/globals.css` (add `katuwang-public` DaisyUI theme), `src/components/landing/LandingPage.tsx`
  + `landing.css` (use the shared pieces; no visual change), `src/components/auth/AuthLayout.tsx`,
  `AuthBackButton.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`,
  `ResetPasswordForm.tsx`, `VerifyEmailForm.tsx`, `LogoutConfirm.tsx`, and the page files for
  `/register`, `/privacy-policy`, `/pending-approval`, `/account-declined`, `/unauthorized`.
- Do **not** change `BrandMark`, `FeedbackBanner` or `FormField` themselves: they are used across
  the portals. Restyle them only through the `.kt-public` scope / nested theme.
- Docs (project rules): copy this plan to `docs/plans/public-pages-redesign.md`; log in
  `Changes.md`; add `[ ]` lines to `docs/backlog/TOTEST.txt`.

## Verification

- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` — expect only the known pre-existing
  `ValidatedForm.test.tsx` failure (add-session case); the LoginForm cases in that file,
  `RegisterForm.test.tsx`, `passwordRecovery.test.tsx` and `dashboard` page tests must pass.
- Browser (dev server, desktop + 375px) for all 14 pages: only IBM Plex loads; primary buttons,
  inputs, checkboxes are Dagat; no horizontal scroll; no console/server errors; landing page
  unchanged (screenshot compare).
- Flows: log in with seed/test account (errors inline for wrong email/password, redirect to
  portal); register learner and tutor with a test account on the local dev DB (field errors,
  consent required, redirect); forgot-password → reset; check `?registered=true`, `?pending=true`,
  `?reset=true` banners on `/login`.
- Portal check: open `/learner`, `/tutor`, `/admin` and confirm they still use the old theme and fonts.
- Commit only when asked (project rule), on `landing-redesign` or a new branch the user names.
