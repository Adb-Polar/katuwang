# Katuwang — ISO/IEC 25010 QA Testing & Quality Evaluation Checklist

> **Target Platform:** Katuwang Peer Tutoring Management Platform  
> **Institution:** Taysan Resettlement Integrated School (TRIS), Legazpi City, Albay  
> **System Classification:** Web Application (Next.js 16 App Router, TypeScript, Tailwind CSS, DaisyUI, Prisma ORM, MariaDB/MySQL)  
> **Evaluation Standard:** ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE)  
> **Intended Audience:** Quality Assurance (QA) Engineers, Capstone Evaluation Panelists, Lead Developers, System Testers  
> **Target Roles:** `STUDENT_LEARNER` (`/learner`), `STUDENT_TUTOR` (`/tutor`), `ADMIN` (`/admin`)  
> **Mandatory Legal & Policy Grounding:** Republic Act 10173 (Philippine Data Privacy Act of 2012) — Double-Blind Anonymity Principle

---

## Executive Summary & System Profile

Katuwang is a non-profit, web-based peer tutoring management platform designed for public secondary school environments characterized by split-shift schedules, limited classroom capacity, and varied digital device access. The platform connects qualified student tutors with learners seeking academic assistance while strictly maintaining double-blind anonymity (real names are hidden across the peer boundary and replaced with sequential identifiers: `STU-####` and `TUT-####`).

### Top 3 Prioritized ISO/IEC 25010 Categories for Katuwang

| Priority | ISO 25010 Characteristic | Rationale for Katuwang |
| :---: | :--- | :--- |
| **P1** | **6. Security & Confidentiality** | **Legal Non-Negotiable.** Under RA 10173 and TRIS institutional ethics, minors interacting in peer tutoring must never experience identity exposure, cyber-harassment, or peer bias. The double-blind boundary (`STU-####` / `TUT-####`) and strict Role-Based Access Control (RBAC) must never leak across peer-facing APIs or UI views under any circumstance. |
| **P2** | **1. Functional Suitability** | **Core Academic Mandate.** The platform's fundamental capstone objective is organizing, tracking, and measuring academic intervention. Automated tutor matching algorithms, qualifying certification exams, class scheduling, pre/post-test diagnostic score gain, and topic request lifecycle workflows must function correctly without logical flaws. |
| **P3** | **4. Interaction Capability / Usability** | **Field Environment Feasibility.** Users are secondary school students and teachers using varied mobile phones, budget tablets, and older desktop computers. Intuitive learnability, WCAG 2.1 AA accessibility, responsive layout (360px to 1080p+), clear feedback, and robust user error protection are essential to prevent student abandonment. |

---

## QA Test Execution Legend

- `[ ] PASS`: Tested and confirmed to strictly match the expected behaviour.
- `[ ] FAIL`: Divergence or defect detected (requires defect log ID and severity).
- `[ ] BLOCKED`: Prerequisite flow or environment blocker prevents test completion.
- `[ ] N/A`: Condition not applicable to the current deployment profile.

---

## 1. Functional Suitability

Degree to which the software product provides functions that meet stated and implied needs when used under specified conditions.

### 1.1 Functional Completeness
*Verify that every feature specified in system requirements and thesis scope is fully implemented across all user roles.*

