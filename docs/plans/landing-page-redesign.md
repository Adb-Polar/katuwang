# Landing Page Redesign (`/`)

Status: **Direction chosen — prototype 10 (Story) implemented** (Changes.md Part 82; 04 Timetable was built first and superseded). The original 11-section "The Key" scope below is historical.

(Original status: Planning — nothing built.) Scope is `src/app/page.tsx` + new `src/components/landing/*` + a small
additive block in `globals.css`. No schema, API, or DB change.

## 1. What exists today

`src/app/page.tsx` is a ~60-line placeholder: nav (K-tile + wordmark, Log in, Create Account), one centred
hero (eyebrow, H1 "Learn with a peer who gets it.", paragraph, CTA, a privacy line with a sample `STU-0842`
badge), and a one-line footer. It works, but it says nothing about tutors, matching, verification,
progress tracking, or the school context, and it doesn't express the product's one strong idea.

Findings that shape the design:

| Finding | Source | Consequence |
|---|---|---|
| Real logo exists (3 overlapping "helper" figures; teal `#61A89A / #2D8A8A / #005744`; variants: full-color, dark, white, anchor) but **is wired into nothing** — the UI still shows a "K" tile | `public/logos/`, Changes.md Part 76, `BrandMark.tsx` | Landing is the first place to use the real mark. Build a `Logo` component (inline SVG; the shipped files carry a ~6 KB C2PA metadata blob) |
| The signature idea — *people become a notation (`STU-` ⇄ `TUT-`), colour marks which side of the double-blind you're on* — "isn't expressed anywhere loud". Reviewer explicitly proposes the marketing hero as the `STU-XXXX ⇄ TUT-XXXX` pairing set large in mono | `docs/reviews/reviews.md` D6 | This is the hero concept. "Spend the boldness there" |
| Apfel Grotezk 900 (Satt) is loaded but never used; review says "reserve 900 Satt for a single hero moment" | `layout.tsx`, reviews D1 | Use Satt for the hero H1 only |
| Palette is meaning-bearing: teal = brand, **ube = learner**, **marigold = tutor**. Light theme only (`prefersdark: false`) | `globals.css`, ROUND-2-CONTEXT | Role colours on the landing must keep those meanings (violet learner / gold tutor). No dark mode |
| Round-2 landing mock exists: hero → "how the names stay hidden" key list → sample class card → footer with RA 10173 note | `design/round-2/01-landing.html` | Keep its three ideas (key list, real-looking class card, RA 10173 footer), make them bolder |
| Type-scale contract: `text-xl`+ is "page-level H1 only" | `globals.css` comment | Marketing needs display sizes for section titles — document a scoped exception, don't silently break the contract |
| Invariants: IDs always carry `STU-`/`TUT-` prefix; identity colour never marks a state; every colour has a non-colour cue; Fragment Mono never on long prose; buttons are mono | ROUND-2-CONTEXT | Applies to every mock UI fragment on the page |
| Hard content limits: no payments/monetisation; chatbot is rule-based (no LLM); no file uploads; analytics descriptive only; free/non-profit, built for TRIS (Legazpi City) | `project-overview.md`, `decisions.md` | Copy must not overclaim ("AI tutor", "upload notes", "premium") |
| `/` is public (proxy matcher covers only `/dashboard`, `/admin`, `/tutor`, `/learner`). `registrationOpen` platform setting can close signup; `/register/learner` and `/register/tutor` exist | `proxy.ts`, `settings.ts` | Nav should be session-aware; CTAs should tolerate closed registration |

## 2. Design direction — "The Key"

"Modern" here = confident type, generous space, a few large visual moments built from **the app's own UI
atoms** (real `kt-card`, `AnonymousIdBadge`, `StatusBadge`, class cards), not stock illustrations or
screenshots. The page *is* a legend for the notation.

**Mood:** calm, school-friendly but not childish; closer to Linear/Vercel restraint than to an ed-tech
mascot site. Warm off-white canvas (existing `base-100/200`), one dark section for contrast, teal as the
only "loud" colour, violet/gold used strictly for learner/tutor.

