import type { ChatContext, FaqEntry, Intent } from "@/lib/chatbot/types";
import { INTENTS } from "@/lib/chatbot/intents";
import { FAQ_ENTRIES } from "@/lib/chatbot/faq";
import { tokenize } from "@/lib/chatbot/normalize";

// Weights: a canonical keyword hit is worth 1, a phrase/shape pattern hit 3,
// a (more specific) FAQ keyword hit 2. A candidate needs at least MIN_SCORE
// to beat the fallback.
const KEYWORD_WEIGHT = 1;
const PATTERN_WEIGHT = 3;
const FAQ_KEYWORD_WEIGHT = 2;
const MIN_SCORE = 2;

const CATEGORY_PRIORITY: Record<string, number> = {
  recommend: 4,
  nav: 3,
  faq: 2,
  smalltalk: 1,
};

function intentAppliesTo(intent: Intent, role: ChatContext["role"]): boolean {
  return intent.roles === "all" || intent.roles.includes(role);
}

function scoreIntent(intent: Intent, tokens: Set<string>, raw: string, normalized: string): number {
  let score = 0;
  for (const kw of intent.keywords) if (tokens.has(kw)) score += KEYWORD_WEIGHT;
  // Patterns match against the raw message OR the normalised token stream, so
  // Taglish phrasings ("paano mag-enroll" -> "how enroll") still hit them.
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
  const tokenList = tokenize(message);
  const tokens = new Set(tokenList);
  const normalized = tokenList.join(" ");

  let bestIntent: Intent | null = null;
  let bestIntentScore = 0;
  for (const intent of INTENTS) {
    if (!intentAppliesTo(intent, ctx.role)) continue;
    const s = scoreIntent(intent, tokens, raw, normalized);
    if (s < MIN_SCORE) continue;
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
    const s = scoreFaq(entry, tokens);
    if (s >= MIN_SCORE && s > bestFaqScore) {
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