| ID | Feature / Module | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FS-COMP-01** | **User Management:** Registration & Anonymous ID Generation | 1. Navigate to `/register/learner` and submit valid registration data.<br>2. Navigate to `/register/tutor` and submit valid registration data.<br>3. Inspect the created user profiles and session payload. | The system registers the account, securely hashes the password with bcrypt, generates an atomic sequential anonymous identifier (`STU-####` for learners, `TUT-####` for tutors) via `IdCounter`, and prevents duplicate email registration. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-02** | **User Management:** Authentication & Role-Based Portals | 1. Log in at `/login` with Learner credentials.<br>2. Log in with Tutor credentials.<br>3. Log in with Admin credentials.<br>4. Test `/logout`. | Each user role is routed to its authorized portal (`/learner`, `/tutor`, or `/admin`). Session tokens persist via secure HTTP-only cookies. Logging out immediately destroys the session and invalidates access. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-03** | **Class Management:** Class Creation & Multi-Session Scheduling | 1. Log in as a Tutor (`/tutor/classes`).<br>2. Click **Create Class**; define subject, topics, max students, and schedule.<br>3. Add individual `ClassSession` dates and meeting links. | A new `TutorClass` record is created with an allocated class code (`C-####`), associated `ClassTopic` rows, and scheduled `ClassSession` meetings. The class appears on the tutor's dashboard and the public browse list. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-04** | **Learner Enrollment:** Class Browsing & Enrollment | 1. Log in as a Learner (`/learner`).<br>2. Open **Browse Classes**.<br>3. Select an open upcoming class and click **Enroll**.<br>4. Inspect the enrolled class roster. | The class moves into the learner's **My Classes** tab; the class enrolled count increments by 1; the tutor's roster reflects the learner's anonymous ID (`STU-####`); duplicate enrollments are rejected with an alert. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-05** | **Tutor Matching:** Weighted Algorithm & Topic Requests | 1. As a Learner, submit match criteria at `/learner/match` (subject, grade, format).<br>2. When no class matches, submit a **Topic Request** (`/learner/requests`).<br>3. As a Tutor, view `/tutor/requests` and click **Accept**. | The matching engine ranks available tutors based on subject overlap, certified topics, and schedule fit. If unmatched, the topic request is saved as `OPEN`. Accepting the request auto-creates a linked `TutorClass` and updates status to `ACCEPTED`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-06** | **Assessments:** Tutor Qualifying Certification Exam | 1. As an Admin, configure global pass percentage on `/admin/settings`.<br>2. As a Tutor, navigate to `/tutor/assessments` and start a topic exam.<br>3. Complete and submit all quiz questions. | The exam randomly samples questions from the question bank; upon submission, the quiz auto-grades instantly; if score ≥ pass threshold, a `TopicCertification` is granted with `CERTIFIED` status. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-07** | **Assessments:** Session Pre-Test and Post-Test Diagnostics | 1. As a Tutor, attach a pre/post test to a `ClassSession`.<br>2. As an Enrolled Learner, take the pre-test before session start.<br>3. Tutor marks session `COMPLETED`.<br>4. Learner completes post-test at `/learner/progress`. | Pre-test opens prior to session completion; post-test unlocks once the session is marked `COMPLETED`. Pre-to-post test score gain is calculated and charted on the learner, tutor, and admin dashboards. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-08** | **Chatbot Assistant:** FAQ, Class Recommendations, Misses | 1. Open the Chatbot widget in any portal.<br>2. Ask an FAQ question (e.g., "How do I enroll?").<br>3. Ask for a class recommendation (e.g., "Find me a Math class").<br>4. Enter an unrecognised query. | The chatbot delivers immediate FAQ answers with deep navigation links, recommends matching open classes, and logs unhandled queries into `chatbot_misses` for admin review at `/admin/chatbot`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-COMP-09** | **Administration & Governance:** Abuse Reports & Audit Logs | 1. As a Learner, submit an abuse report against a class (`ReportButton`).<br>2. As Admin, view `/admin/abuse-reports`, resolve the report, or suspend the class.<br>3. Inspect `/admin/audit-log`. | The report is queued with selected violation tags; admin actions (resolve/dismiss, account/class suspension) immediately update target statuses and record immutable audit trail entries in `AuditLog`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 1.2 Functional Correctness
*Test that calculations, business logic rules, and data operations produce precisely accurate results.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FS-CORR-01** | **Matching Score Calculation** | Invoke `rankMatches()` via `POST /api/learner/match` with known subject, grade, and preferred class format. | Score accurately applies weights: Subject match (+40), certified topic bonus (+20), grade proximity (+20 to +10), schedule soonness (+10), format match (+10). Total score is strictly bounded between 0 and 100. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-CORR-02** | **Assessment Auto-Grading & Pass Gating** | Submit quiz attempts with 100%, 75%, and 40% correct answers when pass mark is set to 75%. | Attempts with score ≥ 75% receive `PASSED` status and activate topic certification; attempts < 75% receive `FAILED` status and do not grant certification. Scores reflect exact mathematical quotient `(correct / total) * 100`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-CORR-03** | **Pre/Post Test Diagnostic Delta Gain** | Record pre-test score of 40% and post-test score of 80% for a learner session attempt. | System computes absolute score gain `(+40.0%)` and relative normalized gain accurately without rounding drift or inverted sign. Progress displays correct green upward trend badge. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-CORR-04** | **Class Capacity Enforcement** | Attempt to enroll a learner into a `TutorClass` where `currentEnrollments == maxStudents`. | System rejects enrollment with HTTP 409 Conflict (`"This class is already full."`). The database enrollment count never exceeds `maxStudents`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-CORR-05** | **Class Schedule Conflict Guard** | Tutor attempts to create two overlapping sessions on the same calendar day/time window. | The system rejects overlapping schedule creation with a validation error, preventing double-booking of a single tutor across simultaneous sessions. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 1.3 Functional Appropriateness
*Confirm that user workflows are logical, intuitive, and help users achieve their tasks with minimal steps.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FS-APPR-01** | **Learner End-to-End Tutoring Journey** | Execute journey: Register -> Browse/Search Class -> Enroll -> Take Pre-Test -> Attend Session -> Take Post-Test. | User transitions from discovery to assessment completion smoothly without encountering dead ends, redundant re-logins, or missing action buttons. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-APPR-02** | **Tutor Request-to-Class Fulfillment Flow** | Tutor inspects an open topic request, clicks **Accept**, reviews auto-filled modal, and confirms creation. | The class is immediately populated with requested subject/topics, the requesting learner is automatically enrolled, and the request status transitions cleanly without manual re-entry. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **FS-APPR-03** | **Self-Service Password & Profile Management** | User navigates to Profile, edits bio/grade level, and changes password via `ChangePasswordForm`. | Profile attributes update immediately in the UI; password change verifies current password, securely hashes new password, and keeps user session valid without forcing unexpected page reloads. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 2. Performance Efficiency

