# Capsule E

## Premise (subject-derived)
Katuwang replaces names with a notation: `STU-XXXX` for learners, `TUT-XXXX` for
tutors, plus grade, section, and status. The page is the *key* to that notation —
calm, centred, symmetric, like a map legend — where colour tells you which side of
the double-blind a token belongs to, so a name is never needed. Learner-side text
is violet, tutor-side text is gold, system/audit text is grey, and human/neutral
language is plain ink.

## Fonts
- **Fragment Mono** — Wei Huang. SIL OFL 1.1. Self-hosted
  `fonts/FragmentMono-Regular.woff2` + `Italic.woff2`. All coded/key lines (IDs,
  times, states, nav, log, actions).
- **Apfel Grotezk** — Collletttivo. SIL OFL 1.1. `Regular|Mittel|Fett.woff2`.
  Wordmark, headline, and prose framing.
- Fallbacks: `ui-monospace, monospace` / `system-ui, sans-serif`.
- Pairing logic: a humanist monospace for anything that is *notation*; a warm
  grotesque for anything that is *speech*.

## Hierarchy & type roles
1. Wordmark — Apfel 700, uppercase, 0.34em tracking, 0.95rem.
2. Portal line — Apfel 400, 0.9rem.
3. Headline `Learn with a peer who gets it.` — Apfel 500, ~1.85–3rem, 18ch, centred.
4. Intake — Apfel 400, 0.92rem.
5. Key block — Fragment Mono, ~0.9–1rem, line-height 2.15, 52ch, centred, `pre-wrap`.
6. Actions — Fragment Mono, 0.92rem.

## Case / weight / spacing
Mostly mixed case; wordmark uppercased and widely tracked. Low weight contrast
(400 / 500 / 700). Generous line-height in the key (2.15) so each coded line reads
as its own legend entry. Centred symmetry throughout.

## Canvas & colour (4 active letterform colours)
- Canvas: `oklch(98% 0.004 90)` — warm near-white. ~100% of surface.
- Ink `oklch(22% 0.01 70)` — primary. Wordmark, headline, portal/intake, and all
  neutral key prose (`You are … Your learner is …`, section, session, nav). ~65% of text.
- Learner `oklch(46% 0.15 300)` — violet. Governs `STU-2071` and the state
  `Enrolled`. ~8% of text. Role: this token belongs to the learner side.
- Tutor `oklch(50% 0.10 76)` — gold/ochre. Governs `TUT-0148` and `6 verified
  topics`. ~8% of text. Role: this token belongs to the tutor side.
- System `oklch(55% 0.014 265)` — grey. Governs `2 pending requests`, `Completed`,
  `Suspended`, and the whole `Requested 28 Aug 2026 · reviewed by admin` line.
  ~19% of text. Role: platform / audit, belonging to neither peer.

Each colour appears in genuine supplied content and changes how the line is read
(which side owns it), not as a highlight or swatch.

## Space & composition
- `display:flex; flex-direction:column; align-items:center; text-align:center`.
- `gap: clamp(1.9rem,5.5vw,3.1rem)` between blocks; body padding `clamp(2.75rem,9vw,7rem)` / `clamp(1.25rem,6vw,3rem)`.
- `.block` max-width 40rem; key block 52ch; headline 18ch — nested centred measures.
- No rules, no columns — symmetry and vertical rhythm only.

## Signature relationship
Colour = which side of the double-blind a token is on. `TUT-0148` is gold,
`STU-2071` is violet, the audit line is grey — the identities stay hidden because
the colour already tells you everything the interface needs.

## Invariants if this continues
- Four fixed colour roles: neutral ink / learner violet / tutor gold / system grey.
- Notation (IDs, times, states, logs) in monospace; speech in the grotesque.
- Centred, symmetric composition; measures in `ch`/`rem`, `margin: 0 auto`.
- Colour only ever encodes side/ownership, never decoration or mere emphasis.

## Allowed variation
Layout may left-align for dense screens while keeping the four-role colour key.
A learner-portal screen may lead with violet, a tutor-portal screen with gold.
Additional coded roles (e.g. session status) join the monospace set.

## Prohibited normalisation
No fifth colour. Violet/gold never used purely for visual interest on non-role
text. No card chrome, borders, or icons standing in for the colour key.

## Provisional assumptions / risks
- Pledge line is provisional working copy.
- `--tutor` gold at `oklch(50% 0.10 76)` on near-white is ~4.4:1 — borderline for
  small text; Round 2 should verify and darken to ~`oklch(46% 0.11 74)` if needed.
- Colour-only encoding fails for colour-blind users and greyscale print — Round 2
  MUST pair every role colour with a non-colour cue (the `STU-`/`TUT-` prefix
  already does this for IDs; states need a shape-free textual cue too).
- Centred long lines can hurt readability; hold the key block ≤ 52ch and left-align
  it in Round 2 if testing shows strain.

## Round 2 translation notes
The four-role colour key is the system's backbone: learner data violet, tutor data
gold, audit/system grey, neutral copy ink — across every portal. Monospace for all
IDs, timestamps, counts, and status; grotesque for headings and sentences.
Keep compositions centred/symmetric where the screen allows; left-align tables but
keep the colour roles. Always add a redundant non-colour cue for each role.
