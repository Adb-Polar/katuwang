import type { FaqEntry } from "@/lib/chatbot/types";

// ─── FAQ knowledge base ───────────────────────────────────────────────────
// Starter set drawn from the project scope + role docs. Per the thesis
// (Sprint 5 "FAQ Knowledge Base"), this should be refined with real answers
// from TRIS stakeholder interviews — grow it from the chatbot_misses table.

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
    link: { href: "/tutor/assessments", label: "Assessments" },
  },
  {
    id: "faq_after_pass",
    question: "What happens after I pass a topic assessment?",
    answer:
      "Depending on the platform setting, you're either certified for that topic immediately, or a pending certification is created for an admin to confirm. Once CERTIFIED, that topic is available when you create a class.",
    keywords: ["pass", "assessment", "after", "certify", "result", "next", "score"],
  },
  {
    id: "faq_matching",
    question: "How does tutor matching work?",
    answer:
      "Auto Match scores each scheduled class against what you enter using a weighted formula: subject, topic overlap, grade-level compatibility, and how well the class's session times fit your preferred slots. Higher score = better fit.",
    keywords: ["match", "matching", "work", "score", "algorithm", "how", "rank", "recommend"],
    link: { href: "/learner/match", label: "Auto Match" },
  },
  {
    id: "faq_no_match",
    question: "What if no class matches what I need?",
    answer:
      "Post a topic request from My Requests. Pick the subject, topics, your grade level and preferred times; a tutor can accept it and build a class for you. You can also send it to one specific tutor.",
    keywords: ["no", "match", "nothing", "empty", "request", "cant", "find", "fallback"],
    link: { href: "/learner/requests", label: "My Requests" },
  },
  {
    id: "faq_class_cancelled",
    question: "My class was cancelled — what now?",
    answer:
      "You'll get a notification. If your enrolment came from a topic request, that request re-opens automatically so a tutor can pick it up again. Otherwise, browse for another class or post a new request.",
    keywords: ["cancel", "cancelled", "class", "removed", "gone", "what", "now"],
  },
  {
    id: "faq_group_solo",
    question: "Can I choose one-on-one vs. group tutoring?",
    answer:
      "Yes. When you use Auto Match or post a topic request you can set your preferred setup — one-on-one (solo) or group — and matching respects it.",
    keywords: ["group", "solo", "one", "individual", "setup", "format", "alone"],
  },
  {
    id: "faq_chatbot_scope",
    question: "Can the chatbot tutor me or answer schoolwork?",
    answer:
      "No. I only help with navigating Katuwang, answering questions about how it works, and (for learners) suggesting classes. For actual tutoring, enrol in a class or post a topic request.",
    keywords: ["tutor", "teach", "answer", "homework", "schoolwork", "solve", "explain", "you"],
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
];