Performance of the system relative to the amount of resources used under stated conditions.

### 2.1 Time Behaviour (Speed)
*Measure page load times, API response latencies, and transaction speeds.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **PE-TIME-01** | **Initial Page Load & FCP** | Measure First Contentful Paint (FCP) and DOM Interactive on `/login`, `/learner`, `/tutor`, and `/admin`. | Page loads within **< 2.0 seconds** on standard broadband and **< 3.5 seconds** under simulated Fast 3G conditions without layout shifts (CLS < 0.1). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-TIME-02** | **Core API Response Latencies** | Measure server response time for `GET /api/classes`, `POST /api/learner/match`, and `GET /api/search`. | API endpoints respond in **< 300 ms** under normal operational load; complex matching queries respond in **< 500 ms**. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-TIME-03** | **Global Search Instant Feedback** | Press `⌘K` / `Ctrl+K` and type search query across subjects, topics, and classes. | Filtered results render in **< 150 ms** using client-side debouncing and optimized endpoint query execution. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 2.2 Resource Utilization
*Monitor CPU usage, memory consumption, disk I/O, and network bandwidth during operations.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **PE-RES-01** | **Client Memory & DOM Footprint** | Monitor browser RAM and DOM node count while navigating across all tabs in `/learner` and `/admin`. | Client memory footprint remains stable **< 150 MB**; no memory leaks detected after repeatedly mounting and unmounting modals and table views. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-RES-02** | **Server Memory on 12GB Host** | Monitor Node.js/Next.js RSS memory and CPU spikes during automated test runs (`pnpm test`) and database operations. | Server memory usage remains well within host limits (Node process consumes < 1.5 GB); CPU drops back to idle immediately following batch query completions. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-RES-03** | **Database Connection Pool Stability** | Monitor MariaDB pool connections during concurrent API invocations. | MariaDB connection pool reuses active connections, honors 30,000 ms timeout setting in `src/lib/prisma.ts`, and releases idle connections without pool exhaustion. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 2.3 Capacity
*Determine maximum limits and behavior under heavy data or transaction loads.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **PE-CAP-01** | **Concurrent User Sessions** | Simulate 50 concurrent active sessions browsing classes and taking quizzes simultaneously. | All requests complete without 500/504 gateway timeout errors; error rate is strictly **0%**. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-CAP-02** | **Large Table Pagination & Rendering** | Query `/admin/audit-log` and `/admin/users` with > 1,000 records seeded. | Tables render with smooth pagination or virtual scrolling; response payload sizes stay compact without transferring the entire database table in a single request. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **PE-CAP-03** | **Rate Limiting Threshold** | Send rapid successive requests (> 20 requests in 5 seconds) to `/api/register` or `/api/chatbot`. | System returns HTTP 429 Too Many Requests once rate limit threshold is breached, protecting the database from exhaustion. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 3. Compatibility

