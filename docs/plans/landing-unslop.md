# Landing page and theme unslop pass

## Goal
Remove generic AI-template styling from the landing page and the shared theme,
and fix low-contrast secondary text across the app.

## Direction
- Aesthetic: "School ID, plainly printed."
- Signature: the anonymous ID pair (STU-2071 / TUT-0148) set large in Fragment
  Mono as the hero visual. Nothing else competes with it.
- Palette: cool neutral background `oklch(97.5% 0.004 250)`, white surface, ink
  `oklch(24% 0.02 258)`, muted `oklch(46% 0.02 258)`, faint `oklch(52% 0.02 258)`,
  border `oklch(90% 0.008 250)`, teal primary. Violet and gold only mark
  learner and tutor IDs.
- Type: Apfel Grotezk for all words (headings, body, buttons, nav). Fragment
  Mono only for IDs, class codes, scores, dates and times.
- Avoid: gradients, sparkle/"magic" icons, hover lift or scale, blur, uppercase
  spaced eyebrows, cards inside cards, opacity-based text colour.

## Steps
1. Theme tokens in `src/app/globals.css` (base colours, solid muted/faint,
   button and nav font, badge dot on status badges only, solid topbar).
2. Rewrite `src/components/landing/UploadedLanding.tsx` on theme tokens; delete
   `uploaded-landing.css` and the landing-only palette.
3. Replace `Sparkles`; remove hover lift/scale from cards and avatar.
4. Map `text-base-content/40–55` → `text-(--kt-faint)` and `/60–80` →
   `text-(--kt-muted)` app-wide.
5. Typecheck, lint, test, browser check, log in Changes.md and TOTEST.

## Not in scope
- The older landing components (`LandingHero`, `StoryTimeline`, `PrivacyPayoff`,
  `StoryEnd`, `LandingNav`, `LandingFooter` and the four sample visuals) are no
  longer rendered anywhere. Deleting them is a separate cleanup.

## Final landing design (2026-11-17)

After the audit, the landing page was redesigned from local prototypes in
`design/round-3/` (untracked). Choices, in order:
- Fonts: IBM Plex Serif (headings, IDs) + IBM Plex Sans (text). One display
  face, one readable body face; no monospace.
- Layout: decluttered to five short sections; hero balanced by a flat vector
  illustration of a tutor helping a learner.
- Personality, kept small: italic accent line, Tagalog kickers (Paano?,
  Pribado, Mga tanong), one tinted band, role colours on the join links.
- Palette "Dagat": primary `oklch(42% 0.09 222)` (#005770), learner coral,
  tutor citrus; logo drawn in the primary colour. All text pairings pass AA.
- No mention of RA 10173 on the page.

Scope: landing page only (`.kt-landing`). Applying Plex and Dagat to the
portals, and recolouring the logo files in `public/logos/`, are separate
decisions. A recoloured logo is saved at `design/round-3/landing-base/logo-dagat.svg`.
