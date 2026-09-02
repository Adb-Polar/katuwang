# Production Baseline — Katuwang visual language (Direction E)

**Status:** frozen 2026-09-01. User approved the seven rebuilt Round 2 sample
screens and their generation rules. This file + `ROUND-2-CONTEXT.md` +
`STYLEGUIDE.html` are the authority for any further work in this language.

### Reopen log

- **2026-09-01 (a) — colour rules reopened, by explicit user override.** Reason:
  the original E palette (four muted roles, identity-only encoding, no red/green)
  was judged too minimal and not intuitive. Authorised change: **keep** the
  identity family (learner violet, tutor gold, ink, system grey) for *who*;
  **add** a conventional state family — info (blue), success (green), warning
  (amber), error (red) — for *what is happening*.

- **2026-09-01 (b) — composition + shell reopened, by explicit user override
  against a supplied reference image** (`design/reference/Pasted image.png`, a
  card-based SaaS dashboard). What stays: the **two typefaces and their jobs**
  (Fragment Mono = notation, Apfel Grotezk = speech), the **two colour families**,
  and every colour keeping a non-colour cue. What changed: the "flat legend, no
  cards, hairlines only, 2px radius" composition is **replaced** by a card UI —
  white cards with `.5rem` radius + soft shadow on a light-grey page; a grouped
  left sidebar with a green active-pill and letter-tile "icons"; a sticky top bar
  with search + icon buttons + avatar; pill badges; a green promo card;
  green (`--brand`) as the primary/brand colour. Applied to `base.css`, all seven
  screens, and `STYLEGUIDE.html`. The locked Round 1 study `E.html` is unchanged
  and is now only the record of the typographic origin.

Proof level reached: **Round 2 artifact system available.** Sample screens use
placeholder content; they are visual-review mockups, not wired implementation.

## Frozen files

```
design/ROUND-2-CONTEXT.md          locked concept capsule + Round 2 additions
design/STYLEGUIDE.html             self-contained style guide (this language)
design/round-2/base.css            the system stylesheet (tokens + components)
design/round-2/fonts/*             Fragment Mono, Apfel Grotezk (SIL OFL 1.1)
design/round-2/01-landing.html
design/round-2/02-auth.html
design/round-2/03-portal-dashboard.html
design/round-2/04-admin-table.html
design/round-2/05-class-browse.html
design/round-2/06-class-detail.html
design/round-2/07-create-form.html
design/round-1/E.html              the locked Round 1 study (do not edit)
design/round-1/capsules/E.md       the locked capsule (do not edit)
```

## Invariant — do not change without an explicit reopen

1. **Two typefaces, fixed jobs.** Fragment Mono = notation (IDs, dates, times,
   counts, %, status codes, kbd, meeting links). Apfel Grotezk = speech (titles,
   nav labels, section labels, sentences, buttons). Fragment Mono never sets long
   prose; Apfel Grotezk never sets an ID / time / count / status.