**Modern devices (all CSS, no new dependency):**
- Sticky glass nav (`backdrop-blur`, same treatment as `.kt-topbar`).
- Hero with large fluid type (`clamp`), Apfel **Satt 900** headline, soft radial teal/violet/gold glow behind the
  visual + faint dot grid mask.
- **Bento grid** for features (mixed 1×1 / 2×1 tiles, 0.5rem radius, hairline border, hover lift ≤ 120 ms).
- CSS-only role tabs (radio-driven DaisyUI `tabs`) for "How it works" — Learner / Tutor.
- One full-bleed **dark neutral** section for the privacy story (`bg-neutral`, white logo variant).
- Scroll reveal: tiny `Reveal` client wrapper (IntersectionObserver, fade + 8 px rise, once), disabled under
  `prefers-reduced-motion` and when JS is off (content visible by default).
- Fragment Mono for every notation fragment (IDs, times, status codes, step numbers `01 02 03`, buttons).

**Rejected:** stock photos / illustrations (no assets, off-brand for a privacy product); Lottie/Framer Motion
(new deps, weight); dark mode toggle (theme is light-only by decision); fake stats, testimonials, or school
logos (no real data — a fabricated number on a school platform is worse than none); a hero video.

## 3. Page structure

Mobile-first; single column under `md`, grids from `md`/`lg`. Container `max-w-6xl`, 16–24 px gutters.

1. **Nav** (sticky, glass). Logo + wordmark · anchors *How it works · Privacy · FAQ* · `Log in` (ghost) ·
   `Create account` (primary). If a session exists: replace both with `Go to your portal → /dashboard`.
   Mobile: `<details>` menu (no JS), matching the `.nav-mobile` precedent.
2. **Hero** — two columns on `lg`.
   - Left: mono eyebrow `Peer tutoring · Grades 7–12 · Free`; H1 **"Learn with a peer who gets it."**
     (Satt 900, `clamp(2.5rem, 6vw, 4.5rem)`); one-sentence subhead (what + how: matched with a
     topic-verified classmate, names hidden); CTAs `Create account` (primary) + `See how it works` (ghost,
     anchor); micro-line "Already have an account? Log in".
   - Right — **the Pairing visual** (signature moment): two stacked/offset cards,
     `STU-2071` (violet, "Grade 8 · needs help with *linear equations*") ⇄ `TUT-0148` (gold,
     "Grade 11 · ✓ Verified · Algebra"), a connector pill `MATCHED · Tue 4:00 PM`, and a small `Real names: hidden`
     lock chip. Subtle float animation (reduced-motion safe). IDs are fictional and labelled "sample".
3. **Trust strip** (one row of 4 mono chips): `FREE, always` · `Grades 7–12` · `Built for TRIS, Legazpi City` ·
   `RA 10173 compliant`. No numbers we can't back up.
4. **The problem, kindly** (short, 2-col: statement + 3 bullets). Not every question can wait for a busy
   teacher; classmates often explain it in a way that clicks; Katuwang makes that help organised, checked, and
   safe. Tone: dignified, never deficit-framing the school or students.
