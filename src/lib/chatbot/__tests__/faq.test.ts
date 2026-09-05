import { describe, it, expect } from "vitest";
import { FAQ_ENTRIES } from "@/lib/chatbot/faq";
import { STOPWORDS } from "@/lib/chatbot/normalize";
import { classify } from "@/lib/chatbot/classifier";
import type { ChatContext } from "@/lib/chatbot/types";

const learner: ChatContext = { role: "STUDENT_LEARNER", userId: "L1", gradeLevel: "GRADE_9" };
const tutor: ChatContext = { role: "STUDENT_TUTOR", userId: "T1", gradeLevel: "GRADE_11" };
const admin: ChatContext = { role: "ADMIN", userId: "A1", gradeLevel: "GRADE_12" };

describe("FAQ_ENTRIES — catalogue integrity", () => {
  it("has unique, faq_-prefixed ids", () => {
    const ids = FAQ_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith("faq_")).toBe(true);
  });

  it("every entry has a non-empty question, answer, and at least 3 keywords", () => {
    for (const entry of FAQ_ENTRIES) {
      expect(entry.question.length).toBeGreaterThan(0);
      expect(entry.answer.length).toBeGreaterThan(0);
      expect(entry.keywords.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("has no keyword that tokenize() would drop as a stopword", () => {
    const offenders = FAQ_ENTRIES.flatMap((e) => e.keywords.filter((kw) => STOPWORDS.has(kw)));
    expect(offenders).toEqual([]);
  });
});

describe("FAQ_ENTRIES — retrieval round-trip", () => {
  const cases: [string, ChatContext, string][] = [
    ["what's the difference between a tutor role and a learner account", learner, "faq_roles"],
    ["my account is pending approval, how long do I wait", learner, "faq_pending_approval"],
    ["my registration was declined, what's the reason", learner, "faq_declined"],
    ["is there a capacity limit on how many seats a class has", learner, "faq_class_capacity"],
    ["can a class have multiple topics and multiple sessions", tutor, "faq_multi_topic_class"],
    ["can I update my grade level or section in my profile", learner, "faq_update_grade_section"],
    ["how do I delete my account and remove my data", learner, "faq_account_deletion"],
    ["do you understand filipino or taglish", learner, "faq_taglish"],
    ["will katuwang send me an email notification", learner, "faq_email_notifications"],
    ["does katuwang have an offline mode or a mobile app", learner, "faq_offline_mobile"],
    ["how do I report a problem or flag abuse", learner, "faq_report_problem"],
  ];

  it.each(cases)("%s -> %s", (message, ctx, expectedId) => {
    expect(classify(message, ctx).faq?.id).toBe(expectedId);
  });

  it("role-scoped entries are not served to the wrong role", () => {
    expect(classify("can a class have multiple topics and multiple sessions", learner).faq?.id).not.toBe(
      "faq_multi_topic_class"
    );
    expect(classify("is there a capacity limit on how many seats a class has", tutor).faq?.id).not.toBe(
      "faq_class_capacity"
    );
    expect(classify("is there a capacity limit on how many seats a class has", admin).faq?.id).not.toBe(
      "faq_class_capacity"
    );
  });
});
