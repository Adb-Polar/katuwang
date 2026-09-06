/**
 * Role-scoped Help & FAQ content for the in-app Help Center.
 *
 * Each portal (`/learner/help`, `/tutor/help`, `/admin/help`) renders the entry
 * for its own role only — learners never see tutor/admin material and vice
 * versa. Keep answers grounded in how the app actually behaves; when a flow
 * changes, update the matching entry here.
 */

export type HelpRole = "LEARNER" | "TUTOR" | "ADMIN";

export interface HelpLink {
  label: string;
  href: string;
}

export interface HelpGuide {
  title: string;
  steps: string[];
}

export interface HelpFaq {
  category: string;
  question: string;
  answer: string;
}

export interface HelpEntry {
  /** short sentence under the page title */
  intro: string;
  /** jump-off points into the portal */
  quickLinks: HelpLink[];
  /** numbered walkthroughs of the common tasks */
  guides: HelpGuide[];
  /** searchable question/answer list */
  faqs: HelpFaq[];
}

const PRIVACY_NOTE =
  "Katuwang is double-blind by law (RA 10173, the Data Privacy Act). Learners and tutors never see each other's real name, email, or contact details — only the sequential anonymous ID (STU-XXXX for learners, TUT-XXXX for tutors) and non-identifying info such as grade level.";

