# Chatbot Assistant — architecture & workflow

The Katuwang assistant is a **deterministic, intent-based responder** — it
matches a user message against a fixed catalogue of intents and a small FAQ
knowledge base by keyword / synonym / regex scoring, then returns a
**predefined** reply. There is **no LLM**, no external NLP service, and no
generative text. This matches the thesis scope ("intent-based response
logic", "no free-form generative chat"); see
[`decisions.md`](./decisions.md) and
the [implementation-plan appendix](#appendix--original-implementation-plan) below.

Everything runs inside the app — one API route plus pure functions.

---

## 1. Pieces

| Layer | Path | Role |
|---|---|---|
| Widget | `src/components/chatbot/ChatWidget.tsx` | Floating launcher + chat panel, mounted in every portal by `PortalLayout` when `chatbotEnabled` is true. Transcript held in React state + `localStorage`. |
| | `src/components/chatbot/ChatMessage.tsx` | Renders one bubble: text, deep-link buttons, class cards, suggestion chips. |
| | `src/components/chatbot/chatbotClient.ts` | `askChatbot(message)` → `POST /api/chatbot`. |
| API | `src/app/api/chatbot/route.ts` | Auth, `chatbotEnabled` gate, Zod validation, loads the learner's grade level, calls `getBotReply`. |
| Validation | `src/lib/validations/chatbot.ts` | `chatbotMessageSchema` — 1–500 chars. |
| Engine | `src/lib/chatbot/normalize.ts` | `tokenize()` — lowercase, strip accents/punctuation, drop stopwords, plural→singular, apply the Taglish synonym map. Also exports `editDistance()`/`fuzzyHit()` (typo tolerance) and `STOPWORDS`. |
| | `src/lib/chatbot/intents.ts` | `INTENTS` — the ~35-entry intent catalogue. |
| | `src/lib/chatbot/faq.ts` | `FAQ_ENTRIES` — the 26-entry knowledge base. |
| | `src/lib/chatbot/classifier.ts` | `classify(message, ctx)` — corrects typos, scores intents + FAQ, returns the best or nothing. |
| | `src/lib/chatbot/recommend.ts` | `extractCriteria()` + `recommendClasses()` — the learner class-recommendation path, built on the existing matching engine. |
| | `src/lib/chatbot/respond.ts` | `getBotReply(message, ctx)` / `getBotReplyWithScore()` — the orchestrator; also logs unmatched messages. |
| | `src/lib/chatbot/misses.ts` | `aggregateMisses(rows, opts)` — groups `ChatbotMiss` rows by role + normalised wording for the admin review page. |
| | `src/lib/chatbot/types.ts` | Shared types. |
| Data | `ChatbotMiss` model (`prisma/schema.prisma`) | One row per unmatched message, for growing the FAQ. |
| Admin UI | `src/app/admin/chatbot/page.tsx` + `ChatbotMissesTable.tsx` | `/admin/chatbot` — read-only, grouped/sortable/filterable review of unanswered questions, backed by `GET /api/admin/chatbot-misses`. |
| Setting | `chatbotEnabled` (`src/lib/settings.ts`, default **ON**) | Toggle on `/admin/settings`. |

---

## 2. Request lifecycle

```
User types "paano sumali sa klase"  (ChatWidget)
        │
        ▼  POST /api/chatbot  { message }
┌─────────────────────────────────────────────────────────────┐
│ route.ts                                                     │
│  1. getServerSession        → 401 if not signed in           │
│  2. getSetting("chatbotEnabled") → 403 if off                │
│  3. chatbotMessageSchema.safeParse → 400 if empty / >500     │
│  4. prisma.user.findUnique  → learner's gradeLevel           │
│  5. ctx = { role, userId, gradeLevel }                       │
│  6. getBotReply(message, ctx)                                │
└─────────────────────────────────────────────────────────────┘
        │
        ▼  respond.ts → classify(message, ctx)      (classifier.ts)
        │      ├─ tokenize(message)                 (normalize.ts)
        │      │     "paano sumali sa klase"
        │      │       → ["how", "enroll", "class"]   (synonyms applied)
        │      ├─ score every intent whose roles include ctx.role
        │      ├─ score every FAQ entry
        │      └─ pick the best above the confidence floor
        │
        ▼  dispatch on the result
        ├─ FAQ hit            → { text: entry.answer, links: [entry.link?] }
        ├─ recommend intent   → extractCriteria + recommendClasses  (recommend.ts)
        │                        → { text, cards[], links? }
        ├─ nav / smalltalk    → intent.response (string | fn(ctx)) + intent.link
        └─ nothing matched    → log ChatbotMiss  +  generic fallback + chips
        │
        ▼  { reply: BotReply }  →  ChatWidget renders the bubble
```

`BotReply = { text, intentId, category, links?, cards?, suggestions? }`.

---

## 3. How classification scores

`classify()` (in `classifier.ts`) runs three passes:

**a. Normalise** — `tokenize()`:
1. lowercase, NFD-decompose, strip combining accents and punctuation
2. split on whitespace, drop an English + Filipino **stopword** set
   (`the`, `is`, `ang`, `ng`, `mag`, …) — but `no` / `not` are kept, they
   carry meaning ("no class", "no match")
3. light **plural → singular** (`registrations` → `registration`,
   `classes` → `class`)
4. apply the **synonym map** (`paano`→`how`, `guro`→`tutor`, `klase`→`class`,
   `sumali`→`enroll`, `libre`→`free`, …)
5. **typo-correct** each token via `correctToken()` (`classifier.ts`): if the
   token isn't already a known catalogue keyword and is a single edit
   (`editDistance` = 1) from one that's ≥4 chars, snap it to that keyword —
   e.g. `"enrol"` → `"enroll"`. This runs *before* both keyword scoring and
   pattern matching, so a typo still lights up a regex like `/\benroll\b/`,
   not just the keyword weight.

**b. Score each candidate**

| Signal | Weight |
|---|---|
| a candidate **keyword** appears in the token set | **1** |
| a candidate **regex pattern** matches the raw message **or** the normalised token stream¹ | **3** |
| an **FAQ keyword** appears in the token set | **2** |

¹ Patterns are tested against both so a Taglish phrase
(`"paano mag enroll"` → tokens `"how enroll"`) still hits an English pattern
like `/how.*enroll/`.

Intents are only scored if `intent.roles === "all"` or they include the
caller's role — so a learner never matches `nav_create_class` (tutor-only).

**c. Pick the winner**

- A candidate must reach **both** `MIN_SCORE = 2` (absolute floor) **and**
  `MIN_CONFIDENCE = 0.35` measured as `score / max(3, tokenCount)` (relative
  to message length, floored at 3 tokens so short pointed queries like
  "reset password" aren't penalised) — a long rambling message that only
  glances a couple of keywords now correctly misses instead of confidently
  answering the wrong thing.
- Among intents, higher score wins; ties break by **category priority**
  `recommend (4) > nav (3) > faq (2) > smalltalk (1)`.
- An **intent beats an FAQ of equal score** (it can offer a deep link and
  follow-up chips); an FAQ only wins if it scores strictly higher.
- If nothing clears both gates, `classify` returns `{ intent: null,
  faq: null, score: 0 }` and the orchestrator serves the **fallback**. The
  winning `score` is otherwise returned too — `route.ts` surfaces it as a
  non-production `debugScore` field for tuning the KB from near-misses.

---

## 4. The recommendation path (`recommend.ts`)

Only reached for a `STUDENT_LEARNER` whose message matched the
`recommend_class` intent.

1. **`extractCriteria(message)`**
   - subject: pick the `SubjectArea` with the most keyword hits from
     `SUBJECT_KEYWORDS` (`"algebra"`, `"biology"`, `"balarila"`, …)
   - topics: substring-match the message against `SUBJECT_TOPICS[subject]`
     (the topic name or its first significant word)
2. **`recommendClasses(ctx, criteria)`**
   - load the learner's browsable classes for that subject via the existing
     `browsableOrEnrolledWhere` / `learnerClassInclude` / `toLearnerClassDTO`
     (`src/lib/classQueries.ts`), drop ones already enrolled in
   - **topic named** → rank with `rankMatches()` (`src/lib/matching.ts`) —
     the same weighted engine Auto Match uses (subject, topic overlap,
     grade fit, soonness) — take top 3
   - **no topic named** → list open classes in the subject, soonest session
     first, top 3
   - **nothing** → `fallbackToRequest: true`
3. `respond.ts` turns the result into `cards[]` (each links to
   `/learner/classes/{id}`) or a "post a topic request" link.

No new matching logic — the chatbot is a thin front-end over `rankMatches`.

---

## 5. The miss-logging loop

When `classify` returns nothing, `respond.ts` writes a row:

```
ChatbotMiss { message, role, userId, createdAt }   // best-effort, never blocks the reply
```

Purpose: the FAQ in `faq.ts` is grounded but not exhaustive — the thesis
calls for it to be refined with real TRIS stakeholder input, and
`chatbot_misses` is that feedback channel. **`/admin/chatbot`** (backed by
`aggregateMisses()` in `misses.ts` + `GET /api/admin/chatbot-misses`) reads
the table, grouped by role + normalised wording so repeat questions surface
as one row with a count — sort by count to find what's worth adding next as a
`FaqEntry` (or a new `Intent`).

---

## 6. Configuration & gating

- **`chatbotEnabled`** platform setting (default ON). Admin →
  Settings → *Chatbot assistant*.
  - OFF → each portal layout passes `chatbotEnabled={false}`, so
    `PortalLayout` doesn't mount `<ChatWidget/>`, **and** `POST /api/chatbot`
    returns `403` (defence in depth — a stale client can't still call it).
- The widget is mounted for **all three roles** (learner, tutor, admin).
- Transcript lives only in the visitor's browser (`localStorage`, capped at
  30 turns). Nothing is persisted server-side except miss rows.

---

## 7. Extending it

| Want to… | Do this |
|---|---|
| Add a canned answer to a common question | Add a `FaqEntry` to `FAQ_ENTRIES` in `faq.ts` (question, answer, `keywords` in canonical/singular form, optional `link`). |
| Add a "take me to X" answer | Add an `Intent` to `INTENTS` in `intents.ts` — `id`, `category: "nav"`, `roles`, `keywords`, optional `patterns`, `response` (string or `(ctx) => …`), `link`. |
| Handle a new Taglish word | Add it to `SYNONYMS` in `normalize.ts` mapping to an existing canonical token. |
| Tune sensitivity | `MIN_SCORE` / `MIN_CONFIDENCE` / the weights / `CATEGORY_PRIORITY` in `classifier.ts`. |
| Recommend on a new axis | Extend `MatchCriteria` handling in `src/lib/matching.ts` — the chatbot inherits it automatically. |

**Tests** live in `src/lib/chatbot/__tests__/` (`classifier.test.ts`,
`recommend.test.ts`, `normalize.test.ts`, `faq.test.ts`, `misses.test.ts`)
and `src/app/api/chatbot/__tests__/route.test.ts` +
`src/app/api/admin/chatbot-misses/__tests__/route.test.ts`. Add an
utterance → expected-intent row to `classifier.test.ts` (or `faq.test.ts`
for a new FAQ) whenever you add an intent or FAQ entry.

---

## 8. Limitations (by design)

- No memory of earlier turns — every message is classified in isolation
  (the client keeps the visible transcript, the server does not).
- Spelling correction is single-edit-distance only, and only against
  keywords already in the catalogue (`fuzzyHit`/`editDistance` in
  `normalize.ts`) — a token more than one edit from every known keyword
  still misses.
- One intent or one FAQ entry per reply — no multi-answer composition.
- English + common Taglish only; other phrasings fall to the fallback (and
  get logged).

---

## Appendix — Original implementation plan

> Merged 2026-09-10 from `docs/reference/chatbot.md`. This is the plan the module
> was built from; the architecture section above is the current reference. Headings
> demoted one level; `docs/reference/feature-checklist.md` paths updated to `docs/reference/`.

## Chatbot Assistant Module (intent-based)

### Context

Module 5 of 6 in the Katuwang spec is the **Chatbot Assistant** — the last
whole module with zero code (`docs/reference/feature-checklist.md` §5, `docs/reference/
decisions.md`). The thesis scopes it tightly (`project-overview.md` §"Explicit
delimitations"):

> Chatbot is nav/FAQ/recommendation only — never a replacement for actual
> tutoring, **no free-form generative chat**.

and the sprint plan (thesis §"Sprint 5") lists exactly five deliverables:
Intent-Based Response Logic · Navigation Help Intents · FAQ Knowledge Base ·
Session Recommendation Intent · Chat UI Widget.

So this is a **deterministic, rule/pattern-matching intent engine — no LLM, no
external NLP service, no new runtime dependency**. It classifies a user message
into one of a fixed catalogue of intents and returns a predefined response,
optionally enriched with a deep link or (for the recommendation intent) live
class matches from the existing matching engine.

### Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Which portals get the widget | **All three** (learner, tutor, admin) |
| Conversation persistence | **Log unmatched queries only** — one new `ChatbotMiss` table so the FAQ can be grown from real misses. Full history stays client-side. |
| Matching approach | **Zero-dependency** hand-rolled tokenise + keyword/synonym/regex scoring with a confidence threshold. Pure, unit-testable functions. |
| Admin on/off switch | **New `chatbotEnabled` PlatformSetting** (default ON), toggle on `/admin/settings`, mirrors `matchingEnabled`. Route 403s + widget hides when off. |

### Schema change — needs explicit DB confirmation before running

One additive model in `prisma/schema.prisma`:

```prisma
model ChatbotMiss {
  id        String   @id @default(cuid())
  message   String   @db.Text
  role      Role
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@map("chatbot_misses")
}
```

Add `chatbotMisses ChatbotMiss[]` to `model User`. Migration name
`add_chatbot_misses`. Nothing else in the schema changes.

**Fallback if the DB change is declined:** `respond.ts` logs misses via
`console.warn("[chatbot-miss] …")` instead of `prisma.chatbotMiss.create`, the
`ChatbotMiss` model is dropped from this plan, and everything else ships
unchanged.

### Changes

#### 1. Setting — `src/lib/settings.ts` + admin form

- `PLATFORM_SETTING_KEYS` gains `"chatbotEnabled"`; `DEFAULTS.chatbotEnabled = true`.
- `src/components/admin/PlatformSettingsForm.tsx` `SETTING_META` gains a
  `chatbotEnabled` entry (group `"General"`, label "Chatbot assistant",
  description "Show the in-app help assistant and answer its requests.").
- `GET/PATCH /api/admin/settings` already iterate `PLATFORM_SETTING_KEYS` — no
  route change (confirm `updatePlatformSettingSchema` derives its `key` enum
  from `PLATFORM_SETTING_KEYS`; widen it if it's a hard-coded list).

#### 2. Intent engine — `src/lib/chatbot/`

| File | Contents |
|---|---|
| `types.ts` | `IntentCategory = "nav" \| "faq" \| "recommend" \| "smalltalk" \| "fallback"`; `Intent`, `FaqEntry`, `ChatContext` (`{ role: Role; userId: string; gradeLevel: GradeLevel \| null }`), `BotReply` (`{ text; intentId; links?: {href,label}[]; cards?: RecCard[]; suggestions?: string[] }`). |
| `normalize.ts` | `tokenize(text)` — lowercase, strip diacritics + punctuation, split, drop an English + Filipino stopword set. `SYNONYMS` map folding common Taglish / variants to canonical tokens (`paano→how`, `saan→where`, `libre→free`, `guro→tutor`, `klase→class`, `magpatala/sumali→enroll`, `iskedyul→schedule`, …). |
| `intents.ts` | `INTENTS: Intent[]` — each has `id`, `category`, `roles: Role[] \| "all"`, `keywords: string[]`, `patterns: RegExp[]`, `response: string \| (ctx) => Omit<BotReply,"intentId">`, optional `link` and `suggestions`. ~25 entries (catalogue below). |
| `faq.ts` | `FAQ_ENTRIES: FaqEntry[]` — `{ id, question, answer, keywords, roles?: Role[] \| "all", link? }`, ~15 entries seeded from `project-overview.md` delimitations + the role docs. `roles` (absent ⇒ all) scopes an entry to one role's workflow so a learner never gets a tutor how-to and vice-versa; platform-wide facts stay unscoped. Header comment: *starter set — refine with TRIS stakeholder interviews (thesis Sprint 5 "FAQ Knowledge Base")*. |
| `classifier.ts` | `classify(message, ctx): { intent: Intent \| null; faq: FaqEntry \| null; score: number }`. Score = Σ(keyword token hits ×1) + Σ(regex/phrase hits ×3), divided by message token count; role-filtered (both intents via `Intent.roles` **and** FAQ entries via `FaqEntry.roles`); below `MIN_CONFIDENCE` → `null` (→ fallback). Category priority breaks ties: `recommend > nav > faq > smalltalk`. |
| `recommend.ts` | `extractCriteria(message)` → `{ subject?: SubjectArea; topics: string[] }` via a subject-keyword table + substring match against `SUBJECT_TOPICS` (`src/lib/subjectTopics.ts`). `recommendClasses(ctx, criteria)` → mirrors the core of `POST /api/learner/match`: reuse `browsableOrEnrolledWhere`, `learnerClassInclude`, `toLearnerClassDTO` (`src/lib/classQueries.ts`) + `rankMatches` (`src/lib/matching.ts`); return top 3 `RecCard`s (`{ id, title, subject, score, reasons, href: "/learner/classes/{id}" }`) and `fallbackToRequest: boolean` (true when none rank). |
| `respond.ts` | `getBotReply(message, ctx): Promise<BotReply>` — `classify` → dispatch: `recommend` + learner → `recommendClasses`; `faq` → answer + link; `nav`/`smalltalk` → response (+link+suggestions); `null` → **log a `ChatbotMiss`** (fire-and-forget) and return the generic help reply with the top quick-reply chips. |

**Starter intent catalogue** (role-aware):

- *nav, all*: find/enroll in a class, how matching works → `/learner/match`,
  post a topic request → `/learner/requests`, my classes/schedule →
  `/learner/my-classes` \| `/tutor/classes`, notifications →
  `/{role}/notifications`, edit profile/availability → `/{role}/profile`,
  reset/forgot password → `/reset-password`, log out.
- *nav, tutor*: create a class → `/tutor/classes`, get certified / take a topic
  assessment → `/tutor/assessments`, accept a topic request → `/tutor/requests`,
  view my students → `/tutor/students`.
- *nav, admin*: approve registrations → `/admin/registrations`, review
  certifications → `/admin/certifications`, moderate classes/requests,
  question bank → `/admin/assessment/question-bank`, reports → `/admin/reports`,
  platform settings → `/admin/settings`.
- *recommend, learner*: "recommend a class", "find me a science tutor", "I need
  help with algebra".
- *smalltalk, all*: greeting, thanks, "who are you" / "what can you do"
  (→ capability list + quick replies).
- *fallback*: "I can help you get around Katuwang, answer common questions, and
  (learners) find a class. Try one of these:" + chips.

#### 3. Validation + API — `POST /api/chatbot`

- `src/lib/validations/chatbot.ts` — `chatbotMessageSchema = z.object({ message: z.string().trim().min(1).max(500) })`.
- `src/app/api/chatbot/route.ts` — `getServerSession` (any authenticated role);
  `403` when `!(await getSetting("chatbotEnabled"))`; `safeParse` → `400` on the
  first error; for a learner, `prisma.user.findUnique({ select: { gradeLevel } })`;
  `const reply = await getBotReply(message, ctx)`; `200 → { reply }`. Standard
  `try/catch` + `console.error` + generic `500`.

#### 4. Chat UI widget — `src/components/chatbot/`

| File | Contents |
|---|---|
| `ChatWidget.tsx` (`"use client"`) | Floating launcher button `fixed bottom-4 right-4 z-40` (`MessageCircle` icon); opens a panel `w-[min(22rem,calc(100vw-2rem))] h-[30rem]` card. DaisyUI `chat chat-start`/`chat-end` bubbles. Input + send; quick-reply chips send on click; bot links are `next/link`; recommendation cards link to the class. First-open greeting + capability chips. History in `useState`, mirrored to `localStorage` `"kt-chat-history"` (cap 30 messages, wrapped in `try/catch`). Escape closes; the widget never blocks page scroll/interaction. `POST`s to `/api/chatbot`. |
| `ChatMessage.tsx` | Renders one bubble — text, `links[]`, `cards[]`, `suggestions[]`. |
| `chatbotClient.ts` | thin `askChatbot(message): Promise<BotReply>` fetch wrapper. |

Wire-in: `src/components/layout/PortalLayout.tsx` gets a `chatbotEnabled?: boolean`
prop and renders `<ChatWidget />` when true. Each layout
(`src/app/{learner,tutor,admin}/layout.tsx`, all already async) passes
`chatbotEnabled={await getSetting("chatbotEnabled")}`. No sidebar nav item — it
is a floating widget only.

#### 5. Tests (`*.test.ts`, Vitest, existing mock patterns)

- `src/lib/chatbot/__tests__/classifier.test.ts` — table of `(utterance →
  expected intent id / category)`, including Taglish phrasings, the
  below-threshold → fallback case, and role-gating (a tutor-only intent must not
  match for a `STUDENT_LEARNER` context).
- `src/lib/chatbot/__tests__/recommend.test.ts` — `extractCriteria` subject +
  topic detection; `recommendClasses` mocks `@/lib/prisma`, asserts it feeds
  `rankMatches` and returns `fallbackToRequest: true` on an empty ranking.
- `src/lib/chatbot/__tests__/faq.test.ts` — keyword → entry retrieval + a
  no-match case.
- `src/app/api/chatbot/__tests__/route.test.ts` — `401` unauth; `403` when
  `getSetting` mocked false; `400` empty / >500 chars; `200` happy path
  (mock `next-auth`, `@/lib/prisma`, `@/lib/settings`); asserts
  `prisma.chatbotMiss.create` is called for a gibberish message and **not**
  for a matched one.
- No component tests (repo has zero `.tsx` tests).

#### 6. Docs

- This plan → merged into this file as the appendix above (was `docs/reference/chatbot.md`).
- `Changes.md` — new `## Part 19` + overview-table row. Note the migration
  (`add_chatbot_misses`) as applied to the **local** DB only; not committed.
- `docs/backlog/TOTEST.txt` — `[ ]` block (see Verification).
- `docs/reference/feature-checklist.md` — §5 rows flip from ❌ to ✅ (or 🟡 for FAQ KB,
  "starter set pending stakeholder interviews"); update the "Biggest gaps to
  close next" line and the module-status table (`5. Chatbot Assistant`).
- `docs/reference/decisions.md` — resolve the "Chatbot Assistant module —
  zero code exists" entry: record that it shipped as a **deterministic
  intent-matcher, no LLM/generative** (matches the thesis delimitation), the
  only new table is `ChatbotMiss`, and there is **no admin miss-review UI in
  v1** (misses are read straight from the table / a future admin screen).
- `docs/roles/{LEARNER,TUTOR,ADMIN}.md` — short "Chatbot assistant" section +
  the `POST /api/chatbot` entry in each API reference.

### Files

**New**
- `prisma/schema.prisma` (+`ChatbotMiss`, +`User.chatbotMisses`) & migration
- `src/lib/chatbot/{types,normalize,intents,faq,classifier,recommend,respond}.ts`
- `src/lib/validations/chatbot.ts`
- `src/app/api/chatbot/route.ts`
- `src/components/chatbot/{ChatWidget,ChatMessage}.tsx`, `chatbotClient.ts`
- test files listed above

**Modified**
- `src/lib/settings.ts` (+`chatbotEnabled`)
- `src/components/admin/PlatformSettingsForm.tsx` (+`SETTING_META` entry)
- `src/components/layout/PortalLayout.tsx` (+`chatbotEnabled` prop, render widget)
- `src/app/{learner,tutor,admin}/layout.tsx` (pass the prop)
- docs listed above

**Reused (no change)**
- `rankMatches`, `scoreClass` — `src/lib/matching.ts`
- `browsableOrEnrolledWhere`, `learnerClassInclude`, `toLearnerClassDTO` — `src/lib/classQueries.ts`
- `SUBJECT_TOPICS` — `src/lib/subjectTopics.ts`
- `getSetting` — `src/lib/settings.ts`

### Step order

1. **Schema** — add `ChatbotMiss` + `User` relation, `npx prisma migrate dev
   --name add_chatbot_misses`, `npx prisma generate`. *(after DB confirmation)*
2. `settings.ts` key + `PlatformSettingsForm` toggle.
3. `src/lib/chatbot/` — `types` → `normalize` → `intents` → `faq` →
   `classifier` → `recommend` → `respond`.
4. `validations/chatbot.ts` + `src/app/api/chatbot/route.ts`.
5. `components/chatbot/` + `PortalLayout` prop + the three layouts.
6. Tests; `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`.
7. Docs.

### Verification

- `tsc` / `lint` clean; `pnpm test` green (current 398 + new cases).
- `pnpm dev`, then in **each** portal (learner / tutor / admin):
  - Launcher button bottom-right; click opens the panel with a greeting +
    capability chips; Escape closes; page stays scrollable behind it.
  - A nav question ("how do I enroll", "where are my notifications",
    tutor: "how do I get certified", admin: "approve registrations") returns
    the matching predefined answer **and the correct deep link**; the link
    navigates.
  - An FAQ question ("is it free", "why can't I see the tutor's real name",
    "can you tutor me") returns the KB answer.
  - A Taglish phrasing ("paano sumali sa klase", "libre ba to") resolves to
    the same intent as its English form.
  - Gibberish ("asdfgh") returns the fallback help with quick-reply chips.
- **Learner only:** "recommend a science class" / "I need help with algebra"
  returns up to 3 class cards ranked by the matcher, each linking to
  `/learner/classes/[id]`; with no browsable class for that subject it returns
  the "post a topic request" CTA linking to `/learner/requests`.
- **Admin toggle:** `/admin/settings` → turn *Chatbot assistant* off →
  the widget disappears on reload in all portals and `POST /api/chatbot`
  returns `403`.
- **Persistence:** send a few messages, reload the page — the transcript is
  restored from `localStorage`.
- **Miss logging:** after sending gibberish, a `chatbot_misses` row exists
  (`npx prisma studio` or a direct query) with the message, role, and userId.
- Run the new Vitest files; confirm `classifier.test.ts` covers the
  role-gating and fallback paths.

---

### v1.1 — usability pass (2026-09-04, Changes.md Part 30)

Shipped as designed above, but as-built the classifier used a flat
`MIN_SCORE` floor rather than the `score / tokenCount` + `MIN_CONFIDENCE`
gate this doc originally specified (§ "Intent engine" table above), and the
`chatbot_misses` table had no reader — the "grow it from real usage" plan had
no mechanism to act on. The v1.1 pass closed both gaps, plus typo tolerance
and a KB expansion:

- **`MIN_CONFIDENCE` implemented** — `classifier.ts` now gates on
  `score / max(3, tokenCount) >= 0.35`, alongside the original absolute
  `MIN_SCORE` floor (kept so a single strong pattern hit still wins on a
  short message).
- **Fuzzy keyword matching** — a single-edit-distance typo of a known
  keyword (≥4 chars) is corrected before scoring *and* before pattern
  matching, via `editDistance`/`fuzzyHit` (`normalize.ts`) and
  `correctToken()` (`classifier.ts`).
- **`smalltalk_capabilities` narrowed** — it was broad enough (bare `"help"`
  keyword + `/\bhelp\b/` pattern) to swallow most unclear messages before
  they could reach `logMiss`, undermining the "grow from misses" loop from
  the other direction.
- **The misses loop is closed** — `/admin/chatbot` (new) reads
  `chatbot_misses`, grouped by role + normalised wording, sortable/filterable.
  This is the mechanism this doc assumed would exist but never built.
- **FAQ KB grown** 15 → 26 entries, +12 nav intents, each addition grounded in
  a role doc or codebase fact (no invented content).

See `Changes.md` Part 30 for the full file-by-file breakdown.
