
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { browsableOrEnrolledWhere, learnerClassInclude, toLearnerClassDTO } from "@/lib/classQueries";
import { rankMatches, upcomingScheduledSessions, type ClassForMatching } from "@/lib/matching";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import type { ChatContext, RecommendationCard } from "@/lib/chatbot/types";

// ─── Recommendation intent: parse a message + rank live classes ───────────

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  MATH: ["math", "mathematics", "arithmetic", "algebra", "geometry", "trigonometry", "trig", "calculus", "fractions", "statistics", "probability", "equations", "numbers"],
  ENGLISH: ["english", "grammar", "essay", "writing", "reading", "comprehension", "vocabulary", "literature", "speaking", "research"],
  SCIENCE: ["science", "biology", "chemistry", "physics", "cell", "genetics", "chemical", "ecosystem", "environment", "energy", "motion", "space"],
  FILIPINO: ["filipino", "balarila", "gramatika", "panitikan", "sanaysay", "pagbasa", "pagsulat", "pagsasalin", "retorika", "wika"],
  ARALING_PANLIPUNAN: ["araling", "panlipunan", "history", "kasaysayan", "ekonomiks", "economics", "geography", "heograpiya", "civics", "pamahalaan"],
  TLE: ["tle", "technology", "livelihood", "entrepreneurship", "cookery", "ict", "agriculture", "industrial", "home economics"],
  MAPEH: ["mapeh", "music", "arts", "physical education", "health", "sports", "dance", "pe"],
};

const SUBJECTS = Object.keys(SUBJECT_KEYWORDS) as string[];

export interface ExtractedCriteria {
  subject: string | null;
  topics: string[];
}

/** Best-effort subject + topic extraction from a free-text message. */
export function extractCriteria(message: string): ExtractedCriteria {
  const text = message.toLowerCase();

  let subject: string | null = null;
  let subjectHits = 0;
  for (const s of SUBJECTS) {
    const hits = SUBJECT_KEYWORDS[s].filter((k) => text.includes(k)).length;
    if (hits > subjectHits) {
      subject = s;
      subjectHits = hits;
    }
  }

  const topics = subject
    ? SUBJECT_TOPICS[subject].filter((t) => {
        // match on the topic itself or its first significant word
        const head = t.toLowerCase().split(/[\s&(]/)[0];
        return text.includes(t.toLowerCase()) || (head.length >= 4 && text.includes(head));
      })
    : [];

  return { subject, topics };
}

export interface RecommendationResult {
  cards: RecommendationCard[];
  fallbackToRequest: boolean;
  subject: string | null;
}

const MAX_CARDS = 3;

function reasonStrings(matchedTopics: string[], gradeMatch: string): string[] {
  const out: string[] = [];
  if (matchedTopics.length) out.push(`Covers ${matchedTopics.slice(0, 3).join(", ")}`);
  if (gradeMatch === "exact") out.push("Matches your grade level");
  else if (gradeMatch === "adjacent") out.push("Close to your grade level");
  return out;
}

/**
 * Rank the learner's browsable classes for a message. When a topic was named
 * we defer to the real matching engine; otherwise we surface the soonest
 * open classes in the subject. Empty result → suggest a topic request.
 */
export async function recommendClasses(
  ctx: ChatContext,
  criteria: ExtractedCriteria
): Promise<RecommendationResult> {
  const { subject } = criteria;
  if (!subject) return { cards: [], fallbackToRequest: true, subject: null };

  const [rows, showRealNames] = await Promise.all([
    prisma.tutorClass.findMany({
      where: { ...browsableOrEnrolledWhere(ctx.userId), subject },
      include: learnerClassInclude(ctx.userId),
      orderBy: { createdAt: "desc" },
    }),
    getSetting("showTutorRealNames"),
  ]);

  const now = new Date();
  const dtos = rows
    .map((r) => toLearnerClassDTO(r, showRealNames))
    .filter((c) => c.enrollments.length === 0);

  const forMatching: (ClassForMatching & { code: string; topicList: string[] })[] = dtos.map((c) => ({
    id: c.id,
    subject: c.subject,
    gradeLevel: c.gradeLevel,
    topics: c.topics,
    verifiedTopics: c.verifiedTopics,
    sessions: c.sessions,
    maxStudents: c.maxStudents,
    enrollmentCount: c._count.enrollments,
    status: c.status,
    published: c.published,
    code: c.code,
    topicList: c.topics,
  }));

  let cards: RecommendationCard[] = [];

  if (criteria.topics.length > 0) {
    cards = rankMatches({ subject, topics: criteria.topics, gradeLevel: ctx.gradeLevel }, forMatching, now)
      .slice(0, MAX_CARDS)
      .map((m) => ({
        id: m.class.id,
        title: `${m.class.code} · ${subject}`,
        subject,
        score: m.score,
        reasons: reasonStrings(m.reasons.matchedTopics, m.reasons.gradeMatch),
        href: `/learner/classes/${m.class.id}`,
      }));
  } else {
    // No topic named — list open classes in the subject, soonest first.
    cards = forMatching
      .filter(
        (c) =>
          c.status === "SCHEDULED" &&
          c.published &&
          c.enrollmentCount < c.maxStudents &&
          upcomingScheduledSessions(c, now).length > 0
      )
      .sort(
        (a, b) =>
          (upcomingScheduledSessions(a, now)[0]?.getTime() ?? Infinity) -
          (upcomingScheduledSessions(b, now)[0]?.getTime() ?? Infinity)
      )
      .slice(0, MAX_CARDS)
      .map((c) => ({
        id: c.id,
        title: `${c.code} · ${subject}`,
        subject,
        score: 0,
        reasons: [`Covers ${c.topicList.slice(0, 3).join(", ")}`].filter(Boolean),
        href: `/learner/classes/${c.id}`,
      }));
  }

  return { cards, fallbackToRequest: cards.length === 0, subject };
}