Degree to which a product can exchange information with other products and perform its functions while sharing common hardware/software environments.

### 3.1 Co-existence
*Verify smooth operation alongside other browser tools, extensions, and OS background tasks.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **CO-EX-01** | **Browser Extension Coexistence** | Load Katuwang portals with common extensions active (uBlock Origin, Grammarly, Google Translate). | UI layout, input fields, modals, and DaisyUI components function without DOM corruption, CSS clash, or script execution failure. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **CO-EX-02** | **Client Storage Isolation** | Check `localStorage` keys used by Chatbot and theme preferences alongside other origins. | All stored keys use clear, non-colliding names (e.g. `katuwang-chat-history`); no foreign local storage data is modified or overwritten. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 3.2 Interoperability
*Test data exchange, API formats, and standard third-party integrations.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **CO-IN-01** | **RESTful JSON API Standards** | Inspect HTTP headers and body responses across `/api/**`. | All API endpoints strictly return `application/json; charset=utf-8` with consistent envelope structure (`{ data }` or `{ error, code }`). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **CO-IN-02** | **Admin CSV Export Interoperability** | Export user, enrollment, and report summaries from `/admin/reports` to CSV. | Generated `.csv` files open cleanly in Microsoft Excel, LibreOffice Calc, and Google Sheets with correct UTF-8 character encoding, intact headers, and proper date formatting. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **CO-IN-03** | **Mail Transport Fallback** | Trigger password reset email when SMTP environment variables are unconfigured vs. configured. | When SMTP is configured, sends standard RFC 5322 MIME email. When unconfigured, falls back to logging the reset link to server console without raising an uncaught exception. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 4. Interaction Capability / Usability

Degree to which a product can be understood, learned, used, and attractive to the user under specified conditions.

