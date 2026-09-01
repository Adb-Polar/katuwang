# Capsule B

## Premise (subject-derived)
The Filipino *section* is a named cohort whose day begins with a roll called aloud
in sequence — an ordered, spoken, ceremonial cadence. The page is that register:
a numbered vertical list, hanging tabular indices in the left margin, each entry
announced in large condensed capitals like a class list posted on a wall, with a
quiet supporting line beneath.

## Fonts
- **League Spartan** — The League of Moveable Type. SIL OFL 1.1. Variable weight
  100–900, self-hosted `fonts/LeagueSpartan-var.ttf`. Used at 700 (calls) / 800 (masthead).
- **Apfel Grotezk** — Collletttivo. SIL OFL 1.1. `Regular.woff2` for meta lines.
- Fallbacks: `system-ui, sans-serif`.
- Pairing logic: a geometric high-impact display voice for the thing being called;
  a plain humanist grotesque for the thing being recorded.

## Hierarchy & type roles
1. Masthead `Katuwang` — League Spartan 800, uppercase, 0.02em, ~2.4–4.2rem, line-height 0.92.
2. Subhead — Apfel 400, 0.82rem, 0.16em tracking, uppercase, secondary colour.
3. Index numerals `01`–`05` — Apfel 400, tabular-nums, 0.9rem, secondary colour, hanging in a 3.2ch column.
4. Calls — League Spartan 700, uppercase, 0.05em, ~1.35–2.5rem, line-height 1.0, primary colour.
5. Meta — Apfel 400, 0.82rem, 0.05em, line-height 1.5, secondary colour, `pre-wrap`.

## Case / weight / spacing
Calls and masthead all-caps with positive tracking; meta sentence case. Strong
size contrast between call and meta (~3×). Line-height compressed on calls (1.0)
so multi-line entries read as one chanted block.

## Canvas & colour (2 active letterform colours)
- Canvas: `oklch(96.5% 0.012 95)` — pale straw. ~100% of surface.
- Primary: `oklch(26% 0.03 42)` — dark umber. Calls + masthead. ~55% of text ink.
- Secondary: `oklch(50% 0.024 45)` — faded brown. Numerals + subhead + every meta
  line. ~45% of text ink. Role: everything already-recorded / supporting sits one
  step back from the thing being called.

## Space & composition
- Left-aligned single column, `max-width: 54rem`, body padding `clamp(2.5rem,8vw,6.5rem)` / `clamp(1.25rem,6vw,5.5rem)`.
- Each `li` is a grid `3.2ch 1fr`, column-gap `clamp(1rem,4vw,2.5rem)`; numerals hang.
- Entry padding `clamp(1.1rem,3vw,1.7rem)` top and bottom — even register cadence.
- Meta offset `0.55rem` below its call.
- No rules between entries; the numeral column and the rhythm do the separating.

## Signature relationship
The hanging tabular numeral column plus the ceremonial all-caps call: the platform
"takes attendance" of everything — a class, a schedule, an identity, a set of
states — by reading it out in order.

## Invariants if this continues
- Ordered, indexed, top-to-bottom reading. Hanging tabular numerals.
- Condensed all-caps display voice for the primary item; plain grotesque for meta.
- Two-tone ink: called vs recorded.
- No dividers; rhythm and the index column carry structure.

## Allowed variation
Index scheme may become `01 / 01.1` for nested items (sessions within a class).
Call size may step down for dense list screens. Meta may carry 2–3 lines.

## Prohibited normalisation
No bullet dots, no rules, no cards, no colour beyond the two inks. The display
face never drops to sentence case for calls. Numerals never become proportional.

## Provisional assumptions / risks
- Pledge line is provisional working copy.
- Very long calls (entry 04) wrap to 3 lines on narrow screens — intended, but
  Round 2 must confirm it still reads as ceremonial, not broken.
- Straw canvas + faded-brown secondary: check secondary text stays ≥ 4.5:1 at
  small sizes; darken toward `oklch(46% ...)` if not.

## Round 2 translation notes
List and table screens are the native home: leading tabular index column, all-caps
condensed row headers, muted grotesque metadata. Dashboards become a called
sequence of stat entries rather than a card grid. Page headers = masthead weight.
Buttons: all-caps League Spartan with tracking. Keep everything on the two inks;
"danger" is size and position, not red.
