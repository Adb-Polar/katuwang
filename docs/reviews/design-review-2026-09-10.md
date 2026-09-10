# Design Review — Katuwang UI

- **Date:** 2026-09-10
- **Scope:** the shipped visual system — `src/app/globals.css`, `src/app/layout.tsx`,
  `src/components/ui/*`, and how portal pages apply them. Cross-checked against the
  frozen design language in `design/ROUND-2-CONTEXT.md` and `docs/reference/theme.md`.
- **Method:** static reading of the token layer, component primitives, and a sample
  of pages. No screenshots taken.
- **Lens:** is the design *specific to this product*, does the typography carry
  personality, does structure encode meaning, and is the boldness spent in one place.

---

## Executive summary

Katuwang has a genuinely ownable design **concept**: the interface is the *legend*
for an anonymity notation. Real names never appear, so `STU-XXXX` / `TUT-XXXX`,
grade, section, and status codes *are* the identity, and the type system splits
into **Fragment Mono for notation** (IDs, dates, counts, status) and **Apfel
Grotezk for speech** (titles, sentences, labels). Colour runs in two families that
never mix — **identity** (violet = learner, gold = tutor, grey = system) for *who*,
and **state** (info / success / warning / error) for *what is happening*. That is a
thesis derived from the RA 10173 double-blind mandate, not a mood board. It is the
right idea.

The **implementation has sanded that thesis down** toward the generic
"soft white cards on a warm-grey page, teal accent, everything restrained" look
that every AI-assisted admin UI converges on. The concept is still legible if you
know to look for it, but nothing on screen makes it *loud*. The causes are
concrete and fixable:

| # | Severity | Finding |
|---|---|---|
| D1 | 🟠 High | Emphasis weights are all collapsed to 500 — the type system has one weight for "bold", so hierarchy rests entirely on size + colour |
| D2 | 🟠 Medium | The Apfel migration is half-done: `--font-serif` is aliased to Apfel and `font-serif` still ships in 37 files |
| D3 | 🟠 Medium | Fragment Mono is under-deployed against its own "notation" brief — nav items, buttons, and audit strings render in Apfel |
| D4 | 🟠 Medium | The "every colour has a non-colour cue" promise is opt-in: `StatusBadge`'s 3-letter code is an optional prop and mostly unset |
| D5 | 🟡 Medium | Design docs no longer match the build — `docs/reference/theme.md` is a different palette, and the "no SVG icons" invariant is abandoned (Lucide in 70 files) with no `decisions.md` entry |
| D6 | 🟡 Low | The card shell is the safe default; the signature ("interface as legend") isn't expressed anywhere with intent |
| D7 | 🟡 Low | ROUND-2's own open contrast questions (badge-on-tint, muted-on-surface, white-on-teal) were never closed |

---

## What's already working — keep it

- **The typographic concept is real and specific.** Fragment Mono on every ID /
  time / count is a choice you would not make on a generic dashboard, and it ties
  directly to the product's reason for existing. `AnonymousIdBadge`
  (`src/components/ui/AnonymousIdBadge.tsx`) executes the identity-colour rule
  cleanly — a learner's ID stays violet inside the tutor portal.
- **Two disciplined colour families.** `globals.css` documents the split at the top
  and the `--kt-tint-*` / `--kt-badge--*` tokens enforce it. Identity never marks a
  state; state never marks a person. This is genuinely good system design.
- **Restraint in the shell.** `--depth: 0`, `--noise: 0`, one radius (`0.5rem`),
  soft single-layer shadow (`--kt-shadow-card`), no gradients. The card layer
  (`.kt-card`, `.kt-card-body`, `.kt-card-head`) is consistent and quiet.
- **Accessibility floor is mostly there.** `prefers-reduced-motion` gates the one
  animation (`.kt-swap`), motion is capped at ~180ms, focus styling is defined.