### 4.1 Appropriateness Recognisability
*Confirm that icons, navigation labels, and UI elements clearly communicate their purpose.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **US-REC-01** | **Role & Status Visual Badges** | Inspect status badges for Classes (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `SUSPENDED`) and Users (`APPROVED`, `PENDING`). | Distinct DaisyUI badge styles (`badge-success`, `badge-warning`, `badge-error`, `badge-info`) instantly convey state to high school users without ambiguity. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-REC-02** | **Navigation & Icon Semantics** | Review sidebar navigation in `/learner`, `/tutor`, and `/admin`. | Every navigation item includes standard Lucide icons matching recognized metaphors (Book for Classes, Users for Tutors, Clipboard for Assessments). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 4.2 Learnability
*Validate how easily a new user can complete core tasks using tooltips, onboarding, and guidance.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **US-LRN-01** | **Empty State Guidance** | View empty states (Learner with no enrolled classes, Tutor with no scheduled sessions). | Helpful visual empty states guide the user on what to do next with actionable buttons (e.g., "Browse Available Classes" or "Create Your First Class"). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-LRN-02** | **Role-Specific Help Center** | Navigate to `/help` as Learner, Tutor, and Admin. | Help center provides categorized, easily searchable FAQ guides tailored to the authenticated user's specific role permissions and tasks. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-LRN-03** | **Chatbot Quick-Replies & Navigation** | Open chatbot and click suggested quick-reply chips. | Chatbot promptly inputs the query and outputs direct deep links to the relevant page (e.g., "Take your quiz here", "View your roster here"). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 4.3 Operability
*Ensure full responsiveness, keyboard navigation, and consistent controls.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **US-OPR-01** | **Mobile Responsive Viewports** | Test all views at 360px (mobile), 768px (tablet), and 1280px+ (desktop). | Navigation collapses into a responsive drawer/hamburger menu; table layouts adapt to card or scroll views without horizontal viewport clipping. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-OPR-02** | **Keyboard Navigation & Focus Management** | Navigate interactive forms and modals using `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Esc`. | Focus indicators remain clearly visible; tab order follows logical visual reading sequence; `Esc` reliably dismisses open dialog modals. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-OPR-03** | **Global Shortcut Activation** | Press `Ctrl+K` (Windows/Linux) or `⌘K` (macOS) on any portal screen. | Global quick search modal immediately opens with active focus placed in the search input field. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 4.4 User Error Protection
*Test field validations, warning dialogues, and destructive action guards.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **US-PROT-01** | **Form Field Validation & Error Messages** | Enter invalid data (invalid email format, passwords < 8 characters, negative numbers in class capacity). | Submissions are blocked client-side with clear inline field errors; Zod server-side validation catches malformed submissions with 400 Bad Request. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-PROT-02** | **Destructive Action Confirmation** | Attempt to unenroll from a class, cancel a scheduled session, or suspend a user account. | System displays an explicit confirmation dialog detailing consequences before executing the action. Clicking Cancel leaves state unaltered. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-PROT-03** | **Past Date / Time Scheduling Guard** | Attempt to schedule a class session with a date or time in the past. | Date-time picker restricts past selections or API rejects request with `"Cannot schedule a class in the past."` | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 4.5 Inclusivity / Accessibility (WCAG 2.1 AA)
*Verify accessibility compliance for color contrast, screen readers, and text scaling.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **US-ACC-01** | **Color Contrast Ratios** | Run automated contrast analysis (Lighthouse/axe) on buttons, text, and badges across light & dark modes. | Text and interactive elements meet or exceed WCAG 2.1 AA contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-ACC-02** | **Screen Reader ARIA Semantics** | Audit modals, alerts, and dynamic tabs with a screen reader (NVDA, VoiceOver, or Orca). | Dialogs have `role="dialog"`, dynamic status alerts announce via `aria-live`, and icon-only buttons include descriptive `aria-label` attributes. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **US-ACC-03** | **Browser Zoom Scalability** | Zoom browser viewport to 200%. | Content reflows vertically without text overlap, clipped modal content, or broken navigation functionality. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 5. Reliability

Degree to which a system performs specified functions under specified conditions for a specified period of time.

