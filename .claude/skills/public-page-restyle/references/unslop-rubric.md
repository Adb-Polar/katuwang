# Unslop rubric

Flag these on the target page. Quote the evidence (class string, colour, copy) with `file:line`,
and give each a severity:

- **Critical** — hurts use or accessibility: text under 4.5:1 contrast, controls that do nothing,
  copy that promises something the code doesn't do, unreadable 11–12px body text.
- **High** — the page reads as a template: generic hero/headline copy, gradients, nested cards,
  mismatched siblings, decorative icons doing the talking.
- **Medium** — polish: spacing hacks, stray tracking, leftover unused props, inconsistent links.

## The tells

**Type**
- Inter/Roboto/Arial/system-ui as the brand voice; more than two families on one page.
- Monospace used for labels, buttons, nav or eyebrows (on this project mono is gone from public
  pages entirely).
- Uppercase, letter-spaced eyebrows ("EDITORIAL SEQUENCE", "PLATFORM ROLES").
- 11–12px body/UI text (`text-xs`, `text-2xs`, `input-sm`, `btn-sm` on main actions).
- Hand-tuned hacks: `[word-spacing:-0.2em]`, `-translate-x-[3px]` on a logo.

**Colour**
- Purple/indigo "AI product" gradients, rainbow lines.
- Cream/sand/parchment page background as a "premium" move (`#FAF8F5` was one).
- Grey body text by opacity (`text-base-content/40…/60`, `opacity-80`) — measure it; it usually
  fails.
- Role colours applied to the wrong role, or two sibling tiles styled differently.

**Layout**
- A card floating on a grey page holding the whole page.
- Cards inside cards; identical card grids; boxes inside boxes inside boxes.
- 01/02/03 markers with no real sequence, or numbers + badges + zig-zag saying the same thing.
- Duplicated logo (header and in-card), duplicated CTAs repeating the hero.
- Long forms in one undivided column.
- Alerts used for things that aren't warnings (consent, info blurbs).

**Motion and effects**
- Hover lift/scale (`hover:-translate-y-*`, `hover:scale-*`), bounce easing, pulsing dots.
- Decorative `backdrop-blur`, heavy shadows, z-index soup.

**Dashboards and data pages**
- A grid of identical stat tiles with tinted icon chips, sometimes padded with
  `last:col-span-2` to fill the grid; several tiles linking to the same place.
- The same data shown twice (an "upcoming" list and a timetable of the same sessions; a note
  repeated in two widgets).
- Visual order rearranged with `order-*` while the DOM/tab order stays different (WCAG 1.3.2 /
  2.4.3 — Critical).
- Utility controls and internal wording leaking into a preview ("Refresh", provider/status jargon).
- Empty states that are italic grey text in a dashed box with no link to the next step.
- No page `h1`; every block an `h2` styled tiny.

**Copy and icons**
- Generic lines: "Welcome Back", "Sign in to your account", "Join X", "Get started with X".
- Sparkles / magic icons on things that aren't AI.
- Controls with no behaviour behind them.

## What to keep

Before proposing changes, list 3–5 things that work and leave them alone — e.g. real content and
real product UI, accessible labels and focus states, honest disclaimers, tested strings.
