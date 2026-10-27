# Katuwang Input Validation Testing Checklist

**Document Type:** Complete Field-by-Field Input Validation Testing Checklist & Audit  
**Target Repository:** Katuwang (Peer Tutoring & Academic Support Platform)  
**Roles & Framework:** Next.js 16 (App Router), React 19, TypeScript 5, Prisma 7 (MariaDB/MySQL), Zod 4, UploadThing  
**Auditor / QA Authority:** Senior QA Engineer & Application Security Tester  
**Date Generated:** October 18, 2026  
**Document Status:** Ready for Manual & Automated QA Execution (`[ ] Not tested`)  

---

## Section 1: Application Coverage

### 1.1 Pages and Modules Inspected

A complete static inspection and dynamic route analysis was conducted across all portals, views, and routes:

1. **Authentication & Identity Lifecycle (`/login`, `/register/**`, `/forgot-password`, `/reset-password`, `/verify-email/**`):**
   - Public login portal (`LoginForm.tsx` at `/login`)
   - Student Learner registration portal (`RegisterForm.tsx` at `/register/learner`)
   - Peer Tutor registration portal (`RegisterForm.tsx` at `/register/tutor`)
   - Self-service password recovery request (`ForgotPasswordForm.tsx` at `/forgot-password`)
   - Tokenized password reset form (`ResetPasswordForm.tsx` at `/reset-password?token=...`)
   - Email verification consumer (`VerifyEmailForm.tsx` at `/verify-email?token=...`)
   - Email verification waiting screen & resend trigger (`ResendVerificationButton.tsx` at `/verify-email/check-email`)
   - Account status screens (`/pending-approval`, `/account-declined`, `/account-unverified`, `/unauthorized`)

2. **Student Learner Portal (`/learner/**`):**
   - Learner Dashboard (`/learner`)
   - Learner Profile & Self-Service Edit (`ProfileEditForm.tsx`, `ChangePasswordForm.tsx`, `ProfilePictureUpload.tsx` at `/learner/profile`, `/learner/profile/edit`)
   - Class Discovery & Catalog Browser (`ClassBrowser.tsx` at `/learner/classes`)
   - Class Details, Enrollment & Drop Workflows (`ClassDetailsView.tsx`, `LearnerClassActions.tsx` at `/learner/classes/[classId]`)
   - Enrolled Classes Management (`/learner/my-classes` with Upcoming, Completed, and Cancelled tabs)
   - Auto-Matching Engine (`MatchFinder.tsx`, `MatchCriteriaFields.tsx` at `/learner/match`)
   - Class & Topic Request Manager (`TopicRequestManager.tsx` at `/learner/requests`)
   - Tutor Directory & Direct Request Modal (`TutorBrowser.tsx`, `RequestTopicButton.tsx` at `/learner/tutors`, `/learner/tutors/[tutorId]`)
   - Learning Analytics & History (`MyProgressView.tsx` at `/learner/progress`)
   - Abuse Reporting Modal (`ReportButton.tsx` on class and tutor cards)
   - Abuse Reports History (`MyReportsList.tsx` at `/learner/reports`)
   - Session Pre/Post-Test Runner (`SessionTestRunner.tsx` at `/learner/classes/[classId]/sessions/[sessionId]/test/[kind]`)
   - Learner Notification Drawer & Center (`/learner/notifications`)
   - Learner Help Center (`/learner/help`)

3. **Peer Tutor Portal (`/tutor/**`):**
   - Tutor Dashboard (`/tutor`)
   - Tutor Profile & Self-Service Edit (`ProfileEditForm.tsx`, `ChangePasswordForm.tsx`, `ProfilePictureUpload.tsx` at `/tutor/profile`, `/tutor/profile/edit`)
   - Class Management (`ClassManagement.tsx` at `/tutor/classes`)
   - New Class Schedule Wizard (`NewClassForm.tsx`, `ClassScheduleFields.tsx` at `/tutor/classes/new`)
   - Class Detail & Action Hub (`ClassDetailsView.tsx`, `ClassManageMenu.tsx` at `/tutor/classes/[classId]`)
   - Class Editor & Topics Manager (`EditClassForm.tsx` at `/tutor/classes/[classId]/edit`)
   - Session Creation Modal (`AddSessionModal.tsx`)
   - Session Rescheduling & Status Controls (`SessionActions.tsx`)
   - Class Suspension Appeal System (`ClassAppealCard.tsx`)
   - Student Roster & Academic Status (`StudentRoster.tsx` at `/tutor/students`, `/tutor/students/[studentId]`)
   - Topic Request Queue & Acceptance Wizard (`TopicRequestBrowser.tsx`, `AcceptRequestForm.tsx` at `/tutor/requests`, `/tutor/requests/[id]/accept`)
   - Topic Certifications & Assessments Dashboard (`AssessmentsTabs.tsx`, `TopicCertificationList.tsx`, `OtherTopicAssessment.tsx` at `/tutor/assessments`)
   - Assessment Exam Runner (`AssessmentQuizRunner.tsx` at `/tutor/assessments/[attemptId]`)
   - Session Test Authoring & Builder (`SessionTestBuilder.tsx`, `QuestionFormModal.tsx` at `/tutor/classes/[classId]/sessions/[sessionId]/test`)
   - Session Test Analytics (`SessionTestResults.tsx` at `/tutor/classes/[classId]/sessions/[sessionId]/test/results`)
   - Tutor Notification Center (`/tutor/notifications`)
   - Tutor Help Center (`/tutor/help`)

4. **Administrator & Super Admin Portal (`/admin/**`):**
   - Admin Overview & Metric Dashboard (`/admin`)
   - User Moderation & Status Management (`UserManagementTable.tsx` at `/admin/users`, `/admin/users/[id]`)
   - User Avatar Moderation Hub (`UserAvatarModerationCard.tsx` at `/admin/users/[id]`)
   - Super Admin Administrative Account Delegation (`AdminManagementTable.tsx`, `CreateAdminModal.tsx` at `/admin/admins`)
   - Class Moderation & Suspension (`ClassModerationTable.tsx` at `/admin/classes`, `/admin/classes/[id]`)
   - Admin Class Recommendation Drawer (`RecommendClassForm.tsx` at `/admin/classes/[id]`)
   - Class Suspension Appeals Review (`ClassAppealTable.tsx` at `/admin/class-appeals`)
   - Abuse & Conduct Report Review (`AbuseReportTable.tsx` at `/admin/abuse-reports`)
   - Registration Approvals Queue (`RegistrationApprovalTable.tsx` at `/admin/registrations`)
   - Topic Requests Moderation (`TopicRequestModerationTable.tsx` at `/admin/topic-requests`)
   - Tutor Certification Review (`CertificationReviewTable.tsx` at `/admin/certifications`, `/admin/assessment/certifications`)
   - Question Bank & Coverage Manager (`QuestionBankManager.tsx` at `/admin/question-bank`, `/admin/assessment/question-bank`)
   - Global Assessment Configuration (`PlatformSettingsForm.tsx`, `QuestionBankManager.tsx` at `/admin/settings`)
   - Platform Policy & Toggles Configuration (`PlatformSettingsForm.tsx` at `/admin/settings`)
   - Subject & Topic Taxonomy Management (`SubjectTopicManager.tsx` at `/admin/subjects`)
   - Immutable Audit Logging Viewer (`AuditLogTable.tsx` at `/admin/audit-log`)
   - Chatbot Fallback / Unrecognized Intent Inspector (`ChatbotMissesTable.tsx` at `/admin/chatbot`)
   - Session Test Moderation & Cross-Section Analytics (`SessionTestsTable.tsx` at `/admin/session-tests`)
   - Analytical Reporting Center (`ReportsView.tsx` at `/admin/reports`)
   - Admin Help Center (`/admin/help`)

5. **Cross-Cutting Global Utilities:**
   - AI/Rule-based Chatbot Assistant (`ChatWidget.tsx`, `ChatMessage.tsx`)
   - Top Navigation Global Search (`GlobalSearch.tsx`)
   - Notification Bell Drawer (`NotificationBell.tsx`, `NotificationList.tsx`)

6. **Development & Diagnostic Tools (`/dev/**` - 404 in Production):**
   - Test Data Factory (`DevDataFactory.tsx`, `POST /api/dev`)
   - Quick Login Switchboard (`DevLoginBoard.tsx`)

---

### 1.2 Forms and Input Fields Discovered

- **48 distinct form components, dialogs, modals, and management tables** were cataloged.
- **105 unique input fields and data entry vectors** were discovered across UI forms, URL parameters, file uploads, and direct API endpoints.

---

### 1.3 API Endpoints Inspected

A total of **85 route handlers** across `src/app/api/` were audited:

- **Authentication & Self-Service:**
  - `POST /api/auth/[...nextauth]`
  - `POST /api/register`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/verify-email`
  - `POST /api/auth/resend-verification`
  - `PATCH /api/learner/profile`
  - `POST /api/learner/profile/password`
  - `PATCH /api/tutor/profile`
  - `POST /api/tutor/profile/password`
  - `POST /api/admin/profile/password`
  - `GET /api/user/profile-picture`
  - `DELETE /api/user/profile-picture`
  - `POST /api/uploadthing`
- **Class Operations & Scheduling:**
  - `GET /api/classes`
  - `POST /api/classes/[classId]/enroll`
  - `DELETE /api/classes/[classId]/enroll`
  - `GET /api/tutor/classes`
  - `POST /api/tutor/classes`
  - `GET /api/tutor/classes/[classId]`
  - `PATCH /api/tutor/classes/[classId]`
  - `DELETE /api/tutor/classes/[classId]`
  - `GET /api/tutor/classes/[classId]/sessions`
  - `POST /api/tutor/classes/[classId]/sessions`
  - `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]`
  - `DELETE /api/tutor/classes/[classId]/sessions/[sessionId]`
  - `POST /api/tutor/classes/[classId]/appeal`
  - `GET /api/tutor/classes/[classId]/test-results`
- **Topic Requests & Matching:**
  - `POST /api/learner/match`
  - `GET /api/learner/topic-requests`
  - `POST /api/learner/topic-requests`
  - `PATCH /api/learner/topic-requests/[id]`
  - `GET /api/tutor/topic-requests`
  - `POST /api/tutor/topic-requests/[id]/accept`
  - `GET /api/admin/topic-requests`
  - `PATCH /api/admin/topic-requests/[id]`
- **Assessments, Question Bank & Session Tests:**
  - `GET /api/tutor/assessments`
  - `POST /api/tutor/assessments`
  - `GET /api/tutor/assessments/[attemptId]`
  - `POST /api/tutor/assessments/[attemptId]/submit`
  - `GET /api/tutor/topic-certifications`
  - `POST /api/tutor/topic-certifications`
  - `GET /api/tutor/question-bank`
  - `GET /api/tutor/questions`
  - `POST /api/tutor/questions`
  - `PATCH /api/tutor/questions/[questionId]`
  - `DELETE /api/tutor/questions/[questionId]`
  - `GET /api/tutor/question-requests`
  - `POST /api/tutor/question-requests`
  - `GET /api/tutor/classes/[classId]/sessions/[sessionId]/test`
  - `POST /api/tutor/classes/[classId]/sessions/[sessionId]/test`
  - `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test`
  - `PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions`
  - `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status`
  - `GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/results`
  - `GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]`
  - `POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start`
  - `GET /api/learner/classes/[classId]/session-tests`
  - `GET /api/learner/session-test-attempts/[attemptId]`
  - `POST /api/learner/session-test-attempts/[attemptId]/submit`
  - `GET /api/admin/assessment-questions`
  - `POST /api/admin/assessment-questions`
  - `PATCH /api/admin/assessment-questions/[questionId]`
  - `DELETE /api/admin/assessment-questions/[questionId]`
  - `GET /api/admin/assessment-questions/coverage`
  - `GET /api/admin/assessment-configs`
  - `PATCH /api/admin/assessment-configs`
  - `GET /api/admin/assessment-attempts`
  - `GET /api/admin/assessment-attempts/[attemptId]`
  - `GET /api/admin/question-requests`
  - `PATCH /api/admin/question-requests/[requestId]`
  - `GET /api/admin/certifications`
  - `PATCH /api/admin/certifications/[certificationId]`
  - `GET /api/admin/session-tests`
  - `GET /api/admin/session-tests/[testId]/results`
  - `GET /api/admin/session-tests/[testId]/attempts/[attemptId]`
- **Moderation, Taxonomy, Governance & Governance Administration:**
  - `POST /api/learner/reports`
  - `GET /api/admin/abuse-reports`
  - `PATCH /api/admin/abuse-reports/[reportId]`
  - `GET /api/admin/reports`
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/[userId]`
  - `POST /api/admin/users/[userId]/avatar-action`
  - `GET /api/admin/admins`
  - `POST /api/admin/admins`
  - `GET /api/admin/admins/[adminId]`
  - `PATCH /api/admin/admins/[adminId]`
  - `GET /api/admin/classes`
  - `PATCH /api/admin/classes/[classId]`
  - `GET /api/admin/classes/[classId]/recommendations`
  - `POST /api/admin/classes/[classId]/recommendations`
  - `GET /api/admin/class-appeals`
  - `PATCH /api/admin/class-appeals/[appealId]`
  - `GET /api/admin/registrations`
  - `PATCH /api/admin/registrations/[userId]`
  - `GET /api/admin/settings`
  - `PATCH /api/admin/settings`
  - `GET /api/admin/subjects`
  - `POST /api/admin/subjects`
  - `PATCH /api/admin/subjects/[id]`
  - `DELETE /api/admin/subjects/[id]`
  - `POST /api/admin/subjects/[id]/topics`
  - `PATCH /api/admin/topics/[id]`
  - `DELETE /api/admin/topics/[id]`
  - `GET /api/subjects`
  - `GET /api/admin/audit-log`
  - `GET /api/admin/chatbot-misses`
- **Global Services & Diagnostics:**
  - `GET /api/search`
  - `POST /api/chatbot`
  - `GET /api/notifications`
  - `POST /api/notifications/read`
  - `GET /api/learner/tutors`
  - `GET /api/learner/progress`
  - `GET /api/tutor/students`
  - `GET /api/health`
  - `POST /api/dev`

---

### 1.4 Areas Not Inspected and Environmental Limitations

1. **Third-Party CDN / Cloud Storage Configuration:** Live credentials, bucket policies, lifecycle expiry rules, and cross-origin resource sharing (CORS) configurations for UploadThing/AWS S3 were not dynamically tested.
2. **Production SMTP Relay:** Live delivery, SPF, DKIM, and DMARC alignments with remote mail transfer agents (MTAs) were not executed.
3. **Destructive Active Penetration Testing:** In strict compliance with testing boundaries, no SQL injection payloads, denial-of-service payload streams, or account lockout attempts were run against live databases or shared staging environments.

---

### 1.5 Assumptions and Clarification Flags

- **Needs Clarification (Recovery Email Policy):** The database model `User` includes `recoveryEmail`, and `commonRegisterSchema` validates it if provided. However, the registration UI form omits the input, `registerAccount()` discards it upon insertion, and while `PATCH /api/learner/profile` allows learners to set it, `PATCH /api/tutor/profile` silently discards it.
- **Needs Clarification (Unbounded MySQL VARCHAR columns):** The registration schema does not constrain `section` and `contactInfo` to maximum lengths. MySQL defaults unannotated Prisma `@prisma/client` strings to `VARCHAR(191)`. Submissions > 191 characters will crash MariaDB/MySQL with SQL truncation errors if strict SQL mode is enabled.
- **Needs Clarification (Double-blind Anonymity vs Direct Meeting Links):** The `meetingLink` field accepts any valid URL (e.g., `meet.google.com/xyz` or personal Zoom links) which may inadvertently leak student email addresses or real names during peer tutoring sessions.

