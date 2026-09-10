# Round 2 Context — Locked Direction E

Locked by the user on 2026-09-01. This is the governing context for every Round 2
artifact. The other four Round 1 studies (A, B, C, D) are terminated.

Source of truth for the direction: `design/round-1/E.html` and
`design/round-1/capsules/E.md` (reproduced and extended below).

---

## Premise (unchanged from Round 1)

Katuwang replaces names with a notation — `STU-XXXX` for learners, `TUT-XXXX` for
tutors, plus grade, section, and status. The interface is the **key** to that
notation: calm, centred where the screen allows, symmetric, like a map legend.
**Colour tells you which side of the double-blind a token belongs to**, so a real
name is never needed. Learner-side text is violet, tutor-side text is gold,
system/audit text is grey, neutral human language is plain ink.

## Typography (invariant)

- **Fragment Mono** (Wei Huang, SIL OFL 1.1) — *notation*: IDs, dates, times,
  counts, status codes, capacity, navigation items, audit strings, code fields,
  buttons.
- **Apfel Grotezk** (Collletttivo / Alexander Meyer, SIL OFL 1.1) — *speech*:
  page titles, section labels, sentences, descriptions, form labels.
- Fallbacks: `ui-monospace, monospace` / `system-ui, sans-serif`.
- Low weight contrast (400 / 500 / 700). Generous line-height on notation blocks
  (legend entries read individually). Measures in `ch` / `rem`.

## Colour — two families (reopened 2026-09-01 for usability)

Canvas: `oklch(98% 0.004 90)` warm near-white.

### Identity family — *who* (only on IDs, identity labels, portal accents)

| Role | Value | Governs |
|---|---|---|
| Ink (neutral) | `oklch(22% 0.01 70)` | headings, neutral prose/data, primary buttons |
| Learner | `oklch(45% 0.15 300)` | `STU-XXXX`, learner-portal accent |
| Tutor | `oklch(48% 0.12 88)` | `TUT-XXXX`, tutor-portal accent (hue nudged off amber) |
| System | `oklch(48% 0.014 265)` | muted meta, disabled, archived (`Completed`, `Draft`), admin accent |

### State family — *what is happening* (chips, alerts, validation)

| Role | Value | Governs |
|---|---|---|
| Info | `oklch(52% 0.13 245)` blue | informational notes, `Scheduled` |
| Success | `oklch(50% 0.13 150)` green | `Open`, `Active`, `Enrolled`, `Published`, verified topics, confirmations |
| Warning | `oklch(60% 0.13 65)` amber | `Pending`, `Full`, needs-attention banners |
| Error | `oklch(53% 0.21 25)` red | `Suspended`, `Cancelled`, validation errors, destructive actions, moderation notices |

**Keep the families apart.** Identity colour never marks a state; state colour
never marks a person. An `STU-XXXX` stays violet inside a red `SUS` row — the ID
and the status chip carry different colours on purpose.

**Every colour is still paired with a non-colour cue:**

- IDs carry the `STU-` / `TUT-` prefix.
- Status = a 3-letter Fragment Mono code **plus** the full word:
  `OPN Open` · `ACT Active` · `ENR Enrolled` · `PUB Published` · `SCH Scheduled`
  · `PEN Pending` · `FUL Full` · `SUS Suspended` · `CAN Cancelled` ·
  `CMP Completed` · `DRF Draft`.
- Verified topics carry a leading `✓`.
- Alerts carry a leading glyph (`i` info · `✓` success · `!` warning · `!` error)
  and a bold lead word. Field errors: red + leading `!` + heavier weight.

## Composition — card UI (reopened 2026-09-01 against a reference image)

The original "flat legend, no cards, hairlines only" composition is replaced by a
card-based dashboard, per `design/reference/Pasted image.png`. Typography and the
two colour families carry over unchanged; the shell is new.

- **Cards.** Content lives in white `.card`s: `--radius-card` `.5rem`, `1px`
  `--border`, `--shadow-card` (soft). Light-grey `--bg` page behind. Optional
  `.card-head` = title (left) + tools/`⋯` (right). No nested cards.
- **Sidebar** (`.sidebar`, white, `--nav-w` ≈ 15.5rem): brand row (green
  `.brand-mark` tile + wordmark + `«` collapse), then `.nav-group`s each led by a
  small uppercase `.label`; `.nav-item` = a letter-tile `.ic` + label; the active
  item is a green-tint pill with green text and a solid-green tile. A `.side-promo`
  card (green gradient, white text + white button) sits at the bottom, then
  `.side-foot` (viewer ID + theme toggle).
- **Top bar** (`.topbar`, sticky, blur): pill `.search` with `⌘K` `kbd`, a
  `.spacer`, round `.icon-btn`s (help, notifications), an `.avatar` (initials in
  the identity colour).