- **Palette is warm, not the cliché cream.** `oklch(99% 0.003 80)` surface on an
  `oklch(97%)` page is a hair of warmth, not the `#F4F1EA` default.

---

## Findings

### D1 — All emphasis weights collapsed to 500 (🟠 High)

`globals.css`:

```css
--font-weight-medium: 500;
--font-weight-semibold: 500;
--font-weight-bold: 500;
```

The comment explains it: Apfel ships 400 / 500 / 700 / 900, there is no 600, so
`font-semibold` was snapping to 700 (Fett) and "every emphasised run rendered as
heavy". The fix taken was to pin *all three* emphasis utilities to 500 (Mittel).

**Consequence:** `font-medium`, `font-semibold`, and `font-bold` are now the same
weight everywhere. A page `<h1>` (`PageHeader.tsx`: `font-bold`), a card title
(`.kt-card-head > h2`: `--font-weight-bold`), a table header, and an emphasised
word in a sentence all render at 500. Typographic hierarchy has lost an entire
axis — it now rests only on size, colour, and letter-spacing. The 700 Fett and 900
Satt faces are loaded (`layout.tsx`) and never used. For a product whose thesis is
"typography carries the identity", flattening the weight scale is the single
biggest thing muting it.

**Fix.** Stop treating 500 and 700 as interchangeable. Restore a real two-step
emphasis:

- `--font-weight-medium: 500` (Mittel) — emphasised words in prose, table headers,
  form labels, nav.
- `--font-weight-semibold: 500` — keep, or drop the utility entirely so it isn't a
  silent alias.
