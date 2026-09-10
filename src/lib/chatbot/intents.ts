import type { Intent } from "@/lib/chatbot/types";
import { portalPath } from "@/lib/portalPaths";

// ─── Intent catalogue ─────────────────────────────────────────────────────
// Ordered roughly by specificity. `classify()` scores every intent whose
// `roles` include the caller and picks the highest; ties break by category
// priority (recommend > nav > faq > smalltalk). Keep keywords in the
// canonical form produced by tokenize() (see normalize.ts SYNONYMS).

const LEARNER = "STUDENT_LEARNER" as const;
const TUTOR = "STUDENT_TUTOR" as const;
const ADMIN = "ADMIN" as const;

export const INTENTS: Intent[] = [
  // ── Recommendation (learner only) ──────────────────────────────────────
  {
    id: "recommend_class",
    category: "recommend",
    roles: [LEARNER],
    keywords: ["recommend", "find", "tutor", "class", "help", "need", "learn", "study", "topic"],
    patterns: [
      /\b(recommend|suggest|find|look(ing)? for|need|want)\b.*\b(class|tutor|help|lesson)\b/,
      /\bhelp me (with|in)\b/,
      /\bi need help\b/,
    ],
    response: { text: "" }, // built in respond.ts from live matches
    suggestions: ["Recommend a math class", "Find me a science tutor", "Post a class request"],
  },

  // ── Navigation — available to every role ───────────────────────────────
  {
    id: "nav_enroll",
    category: "nav",
    roles: [LEARNER],
    keywords: ["enroll", "class", "browse", "find", "join"],
    patterns: [/\bhow\b.*\benroll\b/, /\bjoin a class\b/],
    response: {
      text: "Open Browse Classes to see every scheduled class you can join, then use the Enroll button on one that fits.",
    },
    link: { href: "/learner/classes", label: "Browse Classes" },
    suggestions: ["How does matching work?", "Post a class request"],
  },
  {
    id: "nav_leave_class",
    category: "nav",
    roles: [LEARNER],
    keywords: ["leave", "class", "enroll"],
    patterns: [/\b(leave|unenroll|drop out of|cancel)\b.*\bclass\b/],
    response: {
      text: "Go to My Classes, open the class, and use Unenroll. You can only unenroll while the class is still scheduled.",
    },
    link: { href: "/learner/my-classes", label: "My Classes" },
  },
  {
    id: "nav_matching",
    category: "nav",
    roles: [LEARNER],
    keywords: ["match", "recommend", "auto", "score", "how"],
    patterns: [/\bhow\b.*\bmatch(ing)?\b/, /\bauto match\b/],
    response: {
      text: "Auto Match ranks scheduled classes for you using a weighted score — subject, topic overlap, grade-level fit, and how well the schedule matches your preferred times. Open Auto Match and enter what you need.",
    },
    link: { href: "/learner/match", label: "Auto Match" },
    suggestions: ["Post a class request", "How do I enroll?"],
  },
  {
    id: "nav_topic_request",
    category: "nav",
    roles: [LEARNER],
    keywords: ["request", "topic", "no", "match", "post", "ask"],
    patterns: [/\b(post|submit|make|create)\b.*\brequest\b/, /\bno (class|tutor)\b/, /\bcan'?t find\b/],
    response: {
      text: "If nothing fits, open My Requests and post a class request — pick the subject, topics, your grade level and preferred times. A tutor can accept it and build a class for you. You can also direct it at one specific tutor from their profile.",
    },
    link: { href: "/learner/requests", label: "My Requests" },
  },
  {
    id: "nav_find_tutors",
    category: "nav",
    roles: [LEARNER],
    keywords: ["tutor", "find", "browse", "verified", "profile"],
    patterns: [/\bfind\b.*\btutors?\b/, /\bbrowse\b.*\btutors?\b/, /\blist of tutors\b/],
    response: {
      text: "Find Tutors shows every verified tutor with a CERTIFIED topic — their subjects, verified-topic count, and published classes.",
    },
    link: { href: "/learner/tutors", label: "Find Tutors" },
  },
  {
    id: "nav_my_classes",
    category: "nav",
    roles: "all",
    keywords: ["class", "schedule", "upcoming", "where"],
    patterns: [/\bmy classes\b/, /\bmy schedule\b/, /\bupcoming (class|session)\b/],
    response: (ctx) => ({
      text:
        ctx.role === LEARNER
          ? "My Classes lists every class you're enrolled in with its upcoming sessions."
          : "Classes lists every class you teach with its sessions and roster.",
    }),
    link: (ctx) => (ctx.role === LEARNER ? { href: "/learner/my-classes", label: "My Classes" } : { href: "/tutor/classes", label: "Classes" }),
  },
  {
    id: "nav_notifications",
    category: "nav",
    roles: "all",
    keywords: ["notification", "bell", "alert", "unread"],
    patterns: [/\bwhere\b.*\bnotification/],
    response: {
      text: "The bell in the top bar shows a red dot when you have unread notifications — click it for the latest, or open the Notifications page for the full list.",
    },
    link: (ctx) => ({ href: portalPath(ctx.role, "/notifications"), label: "Notifications" }),
  },
  {
    id: "nav_profile",
    category: "nav",
    roles: "all",
    keywords: ["profile", "availability", "edit", "update", "change", "details"],
    patterns: [/\b(edit|update|change)\b.*\bprofile\b/, /\bmy (availability|details)\b/],
    response: (ctx) => ({
      text:
        ctx.role === TUTOR
          ? "Open Profile to edit your details. Your availability is derived automatically from the sessions you schedule — there's no separate availability form."
          : "Open Profile to review and edit your account details.",
    }),
    link: (ctx) =>
      ctx.role === LEARNER
        ? { href: "/learner/profile", label: "Profile" }
        : ctx.role === TUTOR
        ? { href: "/tutor/profile", label: "Profile" }
        : { href: "/admin/settings", label: "Settings" },
  },
  {
    id: "nav_password",
    category: "nav",
    roles: "all",
    keywords: ["password", "forgot", "reset", "login", "sign"],
    patterns: [/\b(forgot|reset|change)\b.*\bpassword\b/, /\bcan'?t (log ?in|sign in)\b/],
    response: {
      text: "Use the \"Forgot password\" link on the sign-in page. We'll email a reset link to your registered address; it expires after a short while, so use it promptly.",
    },
  },
  {
    id: "nav_logout",
    category: "nav",
    roles: "all",
    keywords: ["logout", "leave", "exit", "sign"],
    patterns: [/\b(log ?out|sign ?out)\b/],
    response: { text: "Use Log Out at the bottom of the sidebar." },
  },
  {
    id: "nav_help_page",
    category: "nav",
    roles: "all",
    keywords: ["help", "guide", "faq", "tutorial", "documentation"],
    patterns: [/\bhelp (page|centre|center)\b/, /\bfaqs?\b/, /\buser guide\b/],
    response: { text: "Open Help & FAQs for a full walkthrough of the platform, organised by topic." },
    link: (ctx) => ({ href: portalPath(ctx.role, "/help"), label: "Help & FAQs" }),
  },
  {
    id: "nav_search",
    category: "nav",
    roles: "all",
    keywords: ["search", "lookup", "directory"],
    patterns: [/\bhow\b.*\bsearch\b/, /\bwhere\b.*\bsearch\b/],
    response: {
      text: "Use the search bar in the top navigation bar — it looks up classes, tutors, and requests as you type.",
    },
  },

  // ── Navigation — tutor ────────────────────────────────────────────────
  {
    id: "nav_create_class",
    category: "nav",
    roles: [TUTOR],
    keywords: ["create", "class", "new", "make", "add", "schedule"],
    patterns: [/\b(create|make|add|start|open)\b.*\bclass\b/, /\bnew class\b/],
    response: {
      text: "Open Classes and use New Class. You can only create classes for topics you're CERTIFIED to teach — check Assessments if a topic isn't available.",
    },
    link: { href: "/tutor/classes", label: "Classes" },
    suggestions: ["How do I get certified?"],
  },
  {
    id: "nav_certify",
    category: "nav",
    roles: [TUTOR],
    keywords: ["certify", "assessment", "qualify", "teach", "how", "become"],
    patterns: [/\bhow\b.*\b(certif|qualif)/, /\bget certified\b/, /\btake (the )?assessment\b/],
    response: {
      text: "Open Assessments, pick a topic, and take its qualifying quiz. Pass it and you're either certified straight away or sent to an admin for confirmation, depending on the platform setting. Once CERTIFIED you can create classes for that topic.",
    },
    link: { href: "/tutor/assessments", label: "Assessments" },
  },
  {
    id: "nav_accept_request",
    category: "nav",
    roles: [TUTOR],
    keywords: ["request", "accept", "topic", "learner", "queue"],
    patterns: [/\b(accept|answer|take|respond to)\b.*\brequest\b/],
    response: {
      text: "Open Requests to see class requests you can take. Accepting one auto-creates a full class from it (for your CERTIFIED topics only).",
    },
    link: { href: "/tutor/requests", label: "Requests" },
  },
  {
    id: "nav_students",
    category: "nav",
    roles: [TUTOR],
    keywords: ["student", "learner", "roster", "who", "enrolled"],
    patterns: [/\bmy students\b/, /\bwho (is|are)\b.*\benrolled\b/],
    response: {
      text: "Students lists every learner across your classes (by anonymous ID). Open a class for its per-class roster.",
    },
    link: { href: "/tutor/students", label: "Students" },
  },
  {
    id: "nav_appeal_class",
    category: "nav",
    roles: [TUTOR],
    keywords: ["appeal", "suspend", "class", "locked", "moderation"],
    patterns: [/\bappeal\b.*\b(class|suspension|ban)\b/, /\bclass\b.*\b(suspended|banned)\b/],
    response: {
      text: "A SUSPENDED or BANNED class shows an appeal card under its moderation panel — open the class and file one appeal with your reason. You can only have one PENDING appeal per class at a time.",
    },
    link: { href: "/tutor/classes", label: "Classes" },
  },
  {
    id: "nav_tutor_sessions",
    category: "nav",
    roles: [TUTOR],
    keywords: ["session", "schedule", "add", "reschedule", "cancel"],
    patterns: [/\b(add|reschedule|cancel)\b.*\bsession\b/, /\bschedule a session\b/],
    response: {
      text: "Open the class and use the Sessions panel to add, reschedule, or cancel a session — this is also how your availability is derived.",
    },
    link: { href: "/tutor/classes", label: "Classes" },
  },
  {
    id: "nav_tutor_question_request",
    category: "nav",
    roles: [TUTOR],
    keywords: ["question", "request", "assessment", "enough", "topic"],
    patterns: [/\bnot enough questions\b/, /\brequest questions\b/],
    response: {
      text: "If a topic doesn't have enough questions to take its assessment, open Assessments and use \"Request questions\" on that topic — an admin will add more.",
    },
    link: { href: "/tutor/assessments", label: "Assessments" },
  },

  // ── Navigation — admin ───────────────────────────────────────────────
  {
    id: "nav_admin_registrations",
    category: "nav",
    roles: [ADMIN],
    keywords: ["registration", "approve", "pending", "signup", "account"],
    patterns: [/\b(approve|review|pending)\b.*\b(registration|signup|account)\b/],
    response: { text: "Open Registrations to approve or decline pending accounts." },
    link: { href: "/admin/registrations", label: "Registrations" },
  },
  {
    id: "nav_admin_certifications",
    category: "nav",
    roles: [ADMIN],
    keywords: ["certify", "review", "tutor", "pending", "approve"],
    patterns: [/\b(review|approve|reject)\b.*\bcertif/],
    response: { text: "Open Certifications to review tutors' pending topic certifications." },
    link: { href: "/admin/assessment/certifications", label: "Certifications" },
  },
  {
    id: "nav_admin_question_bank",
    category: "nav",
    roles: [ADMIN],
    keywords: ["question", "bank", "assessment", "add", "topic"],
    patterns: [/\bquestion bank\b/, /\badd question/],
    response: {
      text: "Open Question Bank (under Assessment) and drill down subject → topic → questions. A topic isn't assessable until it has enough active questions.",
    },
    link: { href: "/admin/assessment/question-bank", label: "Question Bank" },
  },
  {
    id: "nav_admin_moderation",
    category: "nav",
    roles: [ADMIN],
    keywords: ["moderate", "suspend", "ban", "class", "request", "report"],
    patterns: [/\b(suspend|ban|moderate|remove)\b.*\b(class|request|user)\b/],
    response: {
      text: "Class Moderation is under Classes, class requests under Class Requests, and every moderation action is recorded in the Audit Log.",
    },
    link: { href: "/admin/classes", label: "Classes" },
  },
  {
    id: "nav_admin_reports",
    category: "nav",
    roles: [ADMIN],
    keywords: ["report", "analytics", "stats", "dashboard", "usage", "chart"],
    patterns: [/\b(reports?|analytics|statistics)\b/],
    response: { text: "Open Reports for aggregate stats — users, classes, certifications, and enrolment trends." },
    link: { href: "/admin/reports", label: "Reports" },
  },
  {
    id: "nav_admin_settings",
    category: "nav",
    roles: [ADMIN],
    keywords: ["setting", "toggle", "configure", "platform", "enable", "disable"],
    patterns: [/\b(platform )?settings?\b/, /\bturn (on|off)\b/],
    response: {
      text: "Open Settings to toggle platform features (matching, registration approval, real-name visibility, the chatbot) and tune the assessment config.",
    },
    link: { href: "/admin/settings", label: "Settings" },
  },
  {
    id: "nav_admin_users",
    category: "nav",
    roles: [ADMIN],
    keywords: ["user", "account", "manage", "suspend", "search"],
    patterns: [/\bmanage\b.*\busers?\b/, /\buser (list|directory)\b/],
    response: { text: "Open Users to search, review, and manage every account on the platform." },
    link: { href: "/admin/users", label: "Users" },
  },
  {
    id: "nav_admin_class_appeals",
    category: "nav",
    roles: [ADMIN],
    keywords: ["appeal", "class", "suspend", "review", "pending"],
    patterns: [/\b(review|decide)\b.*\bappeal/],
    response: { text: "Open Class Appeals to approve or reject a tutor's appeal on a suspended or banned class." },
    link: { href: "/admin/class-appeals", label: "Class Appeals" },
  },
  {
    id: "nav_admin_audit_log",
    category: "nav",
    roles: [ADMIN],
    keywords: ["audit", "log", "history", "action", "moderation"],
    patterns: [/\baudit log\b/, /\bmoderation history\b/],
    response: { text: "Open Audit Log for a full history of moderation actions taken by administrators." },
    link: { href: "/admin/audit-log", label: "Audit Log" },
  },
  {
    id: "nav_admin_subjects",
    category: "nav",
    roles: [ADMIN],
    keywords: ["subject", "topic", "manage", "add", "edit"],
    patterns: [/\b(add|edit|manage)\b.*\b(subject|topic)s?\b/],
    response: { text: "Open Subjects & Topics to add, edit, or retire the subjects and topics used across the platform." },
    link: { href: "/admin/subjects", label: "Subjects & Topics" },
  },
  {
    id: "nav_admin_question_requests",
    category: "nav",
    roles: [ADMIN],
    keywords: ["question", "request", "tutor", "add", "assessment"],
    patterns: [/\btutors?\b.*\brequest(ed|ing)?\b.*\bquestions?\b/],
    response: { text: "Open Requests (under Assessment) to see topics where a tutor asked for more assessment questions." },
    link: { href: "/admin/assessment/requests", label: "Requests" },
  },
  {
    id: "nav_admin_chatbot",
    category: "nav",
    roles: [ADMIN],
    keywords: ["chatbot", "unanswered", "miss", "assistant", "question"],
    patterns: [/\bchatbot\b.*\b(miss|unanswered|question)/, /\bwhat.*(students|users).*ask/],
    response: {
      text: "Open Chatbot to see every question the assistant couldn't answer, grouped by frequency — use it to grow the FAQ knowledge base.",
    },
    link: { href: "/admin/chatbot", label: "Chatbot" },
  },

  // ── Small talk / meta ────────────────────────────────────────────────
  {
    id: "smalltalk_capabilities",
    category: "smalltalk",
    roles: "all",
    // Deliberately narrow — a bare "help" (or "can") used to match this and
    // swallow unclear messages before they could reach the fallback/miss log.
    // Only a genuine "what can you do" / "who are you" phrasing should.
    keywords: ["assist", "chatbot", "bot", "assistant"],
    patterns: [
      /\bwhat can (you|u) do\b/,
      /\bwhat do you do\b/,
      /\bwho are (you|u)\b/,
      /\bwhat (are|r) (you|u)\b/,
      /\bhow (can|do) (you|u) help\b/,
    ],
    response: {
      text: "I'm the Katuwang assistant. I can point you to the right page, answer common questions about how the platform works, and (for learners) suggest classes that fit what you need. I don't run tutoring sessions myself.",
    },
    suggestions: ["How do I enroll?", "Why can't I see real names?", "Is Katuwang free?"],
  },
  {
    id: "smalltalk_thanks",
    category: "smalltalk",
    roles: "all",
    keywords: ["thanks", "thank", "salamat", "appreciate", "great"],
    patterns: [/\b(thank you|thanks|salamat)\b/],
    response: { text: "Anytime! Ask me whenever you need a hand getting around Katuwang." },
  },
  {
    id: "smalltalk_greeting",
    category: "smalltalk",
    roles: "all",
    keywords: ["morning", "afternoon", "greetings", "kumusta"],
    patterns: [/^\s*(hi|hey|hello|kumusta|good (morning|afternoon|evening))\b/],
    response: { text: "Hi! What do you need help with today?" },
    suggestions: ["What can you do?", "How do I enroll?"],
  },
];
