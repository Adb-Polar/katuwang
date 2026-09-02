# Capsule A

## Premise (subject-derived)
Double-blind anonymity (RA 10173) means two people work on the same problem from
opposite sides and never see across the boundary. The page is built as two side
columns — one leaning right, one leaning left — that face a wide central channel of
whitespace they never cross. Only shared reality (the class name, the schedule, the
pledge, the navigation both roles use) is allowed to span the full measure and
cross the channel.

## Fonts
- **Apfel Grotezk** — Collletttivo (Alexander Meyer), Italy. SIL OFL 1.1.
  Self-hosted `fonts/ApfelGrotezk-Regular|Mittel|Fett.woff2` (weights 400 / 500 / 700).
- Fallback: `system-ui, sans-serif` (metric stand-in only).
- One family across the whole page: the platform is the single thing holding both
  sides.

## Hierarchy & type roles
1. Display sentence — `Learn with a peer who gets it.` — weight 500, ~2.1–4.1rem, −0.015em tracking, 15ch measure, centered, crosses the channel.
2. Wordmark — 1rem, 0.42em tracking, uppercase, centered.
3. Side-column leads — weight 500, 1.05rem.
4. Side-column body — weight 400, 0.95rem, line-height 1.55.
5. Pledge — 1.02–1.2rem, 27ch measure, centered.
6. Session line — weight 500, ~1rem, centered.
7. Nav — 0.78rem, 0.24em tracking, uppercase, `white-space: pre-wrap` preserves the triple spaces.

## Case / weight / spacing
Mixed case throughout except the uppercased wordmark and nav. Weight contrast is
narrow (400 / 500 / 700). Tight leading on the display line (1.04), open leading in
the columns. No italics.

## Canvas & colour (1 active letterform colour)
- Canvas: `oklch(98.5% 0.006 85)` — warm near-white paper. ~100% of surface.
- Ink: `oklch(23% 0.012 60)` — single warm near-black. ~100% of text. High contrast.
- No second colour: the separation is structural (the channel), not chromatic.

## Space & composition
- Body padding `clamp(2rem,7vw,6rem)` block / `clamp(1.25rem,6vw,5rem)` inline.
- Vertical rhythm: `gap: clamp(2.75rem,8vw,6rem)` between stacked blocks.
- Two-column grid `1fr 1fr`, column-gap `clamp(2.5rem,14vw,12rem)` — the channel.
- Left column `text-align:right`, right column `text-align:left` — both lean inward.
- Spanning blocks centered, `max-width` 15–34ch, `margin: 0 auto`.
- Below 640px the two columns stack and centre; the channel becomes a vertical
  pause between the learner block and the tutor block.

## Signature relationship
The uncrossable central channel of whitespace. Side content leans toward it;
only what both roles literally share is permitted to bridge it.

## Invariants if this continues
- One typeface, one ink colour, warm paper canvas.
- A structural gap that separates the two roles without a rule, box, or colour.
- Shared entities (class, schedule, nav, pledge) always span; role-specific
  material never does.
- Narrow weight range; hierarchy carried by size, measure, and alignment.

## Allowed variation
Column count on wide dashboards may become asymmetric (e.g. roster wide, meta
narrow) as long as the channel survives. Display size scales freely.

## Prohibited normalisation
No dividers, borders, cards, or coloured role chips to mark the split. No second
text colour introduced just to distinguish learner from tutor.

## Provisional assumptions / risks
- The pledge sentence is provisional working copy.
- On very narrow screens the mirrored alignment collapses to centred; acceptable
  but reduces the signature — Round 2 should test a retained micro-channel.
- 1-colour system leans hard on spacing discipline; sloppy vertical rhythm would
  read as unfinished rather than quiet.

## Round 2 translation notes
Treat the channel as the layout spine: sidebar/content, or learner-data /
tutor-data, sit either side of a generous empty gutter. Shared page furniture
(page title, primary action, breadcrumb) spans full width across the gutter.
Keep the single ink; use weight and size — never colour — for state and emphasis.
Status can be conveyed with uppercase + tracking rather than colour.
