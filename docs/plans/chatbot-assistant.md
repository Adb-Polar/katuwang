# Chatbot Assistant Module (intent-based)

## Context

Module 5 of 6 in the Katuwang spec is the **Chatbot Assistant** — the last
whole module with zero code (`docs/feature-checklist.md` §5, `docs/reference/
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

## Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Which portals get the widget | **All three** (learner, tutor, admin) |
| Conversation persistence | **Log unmatched queries only** — one new `ChatbotMiss` table so the FAQ can be grown from real misses. Full history stays client-side. |
| Matching approach | **Zero-dependency** hand-rolled tokenise + keyword/synonym/regex scoring with a confidence threshold. Pure, unit-testable functions. |
| Admin on/off switch | **New `chatbotEnabled` PlatformSetting** (default ON), toggle on `/admin/settings`, mirrors `matchingEnabled`. Route 403s + widget hides when off. |

## Schema change — needs explicit DB confirmation before running

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

## Changes

### 1. Setting — `src/lib/settings.ts` + admin form

- `PLATFORM_SETTING_KEYS` gains `"chatbotEnabled"`; `DEFAULTS.chatbotEnabled = true`.
- `src/components/admin/PlatformSettingsForm.tsx` `SETTING_META` gains a
  `chatbotEnabled` entry (group `"General"`, label "Chatbot assistant",
  description "Show the in-app help assistant and answer its requests.").
- `GET/PATCH /api/admin/settings` already iterate `PLATFORM_SETTING_KEYS` — no
  route change (confirm `updatePlatformSettingSchema` derives its `key` enum
  from `PLATFORM_SETTING_KEYS`; widen it if it's a hard-coded list).

### 2. Intent engine — `src/lib/chatbot/`

| File | Contents |
|---|---|
| `types.ts` | `IntentCategory = "nav" \| "faq" \| "recommend" \| "smalltalk" \| "fallback"`; `Intent`, `FaqEntry`, `ChatContext` (`{ role: Role; userId: string; gradeLevel: GradeLevel \| null }`), `BotReply` (`{ text; intentId; links?: {href,label}[]; cards?: RecCard[]; suggestions?: string[] }`). |
| `normalize.ts` | `tokenize(text)` — lowercase, strip diacritics + punctuation, split, drop an English + Filipino stopword set. `SYNONYMS` map folding common Taglish / variants to canonical tokens (`paano→how`, `saan→where`, `libre→free`, `guro→tutor`, `klase→class`, `magpatala/sumali→enroll`, `iskedyul→schedule`, …). |
| `intents.ts` | `INTENTS: Intent[]` — each has `id`, `category`, `roles: Role[] \| "all"`, `keywords: string[]`, `patterns: RegExp[]`, `response: string \| (ctx) => Omit<BotReply,"intentId">`, optional `link` and `suggestions`. ~25 entries (catalogue below). |
| `faq.ts` | `FAQ_ENTRIES: FaqEntry[]` — `{ id, question, answer, keywords, link? }`, ~15 entries seeded from `project-overview.md` delimitations + the role docs. Header comment: *starter set — refine with TRIS stakeholder interviews (thesis Sprint 5 "FAQ Knowledge Base")*. |
| `classifier.ts` | `classify(message, ctx): { intent: Intent \| null; faq: FaqEntry \| null; score: number }`. Score = Σ(keyword token hits ×1) + Σ(regex/phrase hits ×3), divided by message token count; role-filtered; below `MIN_CONFIDENCE` → `null` (→ fallback). Category priority breaks ties: `recommend > nav > faq > smalltalk`. |
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

### 3. Validation + API — `POST /api/chatbot`

- `src/lib/validations/chatbot.ts` — `chatbotMessageSchema = z.object({ message: z.string().trim().min(1).max(500) })`.
- `src/app/api/chatbot/route.ts` — `getServerSession` (any authenticated role);
  `403` when `!(await getSetting("chatbotEnabled"))`; `safeParse` → `400` on the
  first error; for a learner, `prisma.user.findUnique({ select: { gradeLevel } })`;
  `const reply = await getBotReply(message, ctx)`; `200 → { reply }`. Standard
  `try/catch` + `console.error` + generic `500`.

### 4. Chat UI widget — `src/components/chatbot/`

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

### 5. Tests (`*.test.ts`, Vitest, existing mock patterns)

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

### 6. Docs

- This plan → already at `docs/plans/chatbot-assistant.md`.
- `Changes.md` — new `## Part 19` + overview-table row. Note the migration
  (`add_chatbot_misses`) as applied to the **local** DB only; not committed.
- `docs/TOTEST.txt` — `[ ]` block (see Verification).
- `docs/feature-checklist.md` — §5 rows flip from ❌ to ✅ (or 🟡 for FAQ KB,
  "starter set pending stakeholder interviews"); update the "Biggest gaps to
  close next" line and the module-status table (`5. Chatbot Assistant`).
- `docs/reference/decisions.md` — resolve the "Chatbot Assistant module —
  zero code exists" entry: record that it shipped as a **deterministic
  intent-matcher, no LLM/generative** (matches the thesis delimitation), the
  only new table is `ChatbotMiss`, and there is **no admin miss-review UI in
  v1** (misses are read straight from the table / a future admin screen).
- `docs/roles/{LEARNER,TUTOR,ADMIN}.md` — short "Chatbot assistant" section +
  the `POST /api/chatbot` entry in each API reference.

## Files

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

## Step order

1. **Schema** — add `ChatbotMiss` + `User` relation, `npx prisma migrate dev
   --name add_chatbot_misses`, `npx prisma generate`. *(after DB confirmation)*
2. `settings.ts` key + `PlatformSettingsForm` toggle.
3. `src/lib/chatbot/` — `types` → `normalize` → `intents` → `faq` →
   `classifier` → `recommend` → `respond`.
4. `validations/chatbot.ts` + `src/app/api/chatbot/route.ts`.
5. `components/chatbot/` + `PortalLayout` prop + the three layouts.
6. Tests; `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`.
7. Docs.

## Verification

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