export const HELP_CONTENT: Record<HelpRole, HelpEntry> = {
  LEARNER: {
    intro:
      "How to find a tutor, join classes, and get help with a specific topic.",
    quickLinks: [
      { label: "Browse Classes", href: "/learner/classes" },
      { label: "My Classes", href: "/learner/my-classes" },
      { label: "Auto Match", href: "/learner/match" },
      { label: "My Requests", href: "/learner/requests" },
      { label: "Notifications", href: "/learner/notifications" },
      { label: "Profile", href: "/learner/profile" },
    ],
    guides: [
      {
        title: "Find and join a class",
        steps: [
          "Open Browse Classes from the sidebar.",
          "Filter by subject, topic, or grade level to narrow the list.",
          "Open a class to see its schedule, the topics it covers, and how many seats are left.",
          "Click Enroll. The class then appears under My Classes.",
        ],
      },
      {
        title: "Use Auto Match",
        steps: [
          "Open Auto Match.",
          "Set the subject and topic you need help with, your availability, and whether you want 1-on-1 or a group class.",
          "Review the ranked list — classes are scored on subject, topic overlap, grade-level fit, and how well the schedule matches yours.",
          "Enroll in a good match, or post a class request if nothing fits.",
        ],
      },
      {
        title: "Post a class request",
        steps: [
          "Go to My Requests, or use the “Post a request” option shown when Auto Match finds nothing.",
          "Describe the topic, your availability, and your preferred setup (1-on-1 or group).",
          "Choose public (any certified tutor can pick it up) or directed to one specific tutor.",
          "Wait for a tutor to accept. Accepting auto-creates a class — you then enroll in it to confirm.",
          "Track the status: OPEN → ACCEPTED → ENROLLED → FULFILLED.",
        ],
      },
      {
        title: "Leave a class",
        steps: [
          "Open My Classes.",
          "Open the class you want to drop.",
          "Click Unenroll. Your seat is freed for someone else.",
        ],
      },
    ],
    faqs: [
      {
        category: "General",
        question: "What is Katuwang?",
        answer:
          "A free peer-tutoring platform for TRIS students. Student tutors volunteer to teach; student learners join their classes or request help on a topic. Everything is voluntary and organized through the school.",
      },
      {
        category: "General",
        question: "Does it cost anything? Do I pay the tutor?",
        answer:
          "No. Katuwang is free and non-profit. There are no payments anywhere in the system — tutors volunteer their time.",
      },
      {
        category: "General",
        question: "Where does the tutoring actually happen?",
        answer:
          "On school premises at TRIS. Katuwang organizes and tracks the sessions; the meetings themselves are in person. There is no file upload or online-classroom feature by design.",
      },
      {
        category: "Privacy",
        question: "Can my tutor see my real name?",
        answer: PRIVACY_NOTE,
      },
      {
        category: "Privacy",
        question: "What is my anonymous ID and can I change it?",
        answer:
          "It is your STU-XXXX identifier, assigned once at registration and shown to tutors in place of your name. It cannot be changed.",
      },
      {
        category: "Classes",
        question: "What is the difference between a class and a session?",
        answer:
          "A class is the course container — a subject, its topics, a capacity, and one roster. A session is a single scheduled meeting inside that class covering one of its topics. Joining a class signs you up for its sessions.",
      },
      {
        category: "Classes",
        question: "What happens if a class is cancelled or suspended?",
        answer:
          "You get a notification. If the class was created from one of your class requests, that request automatically re-opens so another tutor can pick it up.",
      },
      {
        category: "Requests",
        question: "Public vs. directed class request — which should I use?",
        answer:
          "Use public when you just need help and any certified tutor will do — it reaches the most tutors. Use directed when you have a specific tutor in mind; only that tutor sees it.",
      },
      {
        category: "Requests",
        question: "What do OPEN, ACCEPTED, ENROLLED, and FULFILLED mean?",
        answer:
          "OPEN — waiting for a tutor. ACCEPTED — a tutor accepted and a class was created for you. ENROLLED — you have joined that class. FULFILLED — the tutoring for the request is done.",
      },
      {
        category: "Matching",
        question: "Why does Auto Match show no results?",
        answer:
          "No existing class scored well enough on subject, topic, grade level, and schedule fit. That is expected sometimes — post a class request instead and a tutor can create a class for you.",
      },
      {
        category: "Account",
        question: "My account says “pending approval”.",
        answer:
          "An admin still needs to approve your registration. You will be able to sign in normally once that is done.",
      },
      {
        category: "Account",
        question: "I forgot my password.",
        answer:
          "Use the “Forgot password” link on the sign-in page. If email is configured for your school, you will receive a reset link.",
      },
    ],
  },

  TUTOR: {
    intro:
      "How to get certified, run classes and sessions, and fulfil learner class requests.",
    quickLinks: [
      { label: "Classes", href: "/tutor/classes" },
      { label: "Students", href: "/tutor/students" },
      { label: "Requests", href: "/tutor/requests" },
      { label: "Assessments", href: "/tutor/assessments" },
      { label: "Notifications", href: "/tutor/notifications" },
      { label: "Profile", href: "/tutor/profile" },
    ],
    guides: [
      {
        title: "Get certified for a topic",
        steps: [
          "Open Assessments.",
          "Pick the subject and topic you want to teach.",
          "Take the qualifying quiz — questions come from an admin-maintained bank.",
          "Pass to earn certification for that topic. Depending on a platform setting you are either certified automatically or left PENDING for an admin to confirm.",
        ],
      },
      {
        title: "Create a class",
        steps: [
          "Open Classes and choose New class.",
          "Pick a subject and its topics — only topics you are CERTIFIED for are selectable.",
          "Set the capacity (1 for a 1-on-1 class, more for a group).",
          "Add one or more sessions with their schedule.",
          "Publish. The class becomes visible to learners browsing and to Auto Match.",
        ],
      },
      {
        title: "Fulfil a class request",
        steps: [
          "Open Requests to see public requests plus any directed to you.",
          "Open one whose topic you are certified for.",
          "Click Accept — a class is auto-created for the request and the learner is prompted to enroll.",
          "The request moves OPEN → ACCEPTED, then ENROLLED once the learner joins.",
        ],
      },
      {
        title: "Manage your roster",
        steps: [
          "Open Students, or the roster on a class.",
          "Learners are listed by anonymous ID only — no names or contact details.",
          "Use the roster to see who is enrolled and track attendance for your in-person sessions.",
        ],
      },
      {
        title: "Appeal a moderated class",
        steps: [
          "If a class of yours is suspended or banned, open it from Classes.",
          "File an appeal from the class page (one open appeal per class).",
          "An admin reviews it; if approved, the class is reinstated to SCHEDULED and you are notified.",
        ],
      },
    ],
    faqs: [
      {
        category: "Certification",
        question: "Why do I have to pass an assessment before teaching?",
        answer:
          "It confirms you know the topic well enough to tutor it. Certification is per topic — passing the Math “Fractions” quiz does not certify you for “Algebra”.",
      },
      {
        category: "Certification",
        question: "Can I create a class for a topic I am not certified for?",
        answer:
          "No. The topic picker when creating a class only shows topics you are CERTIFIED for. Take that topic's assessment first.",
      },
      {
        category: "Certification",
        question: "What do PENDING, CERTIFIED, and REJECTED mean?",
        answer:
          "PENDING — you passed but an admin still needs to confirm (only when auto-certify is off). CERTIFIED — you can teach the topic. REJECTED — an admin declined the certification; you cannot teach it.",
      },
      {
        category: "Certification",
        question: "Who writes the quiz questions?",
        answer:
          "Admins author and maintain the per-topic question bank. Each attempt draws a set of questions from that bank.",
      },
      {
        category: "Classes & sessions",
        question: "What is the difference between a class and a session?",
        answer:
          "A class is the container — subject, topics, capacity, one roster. A session is a single scheduled meeting inside it that tackles one topic. A class can have many sessions.",
      },
      {
        category: "Classes & sessions",
        question: "What happens to enrolled learners if I unpublish or cancel a class?",
        answer:
          "Every enrolled learner is notified. If the class came from a learner's class request, that request re-opens automatically so another tutor can take it.",
      },
      {
        category: "Requests",
        question: "What exactly does “Accept” do on a class request?",
        answer:
          "It auto-creates a class matching the request (subject, topic, setup, schedule window) and links it to the request. The learner is then guided to enroll in that class.",
      },
      {
        category: "Privacy",
        question: "Can I see my learners' real names? Can they see mine?",
        answer:
          PRIVACY_NOTE +
          " An admin can enable a showTutorRealNames override, but it is off by default.",
      },
      {
        category: "Moderation",
        question: "My class was suspended or banned — what can I do?",
        answer:
          "Open the class and file an appeal. An admin reviews it, and an approved appeal reinstates the class and notifies you.",
      },
      {
        category: "Account",
        question: "My tutor account is pending approval.",
        answer:
          "An admin still needs to approve your tutor application. Once approved you can sign in and start taking assessments.",
      },
    ],
  },

  ADMIN: {
    intro:
      "How to run approvals, certifications, the question bank, moderation, and platform settings.",
    quickLinks: [
      { label: "Users", href: "/admin/users" },
      { label: "Registrations", href: "/admin/registrations" },
      { label: "Classes", href: "/admin/classes" },
      { label: "Class Requests", href: "/admin/topic-requests" },
      { label: "Certifications", href: "/admin/assessment/certifications" },
      { label: "Class Appeals", href: "/admin/class-appeals" },
      { label: "Question Bank", href: "/admin/assessment/question-bank" },
      { label: "Reports", href: "/admin/reports" },
      { label: "Audit Log", href: "/admin/audit-log" },
      { label: "Subjects & Topics", href: "/admin/subjects" },
      { label: "Settings", href: "/admin/settings" },
    ],
    guides: [
      {
        title: "Approve or decline registrations",
        steps: [
          "Open Registrations.",
          "Filter by role or grade level and review each applicant.",
          "Approve to activate the account, or Decline with a reason — the applicant sees a dedicated screen explaining the decision.",
        ],
      },
      {
        title: "Review tutor certifications",
        steps: [
          "Open Certifications (only needed when auto-certify on pass is off).",
          "Each PENDING row is a tutor who passed a topic quiz.",
          "Confirm to certify them for that topic, or Reject with a note.",
        ],
      },
      {
        title: "Maintain the question bank",
        steps: [
          "Open Question Bank and drill in: subject → topic → questions.",
          "Add or edit single-answer multiple-choice questions per topic.",
          "The readiness strip shows when a topic has enough questions for the configured attempt size.",
        ],
      },
      {
        title: "Configure assessment rules",
        steps: [
          "Open Settings → Assessment.",
          "Set questions per attempt, pass percentage, and minimum bank size (values save on blur).",
          "Toggle auto-certify on pass depending on whether you want manual confirmation.",
        ],
      },
      {
        title: "Moderate classes and handle appeals",
        steps: [
          "Open Classes to suspend or ban a class that breaks the rules.",
          "Suspended/banned tutors can file one appeal per class.",
          "Open Class Appeals to review; approving reinstates the class to SCHEDULED and notifies the tutor.",
        ],
      },
      {
        title: "Manage subjects and topics",
        steps: [
          "Open Subjects & Topics.",
          "Add, rename, reorder, or (de)activate subjects and their topics.",
          "Renaming a topic fans the new name out to every class and certification that used it.",
        ],
      },
    ],
    faqs: [
      {
        category: "Users",
        question: "Can admins see students' real identities?",
        answer:
          "Yes — admins can see real names and emails because moderation requires it. The double-blind rule applies only across the learner–tutor peer boundary, never to admins.",
      },
      {
        category: "Users",
        question: "What do the account statuses mean?",
        answer:
          "PENDING — awaiting approval. ACTIVE — normal access. SUSPENDED — temporarily blocked. BANNED — permanently blocked (policy). DECLINED — registration was rejected; the applicant sees the reason on a dedicated screen.",
      },
      {
        category: "Users",
        question: "What is the showTutorRealNames setting?",
        answer:
          "An explicit, admin-gated override that lets tutor real names show in some admin-facing views. It is off by default and does not affect what learners see.",
      },
      {
        category: "Assessment",
        question: "What does “auto-certify on pass” do?",
        answer:
          "When on, a tutor who passes a topic quiz is certified immediately. When off, passing creates a PENDING certification that you confirm on the Certifications page.",
      },
      {
        category: "Assessment",
        question: "What happens if a topic's question bank is below the minimum?",
        answer:
          "Tutors get a BANK_NOT_READY response and cannot start that topic's assessment until enough questions exist. The Question Bank readiness strip flags which topics are short.",
      },
      {
        category: "Moderation",
        question: "Suspend vs. ban — what is the difference?",
        answer:
          "Suspend is reversible and meant for temporary issues; ban is permanent. Both notify enrolled learners, and both can be appealed by the tutor.",
      },
      {
        category: "Moderation",
        question: "Where do I see what other admins have done?",
        answer:
          "The Audit Log records moderation actions — approvals, certification decisions, class actions, settings changes — with the acting admin and timestamp, and is sortable.",
      },
      {
        category: "Settings",
        question: "What is the chatbot setting?",
        answer:
          "chatbotEnabled toggles the floating intent-based help assistant in every portal. It handles navigation help, FAQs, and (for learners) class recommendations — it is not free-form chat.",
      },
      {
        category: "Analytics",
        question: "What do the Reports show?",
        answer:
          "Descriptive aggregates only — user counts, class and certification totals, enrollment trends. No prediction or data-mining by design.",
      },
      {
        category: "Privacy",
        question: "What are our RA 10173 obligations in the app?",
        answer:
          "Keep the learner–tutor boundary double-blind: peer-facing views and API responses expose only id/anonymousId plus non-identifying data. Anonymous IDs are generated atomically at registration and never reused.",
      },
    ],
  },
};
