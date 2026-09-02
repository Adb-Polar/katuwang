# Capsule D

## Premise (subject-derived)
Katuwang holds a tension between a peer "who gets it" and an institution that must
log, review, and moderate everything under K-12 rules. The page stages that gap:
one warm, large, plainly-spoken serif voice at the top (the peer), and beneath a
wide silence, the same facts reduced to small, cool, uppercase machine-print (the
record). The reader hears the person first, then sees the system transcribe them.

## Fonts
- **Young Serif** — Bastien Sozeau, via Uncut. SIL OFL 1.1. Self-hosted
  `fonts/YoungSerif-Regular.woff2` (single weight 400). The warm voice.
- **Bricolage Grotesque** — Mathieu Triay, via Uncut. SIL OFL 1.1. Variable
  200–800, self-hosted `fonts/BricolageGrotesque-var.ttf`. The record; used ~400.
- Fallbacks: `Georgia, serif` / `system-ui, sans-serif`.
- Pairing logic: a sturdy, slightly rustic display serif for human speech; a
  cool contemporary grotesque, small and tracked, for institutional metadata.

## Hierarchy & type roles
1. Headline `Learn with a peer who gets it.` — Young Serif, ~2.1–3.7rem, line-height 1.12, 32ch.
2. Name `Katuwang` — Young Serif, ~1.2–1.6rem, above the headline.
3. Pledge — Young Serif, ~1.15–1.5rem, line-height 1.34, 30ch.
4. Cohort — Young Serif, ~1.05–1.25rem.
5. Record block — Bricolage 400, 0.7rem, uppercase, 0.15em tracking, line-height 2,
   `--cool` colour, 46ch, each line its own `display:block`, `pre-wrap`.

## Case / weight / spacing
Serif voice is sentence case, near-single weight, generous size. Record is
uppercase, small, wide-tracked, one modest weight. Extreme size contrast
(headline ≈ 5–6× the record). The vertical gap between the two zones is the
loudest element: `margin-top: clamp(3.5rem,12vw,8rem)`.

## Canvas & colour (2 active letterform colours)
- Canvas: `oklch(97% 0.014 72)` — warm cream. ~100% of surface.
- Warm: `oklch(24% 0.035 45)` — warm near-black. All serif voice. ~75% of text.
- Cool: `oklch(52% 0.014 250)` — desaturated blue-grey. Entire record block. ~25%.
  Role: everything the institution stores rather than says.

## Space & composition
- Asymmetric: large left inset `padding-left: clamp(1.5rem,13vw,13rem)`, ragged
  right, serif block capped at 32ch. Body is a column (`flex`, `min-height:100vh`).
- Block padding `clamp(2.5rem,9vw,7rem)`.
- Record sits far below the voice, left-aligned to the same inset, capped 46ch.

## Signature relationship
The size-and-temperature gap between what a peer says (big, warm serif) and what
the system records (small, cool, uppercase grotesque), joined only by a wide
vertical silence.

## Invariants if this continues
- Two zones: warm serif human voice, cool small-caps institutional record.
- No rule or box between them — only whitespace.
- Serif never goes uppercase; record never goes large or warm.
- Left inset / ragged right asymmetry.

## Allowed variation
The record zone may gain rows and become a definition list (still small, cool,
tracked). On data screens the serif voice may shrink to a single page-title line
while the record expands. Left inset may reduce on mobile.

## Prohibited normalisation
No coloured status pills, no card containers, no centring of the serif voice, no
second display face. The record must stay visually subordinate — never promoted to
body size.

## Provisional assumptions / risks
- Pledge line is provisional working copy.
- Young Serif is a display face at a single weight — long body passages would tire;
  keep it to headline / pledge / short lines only.
- 0.7rem uppercase record is near the legibility floor; Round 2 should hold it at
  ≥ 0.72rem and verify `--cool` contrast at that size (~4.6:1 target).
- Large left inset wastes width on tablets; needs a considered mid-breakpoint.

## Round 2 translation notes
Page headers = the warm serif voice (title + one-line intent). Everything
structural — filters, table meta, breadcrumbs, audit strings, form hints, status —
is the cool tracked small-caps record. Body content sits between them at a neutral
serif or a defined text size. Moderation/notice states live in the record zone,
distinguished by weight (Bricolage 600), not colour.