5. **How it works** (`#how-it-works`) — Learner | Tutor tabs, each 3 numbered steps with a small UI fragment:
   - Learner: `01 Sign up` (grade + section, guardian consent) → `02 Find a class` (browse, or **Auto Match** ranks
     classes by topic / grade / schedule) → `03 Learn & see progress` (pre-test → session → post-test, gain shown).
   - Tutor: `01 Apply` (subjects you're good at) → `02 Get verified` (short quiz per topic; ✓ Verified badge) →
     `03 Run classes` (schedule sessions, manage roster, see learner gains).
6. **Feature bento** — six tiles, each a mini real-UI mock:
   | Tile (size) | Fragment |
   |---|---|
   | Anonymous by design (2×1, teal) | two `AnonymousIdBadge`s, "no names, emails, or contacts cross between peers" |
   | Auto Match (1×1) | 3 ranked class rows with score chips |
   | Verified tutors (1×1) | `✓ Linear equations` `✓ Fractions` certified chips |
   | Pre/post progress (2×1) | pure-CSS two-bar pairs (before → after); **static illustrative data**, labelled "example" |
   | Topic requests (1×1) | "Can't find a class? Ask for one." request ticket |
   | Help assistant (1×1) | chat bubble; copy says "instant answers about the platform", **not** "AI tutor" |
7. **Privacy section** (`#privacy`, dark) — headline "Two people learn together. Neither sees the other's name."
   3 columns: *What peers see* (ID, grade, section) · *What admins see* (real identity, only for moderation and
   approval) · *Never shared* (email, contact number, password — hashed). Guardian-consent line. Link →
   `/privacy-policy`.
8. **Two doors** (role cards) — `I need help` (violet accent, → `/register/learner`) and `I can help`
   (gold accent, → `/register/tutor`), each with 3 bullets and its own CTA. Colour = role, plus the
   `STU-`/`TUT-` text cue.
9. **FAQ** (`#faq`) — DaisyUI `collapse`/`<details>` accordion, 6 items: Is it free? · Do I use my real name? ·
   Who can be a tutor? · Is it only for TRIS students? · Can teachers or parents see my sessions? · What if I
   can't find a class? (answers must match `decisions.md` / `docs/reference/chatbot.md` FAQ KB — verify, don't
   invent).
10. **Final CTA band** — teal (`bg-primary`) with white logo, "Ready when you are." `Create account` (inverted
    button) + `Log in`.
11. **Footer** — anchor logo + wordmark, "Katuwang — academic match and support portal", links (Log in, Create
    account, Privacy Policy), RA 10173 line, TRIS credit.

## 4. Implementation plan

**Files (new)** — all server components unless noted, page stays lean per CLAUDE.md §2:

```
src/components/landing/
  Logo.tsx              inline SVG; variant: "color" | "white" | "ink" (currentColor); size prop
  LandingNav.tsx        server; receives `signedIn` boolean; <details> mobile menu
  Hero.tsx
  PairingVisual.tsx     the STU ⇄ TUT signature card pair
  TrustStrip.tsx
  HowItWorks.tsx        radio-driven DaisyUI tabs (no JS)
  FeatureBento.tsx      + small mock fragments (ProgressBars, RankedRows, ChatBubble…)
  PrivacySection.tsx
  RoleCards.tsx
  LandingFaq.tsx
  FinalCta.tsx
  LandingFooter.tsx
  Reveal.tsx            "use client" — IntersectionObserver fade-in, reduced-motion aware
```

**Files (edited)**
- `src/app/page.tsx` — `getServerSession(authOptions)` → `signedIn`; compose sections; export `metadata`
  (title, description, `openGraph`). Page becomes dynamic because of the session read — acceptable.
- `src/app/globals.css` — additive `/* Landing */` block inside `@layer components`: `.kt-hero-glow`,
  `.kt-dotgrid`, `.kt-float`, `.kt-reveal` (+ reduced-motion guards) and a comment documenting the display-type
  exception to the type-scale contract. **No token changes.**
- (Optional, separate follow-up) swap `BrandMark` for `Logo` in portal/auth chrome — out of scope here.

**Reuse:** `AnonymousIdBadge`, `StatusBadge` (with its 3-letter code), `.kt-card`, `.kt-badge*`, `.kt-id*`,
DaisyUI `btn`/`tabs`/`collapse`, lucide icons (`ShieldCheck`, `Lock`, `ArrowRight`, `Sparkles`…).

**No new dependencies.** No Prisma/API/schema change. No new env vars.

### Build order (one commit-able chunk each; commit only when told)
1. `Logo` + `LandingNav` + `Hero` + `PairingVisual` + globals block → verify hero on 360 / 768 / 1280.
2. `TrustStrip`, `HowItWorks`, `FeatureBento`.
3. `PrivacySection`, `RoleCards`, `LandingFaq`, `FinalCta`, `LandingFooter`, `Reveal`.
4. Metadata + OG, session-aware nav, polish pass (spacing, motion, contrast).
5. Docs: Changes.md entry, `docs/backlog/TOTEST.txt` lines, tick anything relevant in `feature-checklist.md`
   (none expected).