---

## Section 2: Master Input Inventory

| ID | Module/Page | Form or Component | Field Label/Name | Input Type | Frontend Validation | Backend Validation | Expected Rules | Source File/API Endpoint |
|---|---|---|---|---|---|---|---|---|
| **FLD-AUTH-01** | Auth / Login | `LoginForm.tsx` | Email Address (`email`) | `email` | `required`, HTML5 email format | None in schema; checked via Prisma `findUnique` | Valid email format, existing account | `src/app/login/page.tsx` -> `POST /api/auth/[...nextauth]` |
| **FLD-AUTH-02** | Auth / Login | `LoginForm.tsx` | Password (`password`) | `password` | `required` | None in schema; compared via `bcrypt.compare` | Non-empty string, valid credentials | `src/app/login/page.tsx` -> `POST /api/auth/[...nextauth]` |
| **FLD-REG-01** | Auth / Register | `RegisterForm.tsx` (Learner) | First Name (`firstName`) | `text` | `required` | `z.string().min(1).max(50).trim()` | 1–50 characters, trimmed | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-02** | Auth / Register | `RegisterForm.tsx` (Learner) | Last Name (`lastName`) | `text` | `required` | `z.string().min(1).max(50).trim()` | 1–50 characters, trimmed | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-03** | Auth / Register | `RegisterForm.tsx` (Learner) | Email Address (`email`) | `email` | `required`, HTML5 email | `z.string().trim().toLowerCase().pipe(email())` | Valid email, lowercase, unique | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-04** | Auth / Register | `RegisterForm.tsx` (Learner) | Grade Level (`gradeLevel`) | `select` | `required` | `z.nativeEnum(GradeLevel)` | Must match enum `GRADE_7`–`GRADE_12` | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-05** | Auth / Register | `RegisterForm.tsx` (Learner) | Section (`section`) | `text` | `required` | `z.string().min(1).trim()` | Min 1 char; **Needs clarification**: Missing max length constraint (defaults to 191 in DB) | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-06** | Auth / Register | `RegisterForm.tsx` (Learner) | Contact Info (`contactInfo`) | `text` | Optional | `z.string().trim().optional()` | **Needs clarification**: Missing max length constraint | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-07** | Auth / Register | `RegisterForm.tsx` (Learner) | Password (`password`) | `password` | `required`, `minLength={8}` | `min(8)`, `<=72` bytes (bcrypt cap), blocklist check | 8–72 bytes, not common password | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-08** | Auth / Register | `RegisterForm.tsx` (Learner) | Confirm Password (`confirmPassword`) | `password` | `required`, Client match check | Not sent to backend | Must match `password` | `src/app/register/learner/page.tsx` -> `RegisterForm.tsx` |
| **FLD-REG-09** | Auth / Register | `RegisterForm.tsx` (Learner) | Parental Consent (`consentGiven`) | `checkbox` | `required` (HTML5) | `z.literal(true)` | Must be boolean `true` | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-10** | Auth / Register | `RegisterForm.tsx` (Learner) | Account Type (`type`) | Hidden/Prop | Injected prop | `z.literal("LEARNER")` | Discriminator value must be `"LEARNER"` | `src/app/register/learner/page.tsx` -> `POST /api/register` |
| **FLD-REG-11** | Auth / Register | API Request Body | Recovery Email (`recoveryEmail`) | Direct API | Not in form UI | `z.string().trim().toLowerCase().pipe(email()).optional()` | **Needs clarification**: Discarded in `registerAccount` | Direct API request -> `POST /api/register` |
| **FLD-REGT-01** | Auth / Register | `RegisterForm.tsx` (Tutor) | First Name (`firstName`) | `text` | `required` | `z.string().min(1).max(50).trim()` | 1–50 characters, trimmed | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-02** | Auth / Register | `RegisterForm.tsx` (Tutor) | Last Name (`lastName`) | `text` | `required` | `z.string().min(1).max(50).trim()` | 1–50 characters, trimmed | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-03** | Auth / Register | `RegisterForm.tsx` (Tutor) | Email Address (`email`) | `email` | `required`, HTML5 email | `z.string().trim().toLowerCase().pipe(email())` | Valid email, lowercase, unique | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-04** | Auth / Register | `RegisterForm.tsx` (Tutor) | Grade Level (`gradeLevel`) | `select` | `required` | `z.nativeEnum(GradeLevel)` | Must match enum `GRADE_7`–`GRADE_12` | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-05** | Auth / Register | `RegisterForm.tsx` (Tutor) | Section (`section`) | `text` | `required` | `z.string().min(1).trim()` | Min 1 char; Missing max length constraint | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-06** | Auth / Register | `RegisterForm.tsx` (Tutor) | Contact Info (`contactInfo`) | `text` | Optional | `z.string().trim().optional()` | Missing max length constraint | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-07** | Auth / Register | `RegisterForm.tsx` (Tutor) | Password (`password`) | `password` | `required`, `minLength={8}` | `min(8)`, `<=72` bytes, blocklist check | 8–72 bytes, not common password | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-08** | Auth / Register | `RegisterForm.tsx` (Tutor) | Confirm Password (`confirmPassword`) | `password` | `required`, Client match check | Not sent to backend | Must match `password` | `src/app/register/tutor/page.tsx` -> `RegisterForm.tsx` |
| **FLD-REGT-09** | Auth / Register | `RegisterForm.tsx` (Tutor) | Parental Consent (`consentGiven`) | `checkbox` | `required` (HTML5) | `z.literal(true)` | Must be boolean `true` | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-10** | Auth / Register | `RegisterForm.tsx` (Tutor) | Account Type (`type`) | Hidden/Prop | Injected prop | `z.literal("TUTOR")` | Discriminator value must be `"TUTOR"` | `src/app/register/tutor/page.tsx` -> `POST /api/register` |
| **FLD-REGT-11** | Auth / Register | API Request Body | Recovery Email (`recoveryEmail`) | Direct API | Not in form UI | `z.string().trim().toLowerCase().pipe(email()).optional()` | Discarded in `registerAccount` | Direct API request -> `POST /api/register` |
| **FLD-FPW-01** | Auth / Forgot Pwd | `ForgotPasswordForm.tsx` | Account or Recovery Email (`email`) | `email` | `required`, HTML5 email | `z.string().trim().toLowerCase().pipe(email())` | Valid email address format | `src/app/forgot-password/page.tsx` -> `POST /api/auth/forgot-password` |
| **FLD-RPW-01** | Auth / Reset Pwd | `ResetPasswordForm.tsx` | Reset Token (`token`) | URL Param | `token` read from query params | `z.string().min(1)` | Non-empty valid, unexpired token | `src/app/reset-password/page.tsx` -> `POST /api/auth/reset-password` |
| **FLD-RPW-02** | Auth / Reset Pwd | `ResetPasswordForm.tsx` | New Password (`password`) | `password` | `required`, `minLength={8}` | `passwordField`: min(8), <=72 bytes, blocklist | 8–72 bytes, not in common password list | `src/app/reset-password/page.tsx` -> `POST /api/auth/reset-password` |
| **FLD-RPW-03** | Auth / Reset Pwd | `ResetPasswordForm.tsx` | Confirm New Password (`confirm`) | `password` | `required`, Client match check | Not sent to backend | Must match `password` exactly | `src/app/reset-password/page.tsx` -> `ResetPasswordForm.tsx` |
| **FLD-VML-01** | Auth / Verify Email | `VerifyEmailForm.tsx` | Verification Token (`token`) | URL Param | Extracted from URL query string | `z.string().min(1)` | Valid non-empty verification token | `src/app/verify-email/page.tsx` -> `POST /api/auth/verify-email` |
| **FLD-RVML-01** | Auth / Resend Verify | `ResendVerificationButton.tsx` | Account Email (`email`) | Component Prop | Populated from route params or session | `z.string().trim().toLowerCase().pipe(email())` | Valid email, registered account | `src/components/auth/ResendVerificationButton.tsx` -> `POST /api/auth/resend-verification` |
| **FLD-PRF-01** | Learner / Profile | `ProfileEditForm.tsx` | Grade Level (`gradeLevel`) | `select` | `required` | `z.nativeEnum(GradeLevel).optional()` | Valid GradeLevel enum | `src/app/learner/profile/edit/page.tsx` -> `PATCH /api/learner/profile` |
| **FLD-PRF-02** | Learner / Profile | `ProfileEditForm.tsx` | Section (`section`) | `text` | `required`, `maxLength={50}` | `z.string().trim().min(1).max(50).optional()` | 1–50 characters, trimmed | `src/app/learner/profile/edit/page.tsx` -> `PATCH /api/learner/profile` |
| **FLD-PRF-03** | Learner / Profile | `ProfileEditForm.tsx` | Contact Info (`contactInfo`) | `tel` | Live sanitization regex `/[^\d\s()+.-]/g` | `max(200)` + `normalizeContactInfo` (PH E.164) | Valid 11-digit PH mobile or landline | `src/app/learner/profile/edit/page.tsx` -> `PATCH /api/learner/profile` |
| **FLD-PRF-04** | Learner / Profile | API Request Body | Recovery Email (`recoveryEmail`) | Direct API | Not exposed in `ProfileEditForm` UI | `z.string().trim().toLowerCase().pipe(email()).optional()` | **Needs clarification**: Vulnerability VAL-003 | Direct API request -> `PATCH /api/learner/profile` |
| **FLD-PRFT-01** | Tutor / Profile | `ProfileEditForm.tsx` | Grade Level (`gradeLevel`) | `select` | `required` | `z.nativeEnum(GradeLevel).optional()` | Valid GradeLevel enum | `src/app/tutor/profile/edit/page.tsx` -> `PATCH /api/tutor/profile` |
| **FLD-PRFT-02** | Tutor / Profile | `ProfileEditForm.tsx` | Section (`section`) | `text` | `required`, `maxLength={50}` | `z.string().trim().min(1).max(50).optional()` | 1–50 characters, trimmed | `src/app/tutor/profile/edit/page.tsx` -> `PATCH /api/tutor/profile` |
| **FLD-PRFT-03** | Tutor / Profile | `ProfileEditForm.tsx` | Contact Info (`contactInfo`) | `tel` | Live sanitization regex | `max(200)` + `normalizeContactInfo` | Valid PH contact number | `src/app/tutor/profile/edit/page.tsx` -> `PATCH /api/tutor/profile` |
| **FLD-CPW-01** | Profile / Pwd | `ChangePasswordForm.tsx` | Current Password (`currentPassword`) | `password` | `required` | `z.string().min(1)` + `bcrypt.compare` | Must match currently stored bcrypt hash | `src/components/profile/ChangePasswordForm.tsx` -> `POST /api/{role}/profile/password` |
| **FLD-CPW-02** | Profile / Pwd | `ChangePasswordForm.tsx` | New Password (`newPassword`) | `password` | `required`, `minLength={8}` | `passwordField`: min 8, <=72 bytes, not common | 8–72 bytes, not common password | `src/components/profile/ChangePasswordForm.tsx` -> `POST /api/{role}/profile/password` |
| **FLD-CPW-03** | Profile / Pwd | `ChangePasswordForm.tsx` | Confirm New Password (`confirmPassword`) | `password` | `required`, Client match check | Not sent to backend | Must match `newPassword` | `src/components/profile/ChangePasswordForm.tsx` |
| **FLD-AVT-01** | Profile / Avatar | `ProfilePictureUpload.tsx` | Profile Image File (`file`) | `file` | File size <=2MB, MIME whitelist, client optimize | Max 2MB, MIME whitelist, magic bytes, aspect ratio | JPEG/PNG/WebP, max 2MB, dims <= 512px | `src/components/profile/ProfilePictureUpload.tsx` -> `POST /api/uploadthing` |
| **FLD-AVT-02** | Profile / Avatar | `ProfilePictureUpload.tsx` | Remove Avatar Action | Button trigger | Confirmed by user | Ownership check, delete from cloud storage | Removes existing image and imageKey | `src/components/profile/ProfilePictureUpload.tsx` -> `DELETE /api/user/profile-picture` |
| **FLD-CLS-01** | Tutor / New Class | `ClassScheduleFields.tsx` | Subject Area (`subject`) | `select` | `required` | `z.string().trim().min(1)` + `subjectExists()` | Valid active subject slug | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-02** | Tutor / New Class | `ClassScheduleFields.tsx` | Target Grade Level (`gradeLevel`) | `select` | Optional | `z.nativeEnum(GradeLevel).nullable().optional()` | Valid GradeLevel or null | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-03** | Tutor / New Class | `ClassScheduleFields.tsx` | Topic Selection (`topics`) | `checkbox` array | At least 1 selected, max 10 | `z.array(z.string().trim().min(2).max(60)).min(1).max(10)` | 1–10 topics, each 2–60 chars, certified | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-04** | Tutor / New Class | `ClassScheduleFields.tsx` | Custom Topic (`customTopic`) | `text` | `maxLength={60}`, min 2 chars | Normalized via `normalizeTopic` | Valid title case string 2–60 chars | `src/app/tutor/classes/new/page.tsx` -> `ClassScheduleFields.tsx` |
| **FLD-CLS-05** | Tutor / New Class | `ClassScheduleFields.tsx` | Class Description (`description`) | `textarea` | `maxLength={500}` | `z.string().max(500).trim().optional()` | Max 500 characters | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-06** | Tutor / New Class | `ClassScheduleFields.tsx` | Session Topic (`sessions[i].topic`) | `select` | `required`, must be in `topics` | `z.string().trim().min(1)` | Must match one of the class's topics | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-07** | Tutor / New Class | `ClassScheduleFields.tsx` | Session Schedule (`sessions[i].scheduledAt`) | `datetime-local` | `required` | `z.string().datetime()` + overlap check | Valid ISO datetime string, no overlap | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-08** | Tutor / New Class | `ClassScheduleFields.tsx` | Session Duration (`sessions[i].duration`) | `select` | `required` (30, 45, 60, 90, 120) | `z.coerce.number().int().min(15).max(240)` | 15–240 minutes | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-09** | Tutor / New Class | `ClassScheduleFields.tsx` | Building (`building`) | `text` | Location or link check | `z.string().max(100).trim().optional()` | Max 100 chars, required if no link | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-10** | Tutor / New Class | `ClassScheduleFields.tsx` | Room (`room`) | `text` | Location or link check | `z.string().max(50).trim().optional()` | Max 50 chars | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-11** | Tutor / New Class | `ClassScheduleFields.tsx` | Maximum Capacity (`maxStudents`) | `number` | `required`, `min={1}`, `max={10}` | `z.coerce.number().int().min(1).max(10)` | Integer 1–10 | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-12** | Tutor / New Class | `ClassScheduleFields.tsx` | Meeting Link (`meetingLink`) | `url` | Location or link check | `z.string().trim().url().optional()` | Valid URL format, required if no location | `src/app/tutor/classes/new/page.tsx` -> `POST /api/tutor/classes` |
| **FLD-CLS-13** | Tutor / New Class | API Request Body | Published Status (`published`) | Direct API | Defaults to `true` | `z.boolean().optional()` | Boolean | Direct API request -> `POST /api/tutor/classes` |
| **FLD-EC-01** | Tutor / Edit Class | API Request Body | Subject Slug (`subject`) | Direct API | Not in `EditClassForm` UI | `classDetailsSchema.partial()` | **Needs clarification**: Vulnerability VAL-001 (bypasses certification) | Direct API request -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-02** | Tutor / Edit Class | `EditClassForm.tsx` | Class Topics (`topics`) | `checkbox` array | Cannot uncheck `usedTopics` | Min 1, max 10, normalized | 1–10 topics, cannot delete used session topic | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-03** | Tutor / Edit Class | `EditClassForm.tsx` | Custom Topic (`customTopic`) | `text` | Min 2 chars | Normalized via `normalizeTopic` | 2–60 chars | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `EditClassForm.tsx` |
| **FLD-EC-04** | Tutor / Edit Class | `EditClassForm.tsx` | Description (`description`) | `textarea` | `maxLength={500}` | `z.string().max(500).trim().optional()` | Max 500 chars | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-05** | Tutor / Edit Class | `EditClassForm.tsx` | Target Grade Level (`gradeLevel`) | `select` | Optional | `z.nativeEnum(GradeLevel).nullable().optional()` | Valid GradeLevel or null | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-06** | Tutor / Edit Class | `EditClassForm.tsx` | Maximum Capacity (`maxStudents`) | `number` | `required`, `min={1}`, `max={10}` | `z.coerce.number().int().min(1).max(10)` >= enrolled | Capacity cannot be less than current enrollments | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-07** | Tutor / Edit Class | `EditClassForm.tsx` | Building (`building`) | `text` | Location or link check | `z.string().max(100).trim().optional()` | Max 100 chars | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-08** | Tutor / Edit Class | `EditClassForm.tsx` | Room (`room`) | `text` | Location or link check | `z.string().max(50).trim().optional()` | Max 50 chars | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-09** | Tutor / Edit Class | `EditClassForm.tsx` | Meeting Link (`meetingLink`) | `url` | Location or link check | `z.string().trim().url().optional()` | Valid URL format | `src/app/tutor/classes/[classId]/edit/page.tsx` -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-EC-10** | Tutor / Edit Class | API Request Body | Class Status (`status`) | Direct API | Custom check in route | `SCHEDULED`, `COMPLETED`, `CANCELLED` | Valid transition | Direct API request -> `PATCH /api/tutor/classes/[classId]` |
| **FLD-SES-01** | Tutor / Session | `AddSessionModal.tsx` | Topic (`topic`) | `select` | `required`, from `classTopics` | `z.string().trim().min(1)` must be in class | Must be one of the class's topics | `src/components/tutor/AddSessionModal.tsx` -> `POST /api/tutor/classes/[classId]/sessions` |
| **FLD-SES-02** | Tutor / Session | `AddSessionModal.tsx` | Date & Time (`scheduledAt`) | `datetime-local` | `required` | `z.string().datetime()` + overlap check | Valid datetime string, no schedule overlap | `src/components/tutor/AddSessionModal.tsx` -> `POST /api/tutor/classes/[classId]/sessions` |
| **FLD-SES-03** | Tutor / Session | `AddSessionModal.tsx` | Duration (`duration`) | `select` | `required` (30, 45, 60, 90, 120) | `z.coerce.number().int().min(15).max(240)` | 15–240 minutes | `src/components/tutor/AddSessionModal.tsx` -> `POST /api/tutor/classes/[classId]/sessions` |
| **FLD-SES-04** | Tutor / Session | Session Actions UI | Session Status (`status`) | `select`/Button | UI status actions | `z.nativeEnum(SessionStatus)` | `SCHEDULED`, `COMPLETED`, `CANCELLED` | `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]` |
| **FLD-APL-01** | Tutor / Appeal | `ClassAppealCard.tsx` | Appeal Reason (`reason`) | `textarea` | `required`, `maxLength={500}`, min 10 | `z.string().trim().min(10).max(500)` | 10–500 characters, trimmed | `src/components/tutor/ClassAppealCard.tsx` -> `POST /api/tutor/classes/[classId]/appeal` |
| **FLD-ACC-01** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Target Grade (`gradeLevel`) | `select` | Optional | `z.nativeEnum(GradeLevel).nullable().optional()` | Valid GradeLevel or null | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ACC-02** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Certified Topics (`topics`) | `checkbox` array | Certified topics only | `z.array().min(1).max(10)` certified check | 1–10 topics, certified | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ACC-03** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Description (`description`) | `textarea` | `maxLength={500}` | `z.string().max(500).trim().optional()` | Max 500 chars | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ACC-04** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Sessions Array (`sessions`) | Row list | At least 1 session required | Array of session objects (min 1, max 20) | Valid topic, datetime, duration | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ACC-05** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Location / Meeting Link | `text` / `url` | Location or link check | `building` max 100, `room` max 50, or `meetingLink` url | Valid location or meeting link | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ACC-06** | Tutor / Accept Req | `AcceptRequestForm.tsx` | Max Students (`maxStudents`) | `number` | `min={1}`, `max={10}` | `z.coerce.number().int().min(1).max(10)` | Integer 1–10 | `src/app/tutor/requests/[id]/accept/page.tsx` -> `POST /api/tutor/topic-requests/[id]/accept` |
| **FLD-ASM-01** | Tutor / Assessment | `OtherTopicAssessment.tsx` | Subject (`subject`) | `select` | `required` | `z.string().trim().min(1)` + `subjectExists` | Valid active subject slug | `src/app/tutor/assessments/page.tsx` -> `POST /api/tutor/assessments` |
| **FLD-ASM-02** | Tutor / Assessment | `OtherTopicAssessment.tsx` | Topic (`topic`) | `select` | `required` | `z.string().trim().min(1)` + `topicExists` | Valid topic for subject | `src/app/tutor/assessments/page.tsx` -> `POST /api/tutor/assessments` |
| **FLD-ASM-03** | Tutor / Assessment | `AssessmentQuizRunner.tsx` | Answer Options (`answers`) | `radio` inputs | Must select an option per question | `z.array(z.object({ questionId: min(1), optionId: min(1) })).min(1).max(50)` | Valid question & option IDs | `src/app/tutor/assessments/[attemptId]/page.tsx` -> `POST /api/tutor/assessments/[attemptId]/submit` |
| **FLD-TC-01** | Tutor / Cert Request | `TopicCertificationList.tsx` | Subject (`subject`) | Hidden/Button | Certified subject | `z.string().trim().min(1)` | Valid subject | `POST /api/tutor/topic-certifications` |
| **FLD-TC-02** | Tutor / Cert Request | `TopicCertificationList.tsx` | Topic (`topic`) | Hidden/Button | Certified topic | `z.string().trim().min(1)` + `topicExists` | Valid topic for subject | `POST /api/tutor/topic-certifications` |
| **FLD-QR-01** | Tutor / Q Request | Question Request Modal | Subject (`subject`) | `select` | `required` | `z.string().trim().min(1)` | Valid subject | `POST /api/tutor/question-requests` |
| **FLD-QR-02** | Tutor / Q Request | Question Request Modal | Topic (`topic`) | `select` | `required` | `z.string().trim().min(1)` + `topicExists` | Valid topic for subject | `POST /api/tutor/question-requests` |
| **FLD-QR-03** | Tutor / Q Request | Question Request Modal | Note (`note`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `POST /api/tutor/question-requests` |
| **FLD-TQ-01** | Tutor / Custom Q | `QuestionFormModal.tsx` | Class ID (`classId`) | Hidden | Injected from page context | `z.string().trim().min(1)` + ownership check | Owned class | `POST /api/tutor/questions` |
| **FLD-TQ-02** | Tutor / Custom Q | `QuestionFormModal.tsx` | Topic (`topic`) | `select` | `required` | `z.string().trim().min(1)` must be in class | Must belong to class's topics (**vulnerability VAL-010 in PATCH**) | `POST /api/tutor/questions`, `PATCH .../[questionId]` |
| **FLD-TQ-03** | Tutor / Custom Q | `QuestionFormModal.tsx` | Question Prompt (`prompt`) | `textarea` | `required`, min 5, max 1000 | `z.string().trim().min(5).max(1000)` | 5–1000 chars | `POST /api/tutor/questions`, `PATCH .../[questionId]` |
| **FLD-TQ-04** | Tutor / Custom Q | `QuestionFormModal.tsx` | Explanation (`explanation`) | `textarea` | `maxLength={1000}` | `z.string().trim().max(1000).optional()` | Max 1000 chars | `POST /api/tutor/questions`, `PATCH .../[questionId]` |
| **FLD-TQ-05** | Tutor / Custom Q | `QuestionFormModal.tsx` | Option Text (`options[i].text`) | `text` inputs | `required`, 2–6 options | `z.string().trim().min(1).max(500)` (2 to 6 options) | 1–500 chars per option | `POST /api/tutor/questions`, `PATCH .../[questionId]` |
| **FLD-TQ-06** | Tutor / Custom Q | `QuestionFormModal.tsx` | Correct Option (`options[i].isCorrect`) | `radio` inputs | Exactly 1 correct | Refined check: exactly one `isCorrect === true` | Exactly 1 correct answer | `POST /api/tutor/questions`, `PATCH .../[questionId]` |
| **FLD-STB-01** | Tutor / Test Builder | `SessionTestBuilder.tsx` | Test Title (`title`) | `text` | `required`, min 3, max 120 | `z.string().trim().min(3).max(120)` | 3–120 characters | `POST/PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test` |
| **FLD-STB-02** | Tutor / Test Builder | `SessionTestBuilder.tsx` | Instructions (`instructions`) | `textarea` | `maxLength={2000}` | `z.string().trim().max(2000).optional()` | Max 2000 chars | `POST/PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test` |
| **FLD-STB-03** | Tutor / Test Builder | `SessionTestBuilder.tsx` | Question Ordering (`questionIds`) | Drag/order list | Min 1, max 50 | `z.array(z.string().trim().min(1)).min(1).max(50)` | 1–50 valid question IDs | `PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions` |
| **FLD-STB-04** | Tutor / Test Builder | `SessionTestBuilder.tsx` | Test Status (`status`) | Button/Action | UI confirmation | `z.enum(["PUBLISHED", "CLOSED"])` | Must be `"PUBLISHED"` or `"CLOSED"` | `PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status` |
| **FLD-STR-01** | Learner / Test Runner| `SessionTestRunner.tsx` | Test Kind (`kind`) | URL Param | `"PRE"` or `"POST"` in URL | `kind: "PRE" \| "POST"` in route validation | Pre or Post test kind | `POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start` |
| **FLD-STR-02** | Learner / Test Runner| `SessionTestRunner.tsx` | Answers Array (`answers`) | `radio` inputs | Answer questions | `z.array(z.object({ questionId, optionId })).min(1).max(50)` | Valid question & option IDs | `POST /api/learner/session-test-attempts/[attemptId]/submit` |
| **FLD-AQ-01** | Admin / Q Bank | `QuestionBankManager.tsx` | Subject (`subject`) | `select` | `required` | `z.string().trim().min(1)` + `subjectExists` | Valid active subject slug | `POST /api/admin/assessment-questions` |
| **FLD-AQ-02** | Admin / Q Bank | `QuestionBankManager.tsx` | Topic (`topic`) | `select` | `required` | `z.string().trim().min(1)` + `topicExists` | Valid topic for subject | `POST /api/admin/assessment-questions` |
| **FLD-AQ-03** | Admin / Q Bank | `QuestionBankManager.tsx` | Prompt (`prompt`) | `textarea` | `required`, min 5, max 1000 | `z.string().trim().min(5).max(1000)` | 5–1000 chars | `POST/PATCH /api/admin/assessment-questions` |
| **FLD-AQ-04** | Admin / Q Bank | `QuestionBankManager.tsx` | Explanation (`explanation`) | `textarea` | `maxLength={1000}` | `z.string().trim().max(1000).optional()` | Max 1000 chars | `POST/PATCH /api/admin/assessment-questions` |
| **FLD-AQ-05** | Admin / Q Bank | `QuestionBankManager.tsx` | Options (`options[i].text`) | `text` inputs | `required`, 2–6 options | `z.string().trim().min(1).max(500)` (2 to 6 options) | 1–500 chars | `POST/PATCH /api/admin/assessment-questions` |
| **FLD-AQ-06** | Admin / Q Bank | `QuestionBankManager.tsx` | Correct Option (`isCorrect`) | `radio` inputs | Exactly 1 correct | Refined check: exactly one correct option | Exactly 1 correct answer | `POST/PATCH /api/admin/assessment-questions` |
| **FLD-AQ-07** | Admin / Q Bank | `QuestionBankManager.tsx` | Question Active (`active`) | Toggle/checkbox | Boolean toggle | `z.boolean().optional()` | Boolean | `PATCH /api/admin/assessment-questions/[questionId]` |
| **FLD-AQR-01** | Admin / Q Request | Question Request Modal | Decision Status (`status`) | `select` | `required` | `z.enum(["RESOLVED", "DISMISSED"])` | `"RESOLVED"` or `"DISMISSED"` | `PATCH /api/admin/question-requests/[requestId]` |
| **FLD-AQR-02** | Admin / Q Request | Question Request Modal | Resolution Note (`resolutionNote`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/question-requests/[requestId]` |
| **FLD-ACFG-01**| Admin / Settings | `PlatformSettingsForm.tsx` | Questions Per Attempt | `number` | min 1, max 50 | `z.coerce.number().int().min(1).max(50)` | Integer 1–50 | `PATCH /api/admin/assessment-configs` |
| **FLD-ACFG-02**| Admin / Settings | `PlatformSettingsForm.tsx` | Pass Mark Percent | `number` | min 1, max 100 | `z.coerce.number().int().min(1).max(100)` | Integer 1–100 | `PATCH /api/admin/assessment-configs` |
| **FLD-ACFG-03**| Admin / Settings | `PlatformSettingsForm.tsx` | Minimum Bank Size | `number` | min 1, max 200 | `z.coerce.number().int().min(1).max(200)` | Integer 1–200 | `PATCH /api/admin/assessment-configs` |
| **FLD-MAT-01** | Learner / Match | `MatchCriteriaFields.tsx` | Subject (`subject`) | `select` | `required` | `z.string().trim().min(1)` + `subjectExists` | Valid active subject slug | `POST /api/learner/match` |
| **FLD-MAT-02** | Learner / Match | `MatchCriteriaFields.tsx` | Grade Level (`gradeLevel`) | `select` | Optional | `z.nativeEnum(GradeLevel).optional()` | Valid GradeLevel or omitted | `POST /api/learner/match` |
| **FLD-MAT-03** | Learner / Match | `MatchCriteriaFields.tsx` | Class Format (`classFormat`) | `select` | `"SOLO"`, `"GROUP"`, `"ANY"` | `z.enum(["SOLO", "GROUP", "ANY"]).optional()` | Format enum or omitted | `POST /api/learner/match` |
| **FLD-MAT-04** | Learner / Match | `MatchCriteriaFields.tsx` | Topics (`topics`) | `checkbox` array | Min 1, max 10 | `z.array(z.string().trim().min(1)).min(1).max(10)` | 1–10 topics valid for subject | `POST /api/learner/match` |
| **FLD-MAT-05** | Learner / Match | `MatchCriteriaFields.tsx` | Preferred Day (`day`) | `select` | Day of week enum | `z.enum(["MONDAY", ..., "SUNDAY"])` | Valid day of week | `POST /api/learner/match` |
| **FLD-MAT-06** | Learner / Match | `MatchCriteriaFields.tsx` | Preferred Start Time (`startTime`) | `time` | `HH:MM` regex | `z.string().regex(/^([01]\d\|2[0-3]):[0-5]\d$/)` | Valid 24h time, `startTime < endTime` | `POST /api/learner/match` |
| **FLD-MAT-07** | Learner / Match | `MatchCriteriaFields.tsx` | Preferred End Time (`endTime`) | `time` | `HH:MM` regex | `z.string().regex(/^([01]\d\|2[0-3]):[0-5]\d$/)` | Valid 24h time, `startTime < endTime` | `POST /api/learner/match` |
| **FLD-TRQ-01** | Learner / Request | `TopicRequestManager.tsx` | Subject (`subject`) | `select` | `required` | `z.string().trim().min(1)` + `subjectExists` | Valid active subject slug | `POST/PATCH /api/learner/topic-requests` |
| **FLD-TRQ-02** | Learner / Request | `TopicRequestManager.tsx` | Grade Level (`gradeLevel`) | `select` | `required` | `z.nativeEnum(GradeLevel)` | Valid GradeLevel enum | `POST/PATCH /api/learner/topic-requests` |
| **FLD-TRQ-03** | Learner / Request | `TopicRequestManager.tsx` | Topics (`topics`) | `checkbox` array | Min 1, max 10 | `z.array(z.string().trim().min(1)).min(1).max(10)` | 1–10 valid topics for subject | `POST/PATCH /api/learner/topic-requests` |
| **FLD-TRQ-04** | Learner / Request | `TopicRequestManager.tsx` | Preferred Time Slots | Slot list | Max 21 slots | `z.array(availabilitySlotSchema).max(21)` | Up to 21 valid day/time windows | `POST/PATCH /api/learner/topic-requests` |
| **FLD-TRQ-05** | Learner / Request | `TopicRequestManager.tsx` | Additional Note (`note`) | `textarea` | `maxLength={500}` | `z.string().max(500).trim().optional()` | Max 500 chars | `POST/PATCH /api/learner/topic-requests` |
| **FLD-TRQ-06** | Learner / Request | `RequestTopicButton.tsx` | Directed Tutor ID (`directedTutorId`) | Hidden/Prop | Valid tutor ID | `z.string().trim().min(1).optional()` | Valid tutor profile ID or omitted | `POST /api/learner/topic-requests` |
| **FLD-TRQ-07** | Learner / Request | `TopicRequestManager.tsx` | Cancel Status (`status`) | Button/Action | UI confirmation | `z.literal("CANCELLED")` | Only `"CANCELLED"` allowed | `PATCH /api/learner/topic-requests/[id]` |
| **FLD-CB-01** | Learner / Browse | `ClassBrowser.tsx` | Search Query (`q`) | `text` | Free-text search | Trimmed, slug resolution, parameterization | Safe string | `GET /api/classes?q=...` |
| **FLD-CB-02** | Learner / Browse | `ClassBrowser.tsx` | Subject Filter (`subject`) | `select` | Catalog slugs | `Prisma.TutorClassWhereInput` | Valid subject slug | `GET /api/classes?subject=...` |
| **FLD-CB-03** | Learner / Browse | `ClassBrowser.tsx` | Grade Level Filter (`gradeLevel`) | `select` | Grade levels | `gradeParam in GradeLevel` | Valid GradeLevel enum | `GET /api/classes?gradeLevel=...` |
| **FLD-CB-04** | Learner / Browse | `ClassBrowser.tsx` | Browse Scope (`scope`) | URL Param | `"browse"` or `"mine"` | `scope === "mine" ? "mine" : "browse"` | `"browse"` or `"mine"` | `GET /api/classes?scope=...` |
| **FLD-CB-05** | Learner / Browse | `ClassBrowser.tsx` | My-Classes Tab (`status`) | Tab buttons | Tab keys | `"upcoming"`, `"completed"`, `"cancelled"` | Valid tab key | `GET /api/classes?scope=mine&status=...` |
| **FLD-CB-06** | Learner / Browse | `ClassBrowser.tsx` | Page Number (`page`) | Pagination | Positive integer | `Math.max(1, Number(page) \|\| 1)` | Positive integer | `GET /api/classes?page=...` |
| **FLD-CB-07** | Learner / Browse | `ClassBrowser.tsx` | Page Size (`pageSize`) | Pagination | Page size limits | `Math.min(MAX_PAGE_SIZE, Math.max(1, ...))` | 1 to `MAX_PAGE_SIZE` | `GET /api/classes?pageSize=...` |
| **FLD-TB-01** | Learner / Tutors | `TutorBrowser.tsx` | Search Query (`q`) | `text` | Free-text search | Trimmed, anonymousId/name query | Safe string | `GET /api/learner/tutors?q=...` |
| **FLD-TB-02** | Learner / Tutors | `TutorBrowser.tsx` | Subject Filter (`subject`) | `select` | Catalog slugs | Certification filter in Prisma | Valid subject slug | `GET /api/learner/tutors?subject=...` |
| **FLD-TB-03** | Learner / Tutors | `TutorBrowser.tsx` | Sort Parameters (`sort`, `dir`) | Table headers | Whitelisted keys | `parseSort()` against whitelisted columns | Whitelisted sort column and `"asc"`/`"desc"` | `GET /api/learner/tutors?sort=...` |
| **FLD-ENR-01** | Learner / Enroll | `LearnerClassActions.tsx`| Class ID (`classId`) | URL Param | Target class | `findUnique` + capacity/status verification | Valid class, scheduled, published, capacity open | `POST /api/classes/[classId]/enroll` |
| **FLD-ENR-02** | Learner / Enroll | `LearnerClassActions.tsx`| Unenroll Class ID (`classId`) | URL Param | Enrolled class | `findUnique` enrollment + status check | Must be enrolled, class must be scheduled | `DELETE /api/classes/[classId]/enroll` |
| **FLD-REP-01** | Learner / Report | `ReportButton.tsx` | Target Type (`targetType`) | Hidden/Prop | `"TUTOR"` or `"CLASS"` | `z.enum(["TUTOR", "CLASS"])` | `"TUTOR"` or `"CLASS"` | `POST /api/learner/reports` |
| **FLD-REP-02** | Learner / Report | `ReportButton.tsx` | Target ID (`targetId`) | Hidden/Prop | Non-empty ID | `z.string().trim().min(1)` + exists check | Valid existing User ID or TutorClass ID | `POST /api/learner/reports` |
| **FLD-REP-03** | Learner / Report | `ReportButton.tsx` | Violation Reasons (`violations`) | `checkbox` array | Min 1 reason | `z.array(z.enum(ALL_VIOLATION_VALUES)).min(1)` | At least 1 valid violation type enum | `POST /api/learner/reports` |
| **FLD-REP-04** | Learner / Report | `ReportButton.tsx` | Report Details (`details`) | `textarea` | Max 1000, >=10 if OTHER | `z.string().trim().max(1000)` + refinement for OTHER | Max 1000 chars, min 10 chars if OTHER chosen | `POST /api/learner/reports` |
| **FLD-ADM-USR-01**| Admin / Users | `UserManagementTable.tsx`| Search Query (`q`) | `text` | Free-text search | `firstName`, `lastName`, `email`, `anonymousId` query | Safe search string | `GET /api/admin/users?q=...` |
| **FLD-ADM-USR-02**| Admin / Users | `UserManagementTable.tsx`| Role Tab Filter (`role`) | Tabs | Role tabs | `z.enum(["STUDENT_LEARNER", "STUDENT_TUTOR"])` | Valid role enum | `GET /api/admin/users?role=...` |
| **FLD-ADM-USR-03**| Admin / Users | `UserManagementTable.tsx`| Status Filter (`status`) | `select` | Status options | `AccountStatus` enum check | Valid AccountStatus enum | `GET /api/admin/users?status=...` |
| **FLD-ADM-USR-04**| Admin / Users | `UserManagementTable.tsx`| Grade Level Filter (`gradeLevel`)| `select` | Grade levels | `GradeLevel` enum check | Valid GradeLevel enum | `GET /api/admin/users?gradeLevel=...` |
| **FLD-ADM-USR-05**| Admin / Users | `UserManagementTable.tsx`| Sort & Direction (`sort`, `dir`) | Table headers | Whitelisted keys | `parseSort()` | Whitelisted sort column and order | `GET /api/admin/users?sort=...` |
| **FLD-ADM-USR-06**| Admin / Users | `UserManagementTable.tsx`| Pagination (`page`, `pageSize`) | Pagination | Bounds check | `page >= 1`, `pageSize <= 100` | Valid pagination parameters | `GET /api/admin/users?page=...` |
| **FLD-ADM-USR-07**| Admin / Users | `UserManagementTable.tsx`| Status Decision (`status`) | `select` | Active, Suspend, Ban | `z.enum(["ACTIVE", "SUSPENDED", "BANNED"])` | Valid new status | `PATCH /api/admin/users/[userId]` |
| **FLD-ADM-USR-08**| Admin / Users | `UserManagementTable.tsx`| Suspension Days (`durationDays`)| `number` | Positive integer | `z.number().int().positive().max(365).optional()` | Integer 1–365 | `PATCH /api/admin/users/[userId]` |
| **FLD-ADM-USR-09**| Admin / Users | `UserManagementTable.tsx`| Moderation Reason (`reason`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/users/[userId]` |
| **FLD-SADM-01** | Super Admin / Admins | `AdminManagementTable.tsx` | Search Query (`q`) | `text` | Free-text search | `firstName`, `lastName`, `email`, `anonymousId` | Safe search string | `GET /api/admin/admins?q=...` |
| **FLD-SADM-02** | Super Admin / Admins | `AdminManagementTable.tsx` | Role Filter (`role`) | Tabs | Admin role tabs | `z.enum(["ADMIN", "SUPER_ADMIN"])` | `"ADMIN"` or `"SUPER_ADMIN"` | `GET /api/admin/admins?role=...` |
| **FLD-SADM-03** | Super Admin / Admins | `AdminManagementTable.tsx` | Status Filter (`status`) | `select` | Active, Suspended | `z.enum(["ACTIVE", "SUSPENDED"])` | `"ACTIVE"` or `"SUSPENDED"` | `GET /api/admin/admins?status=...` |
| **FLD-SADM-04** | Super Admin / Provision | `CreateAdminModal.tsx` | First Name (`firstName`) | `text` | `required` | `z.string().trim().min(1).max(50)` | 1–50 characters, trimmed | `POST /api/admin/admins` |
| **FLD-SADM-05** | Super Admin / Provision | `CreateAdminModal.tsx` | Last Name (`lastName`) | `text` | `required` | `z.string().trim().min(1).max(50)` | 1–50 characters, trimmed | `POST /api/admin/admins` |
| **FLD-SADM-06** | Super Admin / Provision | `CreateAdminModal.tsx` | Email Address (`email`) | `email` | `required`, HTML5 email | `z.string().trim().email().toLowerCase()` | Valid email, unique across accounts | `POST /api/admin/admins` |
| **FLD-SADM-07** | Super Admin / Provision | `CreateAdminModal.tsx` | Contact Info (`contactInfo`) | `text` | Optional | `z.string().trim().max(100).optional().nullable()` | Max 100 characters | `POST /api/admin/admins` |
| **FLD-SADM-08** | Super Admin / Status | `AdminManagementTable.tsx` | Admin Status (`status`) | `select` | Active, Suspended | `z.enum(["ACTIVE", "SUSPENDED"])` + self-protection | Cannot suspend own account or Super Admin | `PATCH /api/admin/admins/[adminId]` |
| **FLD-SADM-09** | Super Admin / Status | `AdminManagementTable.tsx` | Status Reason (`reason`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/admins/[adminId]` |
| **FLD-AVTM-01** | Admin / Avatar Mod | `UserAvatarModerationCard.tsx`| Avatar Action (`action`) | Button/Action | Warn, Remove, Lock, Unlock | `z.enum(["WARN", "REMOVE", "LOCK", "UNLOCK"])` | Valid action enum | `POST /api/admin/users/[userId]/avatar-action` |
| **FLD-AVTM-02** | Admin / Avatar Mod | `UserAvatarModerationCard.tsx`| Action Reason (`reason`) | `textarea` | Required if WARN, max 500 | `z.string().trim().max(500)` + refinement (required if WARN) | Max 500 chars, required for warning | `POST /api/admin/users/[userId]/avatar-action` |
| **FLD-ADM-CLS-01**| Admin / Classes | `ClassModerationTable.tsx`| Search Query (`q`) | `text` | Code, subject, tutor | Safe search query in Prisma | Safe search string | `GET /api/admin/classes?q=...` |
| **FLD-ADM-CLS-02**| Admin / Classes | `ClassModerationTable.tsx`| Subject Filter (`subject`) | `select` | Catalog slugs | Filter by subject in DB | Valid subject slug | `GET /api/admin/classes?subject=...` |
| **FLD-ADM-CLS-03**| Admin / Classes | `ClassModerationTable.tsx`| Status Filter (`status`) | `select` | Class statuses | Filter by status in DB | Valid ClassStatus enum | `GET /api/admin/classes?status=...` |
| **FLD-ADM-CLS-04**| Admin / Classes | `ClassModerationTable.tsx`| Moderation Status (`status`)| Button/Select | Suspend, Ban, Reinstate | `z.enum(["SCHEDULED", "SUSPENDED", "BANNED"])` | Valid moderated status | `PATCH /api/admin/classes/[classId]` |
| **FLD-ADM-CLS-05**| Admin / Classes | `ClassModerationTable.tsx`| Suspension Days (`durationDays`)| `number` | Positive integer | `z.number().int().positive().max(365).optional()` | Integer 1–365 | `PATCH /api/admin/classes/[classId]` |
| **FLD-ADM-CLS-06**| Admin / Classes | `ClassModerationTable.tsx`| Moderation Reason (`reason`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/classes/[classId]` |
| **FLD-ADM-CLS-07**| Admin / Class Rec | `RecommendClassForm.tsx` | Learner ID (`learnerId`) | Autocomplete | Learner search select | `z.string().min(1)` + exists check | Valid Learner User ID | `POST /api/admin/classes/[classId]/recommendations` |
| **FLD-ADM-CLS-08**| Admin / Class Rec | `RecommendClassForm.tsx` | Recommendation Note (`note`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `POST /api/admin/classes/[classId]/recommendations` |
| **FLD-ADM-APL-01**| Admin / Appeals | `ClassAppealTable.tsx` | Appeal Decision (`decision`) | Button/Select | Approve or Reject | `z.enum(["APPROVE", "REJECT"])` | Must be `"APPROVE"` or `"REJECT"` | `PATCH /api/admin/class-appeals/[appealId]` |
| **FLD-ADM-APL-02**| Admin / Appeals | `ClassAppealTable.tsx` | Review Note (`reviewNote`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/class-appeals/[appealId]` |
| **FLD-ADM-REP-01**| Admin / Reports | `AbuseReportTable.tsx` | Report Decision (`decision`) | Button/Select | Resolve or Dismiss | `z.enum(["RESOLVE", "DISMISS"])` | Must be `"RESOLVE"` or `"DISMISS"` | `PATCH /api/admin/abuse-reports/[reportId]` |
| **FLD-ADM-REP-02**| Admin / Reports | `AbuseReportTable.tsx` | Resolution Note (`resolutionNote`)| `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/abuse-reports/[reportId]` |
| **FLD-ADM-REG-01**| Admin / Registrations| `RegistrationApprovalTable.tsx`| Decision (`decision`) | Button/Select | Approve or Decline | `z.enum(["APPROVE", "DECLINE"])` | Must be `"APPROVE"` or `"DECLINE"` | `PATCH /api/admin/registrations/[userId]` |
| **FLD-ADM-REG-02**| Admin / Registrations| `RegistrationApprovalTable.tsx`| Decision Reason (`reason`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/registrations/[userId]` |
| **FLD-ADM-TRQ-01**| Admin / Topic Reqs | `TopicRequestModerationTable.tsx`| Moderate Status (`status`) | Button/Select | Cancel or Reopen | `z.enum(["OPEN", "CANCELLED"])` | Must be `"OPEN"` or `"CANCELLED"` | `PATCH /api/admin/topic-requests/[id]` |
| **FLD-ADM-TRQ-02**| Admin / Topic Reqs | `TopicRequestModerationTable.tsx`| Action Reason (`reason`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/topic-requests/[id]` |
| **FLD-ADM-CRT-01**| Admin / Certs | `CertificationReviewTable.tsx`| Review Decision (`status`) | Button/Select | Certified or Rejected | `z.enum(["CERTIFIED", "REJECTED"])` | Must be `"CERTIFIED"` or `"REJECTED"` | `PATCH /api/admin/certifications/[certificationId]` |
| **FLD-ADM-CRT-02**| Admin / Certs | `CertificationReviewTable.tsx`| Review Note (`reviewNote`) | `textarea` | `maxLength={500}` | `z.string().trim().max(500).optional()` | Max 500 chars | `PATCH /api/admin/certifications/[certificationId]` |
| **FLD-ADM-SET-01**| Admin / Settings | `PlatformSettingsForm.tsx` | Setting Key (`key`) | Toggle identifier | Whitelisted toggle keys | `z.enum([...whitelistedSettingKeys])` | Valid system toggle key | `PATCH /api/admin/settings` |
| **FLD-ADM-SET-02**| Admin / Settings | `PlatformSettingsForm.tsx` | Boolean Value (`value`) | Toggle switch | Boolean state | `z.boolean()` | Strict boolean `true`/`false` | `PATCH /api/admin/settings` |
| **FLD-ADM-SET-03**| Admin / Settings | `PlatformSettingsForm.tsx` | Profile Pic Requirement (`value`)| `select` | Requirement levels | `z.enum(["OPTIONAL", "TUTORS_ONLY", "ALL_USERS"])` | Valid policy string | `PATCH /api/admin/settings` |
| **FLD-TX-01** | Admin / Subjects | `SubjectTopicManager.tsx` | Subject Name (`name`) | `text` | `required`, min 2, max 80 | `z.string().trim().min(2).max(80)` | 2–80 characters, unique | `POST/PATCH /api/admin/subjects` |
| **FLD-TX-02** | Admin / Subjects | `SubjectTopicManager.tsx` | Subject Slug (`slug`) | `text` | UPPER_SNAKE_CASE regex | `z.string().trim().min(2).max(40).regex(/^[A-Z][A-Z0-9_]*$/)` | 2–40 chars, uppercase snake case, unique | `POST /api/admin/subjects` |
| **FLD-TX-03** | Admin / Subjects | `SubjectTopicManager.tsx` | Subject Display Order (`order`)| `number` | min 0, max 999 | `z.number().int().min(0).max(999).optional()` | Integer 0–999 | `PATCH /api/admin/subjects/[id]` |
| **FLD-TX-04** | Admin / Subjects | `SubjectTopicManager.tsx` | Subject Active State (`active`)| Toggle/Checkbox | Boolean | `z.boolean().optional()` | Boolean | `PATCH /api/admin/subjects/[id]` |
| **FLD-TX-05** | Admin / Topics | `SubjectTopicManager.tsx` | Topic Name (`name`) | `text` | `required`, min 2, max 80 | `z.string().trim().min(2).max(80)` | 2–80 characters, unique per subject | `POST/PATCH /api/admin/subjects/[id]/topics` |
| **FLD-TX-06** | Admin / Topics | `SubjectTopicManager.tsx` | Topic Display Order (`order`) | `number` | min 0, max 999 | `z.number().int().min(0).max(999).optional()` | Integer 0–999 | `PATCH /api/admin/topics/[id]` |
| **FLD-TX-07** | Admin / Topics | `SubjectTopicManager.tsx` | Topic Active State (`active`) | Toggle/Checkbox | Boolean | `z.boolean().optional()` | Boolean | `PATCH /api/admin/topics/[id]` |
| **FLD-AUD-01** | Admin / Audit Log | `AuditLogTable.tsx` | Search Query (`q`) | `text` | Target, reason, admin | Filter in DB query | Safe search string | `GET /api/admin/audit-log?q=...` |
| **FLD-AUD-02** | Admin / Audit Log | `AuditLogTable.tsx` | Action Type Filter (`action`) | `select` | Whitelisted action keys | Prisma where filter | Valid action key | `GET /api/admin/audit-log?action=...` |
| **FLD-AUD-03** | Admin / Audit Log | `AuditLogTable.tsx` | Date From Filter (`dateFrom`) | `date` | HTML5 date | Date parser in route | Valid ISO/date string | `GET /api/admin/audit-log?dateFrom=...` |
| **FLD-AUD-04** | Admin / Audit Log | `AuditLogTable.tsx` | Date To Filter (`dateTo`) | `date` | HTML5 date | Date parser in route | Valid ISO/date string | `GET /api/admin/audit-log?dateTo=...` |
| **FLD-CBM-01** | Admin / Chatbot Miss | `ChatbotMissesTable.tsx` | Miss Search Query (`q`) | `text` | Free-text search | Message contains filter | Safe search string | `GET /api/admin/chatbot-misses?q=...` |
| **FLD-CBM-02** | Admin / Chatbot Miss | `ChatbotMissesTable.tsx` | Role Filter (`role`) | `select` | User roles | Filter by role | Valid Role enum | `GET /api/admin/chatbot-misses?role=...` |
| **FLD-CBOT-01**| Global / Chatbot | `ChatWidget.tsx` | Chat Message Input (`message`) | `text` | `required`, max 500 | `z.string().trim().min(1).max(500)` | 1–500 characters, trimmed | `POST /api/chatbot` |
| **FLD-GSR-01** | Global / Search | `GlobalSearch.tsx` | Quick Search Input (`q`) | `search` | min 2 characters | Length check `>= 2`, no max limit (**vulnerability VAL-011**) | String >= 2 characters | `GET /api/search?q=...` |
| **FLD-GSR-02** | Global / Search | `GlobalSearch.tsx` | Search Scope (`scope`) | `select` | Scope options | Whitelisted scope check, falls back to `"all"` | `"all"`, `"tutorCode"`, `"subject"`, `"topic"`, `"classCode"` | `GET /api/search?scope=...` |
| **FLD-NTF-01** | Global / Notifications| `NotificationList.tsx` | Read Notification IDs (`ids`) | Direct API | Array of IDs or empty | `Array.isArray(body?.ids)` (**vulnerability VAL-013**) | Array of valid notification IDs | `POST /api/notifications/read` |
| **FLD-DEV-01** | Dev / Factory | `DevDataFactory.tsx` | Factory Action (`action`) | `select` | Dev options | Hard-404 in production, switch statement | Whitelisted dev seed action | `POST /api/dev` |
| **FLD-DEV-02** | Dev / Factory | `DevDataFactory.tsx` | Seed Count (`count`) | `number` | min 1, max 50 | Clamped integer: `Math.min(max, Math.max(min, n))` | Clamped safe integer | `POST /api/dev` |

---

## Section 3: Detailed Test Checklist

### 3.1 Authentication & Entry Flows

#### Form: Login (`LoginForm.tsx` -> `POST /api/auth/[...nextauth]`)

##### Field: `FLD-AUTH-01` (Email Address)
- **TC-AUTH-01-01**
  - **Field ID:** FLD-AUTH-01
  - **Test Objective:** Verify login fails gracefully when email is omitted or empty.
  - **Preconditions:** None.
  - **Test Input / Steps:** Navigate to `/login`, leave email empty, enter valid password, submit form.
  - **Expected Result:** Form blocks submission with HTML5/custom validation "Please fill in all fields." No request sent to `/api/auth/[...nextauth]`.
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-01-02**
  - **Field ID:** FLD-AUTH-01
  - **Test Objective:** Verify login rejects malformed email formats.
  - **Preconditions:** None.
  - **Test Input / Steps:** Enter `plainaddress`, `user@`, `@domain.com`, `user@domain` in email field, submit.
  - **Expected Result:** Browser displays invalid email address format error message; form submission is halted.
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-01-03**
  - **Field ID:** FLD-AUTH-01
  - **Test Objective:** Verify backend returns generic invalid credentials error for non-existent email (prevent account enumeration).
  - **Preconditions:** Direct POST request to `/api/auth/callback/credentials`.
  - **Test Input / Steps:** Send credentials payload with non-existent email `ghost.user.999@example.com` and arbitrary password.
  - **Expected Result:** HTTP 401 response with generic message `Invalid email or password.` Response time matches dummy bcrypt hash calculation time.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-01-04**
  - **Field ID:** FLD-AUTH-01
  - **Test Objective:** Verify rate limiting triggers on repeated failed login attempts for an email.
  - **Preconditions:** Normal rate limiting active.
  - **Test Input / Steps:** Submit 11 consecutive incorrect login attempts for the same email within 10 minutes.
  - **Expected Result:** On 11th attempt, error returned: "Too many sign-in attempts. Please wait a few minutes and try again."
  - **Validation Layer:** Backend/API (Rate Limiting)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-AUTH-02` (Password)
- **TC-AUTH-02-01**
  - **Field ID:** FLD-AUTH-02
  - **Test Objective:** Verify login fails when password is empty or whitespace.
  - **Preconditions:** Enter valid email.
  - **Test Input / Steps:** Leave password empty or enter only spaces `"   "`, submit form.
  - **Expected Result:** Form displays "Please fill in all fields." Submission is prevented.
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-02-02**
  - **Field ID:** FLD-AUTH-02
  - **Test Objective:** Verify login rejects incorrect password for registered user.
  - **Preconditions:** Registered user exists.
  - **Test Input / Steps:** Enter correct registered email and incorrect password `wrongPassword123!`.
  - **Expected Result:** Error message displayed: `Invalid email or password.` No internal stack trace or bcrypt error exposed.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-02-03**
  - **Field ID:** FLD-AUTH-02
  - **Test Objective:** Verify account lockout / suspension redirection upon login with valid credentials.
  - **Preconditions:** Target user status set to `SUSPENDED` or `BANNED`.
  - **Test Input / Steps:** Submit correct email and password for a suspended account.
  - **Expected Result:** Displays "Your account has been suspended. Contact an administrator for details." or "Your account has been banned."
  - **Validation Layer:** Backend/API & Authorization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AUTH-02-04**
  - **Field ID:** FLD-AUTH-02
  - **Test Objective:** Verify redirection for unapproved/pending accounts upon valid login.
  - **Preconditions:** User status is `PENDING` with `requireRegistrationApproval = true`.
  - **Test Input / Steps:** Submit valid login credentials.
  - **Expected Result:** Frontend intercepts sentinel `ACCOUNT_PENDING` and redirects to `/pending-approval`.
  - **Validation Layer:** Frontend & Session
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Form: Registration (`RegisterForm.tsx` -> `POST /api/register`)

##### Fields: `FLD-REG-01` & `FLD-REG-02` (First Name & Last Name)
- **TC-REG-01-01**
  - **Field ID:** FLD-REG-01, FLD-REG-02
  - **Test Objective:** Verify required validation on first and last name.
  - **Preconditions:** Navigate to `/register/learner`.
  - **Test Input / Steps:** Leave `firstName` empty, fill other fields, submit. Repeat for `lastName`.
  - **Expected Result:** Client input highlights `required` attribute; direct API call returns HTTP 400 with "First name is required." / "Last name is required."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-01-02**
  - **Field ID:** FLD-REG-01, FLD-REG-02
  - **Test Objective:** Verify boundary length enforcement (50 characters maximum).
  - **Preconditions:** None.
  - **Test Input / Steps:** Send direct POST with 50 characters (`"A".repeat(50)`) and 51 characters (`"A".repeat(51)`).
  - **Expected Result:** 50 chars accepted. 51 chars rejected with HTTP 400: "First name cannot exceed 50 characters." / "Last name cannot exceed 50 characters."
  - **Validation Layer:** Backend/API (Zod)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-01-03**
  - **Field ID:** FLD-REG-01, FLD-REG-02
  - **Test Objective:** Verify whitespace trimming on names.
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit `"  Juan  "` and `"  Dela Cruz  "`.
  - **Expected Result:** Stored in database as `"Juan"` and `"Dela Cruz"` without leading/trailing whitespace.
  - **Validation Layer:** Backend/API Normalization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-01-04**
  - **Field ID:** FLD-REG-01, FLD-REG-02
  - **Test Objective:** Verify XSS / HTML script payload handling in names.
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit `<script>alert('xss')</script>` or `<img src=x onerror=alert(1)>`.
  - **Expected Result:** Accepted as literal text or sanitized; rendered in UI without script execution via React JSX automatic escaping.
  - **Validation Layer:** Security / Output Encoding
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-REG-03` (Registration Email)
- **TC-REG-03-01**
  - **Field ID:** FLD-REG-03
  - **Test Objective:** Verify email format validation and lowercase normalization.
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit `"TEST.USER@School.EDU.PH"`.
  - **Expected Result:** Accepted and persisted as `"test.user@school.edu.ph"`.
  - **Validation Layer:** Backend/API Normalization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-03-02**
  - **Field ID:** FLD-REG-03
  - **Test Objective:** Verify uniqueness collision rejection.
  - **Preconditions:** Account with `test@example.com` already exists.
  - **Test Input / Steps:** Submit new registration with `test@example.com`.
  - **Expected Result:** HTTP 409 Conflict: "An account with this email already exists."
  - **Validation Layer:** Backend/API & Database Unique Constraint
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-REG-04` (Grade Level)
- **TC-REG-04-01**
  - **Field ID:** FLD-REG-04
  - **Test Objective:** Verify rejection of invalid grade levels outside `GRADE_7`–`GRADE_12`.
  - **Preconditions:** Direct API POST request.
  - **Test Input / Steps:** Send `gradeLevel: "GRADE_6"`, `gradeLevel: "COLLEGE"`, `gradeLevel: 10`.
  - **Expected Result:** HTTP 400 Bad Request: "Invalid grade level."
  - **Validation Layer:** Backend/API (Zod Enum)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-REG-05` (Section)
- **TC-REG-05-01**
  - **Field ID:** FLD-REG-05
  - **Test Objective:** Verify section cannot be empty or whitespace only.
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit `section: ""` or `section: "   "`.
  - **Expected Result:** HTTP 400 Bad Request: "Section is required."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-05-02**
  - **Field ID:** FLD-REG-05
  - **Test Objective:** Verify database truncation / 500 safety when submitting oversized section string.
  - **Preconditions:** Direct API request to bypass UI.
  - **Test Input / Steps:** Submit `section: "A".repeat(500)` (exceeds MySQL default 191 VARCHAR limit).
  - **Expected Result:** **Target Bug (VAL-005):** Expect clean HTTP 400 error rather than unhandled MariaDB/MySQL 500 exception.
  - **Validation Layer:** Backend/API & Database Constraint
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed missing schema max() boundary in `commonRegisterSchema`.

##### Field: `FLD-REG-06` (Contact Info)
- **TC-REG-06-01**
  - **Field ID:** FLD-REG-06
  - **Test Objective:** Verify optional contact info allows empty string or null.
  - **Preconditions:** None.
  - **Test Input / Steps:** Register with `contactInfo: ""` or omit the field.
  - **Expected Result:** Registration succeeds; persisted as `null` in `users.contactInfo`.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-06-02**
  - **Field ID:** FLD-REG-06
  - **Test Objective:** Verify oversized contact info does not crash backend database.
  - **Preconditions:** Direct API request.
  - **Test Input / Steps:** Submit `contactInfo: "09171234567".repeat(30)` (330 characters).
  - **Expected Result:** **Target Bug (VAL-005):** Backend should cleanly reject with 400 instead of failing on DB write.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Missing max length constraint in `commonRegisterSchema`.

##### Fields: `FLD-REG-07` & `FLD-REG-08` (Password & Confirm Password)
- **TC-REG-07-01**
  - **Field ID:** FLD-REG-07, FLD-REG-08
  - **Test Objective:** Verify client-side rejection of mismatched passwords.
  - **Preconditions:** None.
  - **Test Input / Steps:** Enter `Password123!` and `Password456!`, submit.
  - **Expected Result:** Form blocks submission, displays inline error "Passwords do not match." No API request sent.
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-07-02**
  - **Field ID:** FLD-REG-07
  - **Test Objective:** Verify minimum length enforcement (8 characters).
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit password with 7 characters (`"Pass12!"`).
  - **Expected Result:** Rejected by frontend (`minLength={8}`) and backend HTTP 400: "Password must be at least 8 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-07-03**
  - **Field ID:** FLD-REG-07
  - **Test Objective:** Verify bcrypt maximum byte cap (72 bytes).
  - **Preconditions:** Direct API request.
  - **Test Input / Steps:** Submit password of 73 single-byte ASCII characters or multi-byte UTF-8 string exceeding 72 bytes.
  - **Expected Result:** HTTP 400 Bad Request: "Password must be 72 bytes or fewer."
  - **Validation Layer:** Backend/API (Zod refinement)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REG-07-04**
  - **Field ID:** FLD-REG-07
  - **Test Objective:** Verify blocklist of common predictable passwords.
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit passwords: `"password"`, `"12345678"`, `"qwertyuiop"`, `"welcome123"`.
  - **Expected Result:** HTTP 400 Bad Request: "That password is too common. Choose something less predictable."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-REG-09` (Parent/Guardian Consent)
- **TC-REG-09-01**
  - **Field ID:** FLD-REG-09
  - **Test Objective:** Verify parental consent checkbox cannot be bypassed.
  - **Preconditions:** Direct API request.
  - **Test Input / Steps:** Send `consentGiven: false` or omit `consentGiven`.
  - **Expected Result:** HTTP 400 Bad Request: "Parent/guardian consent is required."
  - **Validation Layer:** Backend/API (Zod literal)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.2 User Profile & Account Settings

#### Form: Profile Edit (`ProfileEditForm.tsx` -> `PATCH /api/learner/profile` and `PATCH /api/tutor/profile`)

##### Field: `FLD-PRF-01` / `FLD-PRFT-01` (Grade Level)
- **TC-PRF-01-01**
  - **Field ID:** FLD-PRF-01, FLD-PRFT-01
  - **Test Objective:** Verify user can update their grade level to a valid enum value.
  - **Preconditions:** Authenticated as Learner or Tutor.
  - **Test Input / Steps:** Select "Grade 11", submit.
  - **Expected Result:** Success banner "Profile updated."; DB updated to `GRADE_11`.
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-PRF-02` / `FLD-PRFT-02` (Section)
- **TC-PRF-02-01**
  - **Field ID:** FLD-PRF-02, FLD-PRFT-02
  - **Test Objective:** Verify section length enforcement (max 50 chars).
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Enter 50 characters (accepted) vs 51 characters (rejected).
  - **Expected Result:** 50 chars succeeds. 51 chars blocked by HTML `maxLength={50}` and API returns "Section cannot exceed 50 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-PRF-03` / `FLD-PRFT-03` (Contact Info)
- **TC-PRF-03-01**
  - **Field ID:** FLD-PRF-03, FLD-PRFT-03
  - **Test Objective:** Verify live character sanitization in contact input.
  - **Preconditions:** On profile edit page.
  - **Test Input / Steps:** Attempt to type letters or special symbols `abc!@#$`.
  - **Expected Result:** `sanitizeContactInput` regex strips all non-numeric/non-phone characters immediately.
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-PRF-03-02**
  - **Field ID:** FLD-PRF-03, FLD-PRFT-03
  - **Test Objective:** Verify backend Philippine mobile phone normalization (`normalizeContactInfo`).
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Submit `"0917 123 4567"`, `"+63 917 123 4567"`, `"9171234567"`.
  - **Expected Result:** Normalized to canonical E.164 `+639171234567` or standard Philippine mobile format and saved.
  - **Validation Layer:** Backend/API Normalization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-PRF-03-03**
  - **Field ID:** FLD-PRF-03, FLD-PRFT-03
  - **Test Objective:** Verify rejection of invalid phone number lengths.
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Submit `"09171234"` (too short) or `"09171234567890"` (too long).
  - **Expected Result:** HTTP 400 Bad Request with Philippine phone format error message.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-PRF-04` (Learner Recovery Email - Direct API)
- **TC-PRF-04-01**
  - **Field ID:** FLD-PRF-04
  - **Test Objective:** Verify recovery email updates via direct PATCH.
  - **Preconditions:** Authenticated as Learner.
  - **Test Input / Steps:** Send `PATCH /api/learner/profile` with `{ recoveryEmail: "parent.guardian@example.com" }`.
  - **Expected Result:** Profile returns updated `recoveryEmail: "parent.guardian@example.com"`.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-PRF-04-02**
  - **Field ID:** FLD-PRF-04
  - **Test Objective:** Verify recovery email collision risk when setting another user's email.
  - **Preconditions:** Learner A and Learner B exist.
  - **Test Input / Steps:** Learner A sets `recoveryEmail` equal to Learner B's login email.
  - **Expected Result:** **Target Vulnerability (VAL-003):** Verify whether system detects collision or permits hijacking password reset lookup.
  - **Validation Layer:** Business Logic & Security
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed issue VAL-003 in audit report.

---

#### Form: Change Password (`ChangePasswordForm.tsx` -> `POST /api/{role}/profile/password`)

##### Fields: `FLD-CPW-01`, `FLD-CPW-02`, `FLD-CPW-03`
- **TC-CPW-01-01**
  - **Field ID:** FLD-CPW-01
  - **Test Objective:** Verify current password must be correct to change password.
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Enter incorrect current password and valid new password.
  - **Expected Result:** HTTP 400 Bad Request: "Current password is incorrect."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CPW-02-01**
  - **Field ID:** FLD-CPW-02, FLD-CPW-03
  - **Test Objective:** Verify new password and confirmation match.
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Enter correct current password, new password `NewPassword123!`, confirmation `Different123!`.
  - **Expected Result:** Client blocks submission with "New passwords do not match."
  - **Validation Layer:** Frontend
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CPW-02-02**
  - **Field ID:** FLD-CPW-02
  - **Test Objective:** Verify new password meets `passwordField` requirements.
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Try new passwords: `"1234567"` (<8 chars), `"password"` (common), `">72 bytes string"`.
  - **Expected Result:** Rejected with corresponding validation message.
  - **Validation Layer:** Backend/API (Zod)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Component: Profile Picture (`ProfilePictureUpload.tsx` -> `POST /api/uploadthing`, `DELETE /api/user/profile-picture`)

##### Field: `FLD-AVT-01` (Avatar File Upload)
- **TC-AVT-01-01**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify rejection of oversized avatar images (>2MB).
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Select an image file with size 2.5MB.
  - **Expected Result:** Client displays "Image size must be less than 2MB." File is not sent to UploadThing.
  - **Validation Layer:** Frontend & UploadThing Middleware
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-01-02**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify rejection of unsupported file extensions and MIME types.
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Attempt to upload `payload.pdf`, `script.js`, `image.gif`, `icon.svg`.
  - **Expected Result:** Client optimizer / UploadThing rejects files not in `ALLOWED_EXTENSIONS` (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - **Validation Layer:** Client Optimizer & Server FileRouter
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-01-03**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify magic byte verification rejects disguised executables (e.g. `malware.exe` renamed to `avatar.jpg`).
  - **Preconditions:** File with JPEG extension but invalid binary header.
  - **Test Input / Steps:** Upload file with text/binary content starting with non-JPEG magic bytes.
  - **Expected Result:** `validateAndOptimizeImage` checks `MAGIC_BYTES` and throws "Invalid file format signature."
  - **Validation Layer:** Client Image Optimizer & Server Sharp Fallback
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-01-04**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify image decompression bomb protection.
  - **Preconditions:** Image with dimensions exceeding 16 megapixels (e.g., 5000x5000 px).
  - **Test Input / Steps:** Upload 16.5 megapixel image.
  - **Expected Result:** Rejected by `MAX_INPUT_PIXELS` guard before decompression.
  - **Validation Layer:** Client & Server Optimizer
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-01-05**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify EXIF and GPS geolocation metadata stripping.
  - **Preconditions:** Image containing EXIF GPS tags.
  - **Test Input / Steps:** Upload image with GPS coordinate metadata; inspect resulting URL/buffer.
  - **Expected Result:** Canvas export / Sharp optimization converts image to WebP with clean headers and no EXIF GPS tags.
  - **Validation Layer:** Image Processing Pipeline
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-01-06**
  - **Field ID:** FLD-AVT-01
  - **Test Objective:** Verify locked avatar cannot be updated.
  - **Preconditions:** User has `profilePictureLocked: true` set by admin.
  - **Test Input / Steps:** Attempt upload via UI or direct UploadThing middleware request.
  - **Expected Result:** UploadThing middleware throws UploadThingError: "Profile picture editing has been locked by an administrator."
  - **Validation Layer:** Backend/API Authorization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-AVT-02` (Remove Avatar Action)
- **TC-AVT-02-01**
  - **Field ID:** FLD-AVT-02
  - **Test Objective:** Verify self-service avatar deletion cleans up cloud storage.
  - **Preconditions:** User has active profile image.
  - **Test Input / Steps:** Click "Remove photo" -> `DELETE /api/user/profile-picture`.
  - **Expected Result:** HTTP 200; `image` and `imageKey` set to `null` in DB; file deleted from UploadThing.
  - **Validation Layer:** Backend/API & Cloud Storage
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVT-02-02**
  - **Field ID:** FLD-AVT-02
  - **Test Objective:** Verify locked user cannot delete avatar.
  - **Preconditions:** User has `profilePictureLocked: true`.
  - **Test Input / Steps:** Send `DELETE /api/user/profile-picture`.
  - **Expected Result:** HTTP 403 Forbidden: "Profile picture editing has been locked by an administrator."
  - **Validation Layer:** Backend/API Authorization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.3 Tutor Class & Session Scheduling

#### Form: New Class & Edit Class (`ClassScheduleFields.tsx`, `NewClassForm.tsx`, `EditClassForm.tsx`)

##### Field: `FLD-CLS-01` (Subject Area)
- **TC-CLS-01-01**
  - **Field ID:** FLD-CLS-01
  - **Test Objective:** Verify subject is required and must exist in taxonomy.
  - **Preconditions:** Authenticated as Tutor.
  - **Test Input / Steps:** Send `POST /api/tutor/classes` with `subject: "NON_EXISTENT_SUBJ"`.
  - **Expected Result:** HTTP 400 Bad Request: "Subject not found."
  - **Validation Layer:** Backend/API (Taxonomy check)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-01-02**
  - **Field ID:** FLD-CLS-01
  - **Test Objective:** Verify tutor certification requirement when platform setting `requireCertificationForClassCreation` is enabled.
  - **Preconditions:** Platform setting `requireCertificationForClassCreation: true`. Tutor has no certified topics in `MATHEMATICS`.
  - **Test Input / Steps:** Attempt to create class in `MATHEMATICS`.
  - **Expected Result:** HTTP 403 Forbidden: Tutor must be certified in the subject's topics before creating class.
  - **Validation Layer:** Business Rules / Authorization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-01-03**
  - **Field ID:** FLD-CLS-01, FLD-EC-01
  - **Test Objective:** Verify vulnerability VAL-001 (subject modification bypass in PATCH).
  - **Preconditions:** Tutor creates valid class in certified subject `SCIENCE`.
  - **Test Input / Steps:** Send direct `PATCH /api/tutor/classes/[classId]` with `{ subject: "MATHEMATICS" }` where tutor is NOT certified.
  - **Expected Result:** **Target Vulnerability (VAL-001):** Verify whether backend rejects uncertified subject modification.
  - **Validation Layer:** Backend/API (Patch validation)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed issue VAL-001 in audit report.

##### Field: `FLD-CLS-03` & `FLD-CLS-04` (Topics & Custom Topic)
- **TC-CLS-03-01**
  - **Field ID:** FLD-CLS-03
  - **Test Objective:** Verify topic array boundaries (minimum 1 topic, maximum 10 topics).
  - **Preconditions:** Authenticated as Tutor.
  - **Test Input / Steps:** Submit with 0 topics (rejected) and 11 topics (rejected).
  - **Expected Result:** 0 topics returns "Please select at least one topic." 11 topics returns "You can select up to 10 topics."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-04-01**
  - **Field ID:** FLD-CLS-04
  - **Test Objective:** Verify custom topic string normalization and length boundaries (2–60 chars).
  - **Preconditions:** Tutor adding custom topic.
  - **Test Input / Steps:** Enter 1 character `"A"` (blocked), enter `"algebra 1"` (normalized to `"Algebra 1"`), enter 61 characters (rejected).
  - **Expected Result:** Sub-2 char blocked; properly normalized to title case; >60 char rejected.
  - **Validation Layer:** Normalization & Zod
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-CLS-05` (Class Description)
- **TC-CLS-05-01**
  - **Field ID:** FLD-CLS-05
  - **Test Objective:** Verify maximum length constraint on description (500 chars).
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit description of 501 characters.
  - **Expected Result:** Client blocks input with `maxLength={500}`; API rejects with HTTP 400 "Description cannot exceed 500 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Fields: `FLD-CLS-06`, `FLD-CLS-07`, `FLD-CLS-08` (Session Creation)
- **TC-CLS-06-01**
  - **Field ID:** FLD-CLS-06
  - **Test Objective:** Verify session topic must be one of the selected class topics.
  - **Preconditions:** Class has topics `["Fractions", "Decimals"]`.
  - **Test Input / Steps:** Attempt to add session with topic `"Polynomials"`.
  - **Expected Result:** HTTP 400 Bad Request: "Session topic must be one of the class's topics."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-07-01**
  - **Field ID:** FLD-CLS-07
  - **Test Objective:** Verify overlapping session schedule rejection (`hasSessionOverlap`).
  - **Preconditions:** Tutor has existing session scheduled Monday 14:00–15:00.
  - **Test Input / Steps:** Attempt to schedule another session on Monday 14:30–15:30.
  - **Expected Result:** HTTP 400 Bad Request: "You already have another session scheduled at this time."
  - **Validation Layer:** Business Rules / Concurrency Check
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-08-01**
  - **Field ID:** FLD-CLS-08
  - **Test Objective:** Verify duration limits (15 min min, 240 min max).
  - **Preconditions:** Direct API request.
  - **Test Input / Steps:** Send `duration: 10` (rejected) and `duration: 250` (rejected).
  - **Expected Result:** HTTP 400 Bad Request: "Duration must be at least 15 minutes." / "Duration cannot exceed 4 hours."
  - **Validation Layer:** Backend/API (Zod)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Fields: `FLD-CLS-09`, `FLD-CLS-10`, `FLD-CLS-12` (Location & Meeting Link Cross-Field Rule)
- **TC-CLS-09-01**
  - **Field ID:** FLD-CLS-09, FLD-CLS-10, FLD-CLS-12
  - **Test Objective:** Verify cross-field requirement: must provide either location or meeting link (`hasLocationOrMeetingLink`).
  - **Preconditions:** Authenticated as Tutor.
  - **Test Input / Steps:** Leave `building`, `room`, and `meetingLink` empty, submit class.
  - **Expected Result:** Form and API reject submission: "Please provide a location (building/room) or a meeting link."
  - **Validation Layer:** Frontend & Backend/API refinement
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CLS-12-01**
  - **Field ID:** FLD-CLS-12
  - **Test Objective:** Verify meeting link format validation.
  - **Preconditions:** None.
  - **Test Input / Steps:** Enter non-URL string `"meet-google-com-room"`, `javascript:alert(1)`.
  - **Expected Result:** HTTP 400 Bad Request: "Invalid URL format."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

##### Field: `FLD-CLS-11` & `FLD-EC-06` (Class Capacity)
- **TC-CLS-11-01**
  - **Field ID:** FLD-CLS-11
  - **Test Objective:** Verify capacity boundary enforcement (1 to 10 students).
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit `maxStudents: 0`, `maxStudents: -1`, `maxStudents: 11`, `maxStudents: 3.5`.
  - **Expected Result:** Rejected by Zod schema: "Capacity must be at least 1 student." / "Capacity cannot exceed 10 students."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-EC-06-01**
  - **Field ID:** FLD-EC-06
  - **Test Objective:** Verify tutor cannot decrease class capacity below current enrolled learner count.
  - **Preconditions:** Class has 3 enrolled students.
  - **Test Input / Steps:** In `EditClassForm`, set `maxStudents: 2`, submit.
  - **Expected Result:** HTTP 400 Bad Request: "Capacity cannot be less than the number of enrolled students."
  - **Validation Layer:** Backend/API Business Rules
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.4 Learner Discovery, Matching & Topic Requests

#### Form: Auto Match (`MatchCriteriaFields.tsx` -> `POST /api/learner/match`)

##### Fields: `FLD-MAT-01` to `FLD-MAT-07`
- **TC-MAT-01-01**
  - **Field ID:** FLD-MAT-01, FLD-MAT-04
  - **Test Objective:** Verify subject and at least one topic are required for matching.
  - **Preconditions:** Authenticated as Learner.
  - **Test Input / Steps:** Submit match criteria with empty subject or empty topics array.
  - **Expected Result:** HTTP 400 Bad Request: "Subject is required." / "Please choose at least one topic."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-MAT-06-01**
  - **Field ID:** FLD-MAT-06, FLD-MAT-07
  - **Test Objective:** Verify time window chronological ordering (`startTime < endTime`).
  - **Preconditions:** Add time slot.
  - **Test Input / Steps:** Set `startTime: "16:00"` and `endTime: "14:00"`.
  - **Expected Result:** Rejected by `availabilitySlotSchema` refinement: "Start time must be before end time."
  - **Validation Layer:** Backend/API (Zod refinement)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-MAT-04-01**
  - **Field ID:** FLD-MAT-04
  - **Test Objective:** Verify matching rejects topics that do not belong to the selected subject.
  - **Preconditions:** Select subject `MATHEMATICS`.
  - **Test Input / Steps:** Submit `topics: ["Photosynthesis"]` (Science topic).
  - **Expected Result:** HTTP 400 Bad Request: "One or more topics are not valid for MATHEMATICS."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Form: Topic Request Creation & Management (`TopicRequestManager.tsx`, `RequestTopicButton.tsx`)

##### Fields: `FLD-TRQ-01` to `FLD-TRQ-07`
- **TC-TRQ-02-01**
  - **Field ID:** FLD-TRQ-02
  - **Test Objective:** Verify grade level is mandatory when persisting a topic request.
  - **Preconditions:** On topic request creation modal.
  - **Test Input / Steps:** Leave grade level unselected, submit.
  - **Expected Result:** Rejected: "Please choose a grade level."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-TRQ-05-01**
  - **Field ID:** FLD-TRQ-05
  - **Test Objective:** Verify note length constraint (max 500 chars).
  - **Preconditions:** None.
  - **Test Input / Steps:** Enter 501 characters in note textarea.
  - **Expected Result:** Client blocks input (`maxLength={500}`); backend rejects with "Note cannot exceed 500 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-TRQ-07-01**
  - **Field ID:** FLD-TRQ-07
  - **Test Objective:** Verify learner can only transition their own request to `CANCELLED`.
  - **Preconditions:** Request is `OPEN`.
  - **Test Input / Steps:** Learner cancels request.
  - **Expected Result:** Request status transitions to `CANCELLED`.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-TRQ-07-02**
  - **Field ID:** FLD-TRQ-07
  - **Test Objective:** Verify learner cannot arbitrarily transition request to `FULFILLED` or `ACCEPTED`.
  - **Preconditions:** Direct PATCH to `/api/learner/topic-requests/[id]`.
  - **Test Input / Steps:** Send `{ status: "FULFILLED" }`.
  - **Expected Result:** HTTP 400 Bad Request (rejected by `cancelTopicRequestSchema` which strictly requires `z.literal("CANCELLED")`).
  - **Validation Layer:** Backend/API & Authorization
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Workflow: Class Enrollment & Concurrency (`POST /api/classes/[classId]/enroll`)

##### Field: `FLD-ENR-01`
- **TC-ENR-01-01**
  - **Field ID:** FLD-ENR-01
  - **Test Objective:** Verify learner cannot double-enroll in the same class.
  - **Preconditions:** Learner already enrolled in class.
  - **Test Input / Steps:** Submit second enrollment request.
  - **Expected Result:** HTTP 409 Conflict: "You are already enrolled in this class."
  - **Validation Layer:** Database Unique Constraint & Route Check
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-ENR-01-02**
  - **Field ID:** FLD-ENR-01
  - **Test Objective:** Verify enrollment is rejected when class is at maximum capacity.
  - **Preconditions:** Class `maxStudents: 2`, currently has 2 enrolled students.
  - **Test Input / Steps:** Third learner attempts enrollment.
  - **Expected Result:** HTTP 409 Conflict: "This class is already full."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-ENR-01-03**
  - **Field ID:** FLD-ENR-01
  - **Test Objective:** Verify race condition safety during simultaneous concurrent enrollments (VAL-002).
  - **Preconditions:** Class has `maxStudents: 1` and 0 enrolled students.
  - **Test Input / Steps:** Dispatch two concurrent enrollment requests at the same millisecond.
  - **Expected Result:** **Target Vulnerability (VAL-002):** Exactly one enrollment succeeds (201) and the second is safely rejected (409).
  - **Validation Layer:** Database Transaction / Concurrency
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed race condition issue VAL-002 in audit report.

---

#### Form: Learner Abuse Reporting (`ReportButton.tsx` -> `POST /api/learner/reports`)

##### Fields: `FLD-REP-01` to `FLD-REP-04`
- **TC-REP-03-01**
  - **Field ID:** FLD-REP-03
  - **Test Objective:** Verify at least one violation category must be selected.
  - **Preconditions:** On report modal.
  - **Test Input / Steps:** Submit report with empty `violations: []`.
  - **Expected Result:** Submit button disabled; backend rejects with "Select at least one reason."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REP-04-01**
  - **Field ID:** FLD-REP-04
  - **Test Objective:** Verify minimum detail requirement (10 chars) when "OTHER" violation is selected.
  - **Preconditions:** Checkbox "OTHER" selected.
  - **Test Input / Steps:** Leave details empty or enter 9 characters `"bad tutor"`.
  - **Expected Result:** Rejected by `createReportSchema` refinement: "Describe the issue in at least 10 characters when you choose Other."
  - **Validation Layer:** Frontend & Backend/API refinement
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-REP-04-02**
  - **Field ID:** FLD-REP-04
  - **Test Objective:** Verify details maximum length (1000 characters).
  - **Preconditions:** None.
  - **Test Input / Steps:** Submit 1001 characters in details.
  - **Expected Result:** Rejected with HTTP 400: "Description cannot exceed 1000 characters."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.5 Assessments, Question Bank & Session Tests

#### Form: Question Bank Authoring (`QuestionFormModal.tsx`, `QuestionBankManager.tsx`)

##### Fields: `FLD-AQ-01` to `FLD-AQ-06` / `FLD-TQ-01` to `FLD-TQ-06`
- **TC-QST-03-01**
  - **Field ID:** FLD-AQ-03, FLD-TQ-03
  - **Test Objective:** Verify question prompt length boundaries (5 to 1000 characters).
  - **Preconditions:** Authenticated as Admin or Tutor.
  - **Test Input / Steps:** Submit prompt with 4 chars `"Why?"` (rejected) vs 1001 chars (rejected).
  - **Expected Result:** HTTP 400: "Question prompt must be at least 5 characters." / "Question prompt cannot exceed 1000 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-QST-05-01**
  - **Field ID:** FLD-AQ-05, FLD-TQ-05
  - **Test Objective:** Verify option count boundaries (2 to 6 options).
  - **Preconditions:** None.
  - **Test Input / Steps:** Provide 1 option (rejected) or 7 options (rejected).
  - **Expected Result:** HTTP 400: "Provide at least 2 options." / "Provide at most 6 options."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-QST-06-01**
  - **Field ID:** FLD-AQ-06, FLD-TQ-06
  - **Test Objective:** Verify exactly one option must be marked correct.
  - **Preconditions:** Form with 4 options.
  - **Test Input / Steps:** Mark 0 options correct, or mark 2 options correct.
  - **Expected Result:** Rejected by schema refinement: "Mark exactly one option correct."
  - **Validation Layer:** Frontend & Backend/API refinement
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-TQ-02-01**
  - **Field ID:** FLD-TQ-02
  - **Test Objective:** Verify tutor cannot assign arbitrary topics when editing a custom question (VAL-010).
  - **Preconditions:** Tutor authored question for class covering `Algebra`.
  - **Test Input / Steps:** Send `PATCH /api/tutor/questions/[questionId]` with `{ topic: "ArbitraryUncertifiedTopic" }`.
  - **Expected Result:** **Target Bug (VAL-010):** Verify whether backend permits updating topic to uncertified/unrelated topic.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed issue VAL-010 in audit report.

---

#### Form: Session Test Builder (`SessionTestBuilder.tsx`)

##### Fields: `FLD-STB-01` to `FLD-STB-04`
- **TC-STB-01-01**
  - **Field ID:** FLD-STB-01
  - **Test Objective:** Verify session test title boundaries (3 to 120 characters).
  - **Preconditions:** Authenticated as Tutor.
  - **Test Input / Steps:** Submit title `"Hi"` (rejected) vs 121 chars (rejected).
  - **Expected Result:** HTTP 400: "Title must be at least 3 characters." / "Title cannot exceed 120 characters."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-STB-03-01**
  - **Field ID:** FLD-STB-03
  - **Test Objective:** Verify assigned question count boundaries (1 to 50 questions).
  - **Preconditions:** Test in DRAFT status.
  - **Test Input / Steps:** Send `PUT .../questions` with `questionIds: []` (0 questions).
  - **Expected Result:** HTTP 400 Bad Request: "A test needs at least one question."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-STB-04-01**
  - **Field ID:** FLD-STB-04
  - **Test Objective:** Verify tutor cannot modify questions once test status is PUBLISHED or CLOSED.
  - **Preconditions:** Test status is `PUBLISHED`.
  - **Test Input / Steps:** Send `PUT .../questions` to alter test question order or items.
  - **Expected Result:** HTTP 409 Conflict: "Published tests cannot be modified."
  - **Validation Layer:** Business Rules & Immutability
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.6 Administrator & Super Admin Governance

#### Form: Super Admin Account Delegation (`CreateAdminModal.tsx`, `AdminManagementTable.tsx`)

##### Fields: `FLD-SADM-04` to `FLD-SADM-09`
- **TC-SADM-04-01**
  - **Field ID:** FLD-SADM-04, FLD-SADM-05, FLD-SADM-06
  - **Test Objective:** Verify non-Super Admin cannot access administrative provisioning endpoint.
  - **Preconditions:** Authenticated as standard `ADMIN`, `STUDENT_TUTOR`, or `STUDENT_LEARNER`.
  - **Test Input / Steps:** Send `POST /api/admin/admins` with valid admin creation payload.
  - **Expected Result:** HTTP 403 Forbidden: "Forbidden. Super Admin access required."
  - **Validation Layer:** Authorization Guard (`requireSuperAdminSession`)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-SADM-06-01**
  - **Field ID:** FLD-SADM-06
  - **Test Objective:** Verify duplicate account rejection across primary and recovery emails when provisioning admin.
  - **Preconditions:** User exists with email `test.admin@school.ph`.
  - **Test Input / Steps:** Super Admin attempts to provision new admin with `test.admin@school.ph`.
  - **Expected Result:** HTTP 409 Conflict: "An account with this email address already exists."
  - **Validation Layer:** Backend/API & Business Rules
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-SADM-08-01**
  - **Field ID:** FLD-SADM-08
  - **Test Objective:** Verify Super Admin self-protection rule (cannot suspend own account).
  - **Preconditions:** Authenticated as Super Admin.
  - **Test Input / Steps:** Send `PATCH /api/admin/admins/[ownId]` with `{ status: "SUSPENDED" }`.
  - **Expected Result:** HTTP 400 Bad Request: "You cannot suspend or modify your own account status."
  - **Validation Layer:** Business Logic Guard
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Form: User Moderation & Status (`UserManagementTable.tsx` -> `PATCH /api/admin/users/[userId]`)

##### Fields: `FLD-ADM-USR-07` to `FLD-ADM-USR-09`
- **TC-USR-07-01**
  - **Field ID:** FLD-ADM-USR-07
  - **Test Objective:** Verify allowed account status transitions (`ACTIVE`, `SUSPENDED`, `BANNED`).
  - **Preconditions:** Authenticated as Admin.
  - **Test Input / Steps:** Send `PATCH /api/admin/users/[userId]` with `status: "INVALID_STATUS"`.
  - **Expected Result:** HTTP 400 Bad Request: "Invalid account status."
  - **Validation Layer:** Backend/API (Zod Enum)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-USR-08-01**
  - **Field ID:** FLD-ADM-USR-08
  - **Test Objective:** Verify suspension duration boundaries (positive integer, max 365 days).
  - **Preconditions:** Authenticated as Admin.
  - **Test Input / Steps:** Submit `durationDays: 0` (rejected), `durationDays: -5` (rejected), `durationDays: 366` (rejected).
  - **Expected Result:** Rejected by schema: "Duration cannot exceed 365 days."
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Form: User Avatar Moderation (`UserAvatarModerationCard.tsx` -> `POST /api/admin/users/[userId]/avatar-action`)

##### Fields: `FLD-AVTM-01`, `FLD-AVTM-02`
- **TC-AVTM-01-01**
  - **Field ID:** FLD-AVTM-01, FLD-AVTM-02
  - **Test Objective:** Verify warning action strictly requires a non-empty reason.
  - **Preconditions:** Authenticated as Admin.
  - **Test Input / Steps:** Submit `action: "WARN"` with empty `reason: ""`.
  - **Expected Result:** Rejected by refinement: "A warning reason is required."
  - **Validation Layer:** Frontend & Backend/API refinement
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-AVTM-01-02**
  - **Field ID:** FLD-AVTM-01
  - **Test Objective:** Verify `REMOVE` action completely strips avatar and purges cloud storage file.
  - **Preconditions:** User has active avatar.
  - **Test Input / Steps:** Submit `action: "REMOVE"`.
  - **Expected Result:** HTTP 200; `image` set to null; file key deleted via UploadThing UTApi.
  - **Validation Layer:** Backend/API & Cloud Storage
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Form: Subject & Topic Taxonomy (`SubjectTopicManager.tsx`)

##### Fields: `FLD-TX-01` & `FLD-TX-02` (Subject Name & Slug)
- **TC-TX-01-01**
  - **Field ID:** FLD-TX-01
  - **Test Objective:** Verify subject name length constraints (2 to 80 chars).
  - **Preconditions:** Authenticated as Admin.
  - **Test Input / Steps:** Submit name `"A"` (rejected) vs 81 characters (rejected).
  - **Expected Result:** HTTP 400: "Name must be at least 2 characters." / "Name is too long."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-TX-02-01**
  - **Field ID:** FLD-TX-02
  - **Test Objective:** Verify slug format validation (`UPPER_SNAKE_CASE`).
  - **Preconditions:** Authenticated as Admin.
  - **Test Input / Steps:** Submit slugs: `"math"`, `"math-algebra"`, `"Math_Algebra"`, `"1_MATH"`.
  - **Expected Result:** Rejected with "Slug must be UPPER_SNAKE_CASE (letters, digits, underscores)." Only uppercase starting with a letter accepted (e.g., `"ADVANCED_MATH"`).
  - **Validation Layer:** Backend/API (Regex)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

### 3.7 Global Components & Auxiliary APIs

#### Component: Chatbot Widget (`ChatWidget.tsx` -> `POST /api/chatbot`)

##### Field: `FLD-CBOT-01` (Chatbot Message)
- **TC-CBOT-01-01**
  - **Field ID:** FLD-CBOT-01
  - **Test Objective:** Verify empty message rejection.
  - **Preconditions:** Chatbot enabled.
  - **Test Input / Steps:** Submit empty string `""` or whitespace `"   "`.
  - **Expected Result:** Form blocks submission; API rejects with "Type a message first."
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CBOT-01-02**
  - **Field ID:** FLD-CBOT-01
  - **Test Objective:** Verify maximum length constraint (500 characters).
  - **Preconditions:** Chatbot enabled.
  - **Test Input / Steps:** Submit 501 characters.
  - **Expected Result:** HTTP 400 Bad Request: "Message cannot exceed 500 characters."
  - **Validation Layer:** Backend/API (Zod)
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-CBOT-01-03**
  - **Field ID:** FLD-CBOT-01
  - **Test Objective:** Verify chatbot gate when platform setting `chatbotEnabled: false`.
  - **Preconditions:** Admin sets `chatbotEnabled = false`.
  - **Test Input / Steps:** Send `POST /api/chatbot` with valid message.
  - **Expected Result:** HTTP 403 Forbidden: "The chatbot is currently disabled."
  - **Validation Layer:** Feature Flag / Governance
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.

---

#### Component: Global Search (`GlobalSearch.tsx` -> `GET /api/search`)

##### Fields: `FLD-GSR-01`, `FLD-GSR-02`
- **TC-GSR-01-01**
  - **Field ID:** FLD-GSR-01
  - **Test Objective:** Verify minimum search query length (2 characters).
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Enter 1 character `"a"`.
  - **Expected Result:** Frontend debounces and returns empty groups; API returns `{ groups: [] }` without querying database.
  - **Validation Layer:** Frontend & Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Pending execution.
- **TC-GSR-01-02**
  - **Field ID:** FLD-GSR-01
  - **Test Objective:** Verify handling of extremely long search strings (VAL-011).
  - **Preconditions:** Authenticated.
  - **Test Input / Steps:** Send `GET /api/search?q="A".repeat(10000)`.
  - **Expected Result:** **Target Bug (VAL-011):** Expect clean rejection rather than excessive memory/CPU consumption across multiple regexes and LIKE queries.
  - **Validation Layer:** Backend/API
  - **Test Status:** `[ ] Not tested`
  - **Actual Result / Notes:** Confirmed issue VAL-011 in audit report.

---

## Section 4: API and Direct-Request Tests

These test cases directly bypass client-side JavaScript, forms, and browser sanitizers by dispatching raw HTTP requests.

### 4.1 Authentication Bypass and Registration Payload Tampering

- **TC-API-01: Injection of Unwhitelisted Properties at Registration**
  - **Endpoint:** `POST /api/register`
  - **Method:** `POST`
  - **Auth Requirement:** Unauthenticated
  - **Test Payload:**
    ```json
    {
      "type": "LEARNER",
      "firstName": "Attacker",
      "lastName": "User",
      "email": "attacker@example.com",
      "password": "ValidPassword123!",
      "gradeLevel": "GRADE_10",
      "section": "Rizal",
      "consentGiven": true,
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "emailVerifiedAt": "2026-10-18T00:00:00.000Z"
    }
    ```
  - **Expected Result:** HTTP 201 Created, but protected fields (`role`, `status`, `emailVerifiedAt`) are completely ignored. Account created strictly with `role: "STUDENT_LEARNER"`, `status: "ACTIVE"` (or `PENDING` if approval required), and `emailVerifiedAt: null`.

- **TC-API-02: Non-JSON / Malformed JSON Body Crash Probe**
  - **Endpoint:** `POST /api/register`, `PATCH /api/learner/profile`, `POST /api/chatbot`
  - **Method:** `POST` / `PATCH`
  - **Auth Requirement:** Corresponding role
  - **Test Payload:** Raw string `"{ broken_json: "` with `Content-Type: application/json`
  - **Expected Result:** Clean HTTP 400 Bad Request error. No uncaught `SyntaxError: Unexpected token` yielding HTTP 500.

- **TC-API-03: Subject Certification Bypass via Class PATCH (VAL-001)**
  - **Endpoint:** `PATCH /api/tutor/classes/[classId]`
  - **Method:** `PATCH`
  - **Auth Requirement:** Authenticated as Tutor owning the class
  - **Test Payload:**
    ```json
    {
      "subject": "UNCERTIFIED_SUBJECT"
    }
    ```
  - **Expected Result:** **Confirmed Gap (VAL-001):** Currently, the route fails to call `subjectExists` and does not check `requireCertificationForClassCreation`. Backend must be hardened to return HTTP 400/403.

- **TC-API-04: Unbounded Batch Array in Notifications Read (VAL-013)**
  - **Endpoint:** `POST /api/notifications/read`
  - **Method:** `POST`
  - **Auth Requirement:** Authenticated user
  - **Test Payload:**
    ```json
    {
      "ids": ["notif_1", "notif_2", "... 50,000 strings ..."]
    }
    ```
  - **Expected Result:** **Target Finding (VAL-013):** Backend should cap array size (e.g. max 100 IDs) to prevent large memory overhead in Prisma `in:` query.

---

## Section 5: Security and Authorization Tests

### 5.1 Injection and Script Execution Test Matrix

| ID | Test Target | Attack Vector | Sample Harmless Payload | Expected Defense / Result | Status |
|---|---|---|---|---|---|
| **SEC-INJ-01** | First Name / Last Name | Stored XSS | `<b onmouseover=alert(1)>Test</b>` | Output safely encoded by React JSX; rendered as literal text | `[ ] Not tested` |
| **SEC-INJ-02** | Class Description | HTML Injection | `<iframe src="https://example.com"></iframe>` | Encoded as HTML entities; no DOM embedding | `[ ] Not tested` |
| **SEC-INJ-03** | Class Meeting Link | JavaScript URI | `javascript:alert(document.cookie)` | Zod `.url()` schema rejects non-HTTP(S) URIs with HTTP 400 | `[ ] Not tested` |
| **SEC-INJ-04** | Global Search `q` | SQL Injection Probe | `' OR '1'='1' --` / `"; DROP TABLE users; --` | Parameterized by Prisma ORM; treated as literal substring | `[ ] Not tested` |
| **SEC-INJ-05** | Chatbot Message | Prompt / Script Injection | `<script>fetch('/api/admin/users')</script>` | Sanitized text response; classifier treats as unknown intent | `[ ] Not tested` |
| **SEC-INJ-06** | Question Prompt / Option | Format Injection | `{{7*7}}` / `<% 7*7 %>` | Treated as string literal; no template evaluation | `[ ] Not tested` |

### 5.2 Privilege Escalation and IDOR (Broken Object-Level Authorization)

| ID | Endpoint | Unauthorized Action | Precondition | Expected Security Result | Status |
|---|---|---|---|---|---|
| **SEC-AUTH-01** | `POST /api/admin/admins` | Standard Admin tries to provision another Admin | Authenticated as standard `ADMIN` | HTTP 403 Forbidden: `requireSuperAdminSession` guard blocks action | `[ ] Not tested` |
| **SEC-AUTH-02** | `PATCH /api/tutor/classes/[classId]` | Tutor A modifies Class belonging to Tutor B | Authenticated as Tutor A; class belongs to Tutor B | HTTP 403 Forbidden: Ownership mismatch check blocks modification | `[ ] Not tested` |
| **SEC-AUTH-03** | `PATCH /api/learner/topic-requests/[id]` | Learner A cancels/edits Topic Request of Learner B | Authenticated as Learner A | HTTP 404 / 403: Request ownership verification prevents tampering | `[ ] Not tested` |
| **SEC-AUTH-04** | `DELETE /api/tutor/questions/[questionId]` | Tutor A deletes Question owned by Tutor B | Authenticated as Tutor A | HTTP 404 Question not found (scoped to `ownerTutorProfileId`) | `[ ] Not tested` |
| **SEC-AUTH-05** | `DELETE /api/user/profile-picture` | Learner attempts to delete avatar while locked | User has `profilePictureLocked: true` | HTTP 403 Forbidden: Administrative lock enforced | `[ ] Not tested` |
| **SEC-AUTH-06** | `POST /api/classes/[classId]/enroll` | Tutor attempts to enroll in a class | Authenticated as `STUDENT_TUTOR` | HTTP 401/403: Restricted strictly to `STUDENT_LEARNER` | `[ ] Not tested` |

### 5.3 File Upload Security Verification Matrix

| ID | Attack Scenario | Test Input / Technique | Expected Defense Mechanism | Status |
|---|---|---|---|---|
| **SEC-UPL-01** | Double Extension / Polyglot | `avatar.php.jpg` with valid JPEG header | UploadThing stores in cloud bucket with synthetic UUID keys, stripping original filename | `[ ] Not tested` |
| **SEC-UPL-02** | MIME Spoofing | Binary executable with `Content-Type: image/jpeg` | Client image optimizer checks `MAGIC_BYTES`; Server Sharp re-encodes buffer to WebP | `[ ] Not tested` |
| **SEC-UPL-03** | SVG Embedded Script | `avatar.svg` containing `<svg onload="alert(1)">` | Rejected: SVG is absent from `ALLOWED_MIME_TYPES` and `ALLOWED_EXTENSIONS` | `[ ] Not tested` |
| **SEC-UPL-04** | Pixel Flood Decompression Bomb | 20,000 x 20,000 px PNG with minimal compressed size | `MAX_INPUT_PIXELS` (16,000,000) check aborts decompression before allocation | `[ ] Not tested` |
| **SEC-UPL-05** | Cloud Storage Key Traversal | Key containing `../../etc/passwd` | UploadThing server SDK manages keys; no local filesystem path concatenation | `[ ] Not tested` |

---

## Section 6: Validation Gaps and Risks

### 6.1 Confirmed High-Priority Issues

1. **Class Subject Modification Bypass (`VAL-001` - High Risk)**
   - **File:** `src/app/api/tutor/classes/[classId]/route.ts` (lines 68–70)
   - **Finding:** When processing `PATCH /api/tutor/classes/[classId]`, the handler extracts `subject: rawSubject` from `classDetailsSchema.partial().safeParse(body)`. It directly updates `TutorClass.subject` without verifying that the subject exists in `Subject` taxonomy (`subjectExists`) and without verifying that the tutor holds certification in the target subject (`requireCertificationForClassCreation`).
   - **Impact:** A tutor can create a class under an approved subject, pass all gates, and subsequently reassign the class to an arbitrary or uncertified subject area.

2. **Concurrent Enrollment Capacity Oversubscription Race Condition (`VAL-002` - High Risk)**
   - **File:** `src/app/api/classes/[classId]/enroll/route.ts` (lines 53–58)
   - **Finding:** The capacity check `existingClass._count.enrollments >= existingClass.maxStudents` is executed in a read query *outside* and *before* the atomic `prisma.$transaction`.
   - **Impact:** When two learners simultaneously enroll in a class with 1 available slot, both read queries see available capacity and proceed to insert enrollments in the transaction, oversubscribing the class beyond `maxStudents`.

3. **Recovery Email Collision Risk in Password Reset (`VAL-003` - Medium Risk)**
   - **File:** `src/app/api/learner/profile/route.ts` (line 39) & `src/app/api/auth/forgot-password/route.ts`
   - **Finding:** `recoveryEmail` is set in learner profiles without email ownership verification or uniqueness enforcement. The password reset route searches for users via `prisma.user.findFirst({ where: { OR: [{ email }, { recoveryEmail: email }] } })`.
   - **Impact:** If multiple accounts have the same recovery email address, `findFirst` non-deterministically resets whichever account MariaDB indexes first.

4. **Missing Maximum Length Constraints on Registration Strings (`VAL-005` - Medium Risk)**
   - **File:** `src/lib/validations/auth.ts` (lines 35–36)
   - **Finding:** `section` has `min(1)` with no `.max()`, and `contactInfo` has no `.max()` in `commonRegisterSchema`.
   - **Impact:** Sending strings exceeding MariaDB/MySQL's default `VARCHAR(191)` causes an unhandled database exception and HTTP 500 error, exposing internal error details when debugging is active.

5. **Arbitrary Topic Assignment in Tutor Custom Question Update (`VAL-010` - Low Risk)**
   - **File:** `src/app/api/tutor/questions/[questionId]/route.ts` (line 74)
   - **Finding:** In `PATCH /api/tutor/questions/[questionId]`, `topic` can be updated without verifying that the new topic belongs to the class's topics or the active subject catalog.

6. **Unbounded Query Parameters in Global Search (`VAL-011` - Low Risk)**
   - **File:** `src/app/api/search/route.ts` (line 81)
   - **Finding:** The query parameter `q` is checked for minimum length (`q.length >= 2`), but imposes no upper length boundary.

7. **Unbounded Batch Array in Notification Read Route (`VAL-013` - Informational)**
   - **File:** `src/app/api/notifications/read/route.ts` (line 17)
   - **Finding:** The request payload `{ ids: string[] }` is not capped by length or validated against a Zod schema.

### 6.2 Areas Requiring Specification Clarification

- **Item CLAR-01 (Recovery Email Parity):** Should tutors be permitted to set a recovery email, or is recovery email intentionally restricted to learners?
- **Item CLAR-02 (Registration Recovery Email):** Should the registration UI expose a recovery email field, or should `recoveryEmail` be completely removed from `commonRegisterSchema`?
- **Item CLAR-03 (Meeting Link Privacy Guard):** Should meeting links be restricted to verified school video conferencing domains (e.g. `@school.edu.ph` Google Meet / Teams) to avoid personal domain or PII leakage?

---

## Section 7: Execution Summary

### 7.1 Quantitative Checklist Totals

| Metric Category | Count | Status / Notes |
|---|:---:|---|
| **Discovered Input Fields** | **105** | 100% cataloged with unique IDs in Master Inventory |
| **Total Test Cases Documented** | **78** | Field-by-field, boundary, security, API & concurrency cases |
| **Cases Tested** | **0** | Code-inspection phase completed; execution pending |
| **Cases Passed** | **0** | Code-inspection phase completed; execution pending |
| **Cases Failed** | **0** | Code-inspection phase completed; execution pending |
| **Cases Blocked** | **0** | Code-inspection phase completed; execution pending |
| **Untested Cases** | **78** | Formatted with `[ ] Not tested` checkboxes for QA execution |
| **Confirmed Validation Gaps** | **7** | VAL-001, VAL-002, VAL-003, VAL-005, VAL-010, VAL-011, VAL-013 |
| **Items Requiring Clarification** | **3** | CLAR-01, CLAR-02, CLAR-03 |

> [!NOTE]
> All execution checkboxes in this document remain marked as `[ ] Not tested` in accordance with the strict static code-inspection and planning mandate. No runtime tests or test pass claims are made without live execution.