2. **Two colour families, kept separate.**
   - *Identity* (who) — only on IDs (`.id--learner` violet `STU-XXXX`,
     `.id--tutor` gold `TUT-XXXX`) and the identity option-rows on auth.
   - *State* (what) — `.badge--info|success|warning|error|neutral`, `.alert--*`,
     validation, `.delta`: info blue = informational / `SCH`; success green =
     `OPN` `ACT` `ENR` `PUB` / verified / positive delta / confirmations; warning
     amber = `PEN` `FUL` / attention; error red = `SUS` `CAN` / field errors /
     destructive / moderation notice; neutral grey = `DRF` `CMP` / archived.
   - Identity colour never marks a state; state colour never marks a person.
   - **Brand / primary = teal** (`--brand`, the app's `--color-primary`):
     sidebar active-pill, brand mark, `.btn--brand`, focus ring, progress bars,
     chart bars, promo card. Distinct from success green.
   - The dark near-black `.btn--primary` (app `--color-neutral`) is the top-level
     page action (reference's "Export Report" button).
   - **The whole palette is mapped to the live app theme** in
     `src/app/globals.css` ("katuwang theme"): base-100/200/300 → surface / page /
     border, base-content → text, primary teal → brand, secondary ube → learner,
     accent marigold → tutor (darkened for ID-text legibility; the tint keeps the
     real hue), plus the app's info / success / warning / error.
3. **Every colour still keeps a non-colour cue.** `STU-`/`TUT-` prefix; 3-letter
   code + full word in every badge; `✓` on verified topics; alert glyph
   (`i ✓ ! !`) + bold lead word; `▲`/`▼` on deltas; `!` + weight on field errors.
4. **Card shell.** Content sits in white `.card`s (`--radius-card` `.5rem`, `1px`
   border, `--shadow-card` soft shadow) on the `--bg` light-grey page. A card has
   an optional `.card-head` (title left, tools right). No nested cards.
5. **App chrome.** Left `.sidebar` (white, `--nav-w`): brand row, `.nav-group`s
   each with an uppercase `.label` and `.nav-item`s (letter-tile `.ic` + label;
   active = green-tint pill + green text + green tile); a `.side-promo` (green
   gradient, white text + button); `.side-foot` with the viewer's ID + theme
   toggle. Sticky `.topbar`: pill `.search` with `⌘K`, `.icon-btn`s, `.avatar`.
   Below `64rem` the sidebar collapses into a `<details>` `.nav-mobile`.
6. **Radius scale.** `--radius` `.5rem` on controls; `--radius-card` `.5rem` on
   cards; `--radius-pill` on badges, the search field, avatar, icon buttons.
7. **Focus is always visible.** `2px solid var(--focus)` (green) outline,
   `outline-offset 2px`; inputs also take a `3px` green tint ring. Never removed.
8. Portal accent: the green brand pill is shared; the viewer ID in `.side-foot`
   and the avatar carry the identity colour (learner violet / tutor gold / admin
   grey).

## Allowed variation

- Card contents and grid (`.grid-2` / `.grid-3`), number of stat cards, rows,
  filters, sessions per screen.
- Which letter goes in a `.ic` / `.tile` / `.row-ic` (they are 1–2 char mono
  abbreviations, not a fixed icon set).
- New status codes reusing an existing state tint (info / success / warning /
  error / neutral) — each with a `<span class="code">XXX</span>` + full word.
- Tuning any colour token's lightness/chroma for contrast; tuning shadow depth.
- Dark-theme token values; light is the primary design.
- Chart type/props (the CSS bar chart is illustrative).

## Prohibited normalisation

- A new state hue beyond info / success / warning / error / neutral.
- Mixing the two colour families (identity colour on a state, or vice versa).
- Real pictographic **SVG** icons anywhere (skill-level ban, still in force) —
  "icons" are mono letter-tiles or text glyphs only.
- Apfel Grotezk on IDs/times/status; Fragment Mono on long body prose.
- Forcing centred layout onto data tables.
- Nested cards, or a card with no purpose (use a `.card-head`-less card only for
  a single grouped list).

## Reopening conditions

Reopen the locked direction only for: new subject evidence, cultural harm, an
accessibility failure that cannot be solved within these rules, a changed product
requirement, or an explicit user override. Record the reason and the authorising
decision here when it happens.

## Open issues to resolve before implementation

- Re-check contrast at the smallest shipped sizes (target 4.5:1): badge text on
  its tint (`--warning`/`--success`/`--info`/`--error` on `*-tint`), `--text-mut`
  on `--surface`, the green active nav-pill text, and white on `--brand`.
- Confirm identity vs. state stay visually distinct in the same row (violet ID +
  red status badge) and in greyscale.
- The letter-tile "icons" (`.ic`, `.tile`, `.row-ic`, `.pf`) are a placeholder
  for real icons — decide during implementation whether to keep letters, use an
  icon font, or draw CSS icons (no SVG).
- Greyscale/colour-blind pass on every badge and ID in context.
- Keyboard: nav disclosure, table row actions, dialogs — full operability, focus
  trap while a dialog is open, focus restore on close (the mockups show structure
  and states, not the JS behaviour).
- Input preservation across validation errors, navigation, and accidental
  dismissal when these become real forms.
- Replace placeholder copy with real strings from the app.

## Asset & licence status

- **Fragment Mono** — Wei Huang. SIL OFL 1.1. Self-hostable, redistributable with
  the licence. No purchase.
- **Apfel Grotezk** — Collletttivo / Alexander Meyer. SIL OFL 1.1. Same terms.
- Both already vendored in `design/round-2/fonts/`. For the real app, self-host
  via `next/font/local` (do not swap to a Google Fonts copy — keep the OFL files).