## 5. Constraints checklist (must hold at review)

- [ ] Only fictional sample IDs; every mock is labelled "sample/example". No real names anywhere.
- [ ] Copy makes no claims beyond `decisions.md`: free, no payments, rule-based help assistant, no uploads.
- [ ] `STU-` violet / `TUT-` gold used only for those identities; state colours only for state (`✓ Verified`
      = success).
- [ ] Every colour paired with a non-colour cue (prefix, ✓, code + word).
- [ ] WCAG AA contrast incl. text on `bg-neutral` and on teal; visible focus rings; skip-to-content link;
      one `<h1>`, ordered headings, landmarks.
- [ ] `prefers-reduced-motion` disables float/reveal; page fully readable with JS disabled.
- [ ] No horizontal scroll at 360 px; tap targets ≥ 44 px.
- [ ] Fragment Mono only on notation/buttons, never on paragraphs.
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` clean; `pnpm test` unchanged (no route/logic touched).

## 6. Manual verification (→ `docs/backlog/TOTEST.txt` when built)

- `/` renders at 360 / 768 / 1280 / 1920 px; mobile menu opens/closes by keyboard.
- Signed-out: nav shows Log in + Create account; signed-in (each role): shows "Go to your portal" → correct portal.
- Registration closed (`registrationOpen=false`): CTA lands on the existing closed message, no dead end.
- Tabs (Learner/Tutor) and FAQ operable by keyboard; reveal animations off with OS reduced-motion.
- Anchors (`#how-it-works`, `#privacy`, `#faq`) scroll under the sticky nav without clipping.
- Lighthouse: Accessibility ≥ 95, Performance ≥ 90 (mobile).

## 6b. Design prototypes (2026-09-21)

Ten static HTML explorations live in `design/landing/` (open `design/landing/index.html` for a gallery). They
share `base.css` (tokens copied from `globals.css`), the four Apfel weights + Fragment Mono, and clean logo SVGs.
Sample IDs/figures are fictional. **01 is the direction described above**; the rest are alternative bets.

| # | Name | Bet | Theme |
|---|---|---|---|
| 01 | The Key | STU ⇄ TUT pairing hero, bento, dark privacy band | light |
| 02 | School ID | swaying lanyard ID cards, names redacted | light |
| 03 | Legend | ruled map-key sheet, editorial, mono-heavy | light |
| 04 | Timetable | weekly-grid hero + Auto Match mock ("Help that fits your week") | light |
| 05 | Midnight | full dark, teal glow, gradient headline (**live theme is light-only — would need a decision**) | dark |
| 06 | Two Doors | violet "I need help" / gold "I can help" split, logo on the seam | light |
| 07 | Ask | ask-bar + help-assistant chat in a phone frame (real, rule-based feature — not peer chat) | light |
| 08 | Product | tilted browser frame with the learner dashboard | light |
| 09 | Poster | neo-brutalist giant lowercase Satt type, marquee | light |
| 10 | Story | vertical timeline "I'm stuck → I got it" + privacy payoff | light |

Checked in headless Edge at 1280 px and a true 390 px viewport; no horizontal overflow. Not yet checked: contrast
audit, keyboard/tab order, `prefers-reduced-motion` (animations are guarded in `base.css`).

## 7. Open questions (defaults chosen if unanswered)

1. **Hero visual** — default: the STU ⇄ TUT pairing (matches review D6). Alternative: a fuller "class card"
   mock as in round-2. *Default stays unless you prefer the alternative.*
2. **Attribution** — footer credit line: "Built for Taysan Resettlement Integrated School" only, or also the
   capstone/university credit? *Default: TRIS only.*
3. **Section count** — the full 11 above vs. a leaner 7 (drop problem statement, role cards, trust strip).
   *Default: full; every section is cheap and static.*
4. **Tagline** — keep "Learn with a peer who gets it." (default) or add a Tagalog line ("Katuwang mo sa pag-aaral")?
5. **Registration-closed handling** — default: leave CTAs as-is (register page already handles it). Alternative:
   read `registrationOpen` on the server and swap the CTA for a "Registration is closed" note.
