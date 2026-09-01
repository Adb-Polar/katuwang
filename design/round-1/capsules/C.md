# Capsule C

## Premise (subject-derived)
School life for Grades 7–12 is a grid of fixed time blocks, and Katuwang's core
data — recurring weekly session windows, capacity counts, anonymous IDs, status
flags — is all monospaced record. The page is a single printed timetable / terminal
schedule: every line snaps to one fixed character lattice, labels in the left
gutter, values on the ruler, so a class time, an ID, and a status all measure
against the same columns.

## Fonts
- **JetBrains Mono** — JetBrains. SIL OFL 1.1. Self-hosted
  `fonts/JetBrainsMono-Regular|Medium|Bold.woff2` (400 / 500 / 700).
- Fallback: `ui-monospace, monospace`.
- One monospaced family only: the lattice is the whole idea; a second face would
  break the ruler.

## Hierarchy & type roles
1. Title `KATUWANG` — 700, 0.24em tracking, 15px.
2. Row label (left gutter) — 400, lowercase, `--spent` colour, 13ch column.
3. Row value — 400, `--primary`, on the ruler.
4. Live value — `--live` colour (the active session; the word `Open`).
5. Spent value — `--spent` colour (past / audit: `Completed`, the reviewed-on log line).
6. Closing line — `Learn with a peer who gets it.` — 500, 19px, 24ch, after a large
   whitespace drop; the one human sentence, still in the same typewriter.

## Case / weight / spacing
Body 14px / line-height 1.75. Labels lowercase, values sentence case, title upper.
Very low weight contrast (400 vs occasional 500/700). No italics. Character grid
enforced by `grid-template-columns: 13ch 1fr` and `ch`-based sheet width (62ch).

## Canvas & colour (3 active letterform colours)
- Canvas: `oklch(97% 0.006 210)` — faint cool grey-blue (schedule paper). ~100%.
- Primary: `oklch(28% 0.02 220)` — cool near-black. Most values + title + closing. ~70% of text.
- Live: `oklch(46% 0.13 150)` — green. Only the currently-active session line and
  the status word `Open`. ~10% of text. Role: now / active.
- Spent: `oklch(57% 0.014 220)` — dim grey. All left-gutter labels, `Completed`,
  and the `Requested … reviewed by admin` log line. ~20% of text. Role: past / metadata.

## Space & composition
- Centred sheet, `width: 62ch`, `max-width: 100%`.
- Body padding `clamp(2rem,7vw,5.5rem)` / `clamp(1.1rem,5vw,4rem)`.
- Rows are flush, `line-height` doing the spacing; `.gap` blocks (1.75rem) group
  rows into three bands: intake / live state / navigation + log.
- `white-space: pre-wrap` + `overflow-wrap: anywhere` keep long values on the grid.
- Closing line separated by `margin-top: 3.5rem` — the deliberate silence at the
  bottom of the printout.

## Signature relationship
One monospace lattice on which a class time, an anonymous ID, and a status word are
all measured against the same columns — the platform as a single timetable.

## Invariants if this continues
- Monospaced everything; `ch`-based measures; label-gutter + value-ruler rows.
- Three inks with fixed jobs: primary = content, live = active-now, spent = past/meta.
- Bands separated by whitespace, never rules.
- Human sentences allowed, but only ever as larger type in the same monospace.

## Allowed variation
Sheet width may widen to 80–100ch for tables. A fourth band may appear. Live
colour may also flag an imminent deadline. Row labels may nest (`session.1`).

## Prohibited normalisation
No proportional type, no colour outside the three inks, no boxes/rules/tabs
chrome. Green never becomes a generic "success pill"; it only ever marks *now*.

## Provisional assumptions / risks
- Pledge line is provisional working copy.
- `--live` green on the pale canvas may fall near 3:1 — acceptable for the short
  active flags at 14px+, but Round 2 should verify and darken to ~`oklch(43% ...)`
  if used for longer text.
- Monospace at 14px is dense on phones; Round 2 may need 15px + tighter grid.

## Round 2 translation notes
This is a natural fit for schedule views, class detail, rosters, audit log, and
settings (label/value rows). Dashboards = banded label/value readouts, not cards.
Forms = `field ........ [value]` rows. Keep the three-ink discipline: active
session/next deadline in green, historical/audit in dim grey, everything else
primary. Buttons can be `[ create account ]` bracket-style in monospace.
