# Chatbot Assistant — architecture & workflow

The Katuwang assistant is a **deterministic, intent-based responder** — it
matches a user message against a fixed catalogue of intents and a small FAQ
knowledge base by keyword / synonym / regex scoring, then returns a
**predefined** reply. There is **no LLM**, no external NLP service, and no
generative text. This matches the thesis scope ("intent-based response
logic", "no free-form generative chat"); see
[`decisions.md`](./decisions.md) and
[`../plans/chatbot-assistant.md`](../plans/chatbot-assistant.md).

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
  still misses. When a misspelling sits one edit from two different
  keywords, `correctToken()` (`classifier.ts`) prefers the one sharing the
  token's first letter (typos essentially never change it); if neither
  candidate does, it leaves the token uncorrected rather than guess.
- A misspelled trigger word breaks a pattern-only intent outright — regex
  `patterns` are literal, not typo-tolerant, so e.g. "wat can you do" won't
  match `smalltalk_capabilities` the way "how do i enrol" corrects and still
  hits `/\benroll\b/`.
- A typo in a word that only appears as a `SYNONYMS` *source* (e.g.
  "certifcation", meant to fold to `"certify"`) isn't corrected — fuzzy
  correction compares against the canonical *target* keyword, and the edit
  distance from the misspelled full word to its short canonical form is
  usually too large.
- One intent or one FAQ entry per reply — no multi-answer composition.
- English + common Taglish only; other phrasings fall to the fallback (and
  get logged).
- A bare single-keyword message only clears `MIN_SCORE` if that keyword also
  has a matching regex pattern (patterns are worth 3, a lone keyword only 1).
  A handful of nav intents (`nav_search`, `nav_help_page`) have such a
  pattern for this reason; not every keyword does.
- FAQ ties resolve to whichever entry is declared **first** in
  `FAQ_ENTRIES` — there's no FAQ-vs-FAQ tie-break beyond declaration order
  (unlike intents, which break ties by `CATEGORY_PRIORITY`). Keep FAQ
  keyword lists specific to avoid a generic word (e.g. `"what"`, `"level"`)
  silently letting an earlier, more generic entry win a query aimed at a
  later, more specific one — see Changes.md Part 31 for two real instances.
- A `nav` intent can still lose a tie to a higher-`CATEGORY_PRIORITY`
  `recommend` intent when both hit the same score on shared keywords (e.g.
  `nav_find_tutors` and `recommend_class` both list `"find"`/`"tutor"`).
  `nav_find_tutors` carries two anchored patterns for exactly this reason —
  they only match a short, subject-less phrasing ("find tutors", "tutors
  directory"), so it wins outright instead of tying; a subject-bearing
  phrasing ("find me a science tutor") still ties and correctly goes to
  `recommend_class` (see Changes.md Part 32).
