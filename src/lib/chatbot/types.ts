import type { GradeLevel, Role } from "@prisma/client";

// ─── Intent-based chatbot: shared types ────────────────────────────────────
// The assistant is deliberately NOT generative — every reply is a predefined
// response chosen by keyword/pattern matching. See docs/reference/chatbot.md.

export type IntentCategory = "nav" | "faq" | "recommend" | "smalltalk" | "fallback";

/** Who is talking to the bot — drives role-gated intents and the recommendation flow. */
export interface ChatContext {
  role: Role;
  userId: string;
  gradeLevel: GradeLevel | null;
}

/** A deep link the bot can offer alongside its text. */
export interface BotLink {
  href: string;
  label: string;
}

/** One recommended class card (recommendation intent only). */
export interface RecommendationCard {
  id: string;
  title: string;
  subject: string;
  score: number;
  reasons: string[];
  href: string;
}

export interface BotReply {
  text: string;
  intentId: string;
  category: IntentCategory;
  links?: BotLink[];
  cards?: RecommendationCard[];
  /** Suggested follow-up phrases the UI renders as tappable chips. */
  suggestions?: string[];
}

/** What an intent's `response` resolves to before the orchestrator finishes the reply. */
export type BotReplyDraft = Pick<BotReply, "text"> &
  Partial<Pick<BotReply, "links" | "cards" | "suggestions">>;

/** A single entry in the intent catalogue (src/lib/chatbot/intents.ts). */
export interface Intent {
  id: string;
  category: Exclude<IntentCategory, "fallback">;
  /** "all" or the roles this intent is offered to. */
  roles: Role[] | "all";
  /** Canonical tokens that count toward the match score (weight 1 each). */
  keywords: string[];
  /** Phrase/shape patterns that strongly signal this intent (weight 3 each). */
  patterns?: RegExp[];
  /** Static string, a draft object, or a builder that may use the caller's context. */
  response: string | BotReplyDraft | ((ctx: ChatContext) => BotReplyDraft);
  link?: BotLink | ((ctx: ChatContext) => BotLink | undefined);
  suggestions?: string[];
}

/** A single FAQ knowledge-base entry (src/lib/chatbot/faq.ts). */
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  /** "all" (default) or the roles this entry is offered to — mirrors Intent.roles. */
  roles?: Role[] | "all";
  link?: BotLink;
}
