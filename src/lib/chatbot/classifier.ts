import type { ChatContext, FaqEntry, Intent } from "@/lib/chatbot/types";
import { INTENTS } from "@/lib/chatbot/intents";
import { FAQ_ENTRIES } from "@/lib/chatbot/faq";
import { tokenize, fuzzyHit } from "@/lib/chatbot/normalize";

// Weights: a canonical keyword hit is worth 1, a phrase/shape pattern hit 3,
// a (more specific) FAQ keyword hit 2. A candidate needs at least MIN_SCORE
// (absolute floor) AND to clear MIN_CONFIDENCE (score relative to message
// length) to beat the fallback — a long rambling message that only glances a
// couple of keywords should still fall through to the miss log.
const KEYWORD_WEIGHT = 1;
const PATTERN_WEIGHT = 3;
const FAQ_KEYWORD_WEIGHT = 2;
const MIN_SCORE = 2;
const MIN_CONFIDENCE = 0.35;

const CATEGORY_PRIORITY: Record<string, number> = {
  recommend: 4,
  nav: 3,
  faq: 2,
  smalltalk: 1,
};

// Every keyword the catalogue knows, used to typo-correct message tokens
// before scoring — so "enrol" (a single-edit typo of "enroll") both scores
// the exact keyword weight AND still lights up patterns like /\benroll\b/.
const KNOWN_KEYWORDS: string[] = [
  ...new Set([...INTENTS.flatMap((i) => i.keywords), ...FAQ_ENTRIES.flatMap((f) => f.keywords)]),
];

function correctToken(token: string): string {
  if (token.length < 4 || KNOWN_KEYWORDS.includes(token)) return token;
  return KNOWN_KEYWORDS.find((kw) => fuzzyHit(token, kw)) ?? token;
}

function intentAppliesTo(intent: Intent, role: ChatContext["role"]): boolean {
  return intent.roles === "all" || intent.roles.includes(role);
}

function faqAppliesTo(entry: FaqEntry, role: ChatContext["role"]): boolean {
  return !entry.roles || entry.roles === "all" || entry.roles.includes(role);
}

function scoreIntent(intent: Intent, tokens: Set<string>, raw: string, normalized: string): number {
  let score = 0;
  for (const kw of intent.keywords) if (tokens.has(kw)) score += KEYWORD_WEIGHT;
  // Patterns match against the raw message OR the (typo-corrected) normalised
  // token stream, so Taglish phrasings and misspellings still hit them.
  for (const re of intent.patterns ?? []) if (re.test(raw) || re.test(normalized)) score += PATTERN_WEIGHT;
  return score;
}

function scoreFaq(entry: FaqEntry, tokens: Set<string>): number {
  let score = 0;
  for (const kw of entry.keywords) if (tokens.has(kw)) score += FAQ_KEYWORD_WEIGHT;
  return score;
}

export interface Classification {
  intent: Intent | null;
  faq: FaqEntry | null;
  score: number;
}

/**
 * Pick the best-matching intent OR FAQ entry for a message, or return
 * `{ intent: null, faq: null }` when nothing clears the confidence bar
 * (→ the caller serves the fallback reply).
 */
export function classify(message: string, ctx: ChatContext): Classification {
  const raw = message.toLowerCase().trim();
  const tokenList = tokenize(message).map(correctToken);
  const tokens = new Set(tokenList);
  const normalized = tokenList.join(" ");
  // Confidence = score / message length, floored at 3 tokens so short but
  // pointed queries ("reset password") aren't unfairly punished.
  const denom = Math.max(3, tokenList.length);
  const clears = (s: number) => s >= MIN_SCORE && s / denom >= MIN_CONFIDENCE;

  let bestIntent: Intent | null = null;
  let bestIntentScore = 0;
  for (const intent of INTENTS) {
    if (!intentAppliesTo(intent, ctx.role)) continue;
    const s = scoreIntent(intent, tokens, raw, normalized);
    if (!clears(s)) continue;
    const better =
      s > bestIntentScore ||
      (s === bestIntentScore &&
        bestIntent !== null &&
        CATEGORY_PRIORITY[intent.category] > CATEGORY_PRIORITY[bestIntent.category]);
    if (better || bestIntent === null) {
      bestIntent = intent;
      bestIntentScore = s;
    }
  }

  let bestFaq: FaqEntry | null = null;
  let bestFaqScore = 0;
  for (const entry of FAQ_ENTRIES) {
    if (!faqAppliesTo(entry, ctx.role)) continue;
    const s = scoreFaq(entry, tokens);
    if (clears(s) && s > bestFaqScore) {
      bestFaq = entry;
      bestFaqScore = s;
    }
  }

  // An intent wins ties with an FAQ of equal score (it can offer a deep link
  // and follow-ups); an FAQ only wins when it scores strictly higher.
  if (bestIntent && bestIntentScore >= bestFaqScore) {
    return { intent: bestIntent, faq: null, score: bestIntentScore };
  }
  if (bestFaq) {
    return { intent: null, faq: bestFaq, score: bestFaqScore };
  }
  return { intent: null, faq: null, score: 0 };
}