### 5.1 Faultlessness
*Execute edge-case and boundary testing to ensure the system handles abnormal conditions cleanly.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **REL-FLT-01** | **Special Characters & Long Text Inputs** | Submit inputs containing emojis, SQL syntax, HTML tags (`<script>`), and 500+ character strings into bio, notes, and search fields. | Input is safely sanitized and escaped by React/Prisma; no script executes, no database syntax error occurs, and layout remains intact. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-FLT-02** | **Boundary Value Testing** | Test edge values: class capacity of 1 (1-on-1 tutoring), 0 enrollments, quiz score of exactly 75.0% on 75% pass mark. | Boundaries are respected precisely according to business rules without off-by-one errors. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-FLT-03** | **Database Seeding Idempotency** | Run `npx tsx prisma/seed.ts` twice consecutively against the database. | The second run completes with exit code 0, creates zero duplicate rows, causes zero unique key collisions (e.g. `tutor_classes_code_key`), and verifies existing rows (`[=] verified`). | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 5.2 Fault Tolerance
*Verify that the system degrades gracefully when external components or dependencies encounter failures.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **REL-TOL-01** | **Network Interruption Handling** | Simulate temporary network disconnect while browsing classes or submitting an assessment. | Client displays an error alert with a **Retry** option; previously entered form data is preserved without silent data loss. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-TOL-02** | **Database Latency Buffer** | Test query execution against remote cloud database (Aiven MySQL) with simulated 300ms packet latency. | Driver connection succeeds without premature socket drops due to the configured 30,000ms `connectTimeout` in `src/lib/prisma.ts`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-TOL-03** | **Chatbot Unknown Query Graceful Degradation** | Submit complex or non-academic query to the Chatbot widget. | Chatbot falls back to a polite helpful message with options to browse subjects or submit a topic request; never throws an unhandled UI exception. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 5.3 Availability & Recoverability
*Verify platform uptime, recovery procedures, and health monitoring.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **REL-AV-01** | **System Health-Check API** | Send `GET /api/health` request. | Endpoint returns HTTP 200 OK with JSON status `{ status: "ok", timestamp: ... }` confirming database connectivity. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-REC-01** | **Session Recovery on Browser Restart** | Log in, close browser tab completely, reopen browser, and navigate back to `/learner` or `/tutor`. | Authenticated session is preserved seamlessly via secure HTTP-only cookie; user does not have to re-enter credentials until session expiry. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **REL-REC-02** | **Atomic Database Transaction Rollbacks** | Trigger an intentional failure halfway through a multi-model transaction (e.g. topic request fulfillment creating class, topics, and enrollments). | Entire transaction rolls back atomically via Prisma `$transaction`; no partial or orphaned records remain in the database. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 6. Security

Degree to which a system protects information and data so that persons or systems have the degree of data access appropriate to their types and levels of authorization.

