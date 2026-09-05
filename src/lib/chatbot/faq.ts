import type { FaqEntry } from "@/lib/chatbot/types";

// ─── FAQ knowledge base ───────────────────────────────────────────────────
// Starter set drawn from the project scope + role docs. Per the thesis
// (Sprint 5 "FAQ Knowledge Base"), this should be refined with real answers
// from TRIS stakeholder interviews — grow it from the chatbot_misses table.
//
// `roles` scopes an entry to the role(s) it's relevant to (default: all roles).
// The classifier only considers entries whose `roles` include the asker, so a
// learner never gets a tutor-workflow answer and vice-versa. Keep platform-wide
// facts (privacy, subjects, cost) unscoped; scope anything that's a how-to for
// one role's flow.

const LEARNER = "STUDENT_LEARNER" as const;
const TUTOR = "STUDENT_TUTOR" as const;

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "faq_free",
    question: "Is Katuwang free?",
    answer:
      "Yes. Katuwang is a free, non-profit peer-tutoring platform for TRIS students. There are no fees or payments anywhere in the system.",
    keywords: ["free", "payment", "cost", "price", "pay", "money"],
  },
  {
    id: "faq_online",
    question: "Are tutoring sessions online?",
    answer:
      "No. Tutoring happens on school premises. Katuwang coordinates the scheduling, matching and rosters, but the sessions themselves are held in person at TRIS.",
    keywords: ["online", "remote", "location", "onsite", "campus", "premises", "venue", "virtual"],
  },
  {
    id: "faq_anonymity",
    question: "Why can't I see the tutor's / learner's real name?",
    answer:
      "Katuwang enforces double-blind anonymity as required by RA 10173 (the Data Privacy Act). Learners and tutors only ever see each other's anonymous ID (STU-#### or TUT-####), never real names, emails or contact details.",
    keywords: ["name", "real", "anonymous", "identity", "privacy", "hidden", "why"],
  },
  {
    id: "faq_anon_id",
    question: "What is an anonymous ID (STU-#### / TUT-####)?",
    answer:
      "Every student gets a unique sequential ID — STU-#### for learners, TUT-#### for tutors. It's how you're identified to peers so your real identity stays private.",
    keywords: ["anonymous", "id", "stu", "tut", "number", "username", "identifier"],
  },
  {
    id: "faq_grades",
    question: "What grade levels does Katuwang serve?",
    answer: "Junior and Senior High School — Grades 7 to 12 — under the Philippine K-12 framework.",
    keywords: ["grade", "level", "year", "junior", "senior", "high", "school", "who"],
  },
  {
    id: "faq_subjects",
    question: "What subjects are offered?",
    answer:
      "Math, English, Science, Filipino, Araling Panlipunan, TLE, and MAPEH. Each subject has a fixed list of topics you choose from when browsing, matching or requesting.",
    keywords: ["subject", "offer", "available", "math", "english", "science", "filipino", "which"],
  },
  {
    id: "faq_become_tutor",
    question: "How do I become a tutor?",
    answer:
      "Register as a tutor, then for each topic you want to teach take its qualifying assessment from the Assessments page. Once you pass and are CERTIFIED for a topic, you can create classes for it.",
    keywords: ["become", "tutor", "apply", "register", "certify", "how", "start", "teach"],
    roles: [TUTOR],
    link: { href: "/tutor/assessments", label: "Assessments" },
  },
  {
    id: "faq_after_pass",
    question: "What happens after I pass a topic assessment?",
    answer:
      "Depending on the platform setting, you're either certified for that topic immediately, or a pending certification is created for an admin to confirm. Once CERTIFIED, that topic is available when you create a class.",
    keywords: ["pass", "assessment", "after", "certify", "result", "next", "score"],
    roles: [TUTOR],
  },
  {
    id: "faq_matching",
    question: "How does tutor matching work?",
    answer:
      "Auto Match scores each scheduled class against what you enter using a weighted formula: subject, topic overlap, grade-level compatibility, and how well the class's session times fit your preferred slots. Higher score = better fit.",
    keywords: ["match", "matching", "work", "score", "algorithm", "how", "rank", "recommend"],
    roles: [LEARNER],
    link: { href: "/learner/match", label: "Auto Match" },
  },
  {
    id: "faq_no_match",
    question: "What if no class matches what I need?",
    answer:
      "Post a topic request from My Requests. Pick the subject, topics, your grade level and preferred times; a tutor can accept it and build a class for you. You can also send it to one specific tutor.",
    keywords: ["no", "match", "nothing", "empty", "request", "cant", "find", "fallback"],
    roles: [LEARNER],
    link: { href: "/learner/requests", label: "My Requests" },
  },
  {
    id: "faq_class_cancelled",
    question: "My class was cancelled — what now?",
    answer:
      "You'll get a notification. If your enrolment came from a topic request, that request re-opens automatically so a tutor can pick it up again. Otherwise, browse for another class or post a new request.",
    keywords: ["cancel", "cancelled", "class", "removed", "gone", "what", "now"],
    roles: [LEARNER],
  },
  {
    id: "faq_group_solo",
    question: "Can I choose one-on-one vs. group tutoring?",
    answer:
      "Yes. When you use Auto Match or post a topic request you can set your preferred setup — one-on-one (solo) or group — and matching respects it.",
    keywords: ["group", "solo", "one", "individual", "setup", "format", "alone"],
    roles: [LEARNER],
  },
  {
    id: "faq_chatbot_scope",
    question: "Can the chatbot tutor me or answer schoolwork?",
    answer:
      "No. I only help with navigating Katuwang, answering questions about how it works, and (for learners) suggesting classes. For actual tutoring, enrol in a class or post a topic request.",
    keywords: ["tutor", "teach", "answer", "homework", "schoolwork", "solve", "explain"],
  },
  {
    id: "faq_file_upload",
    question: "Can I upload worksheets or learning materials?",
    answer:
      "No. Katuwang has no file upload or storage — tutoring is done on campus, so materials are shared in person during the session.",
    keywords: ["upload", "file", "material", "worksheet", "document", "attach", "share"],
  },
  {
    id: "faq_data_use",
    question: "What data does Katuwang collect and how is it used?",
    answer:
      "Only what's needed to run peer tutoring: your account details (kept private from peers), your enrolments, requests and assessment results. Analytics are aggregate-only — no profiling, prediction or data mining.",
    keywords: ["data", "collect", "privacy", "information", "use", "store", "gdpr", "consent"],
  },

  // ── v1.1 usability-pass additions (2026-09-04) — each grounded in a role
  // doc / project-overview line, per the bounded content-expansion method.

  {
    id: "faq_roles",
    question: "What's the difference between a learner and a tutor account?",
    answer:
      "A learner browses and joins classes to get help; a tutor gets CERTIFIED in topics and creates classes to teach them. Each account has exactly one role, fixed at registration.",
    keywords: ["role", "learner", "tutor", "difference", "account", "both"],
  }, // CLAUDE.md — three-role model
  {
    id: "faq_pending_approval",
    question: "Why can't I sign in yet after registering?",
    answer:
      "If the platform has registration approval turned on, new accounts start as PENDING until an admin reviews them. You'll be able to sign in once approved.",
    keywords: ["pending", "approval", "wait", "register", "sign", "review"],
  }, // docs/roles/ADMIN.md — requireRegistrationApproval / PENDING
  {
    id: "faq_declined",
    question: "My registration was declined — what now?",
    answer:
      "A declined account can't sign in; trying to will take you to a screen showing the admin's decline reason. Contact your school/TRIS coordinator if you think this was a mistake.",
    keywords: ["declined", "decline", "rejected", "registration", "reason"],
  }, // docs/roles/ADMIN.md — DECLINED status, /account-declined
  {
    id: "faq_class_capacity",
    question: "Is there a limit to how many learners can join a class?",
    answer:
      "Yes — every class has a maximum capacity the tutor sets when creating it. Once it's full you can't enrol; a tutor also can't lower capacity below the class's current enrolment.",
    keywords: ["capacity", "limit", "full", "size", "max", "seats"],
    roles: [LEARNER],
  }, // docs/roles/TUTOR.md — capacity, "cannot reduce below enrollment"
  {
    id: "faq_multi_topic_class",
    question: "Can one class cover more than one topic or meeting?",
    answer:
      "Yes. A class is a course container that can hold multiple sessions on different days, each tackling one of the class's topics — one roster, several meetings, instead of a new class per topic.",
    keywords: ["multiple", "topic", "session", "meeting", "part", "course"],
    roles: [TUTOR],
  }, // docs/roles/TUTOR.md — TutorClass = course container w/ multiple sessions
  {
    id: "faq_update_grade_section",
    question: "Can I update my grade level or section?",
    answer:
      "Section is self-editable from your Profile. Grade level is admin-managed (it feeds grade/section filters elsewhere) — ask an admin if it needs to change.",
    keywords: ["grade", "section", "update", "change", "profile", "edit"],
  }, // docs/roles/LEARNER.md & TUTOR.md — Profile self-editable fields
  {
    id: "faq_account_deletion",
    question: "Can I delete my account or my data?",
    answer:
      "There's no self-service account deletion yet. If you need your account or data removed, reach out to your school/TRIS coordinator so an admin can handle it directly.",
    keywords: ["delete", "deletion", "remove", "account", "data"],
  }, // no self-service deletion route exists — answer states that honestly
  {
    id: "faq_taglish",
    question: "Can I ask in Filipino or Taglish?",
    answer:
      "Yes — common Filipino and Taglish phrasings (\"paano\", \"sumali\", \"libre\", etc.) are understood alongside English.",
    keywords: ["taglish", "filipino", "tagalog", "language", "understand"],
  }, // src/lib/chatbot/normalize.ts SYNONYMS
  {
    id: "faq_email_notifications",
    question: "Will I get emails from Katuwang?",
    answer:
      "Only for a password reset. Everything else — new matches, request updates, approvals, moderation — arrives as an in-app notification, not an email.",
    keywords: ["email", "notify", "notification", "inbox", "mail"],
  }, // src/lib/mail.ts — sendMail only used by forgot-password
  {
    id: "faq_offline_mobile",
    question: "Does Katuwang work offline or as a mobile app?",
    answer:
      "Katuwang is a responsive web app you use in a browser — there's no offline mode and no dedicated mobile app, so you'll need an internet connection.",
    keywords: ["offline", "mobile", "app", "install", "internet", "connection"],
  }, // Next.js web app, no PWA/offline support in the stack
  {
    id: "faq_report_problem",
    question: "How do I report a problem with a class or a user?",
    answer:
      "There's no self-service report button yet — flag it to your school/TRIS coordinator so an admin can review and moderate through the admin tools.",
    keywords: ["report", "problem", "issue", "complain", "flag", "abuse"],
  }, // no learner/tutor-facing report route exists — answered honestly
];
