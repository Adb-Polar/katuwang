# Production Baseline — Katuwang visual language (Direction E)

**Status:** frozen 2026-09-01. User approved the seven rebuilt Round 2 sample
screens and their generation rules. This file + `ROUND-2-CONTEXT.md` +
`STYLEGUIDE.html` are the authority for any further work in this language.

### Reopen log

- **2026-09-01 — colour rules reopened, by explicit user override.** Reason: the
  original E palette (four muted roles, identity-only encoding, no red/green) was
  judged too minimal and not intuitive for everyday use. Authorised change:
  **keep** the identity family (learner violet, tutor gold, ink, system grey) for
  *who*; **add** a conventional state family — info (blue), success (green),
  warning (amber), error (red) — for *what is happening*. Typography, composition,
  hairline structure, `2px` radius, and the "colour always has a non-colour cue"
  rule are unchanged. Applied to `base.css`, all seven screens, and `STYLEGUIDE.html`.

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

1. **Two colour families, kept separate.**
   - *Identity* (who) — only on IDs and identity-linked labels + portal accents:
     ink = neutral; learner violet = `STU-XXXX`; tutor gold = `TUT-XXXX`;
     system grey = muted meta / disabled / archived (`Completed`, `Draft`).
   - *State* (what is happening) — lifecycle chips, alerts, validation:
     info blue = informational / `Scheduled`; success green = `Open` / `Active` /
     `Enrolled` / `Published` / verified / confirmations; warning amber =
     `Pending` / `Full` / attention; error red = `Suspended` / `Cancelled` /
     validation errors / destructive / moderation notices.
   - Identity colour never marks a state; state colour never marks a person. An
     `STU-XXXX` stays violet inside a red `SUS` row.
   - Canvas warm near-white `oklch(98% 0.004 90)`.
2. **Two typefaces, fixed jobs:** Fragment Mono = notation (IDs, dates, times,
   counts, status, nav, code fields, buttons). Apfel Grotezk = speech (titles,
   labels, sentences).
3. **Colour never stands alone.** Every colour is paired with a non-colour cue:
   `STU-`/`TUT-` prefix, 3-letter status code + full word, `✓` on verified topics,
   alert glyph (`i ✓ ! !`) + bold lead word, `!` + weight on field errors.
4. **No boxed cards, no drop shadows.** A group = one top hairline (`--rule`,
   ink at 16%) + a Fragment Mono uppercase label + content beneath. (Alerts and
   the moderation notice carry a 2px coloured top rule + a faint tint — still no
   full box.)
5. **`2px` radius maximum.** No pills. Measures in `ch` / `rem`.
6. **Focus is always visible:** `2px solid` outline in the contextual accent
   colour, `outline-offset` 2–3px.
7. Portal accent mapping: learner → violet, tutor → gold, admin → grey/ink.

## Allowed variation

- Portal-specific lead colour and nav active-state colour.
- Left-aligned dense layouts (tables, rosters) while keeping both colour families
  intact; centred/symmetric only where the screen allows (marketing, auth, empty).
- New status codes reusing an existing **state** tint
  (info / success / warning / error / neutral) — each with a code + word.
- Tuning any colour token's lightness/chroma for contrast.
- Content density per screen; number of sessions/rows/filters.
- Dark-ground tokens in `base.css` may be tuned; light is the design.

## Prohibited normalisation

- A new state hue beyond info / success / warning / error.
- Mixing the two families (identity colour on a state, or vice versa).
- Card chrome, pills, boxes/borders around content, shadows.
- Icon set standing in for the colour key.
- Apfel Grotezk on IDs/times/status; Fragment Mono on long body prose.
- Forcing centred layout onto data tables.

## Reopening conditions

Reopen the locked direction only for: new subject evidence, cultural harm, an
accessibility failure that cannot be solved within these rules, a changed product
requirement, or an explicit user override. Record the reason and the authorising
decision here when it happens.

## Open issues to resolve before implementation

- Re-check contrast at the smallest shipped sizes (target 4.5:1) for every colour
  token — the new state set (`--info --success --warning --error`) plus `--tutor`;
  adjust token lightness/chroma, not the roles. Amber `--warning` and green
  `--success` on the warm canvas are the ones to watch.
- Confirm identity vs. state stay visually distinct in the same row (violet ID +
  red status chip) and in greyscale.
- Greyscale/colour-blind pass on every status and ID in context.
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