### 6.1 Confidentiality & Double-Blind Anonymity (RA 10173 Mandate)
*Validate that users can only access data dictated by their role, and zero peer identities are leaked.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-CONF-01** | **Double-Blind Peer Boundary Verification** | As a Learner, inspect network responses for `GET /api/classes`, `GET /api/learner/tutors`, and `POST /api/learner/match`. | Payloads expose **ONLY** anonymous IDs (`TUT-####`), subject, and bio. Real names, email addresses, and phone numbers are completely stripped from JSON. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-CONF-02** | **Tutor Roster Anonymity Verification** | As a Tutor, inspect class roster view and network response for `GET /api/tutor/classes/[classId]`. | Roster exposes **ONLY** learner anonymous IDs (`STU-####`) and grade levels. Real student names and emails are never returned to the tutor. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-CONF-03** | **Admin Identity Visibility Isolation** | As an Admin, view `/admin/users` and `/admin/abuse-reports`. | Admin can view registered real names and emails exclusively for disciplinary, moderation, and legal compliance purposes. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-CONF-04** | **Role-Based Portal Access Control (RBAC)** | 1. As Learner, attempt to access `/admin` and `/tutor`.<br>2. As Tutor, attempt to access `/admin` and `/learner`.<br>3. As Unauthenticated visitor, attempt to access any portal. | System middleware redirects unauthorized roles with HTTP 403 Forbidden or redirects to `/login`. Direct API calls without valid role return 401 or 403. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 6.2 Integrity
*Test against unauthorized data modification, tampering, and injection vulnerabilities.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-INT-01** | **Server-Side Assessment Score Integrity** | Intercept `POST /api/tutor/assessments/submit` and modify the score in the HTTP request payload before dispatching. | Server ignores client-supplied score, evaluates raw submitted answers against the database answer key, and records the server-calculated score. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-INT-02** | **Cross-Tutor Class Tampering Prevention** | As Tutor A, send `PATCH` or `DELETE` request targeting a class ID created by Tutor B. | Server rejects the operation with HTTP 403 Forbidden or 404 Not Found (`"You do not own this class."`). Class remains unmodified. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-INT-03** | **SQL / NoSQL Injection Immunity** | Inject SQL payloads (`' OR 1=1 --`, `'; DROP TABLE users; --`) into login, search, and filter inputs. | Prisma ORM parameterizes all database queries; inputs are treated as literal strings; zero SQL injection vulnerability exists. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 6.3 Non-repudiation & Accountability
*Verify that critical actions are recorded with irrefutable proof in the audit log.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-AUD-01** | **Admin Moderation Audit Trail** | Admin suspends a user, bans a class, or resolves an abuse report. | System automatically writes an immutable record to `AuditLog` containing admin user ID, action type, target entity ID, timestamp, and optional note. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-AUD-02** | **Accountability Log Immutability** | Attempt to modify or delete audit log entries through standard application interfaces. | Audit log records are read-only; no UI or API endpoint allows modification or deletion of historical audit entries. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 6.4 Authenticity & Resistance
*Test password security, authentication timing, session invalidation, and OWASP defenses.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-AUTH-01** | **Bcrypt Password Storage** | Inspect database `users` table directly. | Passwords are stored exclusively as one-way bcrypt hashes with salt rounds; plaintext passwords are never stored anywhere in the database or logs. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-AUTH-02** | **User Enumeration Defense** | Submit password reset requests for an existing email vs. a non-existent email on `/forgot-password`. | System returns identical generic success responses (`"If an account exists with that email, a reset link has been sent."`), preventing account enumeration. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-AUTH-03** | **Cross-Site Scripting (XSS) Immunity** | Inject `<script>alert('XSS')</script>` or `<img src=x onerror=alert(1)>` into user bio, class descriptions, and topic notes. | React automatically escapes HTML entities in JSX; string renders safely as plain text without executing JavaScript. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SEC-AUTH-04** | **Security HTTP Headers** | Inspect HTTP response headers using browser developer tools or `curl -I`. | Responses include security headers configured in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 7. Maintainability & Flexibility

Degree of effectiveness and efficiency with which a product or system can be modified by the intended performers.

### 7.1 Modularity & Reusability
*Inspect code architecture to ensure separation of concerns and component reusability.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **MNT-MOD-01** | **Layered Architectural Separation** | Inspect source tree structure (`src/app/api`, `src/lib`, `src/components`, `prisma/schema.prisma`). | Presentation components, API handlers, database access layers, and domain algorithms (e.g. `matching.ts`, `classifier.ts`) remain cleanly separated. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **MNT-MOD-02** | **Reusable Component Architecture** | Check shared components (`PortalLayout`, `DataTable`, `Badge`, `ConfirmModal`, `ReportButton`). | Shared components are reused across Learner, Tutor, and Admin portals without duplicating markup or logic. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 7.2 Analysability & Testability
*Verify diagnostic log quality, static typing, and automated test coverage.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **MNT-TST-01** | **Automated Test Suite Execution** | Run `pnpm test` in the terminal. | All **102 test files** and **746+ unit/integration tests** pass cleanly with 0 failures across business logic, validations, and API routes. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **MNT-TST-02** | **Static TypeScript Compilation** | Run `npx tsc --noEmit` in the terminal. | TypeScript compiler finishes with **0 type errors**, confirming strict type safety across models, props, and API contracts. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **MNT-TST-03** | **Structured Seeding & Server Logging** | Run `npx tsx prisma/seed.ts` and inspect console output. | Seeding emits color-coded ANSI progress badges across all 12 phases (`[+]` added, `[~]` updated, `[=]` verified, `[i]` settings), providing full trace visibility. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 7.3 Scalability & Adaptability
*Test system flexibility across environments, database configurations, and dynamic settings.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **MNT-SCAL-01** | **Dynamic Database Switching** | Switch between local MySQL and cloud Aiven MariaDB using `scripts/switch-db.mjs`. | Application cleanly switches target datasource without requiring schema code changes or manual reconfiguration. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **MNT-SCAL-02** | **Runtime Platform Settings Toggles** | Toggle settings in `/admin/settings` (e.g. `matchingEnabled`, `chatbotEnabled`, `requireEmailVerification`). | Feature flags immediately alter application behavior across portals without requiring application rebuild or server restart. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **MNT-SCAL-03** | **Seed Volume Customization** | Set custom variables in `.env.seed` (e.g. `SEED_SCALE=10`, `SEED_REPORTS_COUNT=20`) and run seed. | Database seeds proportionally to configured knobs, facilitating variable-scale load and performance testing. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## 8. Safety

