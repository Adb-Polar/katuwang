import { describe, it, expect } from "vitest";
import { classify } from "@/lib/chatbot/classifier";
import type { ChatContext } from "@/lib/chatbot/types";

const learner: ChatContext = { role: "STUDENT_LEARNER", userId: "L1", gradeLevel: "GRADE_9" };
const tutor: ChatContext = { role: "STUDENT_TUTOR", userId: "T1", gradeLevel: "GRADE_11" };
const admin: ChatContext = { role: "ADMIN", userId: "A1", gradeLevel: "GRADE_12" };

describe("classify — intent matching", () => {
  const cases: [string, ChatContext, string][] = [
    ["how do I enroll in a class?", learner, "nav_enroll"],
    ["how does auto match work", learner, "nav_matching"],
    ["there's no class for me, what do I do", learner, "nav_topic_request"],
    ["where are my notifications", learner, "nav_notifications"],
    ["I forgot my password", tutor, "nav_password"],
    ["how do I create a class", tutor, "nav_create_class"],
    ["how do I get certified to teach", tutor, "nav_certify"],
    ["where do I approve registrations", admin, "nav_admin_registrations"],
    ["open the platform settings", admin, "nav_admin_settings"],
    ["what can you do", learner, "smalltalk_capabilities"],
    ["thank you", learner, "smalltalk_thanks"],
  ];

  it.each(cases)("%s -> %s", (message, ctx, expectedId) => {
    const { intent } = classify(message, ctx);
    expect(intent?.id).toBe(expectedId);
  });

  it("resolves a Taglish phrasing the same as its English form", () => {
    expect(classify("paano sumali sa klase", learner).intent?.id).toBe("nav_enroll");
    expect(classify("libre ba ang katuwang", learner).faq?.id).toBe("faq_free");
  });

  it("returns nothing for an unintelligible message (-> fallback)", () => {
    const res = classify("asdfghjkl qwerty", learner);
    expect(res.intent).toBeNull();
    expect(res.faq).toBeNull();
  });
});

describe("classify — role gating", () => {
  it("does not match a tutor-only intent for a learner", () => {
    // "how do I create a class" would be nav_create_class for a tutor
    const res = classify("how do I create a class", learner);
    expect(res.intent?.id).not.toBe("nav_create_class");
  });

  it("does not match an admin-only intent for a tutor", () => {
    const res = classify("where do I approve registrations", tutor);
    expect(res.intent?.id).not.toBe("nav_admin_registrations");
  });

  it("only offers the recommendation intent to learners", () => {
    expect(classify("recommend a math class", learner).intent?.category).toBe("recommend");
    expect(classify("recommend a math class", tutor).intent?.category ?? null).not.toBe("recommend");
  });
});

describe("classify — FAQ retrieval", () => {
  it.each([
    ["is katuwang free to use", "faq_free"],
    ["why can't I see the tutor's real name", "faq_anonymity"],
    ["can the chatbot do my homework", "faq_chatbot_scope"],
    ["can I upload a worksheet", "faq_file_upload"],
  ])("%s -> %s", (message, expectedId) => {
    expect(classify(message, learner).faq?.id).toBe(expectedId);
  });
});
