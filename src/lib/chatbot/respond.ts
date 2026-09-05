import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/chatbot/classifier";
import { extractCriteria, recommendClasses } from "@/lib/chatbot/recommend";
import type { BotLink, BotReply, ChatContext, FaqEntry, Intent } from "@/lib/chatbot/types";

// ─── Orchestrator: message + context -> a single predefined reply ─────────

const FALLBACK_SUGGESTIONS_BY_ROLE: Record<ChatContext["role"], string[]> = {
  STUDENT_LEARNER: ["How do I enroll?", "Recommend a class", "Why can't I see real names?"],
  STUDENT_TUTOR: ["How do I get certified?", "How do I create a class?", "Where are my requests?"],
  ADMIN: ["Where do I approve registrations?", "Open reports", "Platform settings"],
};

function resolveLink(intent: Intent, ctx: ChatContext): BotLink | undefined {
  if (!intent.link) return undefined;
  return typeof intent.link === "function" ? intent.link(ctx) : intent.link;
}

async function logMiss(message: string, ctx: ChatContext): Promise<void> {
  try {
    await prisma.chatbotMiss.create({
      data: { message: message.slice(0, 2000), role: ctx.role, userId: ctx.userId },
    });
  } catch (err) {
    console.error("[chatbot] failed to log miss:", err);
  }
}

export interface BotReplyResult {
  reply: BotReply;
  /** Raw classifier score of the winning intent/FAQ (0 on a miss) — surfaced
   *  to devs via a non-production API field so the KB can be tuned from real
   *  near-misses without shipping the number to end users. */
  score: number;
}

export async function getBotReply(message: string, ctx: ChatContext): Promise<BotReply> {
  const { reply } = await getBotReplyWithScore(message, ctx);
  return reply;
}

export async function getBotReplyWithScore(message: string, ctx: ChatContext): Promise<BotReplyResult> {
  const { intent, faq, score } = classify(message, ctx);
  return { reply: await buildReply(message, ctx, intent, faq), score };
}

async function buildReply(
  message: string,
  ctx: ChatContext,
  intent: Intent | null,
  faq: FaqEntry | null
): Promise<BotReply> {
  // ── FAQ hit ──
  if (faq) {
    return {
      text: faq.answer,
      intentId: faq.id,
      category: "faq",
      links: faq.link ? [faq.link] : undefined,
    };
  }

  // ── Recommendation intent (learner) ──
  if (intent && intent.category === "recommend") {
    const criteria = extractCriteria(message);
    const { cards, fallbackToRequest, subject } = await recommendClasses(ctx, criteria);

    if (cards.length > 0) {
      return {
        text: subject
          ? `Here ${cards.length === 1 ? "is a class" : `are ${cards.length} classes`} in ${subject} you could join:`
          : "Here are some classes you could join:",
        intentId: intent.id,
        category: "recommend",
        cards,
        suggestions: ["Post a topic request", "How does matching work?"],
      };
    }

    return {
      text: subject
        ? `I couldn't find an open ${subject} class that fits right now. You can post a topic request and a tutor can build one for you.`
        : "Tell me the subject you need help with (e.g. \"recommend a science class\"), or post a topic request and a tutor can build a class for you.",
      intentId: fallbackToRequest ? "recommend_no_match" : intent.id,
      category: "recommend",
      links: [{ href: "/learner/requests", label: "Post a topic request" }],
      suggestions: ["Recommend a math class", "Recommend an english class"],
    };
  }

  // ── Navigation / small talk intent ──
  if (intent) {
    const r = intent.response;
    const built =
      typeof r === "string" ? { text: r } : typeof r === "function" ? r(ctx) : r;
    const link = resolveLink(intent, ctx);
    return {
      text: built.text,
      intentId: intent.id,
      category: intent.category,
      links: built.links ?? (link ? [link] : undefined),
      cards: built.cards,
      suggestions: built.suggestions ?? intent.suggestions,
    };
  }

  // ── Fallback ──
  await logMiss(message, ctx);
  return {
    text: "I can help you get around Katuwang, answer common questions about how it works, and (for learners) suggest a class. Try one of these:",
    intentId: "fallback",
    category: "fallback",
    suggestions: FALLBACK_SUGGESTIONS_BY_ROLE[ctx.role],
  };
}