Degree to which a product under specified conditions protects human life, health, property, or the school community environment.

### 8.1 Operational Constraints (Student Protection & Safeguarding)
*Verify safety-critical barriers protecting minor students from harassment, inappropriate content, and unauthorized contact.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SAF-OPS-01** | **Direct Communication Channel Exclusion** | Review system architecture and UI for unmoderated private direct messaging / chat rooms between students. | In accordance with thesis safety delimitations, unmoderated student-to-student private chat is **strictly absent**. Tutoring is organized via structured classes and meetings only. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SAF-OPS-02** | **Abuse & Misconduct Reporting** | As a Learner, submit an abuse report against a tutor or class specifying violation category (e.g. Harassment, Inappropriate Language). | Report is submitted with immediate confirmation; admin dashboard highlights the flagged incident for prompt investigation. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SAF-OPS-03** | **Emergency Class & Account Suspension** | Admin flags a class or user as `SUSPENDED` or `BANNED`. | Suspended classes are instantly removed from the browse catalog; suspended users are immediately blocked from logging in or booking sessions. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

### 8.2 Fail-Safe Operations
*Ensure that system failures default to safe, closed states without exposing confidential student data.*

| ID | Test Target | Verification Steps | Expected Behaviour | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SAF-FAIL-01** | **Default-Deny Access Control Gate** | Attempt to access an undefined or newly created API route without explicit session check. | System defaults to denying access (returns 401 Unauthorized or 403 Forbidden); permissions must be explicitly granted per role. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |
| **SAF-FAIL-02** | **Production Error Sanitization** | Force an unhandled server error in production mode (`NODE_ENV=production`). | System returns a generic error response (`{"error": "An unexpected error occurred."}`); zero database connection strings, table schemas, or stack traces are leaked to the client. | `[ ] PASS`<br>`[ ] FAIL`<br>`[ ] BLOCKED` | |

---

## Summary of QA Testing Results

| ISO/IEC 25010 Quality Characteristic | Total Tests | Passed | Failed | Blocked | Compliance Score (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Functional Suitability** | 17 | | | | % |
| **2. Performance Efficiency** | 9 | | | | % |
| **3. Compatibility** | 5 | | | | % |
| **4. Interaction Capability / Usability** | 13 | | | | % |
| **5. Reliability** | 8 | | | | % |
| **6. Security** | 13 | | | | % |
| **7. Maintainability & Flexibility** | 8 | | | | % |
| **8. Safety** | 5 | | | | % |
| **Total Evaluation** | **78** | | | | **%** |

### QA Evaluator Sign-Off

- **Lead QA Tester Name:** __________________________________
- **Signature:** __________________________________
- **Date Completed:** __________________________________
- **Evaluation Recommendation:** `[ ] READY FOR CAPSTONE DEFENSE` | `[ ] REMEDIATION REQUIRED`
