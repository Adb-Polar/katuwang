/**
 * Role-scoped Help & FAQ content for the in-app Help Center.
 *
 * Each portal (`/learner/help`, `/tutor/help`, `/admin/help`) renders the entry
 * for its own role only — learners never see tutor/admin material and vice
 * versa. Keep answers grounded in how the app actually behaves; when a flow
 * changes, update the matching entry here.
 */

export type HelpRole = "LEARNER" | "TUTOR" | "ADMIN";

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
  /** numbered walkthroughs of the common tasks */
  guides: HelpGuide[];
  /** searchable question/answer list */
  faqs: HelpFaq[];
}

// Learners' names are never shown to tutors. Tutors' names reach learners only when an admin turns on
// "Show tutor real names to learners" (off by default), so the copy must not promise "never" for tutors.
const LEARNER_PRIVACY =
  "No. Under the Data Privacy Act (RA 10173), tutors see you only by your anonymous ID (STU-…) and non-identifying details such as your grade level — never your name, email or contact info.";
const TUTOR_PRIVACY =
  "You never see learners' names, emails or contact info — only their anonymous IDs (STU-…) and details such as grade level. Learners see you by your TUT-… ID; your name is shown to them only if the school turns on showing tutor names, which is off by default. Your email and contact info always stay private.";

export const HELP_CONTENT: Record<HelpRole, HelpEntry> = {
  LEARNER: {
    intro:
      "How to find a tutor, join classes, and get help with a specific topic.",
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
          "Follow its status: open (waiting for a tutor), accepted, enrolled, then fulfilled.",
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
        answer: LEARNER_PRIVACY,
      },
      {
        category: "Privacy",
        question: "What is my anonymous ID and can I change it?",
        answer:
          "It is your STU-… identifier, assigned once at registration and shown to tutors in place of your name. It cannot be changed.",
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
        question: "What do the request statuses mean?",
        answer:
          "Open — waiting for a tutor. Accepted — a tutor accepted and a class was created for you. Enrolled — you have joined that class. Fulfilled — the tutoring for the request is done.",
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
      "How to get certified, run classes and sessions, and fulfill learner class requests.",
    guides: [
      {
        title: "Get certified for a topic",
        steps: [
          "Open Assessments.",
          "Pick the subject and topic you want to teach.",
          "Take the qualifying quiz — questions come from an admin-maintained bank.",
          "Pass to earn certification for that topic. Depending on a school setting, you are either certified right away or wait for an admin to confirm it.",
        ],
      },
      {
        title: "Create a class",
        steps: [
          "Open Classes and choose New class.",
          "Pick a subject and its topics — you can only choose topics you are certified for.",
          "Set the capacity (1 for a 1-on-1 class, more for a group).",
          "Add one or more sessions with their schedule.",
          "Publish. The class becomes visible to learners browsing and to Auto Match.",
        ],
      },
      {
        title: "Fulfill a class request",
        steps: [
          "Open Requests to see public requests plus any directed to you.",
          "Open one whose topic you are certified for.",
          "Click Accept — a class is auto-created for the request and the learner is prompted to enroll.",
          "The request becomes accepted, then enrolled once the learner joins the class.",
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
          "An admin reviews it; if approved, the class is reinstated and you are notified.",
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
          "No. When you create a class, the topic picker only shows topics you are certified for. Take that topic's assessment first.",
      },
      {
        category: "Certification",
        question: "What do the certification statuses mean?",
        answer:
          "Pending — you passed, but an admin still needs to confirm it (only when the school doesn't certify automatically). Certified — you can teach the topic. Rejected — an admin declined the certification, so you can't teach it.",
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
        answer: TUTOR_PRIVACY,
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
          "Open Certifications (only needed when “Auto-certify tutors who pass an assessment” is off).",
          "Each pending row is a tutor who passed a topic quiz.",
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
          "Turn “Auto-certify tutors who pass an assessment” off if you want to confirm each certification yourself.",
        ],
      },
      {
        title: "Moderate classes and handle appeals",
        steps: [
          "Open Classes to suspend or ban a class that breaks the rules.",
          "Suspended/banned tutors can file one appeal per class.",
          "Open Class Appeals to review; approving reinstates the class and notifies the tutor.",
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
          "Pending — awaiting approval. Active — normal access. Suspended — temporarily blocked. Banned — permanently blocked. Declined — the registration was rejected; the applicant sees the reason on a dedicated screen.",
      },
      {
        category: "Users",
        question: "What does “Show tutor real names to learners” do?",
        answer:
          "When on, learners see tutors' real names and can search for tutors by name in Find Tutors, class search and the top bar. It is off by default; when off, learners find tutors by their TUT-… IDs. Learners' names are never shown to tutors either way.",
      },
      {
        category: "Assessment",
        question: "What does “Auto-certify tutors who pass an assessment” do?",
        answer:
          "When on, a tutor who passes a topic quiz is certified immediately. When off, passing creates a pending certification that you confirm on the Certifications page.",
      },
      {
        category: "Assessment",
        question: "What happens if a topic's question bank is below the minimum?",
        answer:
          "Tutors are told the topic isn't ready and can't start its assessment until enough questions exist. The Question Bank readiness strip flags which topics are short.",
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
        question: "What does the “Chatbot assistant” setting do?",
        answer:
          "It turns the floating help assistant on or off in every portal. The assistant handles navigation help, FAQs and (for learners) class recommendations — it is not free-form chat.",
      },
      {
        category: "Analytics",
        question: "What does Analytics show?",
        answer:
          "Descriptive aggregates only — user counts, class and certification totals, enrollment trends. No prediction or data-mining by design.",
      },
      {
        category: "Privacy",
        question: "What are our RA 10173 obligations in the app?",
        answer:
          "Keep learners and tutors anonymous to each other: anything one peer sees about another shows only the anonymous ID and non-identifying details. Learners' names are never shown to tutors; tutors' names reach learners only if you turn on “Show tutor real names to learners”. Anonymous IDs are assigned at registration and never reused.",
      },
    ],
  },
};