- **Buttons:** `.btn` (light, bordered) default; `.btn--brand` (green) for the
  main in-context action (Enrol, Create class, Continue); `.btn--primary` (dark
  near-black) for the top-level page action (reference's "Export Report");
  `.btn--danger` (red) destructive; `.btn--quiet` link-like.
- **Badges** are pills: `●` + 3-letter code + word, tinted `--*-tint`.
- **Inputs:** filled (`--surface`), `1px` border, `--radius`; focus = green border
  + `3px` `--brand-tint` ring. Apfel Grotezk `<label>` above, Fragment Mono value.
- **Radius:** `.5rem` controls · `.5rem` cards · pill on badges/search/avatar.
- **Focus:** `2px solid var(--focus)` (green), `outline-offset 2px`. Always visible.
- **Layout:** `.app` = `sidebar | (topbar + main)`. `.main-inner` `max-width` ≈
  78rem, cards stacked / in `.grid-2` / `.grid-3`. Marketing + auth stay centred
  (`.centre`, `.auth-card`). Tables left-align, reflow to stacked rows < 48rem.
- **Mobile (< 64rem):** sidebar → `<details>` `.nav-mobile` (no JS).
- **"Icons":** no SVG (skill ban still holds). Nav/stat/row icons are 1–2 char
  Fragment Mono letter-tiles; a few inline text glyphs (`⌕ ⋯ ◔ ▤ ▦ ↗ ‹ ›`).
- **Charts:** pure-CSS bar chart (`.chart .plot .bar`), pale-green bars, one
  `data-peak` bar in solid green with a `.tip`.
- **Motion:** ≤ 120ms colour transitions on hover, gated by
  `prefers-reduced-motion`.

## Brand / accent mapping

- **Palette = the live app theme** (`src/app/globals.css`, "katuwang theme"):
  base-100/200/300 → surface / page / border, base-content → text; primary **teal**
  → `--brand`; secondary **ube** → `--learner`; accent **marigold** → `--tutor`
  (darkened for ID-text legibility); the app's info / success / warning / error → state.
- **`--brand` (teal)** = brand + primary: sidebar active-pill, `.brand-mark`,
  `.btn--brand`, focus ring, progress bars, chart bars, promo card. Success is a
  separate green (`--success`); positive `.delta` uses success.
- The **dark `.btn--primary`** is the top-level page action.
- Identity colour appears on the viewer's ID in `.side-foot` and the `.avatar`
  (learner → violet, tutor → gold, admin → grey), and on every `STU-`/`TUT-` token.

## Invariants (do not change without an explicit reopen)

1. Fragment Mono = notation, Apfel Grotezk = speech (see §Typography).
2. Two colour families — identity (violet `STU`, gold `TUT`) for *who*, state
   (info / success / warning / error / neutral) for *what* — never mixed. Green
   `--brand` is the shared brand + primary + success colour.
3. Every colour paired with a non-colour cue (prefix / code + word / glyph).
4. Card shell: white `.card`s (`.5rem` radius, soft shadow) on a light-grey page;
   grouped sidebar with a green active-pill; sticky top bar; pill badges. See
   §Composition.
5. Radius: `.5rem` controls · `.5rem` cards · pill on badges/search/avatar.
6. ~~No pictographic SVG icons — letter-tiles / text glyphs only.~~
   **SUPERSEDED 2026-09-10** — the build uses `lucide-react` for row/action/nav
   icons; the Fragment Mono letter-tile survives only as the nav-group glyph.
   See `docs/reference/decisions.md` → "Lucide icon set supersedes the no-SVG
   invariant".

## Allowed variation

Card contents and grid layout; stat/row/filter counts; which letter fills an
`.ic`/`.tile`; new status codes reusing an existing state tint; tuning any colour
token or shadow depth for contrast; dark-theme values; chart type.

## Prohibited normalisation

No new state hue beyond info / success / warning / error / neutral; no mixing the
two colour families; no SVG icon set; no nested cards; Apfel Grotezk never on
IDs/times/status; Fragment Mono never on long body prose; data tables never
force-centred.

## Open issues carried into Round 2 verification

- Contrast at shipped sizes (target 4.5:1): badge text on its tint, `--text-mut`
  on `--surface`, green nav-pill text, white on `--brand`.
- Identity vs. state stay distinct in one row and in greyscale.
- Letter-tile "icons" are a placeholder — decide keep-letters vs. icon-font vs.
  CSS icons (no SVG) at implementation.
- Keyboard: sidebar `<details>`, `⋯` menus, row actions, dialogs fully operable
  and focus-visible; dialogs trap focus while open and restore it on close.
- Replace placeholder copy with real app strings.

## History

- Locked (typography origin): Round 1 study E, 2026-09-01.
- Reopen (a) 2026-09-01: added the semantic state colour family.
- Reopen (b) 2026-09-01: replaced the flat legend composition with this card UI,
  against `design/reference/Pasted image.png` (user override). Typography + the
  two colour families kept.
