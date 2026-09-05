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

  it("does not serve a tutor-workflow FAQ to a learner", () => {
    expect(classify("how do I become a tutor", tutor).faq?.id).toBe("faq_become_tutor");
    const res = classify("how do I become a tutor", learner);
    expect(res.faq?.id ?? null).not.toBe("faq_become_tutor");
  });

  it("does not serve a learner-workflow FAQ to a tutor or admin", () => {
    expect(classify("my class was cancelled what now", learner).faq?.id).toBe("faq_class_cancelled");
    expect(classify("my class was cancelled what now", tutor).faq?.id ?? null).not.toBe("faq_class_cancelled");
    expect(classify("my class was cancelled what now", admin).faq?.id ?? null).not.toBe("faq_class_cancelled");
  });

  it("still serves platform-wide FAQs to every role", () => {
    for (const ctx of [learner, tutor, admin]) {
      expect(classify("is katuwang free", ctx).faq?.id).toBe("faq_free");
      expect(classify("why can't I see real names", ctx).faq?.id).toBe("faq_anonymity");
    }
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

describe("classify — typo tolerance (v1.1)", () => {
  it("resolves a single-edit-distance misspelling to the intended intent", () => {
    expect(classify("how do i enrol in a class", learner).intent?.id).toBe("nav_enroll");
    expect(classify("reccommend a math class", learner).intent?.id).toBe("recommend_class");
  });

  it("resolves a misspelling to the intended FAQ entry", () => {
    expect(classify("will katuwang send me an email notificaton", learner).faq?.id).toBe(
      "faq_email_notifications"
    );
  });

  it("does not fuzzy-match short words", () => {
    // "car" is not a real keyword anywhere, so this must stay unmatched
    // rather than snapping to some unrelated 3-letter keyword.
    expect(classify("car", learner).intent).toBeNull();
  });
});

describe("classify — narrowed smalltalk_capabilities (v1.1)", () => {
  it("a bare 'help' no longer matches the capabilities blurb", () => {
    expect(classify("help", learner).intent?.id).not.toBe("smalltalk_capabilities");
    expect(classify("can you help me", learner).intent?.id).not.toBe("smalltalk_capabilities");
  });

  it("a genuine 'what can you do' phrasing still matches", () => {
    expect(classify("what can you do", learner).intent?.id).toBe("smalltalk_capabilities");
    expect(classify("who are you", learner).intent?.id).toBe("smalltalk_capabilities");
  });
});

describe("classify — length-normalized confidence (v1.1)", () => {
  it("rejects a long rambling message that only glances a couple of keywords", () => {
    const res = classify(
      "so anyway I was talking to my friend yesterday about random school stuff and somehow class came up in conversation and also somewhere in there tutor got mentioned too",
      learner
    );
    expect(res.intent).toBeNull();
    expect(res.faq).toBeNull();
  });

  it("still accepts a short, pointed query", () => {
    expect(classify("reset my password", learner).intent?.id).toBe("nav_password");
  });
});

describe("classify — usability fixes (v1.2)", () => {
  it("a tutor asking about their sessions is no longer swallowed by the 'session'->'class' synonym fold", () => {
    expect(classify("how do i cancel a session", tutor).intent?.id).toBe("nav_tutor_sessions");
  });

  it("a bare 'search' clears the confidence gate for nav_search", () => {
    expect(classify("search", learner).intent?.id).toBe("nav_search");
  });

  it("a bare 'guide' clears the confidence gate for nav_help_page", () => {
    expect(classify("guide", tutor).intent?.id).toBe("nav_help_page");
  });

  it("a bare 'help' still falls through to the fallback (unchanged from v1.1)", () => {
    const res = classify("help", learner);
    expect(res.intent).toBeNull();
    expect(res.faq).toBeNull();
  });

  it("a tutor asking what happens if they're suspended reaches nav_appeal_class without mentioning 'class'", () => {
    expect(classify("what happens if i get suspended", tutor).intent?.id).toBe("nav_appeal_class");
  });

  it("'update my grade level' resolves to faq_update_grade_section, not the generic faq_grades", () => {
    expect(classify("how do i update my grade level", learner).faq?.id).toBe("faq_update_grade_section");
  });

  it("a declined application no longer loses the tie to faq_class_cancelled", () => {
    expect(classify("what happens if my application is declined", learner).faq?.id).toBe("faq_declined");
  });

  it("faq_grades and faq_class_cancelled still resolve correctly on their own strong phrasings", () => {
    expect(classify("what grade levels does katuwang serve", learner).faq?.id).toBe("faq_grades");
    expect(classify("my class was cancelled what now", learner).faq?.id).toBe("faq_class_cancelled");
  });

  it("subject-less 'find tutors' reaches nav_find_tutors instead of losing the tie to recommend_class", () => {
    expect(classify("find tutors", learner).intent?.id).toBe("nav_find_tutors");
    expect(classify("tutors directory", learner).intent?.id).toBe("nav_find_tutors");
  });

  it("a subject-bearing tutor request still goes to the recommendation flow, unchanged", () => {
    expect(classify("find me a science tutor", learner).intent?.id).toBe("recommend_class");
  });

  it("prefers a same-first-letter correction when a misspelling is equidistant to two keywords", () => {
    // "sction" is one edit from both "section" (drop the middle "e") and
    // "action" (substitute the first letter) - must resolve to "section".
    expect(classify("sction update", learner).faq?.id).toBe("faq_update_grade_section");
  });
});
