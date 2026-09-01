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

## Composition & the Round 2 additions

Shapes, rules, fills, and interaction states enter now, derived from the "legend"
premise — not imported from another style:

- **No boxed cards or drop shadows.** A group is delimited by a single top
  **hairline rule** (`1px`, `--rule` = ink at 16%) and a Fragment Mono uppercase
  label, with content flowing beneath — like ruled entries in a printed key.
- **Rules** are only ever thin horizontal separators (section tops, table rows,
  list rows). Never full borders / outlines around content.
- **Fills** appear only on: primary buttons (ink fill, canvas text), status chips
  (role colour at ~10% tint behind the mono code), and selected form options.
  Chips are rectangular, `2px` radius, Fragment Mono.
- **Radius:** `2px` everywhere (printed-key feel). No pill shapes.
- **Focus:** `outline: 2px solid` in the contextual role colour (learner violet in
  the learner portal, etc.), `outline-offset: 2–3px`. Always visible.
- **Inputs:** underline only (`border-bottom: 1px solid --rule`), transparent
  background, Fragment Mono value, Apfel Grotezk `<label>` above. Focus darkens the
  underline and shows the outline.
- **Layout:** portal = a left vertical nav (the index to the key, Fragment Mono
  list) + a centred content column (`max-width` ~64–72rem). Marketing and auth are
  fully centred/symmetric. Tables left-align but keep the colour roles.
- **Mobile:** the nav collapses into a native `<details>/<summary>` disclosure
  (no JS). Tables reflow to stacked label/value rows using explicit markup labels.
- **Motion:** none required; if added, ≤ 150ms opacity/transform, and gated by
  `prefers-reduced-motion`.

## Portal accent mapping

- Learner portal → learner violet accents (nav active state, focus, portal label).
- Tutor portal → tutor gold accents.
- Admin portal → system grey / ink accents (admin belongs to neither peer).

## Invariants (do not change without an explicit reopen)

1. Two colour families with fixed jobs — identity (ink / learner / tutor / system)
   for *who*, state (info / success / warning / error) for *what* — never mixed.
2. Fragment Mono = notation, Apfel Grotezk = speech.
3. Every colour paired with a non-colour cue (prefix / code + word / glyph).
4. No boxed cards / shadows; groups delimited by a hairline + mono label.
   (Alerts and the moderation notice: a 2px coloured top rule + faint tint, no box.)
5. `2px` radius maximum; measures in `ch`/`rem`.

## Allowed variation

Portal-specific lead colour; left-aligned dense layouts (keeping both families);
new status codes reusing an existing state tint (info / success / warning / error
/ neutral); tuning any colour token for contrast; content density per screen.

## Prohibited normalisation

No new state hue beyond info / success / warning / error; no mixing the two
families; no card chrome, pills, or icon set replacing the code + word cue; no
centring forced onto data tables; Apfel Grotezk never used for IDs/times/status;
Fragment Mono never used for long body prose.

## Open issues carried into Round 2 verification

- Confirm every colour token (`--info --success --warning --error`, `--tutor`)
  meets 4.5:1 at the smallest sizes actually used — amber and green on the warm
  canvas most of all.
- Confirm identity and state stay distinct in one row and in greyscale.
- Confirm centred text blocks stay ≤ 60ch and left-align on dense screens.
- Keyboard: nav disclosure, table row actions, and dialogs must be fully operable
  and focus-visible; dialogs trap focus while open and restore it on close.

## User corrections appended at lock

None. Locked as-is.