- `--font-weight-bold: 700` (Fett) — **page H1 and card titles only**, which the
  type-scale contract already says should be the sole heavy elements ("text-xl and
  up … page-level H1 only"). Fett at 24–28px reads as confident, not shouty; the
  original "everything is Fett" problem came from `font-semibold` on small UI text,
  not from H1s.
- Reserve 900 Satt for a single hero moment if D6 gets addressed, else remove it
  from the `localFont` src array so it isn't downloaded.

This is ~4 token lines plus spot-checking that no small-text component uses
`font-bold` (they should use `font-medium`).

---

### D2 — The Apfel migration is half-finished (🟠 Medium)

`globals.css`:

```css
/* --font-serif kept pointing at the display face so existing `font-serif`
   headings render Apfel until they are swept to `font-sans`. */
--font-serif: var(--font-apfel), ui-sans-serif, system-ui, sans-serif;
```

`font-serif` still appears in **37 files** (`grep -rl 'font-serif' src/`).
`PageHeader.tsx` was migrated to `font-sans`; most auth forms, dev pages, and
several admin tables were not. Because `--font-serif` is aliased to Apfel, they
render identically — so this is invisible today, but:

- it is a latent trap: anyone who "fixes" the alias to an actual serif silently
  restyles 37 files;
- `font-serif` in the codebase implies a serif/sans pairing that does not exist,
  which misleads the next person reading the design system.

**Fix.** Finish the sweep: `font-serif` → `font-sans` across the 37 files
(mechanical), then delete the `--font-serif` alias from `@theme inline`. If a
display serif is ever wanted (see D6), introduce it as a *new* named token, not by
un-aliasing this one.

---

### D3 — Fragment Mono is under-deployed against its own brief (🟠 Medium)

`ROUND-2-CONTEXT.md` lists what Fragment Mono governs: "IDs, dates, times, counts,
status codes, **navigation items**, audit strings, code fields, **buttons**."

In the build, mono is applied to `.kt-badge`, `.kt-id`, `.kt-stat-value`,
`.kt-tile`, `.kt-slot`, `.kt-avatar`, and the nav *letter-tile* (`.kt-ic`) — but
**not** to:

- **nav item labels** (`.kt-nav-item` sets no `font-family` → Apfel);
- **buttons** (DaisyUI `.btn` → Apfel);
- **audit-log strings** (render as prose).

So the "notation" half of the concept is quieter than specified. The nav in
particular is a missed opportunity — a monospace nav column is distinctive and
on-thesis, and it is one selector.

**Fix.** Add `font-family: var(--font-mono)` to `.kt-nav-item` and to the button
recipe (or a `.btn` override in the components layer). Consider mono for
audit-log rows — they are notation, not speech. Keep it off anything that is a
full sentence.

---

### D4 — The non-colour cue is optional and mostly absent (🟠 Medium)

`ROUND-2-CONTEXT.md` invariant #3: "Every colour paired with a non-colour cue" —
IDs carry a `STU-`/`TUT-` prefix (done), and **status = a 3-letter Fragment Mono
code plus the full word** (`OPN Open`, `SUS Suspended`, `CMP Completed`, …).

`src/components/ui/StatusBadge.tsx` makes `code` an **optional** prop:

```ts
/** optional 3-letter notation code shown before the label (e.g. "OPN") */
code?: string;
```

Most call sites pass only `tone` + `label`. The only guaranteed non-colour signal
on a badge is then the `●` glyph from `.kt-badge::before`, which is identical
across every tone. So `● Suspended` (red) and `● Completed` (grey) differ almost
entirely by hue — the exact failure mode the invariant was written to prevent, and
a WCAG 1.4.1 (use of colour) problem for the ~1-in-12 users with a colour vision
deficiency.

**Fix.** Make the code mandatory: a `STATUS_META` map (`{ open: { code: "OPN",
label: "Open", tone: "success" }, … }`) as the single source, and have callers
pass a status key, not a free `tone`+`label`+maybe-`code`. That also kills the
current drift where the same status can be spelled differently per screen.

---

### D5 — The design docs have drifted from the build (🟡 Medium)

Two concrete mismatches:

1. **`docs/reference/theme.md` is a different palette than what ships.** It
   documents `--color-primary: oklch(69% 0.17 162.48)` (bright emerald),
   `--color-secondary: oklch(0% 0 0)` (pure black), `--color-accent: oklch(62%
   0.265 303.9)` (vivid violet). The live `globals.css` theme is
   `--color-primary: oklch(40% 0.09 174)` (muted deep teal), `secondary: oklch(48%
   0.16 300)` (ube), `accent: oklch(76% 0.14 80)` (marigold). Anyone building from
   `theme.md` gets the wrong colours.

2. **The "no pictographic SVG icons" invariant is abandoned.** `ROUND-2-CONTEXT.md`
   invariant #6 and "Prohibited normalisation" both ban an SVG icon set in favour
   of letter-tiles and text glyphs. `lucide-react` is imported in **70 files**
   (`ShieldCheck` in `AnonymousIdBadge`, `Flag`, `ArrowRight`, `CalendarClock`, …).
   ROUND-2's own open issues flagged the letter-tiles as "a placeholder — decide
   keep-letters vs icon-font vs CSS icons", so choosing Lucide is defensible — but
   the decision was never written down, and the frozen doc still says the opposite.

Per `CLAUDE.md` ("when a decision diverges from the thesis reference doc … log it
in `docs/reference/decisions.md`"), both of these need a `decisions.md` entry, and
`theme.md` should either be regenerated from `globals.css` or deleted in favour of
pointing at the CSS as the single source.

**Fix.** Add two `decisions.md` entries (palette supersedes `theme.md`; Lucide
supersedes letter-tiles / the no-SVG rule). Regenerate or retire `theme.md`.
Update `ROUND-2-CONTEXT.md` invariant #6 (or mark it superseded) so the frozen doc
isn't actively wrong. If the letter-tiles are fully gone, remove
`.kt-nav-item .kt-ic` / `.kt-letter-tile` from `globals.css`.

---

### D6 — The signature idea isn't expressed anywhere loud (🟡 Low)

Round 1's premise: *"the interface is the key to that notation — calm, centred,
symmetric, like a map legend."* That is a strong, specific concept. The shipped UI
is a competent card dashboard that could belong to any SaaS admin tool; the
"legend" idea survives only in the ID badges.

Nothing anchors it. There is no moment on the dashboard, the login page, or an
empty state that says *this product turns people into a notation and that is the
point*. The `design/round-3/` studies (02 "School ID card", 08 "Field guide", 09
"Ledger book") are all reaching for exactly this — a hero/anchor that *is* the
identity pairing.

**Fix (pick one, keep everything else quiet):**

- A **legend block** on each portal dashboard header: the viewer's own token set
  rendered like a map key — `TUT-0148 · Grade 9 · Section Rizal · Tue 16:00` in
  Fragment Mono, with a one-line "This is how learners see you." It is honest,
  on-thesis, and costs one component.
- Or the **login / marketing hero** as the `STU-XXXX ⇄ TUT-XXXX` pairing set large
  in mono (round-3 sample 02), with the tagline as the only Apfel on the screen.

Spend the boldness there; leave the cards exactly as restrained as they are.

---

### D7 — ROUND-2's open contrast questions were never closed (🟡 Low)

`ROUND-2-CONTEXT.md` → "Open issues carried into Round 2 verification" lists four
contrast checks at shipped sizes (target 4.5:1) that do not appear to have been
run:

- badge text on its own tint (`.kt-badge--warning` uses `--kt-warning-text` =
  `color-mix(warning 80%, black)` on a 20%-warning tint — likely fine, but
  `--kt-badge--tutor` text `--kt-tutor-text: oklch(50% 0.12 80)` on a 24%-accent
  tint at `0.72rem` is the risky one);
- `--kt-muted` (`base-content` at 60%) on `--color-base-100` for body-adjacent
  text at `text-xs` / `text-2xs`;
- green nav-pill text (`--color-primary` on `--kt-tint-primary`);
- white on `--brand` (`--color-primary-content` on `--color-primary` — primary is
  `oklch(40%)` so this is probably safe).

**Fix.** Run the four pairs through a contrast checker at the exact sizes they
ship at. `text-2xs` (0.6875rem) is below the 14px "large text" threshold, so those
need the full 4.5:1. Darken `--kt-tutor-text` and `--kt-faint` if they miss.

---

## Two ways forward

**Path A — recommit to Direction E, executed tight.** D1–D4 are the whole job:
restore weight contrast, finish the font sweep, push mono into nav + buttons, make
the status code mandatory, add the legend block (D6). This is maybe a day of work
and it turns the existing system from "fine" into "distinct" without a redesign.
`design/round-3/15-quiet-cards.html` ("the frozen Round 2 direction, executed
tighter") is this path.

**Path B — adopt a Round 3 direction with a real point of view.** Samples 02
(ID card), 08 (field guide), and 09 (ledger) each commit to one idea that serves
the double-blind premise. This is a bigger change and should only happen if the
team wants a visual reset, not a polish pass. If so, decide *before* touching the
app, and log it as a Round 3 lock in `design/`.

Given the amount of shipped surface, **Path A is the recommendation.** The concept
is already right; it just isn't turned up.

---

## Quick wins (do these regardless of path)

1. **D1** — set `--font-weight-bold: 700`, audit small-text `font-bold` → `font-medium`. (~1h)
2. **D5** — two `decisions.md` entries (palette, icons); regenerate or delete `theme.md`. (~30m)
3. **D4** — `STATUS_META` map, make `StatusBadge` take a status key. (~2h, also de-drifts status labels)
4. **D2** — codemod `font-serif` → `font-sans`, delete the `--font-serif` alias. (~30m)
5. **D3** — `font-family: var(--font-mono)` on `.kt-nav-item` and the button recipe. (~15m + eyeball)
6. **D7** — contrast-check the four token pairs at shipped sizes; darken the misses. (~1h)

None of these change the layout or the component API surface except D4, which is a
net simplification.
