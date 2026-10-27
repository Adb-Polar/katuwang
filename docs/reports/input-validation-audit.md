# Katuwang Input Validation Audit Report

**Date of Audit:** October 17, 2026  
**Audit Type:** Complete Static Codebase Inspection & Input Validation Analysis (Read-Only)  
**Target Repository:** Katuwang (Peer Tutoring & Academic Support Platform)  
**Auditor:** Automated Diagnostic Auditor (Google DeepMind Antigravity)  

---

## 1. Executive Summary

A comprehensive, read-only input validation audit was conducted across the Katuwang repository. The audit inspected frontend client-side validation, API route request parsing and authorization gating, Zod schema specifications, Prisma database schema constraints, business rules, multi-step state transitions, error handling mechanisms, and existing test coverage.

### 1.1 Overall Validation Risk Assessment

Katuwang demonstrates a strong baseline security architecture:
- **Consistent Schema-Driven Validation:** The vast majority of write routes employ Zod schemas located in `src/lib/validations/` for request payload validation.
- **ORM Parameterization:** Persistence operations use Prisma Client with MariaDB/MySQL, effectively eliminating traditional SQL injection vulnerabilities in application logic.
- **Role and Privacy Enforcement:** Route handlers universally inspect NextAuth sessions and enforce role-based access control (`ADMIN`, `STUDENT_TUTOR`, `STUDENT_LEARNER`), while respecting anonymized identifier mappings (`anonymousId`).
- **File Upload Security:** Avatar uploads route through UploadThing with file size (2MB) and MIME restrictions, paired with administrative moderation controls and account lockouts.

However, several critical and high-priority input validation gaps exist where validation logic is either bypassed in PATCH endpoints, exhibits race conditions during capacity checks, fails to guard against unbounded database inputs, or omits error handling on malformed JSON bodies.

### 1.2 Total Findings by Severity

| Severity | Count | Summary of Risk Areas |
|---|:---:|---|
| **Critical** | 0 | No unauthenticated remote code execution or full platform compromise identified. |
| **High** | 2 | Subject certification bypass via class PATCH (`VAL-001`); Enrollment capacity race condition leading to class oversubscription (`VAL-002`). |
| **Medium** | 4 | Unverified/non-unique recovery email collision in password reset (`VAL-003`); Unbounded memory consumption in personalized class browsing (`VAL-004`); Missing maximum length constraints on registration fields leading to unhandled MySQL errors (`VAL-005`); Uncaught JSON parsing exceptions yielding 500 errors across API endpoints (`VAL-006`). |
| **Low** | 5 | Silently discarded recovery email at registration (`VAL-007`); Missing rate limits on self-service password update endpoints (`VAL-008`); Client-side form input length and format discrepancies (`VAL-009`); Arbitrary topic assignment in tutor question update (`VAL-010`); Unbounded search query parameters (`VAL-011`). |
| **Informational** | 3 | Asymmetric recovery email support between tutor and learner profiles (`VAL-012`); Unbounded array payload in batch notification updates (`VAL-013`); Significant validation schema unit test coverage deficit (`VAL-014`). |
| **Total** | **14** | |

### 1.3 Most Important Confirmed Issues

1. **Class Subject Modification Bypass (`VAL-001` - High):** In `PATCH /api/tutor/classes/[classId]`, a tutor can change a class's `subject` slug without subject taxonomy validation (`subjectExists`) and without verifying that the tutor holds certification in the target subject (`requireCertificationForClassCreation`). This allows a tutor to create a class under an approved subject and subsequently reassign it to any uncertified or arbitrary subject.
2. **Concurrent Enrollment Oversubscription Race Condition (`VAL-002` - High):** In `POST /api/classes/[classId]/enroll`, class capacity (`_count.enrollments >= maxStudents`) is checked in an isolated read before the database transaction. Concurrent enrollment requests at `maxStudents - 1` can both pass validation and create enrollments, breaching class capacity invariants.
3. **Recovery Email Collision Risk (`VAL-003` - Medium):** In `PATCH /api/learner/profile`, `recoveryEmail` is updated without verifying email ownership or ensuring uniqueness across accounts. In `POST /api/auth/forgot-password`, user lookup uses `prisma.user.findFirst({ where: { OR: [{ email }, { recoveryEmail: email }] } })`, which can match an unintended account if multiple users configure identical recovery addresses.
4. **Unhandled Database Errors from Omitted Registration Field Lengths (`VAL-005` - Medium):** The registration validation schema `commonRegisterSchema` enforces `min(1)` for `section` and allows free-form `contactInfo`, but imposes no maximum length constraints. MySQL columns configured via Prisma default to `VARCHAR(191)`. Submitting strings exceeding 191 characters causes an unhandled database exception and HTTP 500 error.

---

## 2. Project and Audit Scope

### 2.1 Technology Stack Identified

- **Framework & Runtime:** Next.js 16.2.12 (App Router architecture), React 19.2.4, Node.js 20+ runtime.
- **Language:** TypeScript 5 with strict type checking.
- **Database & ORM:** MariaDB/MySQL accessed via Prisma ORM 7.8.0 (`@prisma/client`, `@prisma/adapter-mariadb`, `prisma`).
- **Validation Engine:** Zod 4.4.3.
- **Authentication:** NextAuth.js 4.24.15 (JWT session strategy, custom CredentialsProvider, bcryptjs cost 12).
- **Asset Storage & Uploads:** UploadThing 7.7.4 (`@uploadthing/react`, `uploadthing/server`).
- **Styling & UI:** Tailwind CSS 4, DaisyUI 5.6.13, Lucide React icons.
- **Test Framework:** Vitest 4.1.11.

### 2.2 Validation Libraries and Patterns Discovered

- **Centralized Zod Schemas:** Defined under `src/lib/validations/*.ts` representing input models for admin actions, assessments, authentication, availability, passwords, session tests, subjects, and topic certifications.
- **Route Validation Handlers:** API routes invoke `.safeParse()` on incoming JSON bodies.
- **Normalization Utilities:** Domain-specific normalizers in `src/lib/` (e.g., `normalizeContactInfo` for Philippine mobile numbers in `src/lib/contactInfo.ts`; `normalizeTopic` for topic casing in `src/lib/subjectTopics.ts`).
- **Sanitization & Escaping:** Standard React JSX DOM binding escapes output to prevent XSS. Prisma parameterizes SQL queries.

### 2.3 Inspected Scope

1. **Frontend Components & Forms:**
   - Auth forms: `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `VerifyEmailForm.tsx`, `ResendVerificationButton.tsx`.
   - Profile forms: `ProfileEditForm.tsx`, `ChangePasswordForm.tsx`, `ProfilePictureUpload.tsx`, `UserAvatar.tsx`.
   - Tutor forms: `NewClassForm.tsx`, `EditClassForm.tsx`, `ClassScheduleFields.tsx`, `AddSessionModal.tsx`, `AcceptRequestForm.tsx`, `ClassAppealCard.tsx`, `OtherTopicAssessment.tsx`, `AssessmentQuizRunner.tsx`.
   - Learner forms: `MatchFinder.tsx`, `MatchCriteriaFields.tsx`, `RequestTopicButton.tsx`, `TopicRequestManager.tsx`, `ReportButton.tsx`.
   - Quiz & Test components: `QuestionFormModal.tsx`, `SessionTestRunner.tsx`, `SessionTestBuilder.tsx`.
   - Admin management forms: `PlatformSettingsForm.tsx`, `UserAvatarModerationCard.tsx`, `UserManagementTable.tsx`, `TopicRequestModerationTable.tsx`.
   - Global UI components: `GlobalSearch.tsx`, `ChatWidget.tsx`, `RecommendClassForm.tsx`.
2. **Backend API Endpoints (84 routes across `src/app/api/`):**
   - Authentication & Identity: `/api/register`, `/api/auth/[...nextauth]`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/verify-email`, `/api/auth/resend-verification`.
   - Profile & Self-Service: `/api/learner/profile`, `/api/tutor/profile`, `/api/learner/profile/password`, `/api/tutor/profile/password`, `/api/admin/profile/password`, `/api/user/profile-picture`, `/api/uploadthing`.
   - Classes & Enrollment: `/api/classes`, `/api/classes/[classId]/enroll`, `/api/tutor/classes`, `/api/tutor/classes/[classId]`, `/api/tutor/classes/[classId]/sessions`, `/api/tutor/classes/[classId]/sessions/[sessionId]`, `/api/tutor/classes/[classId]/appeal`, `/api/admin/classes`, `/api/admin/classes/[classId]`, `/api/admin/classes/[classId]/recommendations`, `/api/admin/class-appeals`, `/api/admin/class-appeals/[appealId]`.
   - Assessments & Session Tests: `/api/tutor/assessments`, `/api/tutor/assessments/[attemptId]/submit`, `/api/tutor/questions`, `/api/tutor/questions/[questionId]`, `/api/tutor/question-bank`, `/api/tutor/question-requests`, `/api/tutor/classes/[classId]/sessions/[sessionId]/test`, `/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions`, `/api/tutor/classes/[classId]/sessions/[sessionId]/test/status`, `/api/tutor/classes/[classId]/sessions/[sessionId]/test/results`, `/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start`, `/api/learner/classes/[classId]/session-tests`, `/api/learner/session-test-attempts/[attemptId]/submit`, `/api/admin/assessment-questions`, `/api/admin/assessment-questions/[questionId]`, `/api/admin/assessment-configs`, `/api/admin/question-requests`, `/api/admin/question-requests/[requestId]`.
   - Matching & Topic Requests: `/api/learner/match`, `/api/learner/topic-requests`, `/api/learner/topic-requests/[id]`, `/api/tutor/topic-requests`, `/api/tutor/topic-requests/[id]/accept`, `/api/admin/topic-requests`, `/api/admin/topic-requests/[id]`.
   - Moderation, Abuse & Taxonomy: `/api/learner/reports`, `/api/admin/abuse-reports`, `/api/admin/abuse-reports/[reportId]`, `/api/admin/reports`, `/api/admin/users`, `/api/admin/users/[userId]`, `/api/admin/users/[userId]/avatar-action`, `/api/admin/registrations`, `/api/admin/registrations/[userId]`, `/api/admin/settings`, `/api/admin/subjects`, `/api/admin/subjects/[id]`, `/api/admin/subjects/[id]/topics`, `/api/admin/topics/[id]`, `/api/subjects`.
   - Utilities & Auxiliary: `/api/chatbot`, `/api/admin/chatbot-misses`, `/api/search`, `/api/notifications`, `/api/notifications/read`, `/api/health`, `/api/dev`.
3. **Database Schema & Constraints:**
   - `prisma/schema.prisma` models, relations, field constraints, unique indexes, and enums.
4. **Existing Test Coverage:**
   - Unit validation tests in `src/lib/validations/__tests__/`.
   - Route tests under `src/app/api/**/__tests__/`.
   - Helper unit tests in `src/lib/__tests__/`.

### 2.4 Areas Not Inspected and Limitations

- **External Cloud Storage Providers:** UploadThing cloud storage bucket configuration, CDN delivery settings, and remote retention policies were not directly tested via live API tokens.
- **Production SMTP Relay:** Real-world email delivery and SPF/DKIM validation were not verified on live servers.
- **Dynamic Database Mutations:** In adherence to the strict read-only audit protocol, no live penetration testing, active race exploitation, or database schema migration execution was performed.

---

## 3. Findings Summary

| ID | Severity | Category | Affected Area | Finding | Confidence |
|---|---|---|---|---|---|
| **VAL-001** | High | Authorization / Business Rules | `PATCH /api/tutor/classes/[classId]` | Subject can be modified without certification or taxonomy existence checks | Confirmed by code inspection |
| **VAL-002** | High | Concurrency / Data Integrity | `POST /api/classes/[classId]/enroll` | Capacity check outside transaction permits concurrent oversubscription | Confirmed by code inspection |
| **VAL-003** | Medium | Security / Account Recovery | `PATCH /api/learner/profile` & `/api/auth/forgot-password` | Non-unique, unverified recovery email allows account reset collisions | Confirmed by code inspection |
| **VAL-004** | Medium | Denial of Service / Resource Exhaustion | `GET /api/classes` | Personalized class browse query loads entire table without DB pagination | Confirmed by code inspection |
| **VAL-005** | Medium | Data Integrity / Server Errors | `POST /api/register` & `commonRegisterSchema` | Unbounded `section` and `contactInfo` lengths trigger MySQL 500 error | Confirmed by code inspection |
| **VAL-006** | Medium | Error Handling / API Robustness | Multiple API Routes (POST / PATCH) | Uncaught JSON body parse errors cause 500 status instead of 400 | Confirmed by code inspection |
| **VAL-007** | Low | Data Flow / Completeness | `POST /api/register` & `registerAccount` | `recoveryEmail` validated in registration schema but dropped before persistence | Confirmed by code inspection |
| **VAL-008** | Low | Security / Brute Force | `POST /api/{role}/profile/password` | Password change endpoints lack IP/user rate limiting | Confirmed by code inspection |
| **VAL-009** | Low | Frontend vs Backend Consistency | `RegisterForm.tsx` | Form inputs omit `maxLength` and phone formatting rules present in schema | Confirmed by code inspection |
| **VAL-010** | Low | Input Validation / Taxonomy | `PATCH /api/tutor/questions/[questionId]` | Custom question topic can be updated to arbitrary unvalidated strings | Confirmed by code inspection |
| **VAL-011** | Low | Performance / Query Hygiene | `GET /api/search`, `/api/classes`, `/api/admin/users` | Unbounded length for search parameter `q` | Confirmed by code inspection |
| **VAL-012** | Informational | Architectural Consistency | `PATCH /api/tutor/profile` | Recovery email cannot be updated on tutor profiles | Confirmed by code inspection |
| **VAL-013** | Informational | Input Validation / Batch Operations | `POST /api/notifications/read` | Array length and item types for notification IDs are unconstrained | Confirmed by code inspection |
| **VAL-014** | Informational | Test Coverage | `src/lib/validations/` | 14 out of 17 validation schema modules lack direct unit test suites | Confirmed by code inspection |

---

## 4. Detailed Findings

### VAL-001: Subject Can Be Modified Without Certification or Taxonomy Existence Checks
- **Severity:** High
- **Category:** Authorization / Business Rules
- **Affected Area:** `PATCH /api/tutor/classes/[classId]`
- **File & Line:** `src/app/api/tutor/classes/[classId]/route.ts#L68-L70`, `src/lib/validations/class.ts#L20-L66`
- **Current Behavior & Evidence:**
  When updating class details, `classDetailsSchema.partial()` parses the incoming payload:
  ```typescript
  // src/app/api/tutor/classes/[classId]/route.ts lines 68-70:
  const { topics: rawTopics, subject: rawSubject, ...updates } = result.data;
  const subjectUpdate = rawSubject !== undefined ? { subject: rawSubject } : {};
  ```
  In `POST /api/tutor/classes/route.ts#L113-L157`, subject creation strictly enforces `await subjectExists(subject)` and checks whether the tutor is certified for all topics if `requireCertificationForClassCreation` is active. In contrast, `PATCH /api/tutor/classes/[classId]` applies `subjectUpdate` directly into Prisma `tutorClass.update()` without:
  1. Verifying that `rawSubject` exists via `subjectExists(rawSubject)`.
  2. Verifying whether the tutor holds certifications for the new subject if `requireCertificationForClassCreation` is enabled.
  3. Validating that existing sessions or unchanged topics remain valid under the new subject.
- **Expected Behavior & Basis:** Classes should either have an immutable `subject` after creation (standard practice in course scheduling systems) or require the identical certification and taxonomy validation checks enforced during class creation.
- **Impact & Realistic Risk:** A tutor can create a class under an authorized subject (e.g., `MATH`) and subsequently send a direct `PATCH` request setting `subject: "ADVANCED_CHEMISTRY"` or arbitrary non-existent slugs. This bypasses certification restrictions and corrupts class taxonomy and search indexing.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Make `subject` immutable in `PATCH` requests by omitting `subject` from editable fields in `classDetailsSchema.partial().omit({ subject: true })`, or add explicit verification in the route:
  ```typescript
  if (rawSubject !== undefined) {
    if (!(await subjectExists(rawSubject))) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }
    // Re-verify topic certifications under the new subject...
  }
  ```
- **Suggested Regression Test:** Send `PATCH /api/tutor/classes/c1` with `{ subject: "NON_EXISTENT_SUBJECT" }` and assert that the endpoint returns `400 Bad Request` or `403 Forbidden`.

---

### VAL-002: Capacity Check Outside Transaction Permits Concurrent Oversubscription
- **Severity:** High
- **Category:** Concurrency / Data Integrity
- **Affected Area:** `POST /api/classes/[classId]/enroll`
- **File & Line:** `src/app/api/classes/[classId]/enroll/route.ts#L53-L58`, `L71-L90`
- **Current Behavior & Evidence:**
  In `src/app/api/classes/[classId]/enroll/route.ts`:
  ```typescript
  // lines 53-58:
  if (existingClass._count.enrollments >= existingClass.maxStudents) {
    return NextResponse.json({ error: "This class is already full." }, { status: 409 });
  }
  // lines 71-74:
  const enrollment = await prisma.$transaction(async (tx) => {
    const created = await tx.classEnrollment.create({
      data: { classId, learnerId: session.user.id },
    });
  ```
  The enrollment count check is evaluated outside the database transaction.
- **Expected Behavior & Basis:** Capacity constraints must be atomic. Two concurrent requests arriving when enrollment is `maxStudents - 1` should result in exactly one successful enrollment and one `409 Class is already full`.
- **Impact & Realistic Risk:** In popular classes with limited seating (e.g., 1-on-1 tutoring where `maxStudents = 1`), simultaneous enrollment clicks by two learners will allow both to enroll, breaking the 1-on-1 contract and corrupting tutor scheduling.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Move the enrollment count verification inside the Prisma transaction and query using transaction client `tx`, or execute an atomic conditional check / update:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const currentCount = await tx.classEnrollment.count({ where: { classId } });
    const targetClass = await tx.tutorClass.findUniqueOrThrow({
      where: { id: classId },
      select: { maxStudents: true },
    });
    if (currentCount >= targetClass.maxStudents) {
      throw new Error("CLASS_FULL");
    }
    return tx.classEnrollment.create({
      data: { classId, learnerId: session.user.id },
    });
  });
  ```
- **Suggested Regression Test:** Execute 5 concurrent `POST /api/classes/[classId]/enroll` requests from different learner sessions against a class with `maxStudents: 1`. Confirm that exactly 1 succeeds with HTTP 201 and 4 fail with HTTP 409.

---

### VAL-003: Non-Unique, Unverified Recovery Email Allows Account Reset Collisions
- **Severity:** Medium
- **Category:** Security / Account Recovery
- **Affected Area:** `PATCH /api/learner/profile` and `POST /api/auth/forgot-password`
- **File & Line:** `src/app/api/learner/profile/route.ts#L33-L42`, `src/app/api/auth/forgot-password/route.ts#L38-L41`, `prisma/schema.prisma#L22`
- **Current Behavior & Evidence:**
  In `prisma/schema.prisma`:
  ```prisma
  email         String  @unique
  recoveryEmail String?
  ```
  `recoveryEmail` is an unindexed, non-unique column. In `src/app/api/learner/profile/route.ts#L39`:
  ```typescript
  ...(recoveryEmail !== undefined ? { recoveryEmail: recoveryEmail || null } : {}),
  ```
  Any authenticated learner can set `recoveryEmail` to any arbitrary address without proof of ownership and without checking if that address is already used as a primary or recovery email by another account.
  When a user requests a reset in `src/app/api/auth/forgot-password/route.ts#L38-L41`:
  ```typescript
  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { recoveryEmail: email }] },
    select: { id: true, status: true },
  });
  ```
  Because `findFirst` is used without ordering or uniqueness guarantees, if User B configures User A's primary email as User B's recovery email, `findFirst` may return User B instead of User A.
- **Expected Behavior & Basis:** Password recovery emails should either require email verification prior to activation or at minimum enforce that a recovery email cannot collide with existing primary or recovery email addresses.
- **Impact & Realistic Risk:** Denial of password reset service or reset link confusion. If account lookup binds to the wrong user ID, password reset tokens are generated for the wrong account.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:**
  1. Add validation in `PATCH /api/learner/profile` verifying that `recoveryEmail` is not already used in `User.email` or `User.recoveryEmail`.
  2. In `POST /api/auth/forgot-password`, prioritize exact primary email matches over recovery email matches:
     ```typescript
     let user = await prisma.user.findUnique({ where: { email } });
     if (!user) {
       user = await prisma.user.findFirst({ where: { recoveryEmail: email } });
     }
     ```
- **Suggested Regression Test:** Create User A (`userA@example.com`) and User B. Set User B's recovery email to `userA@example.com`. Issue a forgot-password request for `userA@example.com` and verify that the token generated belongs strictly to User A.

---

### VAL-004: Personalized Class Browse Query Loads Entire Table Without DB Pagination
- **Severity:** Medium
- **Category:** Denial of Service / Resource Exhaustion
- **Affected Area:** `GET /api/classes`
- **File & Line:** `src/app/api/classes/route.ts#L108-L154`
- **Current Behavior & Evidence:**
  In `src/app/api/classes/route.ts`:
  ```typescript
  // line 108:
  const personalize = scope === "browse" && !hasFilters;
  // lines 145-151:
  prisma.tutorClass.findMany({
    where,
    include: learnerClassInclude(session.user.id),
    orderBy: { createdAt: "desc" },
    // Personalized browse ranks in JS, so it needs the full result set.
    ...(personalize ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
  })
  ```
  When a learner navigates to browse classes without explicit text or subject filters, `personalize` is set to `true`. This causes Prisma to fetch every browsable class in the database across all pages with full relational joins (`sessions`, `topics`, `enrollments`, `tutorProfile`). Ranking and pagination are then performed in memory (`rankBrowseClasses(...).slice(...)`).
- **Expected Behavior & Basis:** Production list endpoints must enforce database-level `take` (limit) caps to prevent memory exhaustion and runaway query times.
- **Impact & Realistic Risk:** As the platform grows to thousands of classes, every learner opening the default browse view causes Node.js to deserialize and process thousands of relational rows, leading to high garbage collection latency, CPU spikes, and potential Out-Of-Memory (OOM) crashes.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Apply a sane upper bound to personalized queries (e.g., `take: 100` or `take: 200`) or perform coarse filtering/scoring in the SQL query rather than pulling the unbounded table.
- **Suggested Regression Test:** Seed 1,000 browsable classes. Issue `GET /api/classes?scope=browse` and assert query execution plan and memory usage remain bounded.

---

### VAL-005: Unbounded `section` and `contactInfo` Lengths Trigger MySQL 500 Error
- **Severity:** Medium
- **Category:** Data Integrity / Server Errors
- **Affected Area:** `POST /api/register` & `commonRegisterSchema`
- **File & Line:** `src/lib/validations/auth.ts#L35-L36`, `prisma/schema.prisma#L25-L26`
- **Current Behavior & Evidence:**
  In `src/lib/validations/auth.ts`:
  ```typescript
  // lines 35-36:
  section: z.string().min(1, "Section is required.").trim(),
  contactInfo: z.string().trim().optional().or(z.literal("")),
  ```
  Neither `section` nor `contactInfo` has a `.max()` constraint in `commonRegisterSchema`.
  In `prisma/schema.prisma`:
  ```prisma
  section     String
  contactInfo String?
  ```
  In MySQL/MariaDB, Prisma `String` fields without `@db.Text` or `@db.VarChar(n)` default to `VARCHAR(191)`. Submitting a section name of 200 characters passes Zod validation but causes Prisma to throw a database error (`Value too long for column 'section'`), returning HTTP 500 to the user.
  In contrast, `src/lib/validations/profile.ts#L18` explicitly enforces `max(50)` for section and `max(200)` for contact info.
- **Expected Behavior & Basis:** Database field limits must be reflected in ingress validation schemas to reject invalid payloads at the boundary with HTTP 400.
- **Impact & Realistic Risk:** Malicious actors or users pasting unexpected strings will trigger unhandled server exceptions, cluttering application error logs and degrading availability.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Update `commonRegisterSchema` in `src/lib/validations/auth.ts`:
  ```typescript
  section: z.string().trim().min(1, "Section is required.").max(50, "Section cannot exceed 50 characters."),
  contactInfo: z.string().trim().max(100, "Contact info cannot exceed 100 characters.").optional().or(z.literal("")),
  ```
- **Suggested Regression Test:** Submit `POST /api/register` with `section: "A".repeat(200)`. Verify that the endpoint returns `400 Bad Request` with an appropriate validation message.

---

### VAL-006: Uncaught JSON Body Parse Errors Cause 500 Status Instead of 400
- **Severity:** Medium
- **Category:** Error Handling / API Robustness
- **Affected Area:** Multiple API Routes (e.g., `POST /api/register`, `POST /api/tutor/classes`, `PATCH /api/admin/settings`, `POST /api/classes/[classId]/enroll`)
- **File & Line:** `src/app/api/register/route.ts#L35`, `src/app/api/tutor/classes/route.ts#L102`, `src/app/api/admin/settings/route.ts#L53`, etc.
- **Current Behavior & Evidence:**
  In `src/app/api/register/route.ts#L35`:
  ```typescript
  const body = await req.json();
  ```
  If a client sends an empty body with `Content-Type: application/json` or sends malformed JSON (e.g. `{malformed`), Next.js `req.json()` throws a `SyntaxError: Unexpected end of JSON input`. Because this call is placed within the general route `try/catch` block, it is caught as an unexpected error:
  ```typescript
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
  ```
  In contrast, `src/app/api/chatbot/route.ts#L30` and `src/app/api/notifications/read/route.ts#L16` properly handle this with `await req.json().catch(() => ({}))`.
- **Expected Behavior & Basis:** Malformed client requests represent client-side errors and should respond with HTTP 400 Bad Request.
- **Impact & Realistic Risk:** Flawed client integrations or malformed network requests artificially elevate server 500 error metrics and trigger false-positive monitoring alerts.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Implement a consistent JSON parsing pattern across all mutation routes:
  ```typescript
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  ```
- **Suggested Regression Test:** Send `POST /api/register` with header `Content-Type: application/json` and raw body `{invalid`. Verify response is `400 Bad Request`.

---

### VAL-007: `recoveryEmail` Validated in Registration Schema but Dropped Before Persistence
- **Severity:** Low
- **Category:** Data Flow / Completeness
- **Affected Area:** `POST /api/register` & `registerAccount`
- **File & Line:** `src/lib/validations/auth.ts#L25-L31`, `src/app/api/register/route.ts#L47-L59`, `src/lib/registration.ts#L14-L29`
- **Current Behavior & Evidence:**
  `commonRegisterSchema` defines:
  ```typescript
  // src/lib/validations/auth.ts lines 25-31:
  recoveryEmail: z.string().trim().toLowerCase().pipe(z.string().email(...)).optional().or(z.literal("")),
  ```
  However, `src/app/api/register/route.ts#L47-L59` invokes `registerAccount` without passing `data.recoveryEmail`:
  ```typescript
  const account = await registerAccount({
    type: data.type,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    gradeLevel: data.gradeLevel,
    section: data.section,
    contactInfo: data.contactInfo || null,
    consentGiven: data.consentGiven,
    requireApproval,
    requireEmailVerification,
  });
  ```
  In `src/lib/registration.ts#L14-L29`, `RegisterAccountInput` does not accept `recoveryEmail`. As a result, any recovery email supplied during registration is validated and silently dropped.
- **Expected Behavior & Basis:** Fields accepted and validated by an API endpoint should be persisted or explicitly documented as not supported.
- **Impact & Realistic Risk:** If a client or mobile app submits `recoveryEmail` at signup expecting account recovery to function immediately, the user's account will be created without the recovery email, leading to failed password recovery attempts.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Pass `recoveryEmail: data.recoveryEmail || null` from `src/app/api/register/route.ts` into `registerAccount` and store it in `tx.user.create({ data: { ... } })`.
- **Suggested Regression Test:** Register a new user with `recoveryEmail: "recovery@example.com"`. Query the database and assert that `user.recoveryEmail === "recovery@example.com"`.

---

### VAL-008: Password Change Endpoints Lack Rate Limiting
- **Severity:** Low
- **Category:** Security / Brute Force
- **Affected Area:** `POST /api/learner/profile/password`, `POST /api/tutor/profile/password`, `POST /api/admin/profile/password`
- **File & Line:** `src/app/api/learner/profile/password/route.ts#L8-L43`, `src/app/api/tutor/profile/password/route.ts#L8-L43`, `src/app/api/admin/profile/password/route.ts#L8-L43`
- **Current Behavior & Evidence:**
  While public authentication endpoints (`/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/resend-verification`, `/api/register`, and credentials sign-in) implement rate limiting using `rateLimit()` from `src/lib/rateLimit.ts`, the authenticated self-service password update endpoints have no rate limiting applied.
- **Expected Behavior & Basis:** Sensitive credential change endpoints should be throttled to prevent automated current-password guessing attacks and avoid CPU starvation from rapid bcrypt hashing (cost factor 12).
- **Impact & Realistic Risk:** If an authenticated session is hijacked or left unattended, an attacker could attempt to brute-force the current password without tripping rate limit alarms.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Apply rate limiting to all three password update routes:
  ```typescript
  if (rateLimitEnabled()) {
    const limited = rateLimit(`change-password:user:${session.user.id}`, 5, 15 * MINUTE_MS);
    if (!limited.ok) return tooManyRequests(limited.retryAfter);
  }
  ```
- **Suggested Regression Test:** Send 10 consecutive incorrect password update requests within 1 minute from the same session and verify that subsequent requests return HTTP 429.

---

### VAL-009: Form Inputs Omit `maxLength` and Phone Formatting Rules Present in Schema
- **Severity:** Low
- **Category:** Frontend vs Backend Consistency
- **Affected Area:** `RegisterForm.tsx`
- **File & Line:** `src/components/auth/RegisterForm.tsx#L125-L203`
- **Current Behavior & Evidence:**
  In `src/components/auth/RegisterForm.tsx`:
  - `firstName` and `lastName` inputs have no `maxLength` attribute, whereas backend schema limits both to 50 characters.
  - `contactInfo` has no live phone validation, no helper hint indicating Philippine mobile format, and no input sanitization (unlike `ProfileEditForm.tsx` which sanitizes phone inputs and executes `normalizeContactInfo`).
- **Expected Behavior & Basis:** Frontend forms should enforce identical constraints to backend schemas to provide immediate, user-friendly feedback before network round-trips.
- **Impact & Realistic Risk:** Poor user experience where users encounter server rejection banners rather than client-side input blocking.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Add `maxLength={50}` to name fields, and integrate `normalizeContactInfo` validation into `RegisterForm.tsx`.
- **Suggested Regression Test:** Attempt typing 51 characters into the First Name field; verify input is capped at 50 characters in the DOM.

---

### VAL-010: Custom Question Topic Can Be Updated to Arbitrary Unvalidated Strings
- **Severity:** Low
- **Category:** Input Validation / Taxonomy
- **Affected Area:** `PATCH /api/tutor/questions/[questionId]`
- **File & Line:** `src/app/api/tutor/questions/[questionId]/route.ts#L62-L78`, `src/lib/validations/sessionTest.ts#L88`
- **Current Behavior & Evidence:**
  In `POST /api/tutor/questions/route.ts#L68-L73`, when creating a custom question, the handler verifies:
  ```typescript
  if (!owned.tutorClass.topics.some((t) => t.topic === topic)) {
    return NextResponse.json({ error: "Topic must be one of the class's topics." }, { status: 400 });
  }
  ```
  However, in `PATCH /api/tutor/questions/[questionId]/route.ts#L62-L78`, `topic` is extracted and updated directly:
  ```typescript
  const { topic, prompt, explanation, options } = result.data;
  // ...
  data: {
    ...(topic !== undefined ? { topic } : {}),
  ```
  `updateTutorQuestionSchema` defines `topic: z.string().trim().min(1).optional()`. There is no check verifying that the updated topic exists in the subject taxonomy or belongs to the tutor's class.
- **Expected Behavior & Basis:** Edited question topics should remain within the certified or class-assigned topic taxonomy.
- **Impact & Realistic Risk:** Tutor questions can become tagged with misspelled or arbitrary topics, disrupting session test question filtering and search results.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** In `PATCH /api/tutor/questions/[questionId]`, check that the updated topic exists within the class topics or subject catalog.
- **Suggested Regression Test:** Send `PATCH /api/tutor/questions/q1` with `{ topic: "Invalid Nonexistent Topic" }` and assert that the request is rejected with `400 Bad Request`.

---

### VAL-011: Unbounded Length for Search Parameter `q`
- **Severity:** Low
- **Category:** Performance / Query Hygiene
- **Affected Area:** `GET /api/search`, `GET /api/classes`, `GET /api/admin/users`, `GET /api/admin/audit-log`
- **File & Line:** `src/app/api/search/route.ts#L81`, `src/app/api/classes/route.ts#L67`, `src/app/api/admin/users/route.ts#L33`
- **Current Behavior & Evidence:**
  Search queries across multiple routes extract `q`:
  ```typescript
  const q = searchParams.get("q")?.trim() || "";
  ```
  While `GET /api/search` checks `if (q.length < 2) return ...`, no route caps the maximum string length of `q`. A client can submit a query parameter containing 100,000 characters. This string is then passed into Prisma queries with multiple `{ contains: q }` OR clauses across several tables.
- **Expected Behavior & Basis:** Input query parameters used in SQL `LIKE` / `CONTAINS` queries should be constrained to a reasonable maximum length (e.g., 100 characters).
- **Impact & Realistic Risk:** Oversized search strings generate heavy memory and database execution overhead.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Truncate or validate `q` across all query handlers:
  ```typescript
  const rawQ = searchParams.get("q")?.trim() || "";
  const q = rawQ.length > 100 ? rawQ.slice(0, 100) : rawQ;
  ```
- **Suggested Regression Test:** Send `GET /api/search?q=${"a".repeat(10000)}` and assert request executes safely within bounds without performance degradation.

---

### VAL-012: Recovery Email Cannot Be Updated on Tutor Profiles
- **Severity:** Informational
- **Category:** Architectural Consistency
- **Affected Area:** `PATCH /api/tutor/profile`
- **File & Line:** `src/app/api/tutor/profile/route.ts#L24`
- **Current Behavior & Evidence:**
  In `src/app/api/tutor/profile/route.ts`:
  ```typescript
  const { contactInfo, section, gradeLevel } = result.data;
  ```
  Even though `updateTutorProfileSchema` alias points to `updateProfileSchema` (which includes `recoveryEmail`), the tutor profile PATCH handler does not extract `recoveryEmail` or update it in the database.
- **Expected Behavior & Basis:** Tutors and learners share the same underlying User model and password reset flow; profile editing capabilities should be symmetric.
- **Impact & Realistic Risk:** Tutors cannot set or update a recovery email from their profile page.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Extract `recoveryEmail` in `src/app/api/tutor/profile/route.ts` and include it in the `prisma.user.update` data payload.
- **Suggested Regression Test:** Send `PATCH /api/tutor/profile` with `{ recoveryEmail: "tutor-rec@example.com" }` and assert that the record updates.

---

### VAL-013: Array Length and Item Types for Notification IDs Are Unconstrained
- **Severity:** Informational
- **Category:** Input Validation / Batch Operations
- **Affected Area:** `POST /api/notifications/read`
- **File & Line:** `src/app/api/notifications/read/route.ts#L17-L24`
- **Current Behavior & Evidence:**
  In `src/app/api/notifications/read/route.ts`:
  ```typescript
  const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined;
  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });
  ```
  No validation is performed on the array length of `ids` or the types of its elements.
- **Expected Behavior & Basis:** Batch update endpoints should validate item shapes using Zod and constrain maximum batch sizes (e.g., `z.array(z.string().cuid()).max(100)`).
- **Impact & Realistic Risk:** A client submitting an array of 50,000 arbitrary strings will construct a massive SQL query parameter list, placing unnecessary strain on the MariaDB query parser.
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Define and apply a Zod schema:
  ```typescript
  const markReadSchema = z.object({
    ids: z.array(z.string().trim().min(1)).max(100).optional(),
  });
  ```
- **Suggested Regression Test:** Send `POST /api/notifications/read` with 101 IDs and verify that it returns `400 Bad Request`.

---

### VAL-014: 14 Out of 17 Validation Schema Modules Lack Direct Unit Test Suites
- **Severity:** Informational
- **Category:** Test Coverage
- **Affected Area:** `src/lib/validations/`
- **File & Line:** `src/lib/validations/__tests__/`
- **Current Behavior & Evidence:**
  `src/lib/validations/` contains 17 schema files:
  - `admin.ts`, `assessment.ts`, `auth.ts`, `availability.ts`, `changePassword.ts`, `chatbot.ts`, `classAppeal.ts`, `classRecommendation.ts`, `class.ts`, `emailVerification.ts`, `match.ts`, `passwordReset.ts`, `password.ts`, `profile.ts`, `report.ts`, `sessionTest.ts`, `subject.ts`, `topicCertification.ts`.
  However, `src/lib/validations/__tests__/` only contains tests for 3 schemas:
  - `auth.test.ts`
  - `class.test.ts`
  - `report.test.ts`
  The remaining 14 schemas have zero direct unit tests verifying boundary values, regex patterns, or refine conditions.
- **Expected Behavior & Basis:** Critical data contracts and validation rules should be protected by fast, isolated unit test suites.
- **Impact & Realistic Risk:** Regressions in validation logic or subtle schema misconfigurations may go undetected during dependency upgrades (such as Zod 4 migrations).
- **Confidence:** Confirmed by code inspection.
- **Recommended Fix:** Add dedicated unit test files in `src/lib/validations/__tests__/` covering each schema.
- **Suggested Regression Test:** N/A (Test suite implementation).

---

## 5. Input Validation Inventory

| Input / Form / Endpoint | Frontend Validation | Backend Validation | Database / Business Rules | Status | Notes |
|---|---|---|---|---|---|
| **Registration Form** (`/register`) | HTML5 required, passwords match, minLength 8 | Zod `registerSchema` (name, email, password, grade, section, consent) | `User` unique email, unique anonymousId, GradeLevel enum | `Validation gap confirmed` | `section` & `contactInfo` lack max length (`VAL-005`); `recoveryEmail` dropped (`VAL-007`) |
| **Login Form** (`/login`) | Client required check | NextAuth `CredentialsProvider`, IP/email rate limit | User password compare (bcrypt), status check (ACTIVE/PENDING/etc.) | `Adequate based on static inspection` | Dummy hash compare prevents timing attacks |
| **Forgot Password** (`/forgot-password`) | HTML5 email input | Zod `forgotPasswordSchema`, IP & email rate limit | Token hashed with SHA-256, 1-hour expiry | `Validation gap confirmed` | Recovery email lookup collision risk (`VAL-003`) |
| **Reset Password** (`/reset-password`) | minLength 8, password match | Zod `resetPasswordSchema` (BCrypt 72-byte cap, blocklist) | One-time token use via `usedAt`, bcrypt hash cost 12 | `Adequate based on static inspection` | Safe token hashing and transaction update |
| **Verify Email** (`/verify-email`) | Token in URL | Zod `verifyEmailSchema`, IP rate limit | SHA-256 token hash lookup, 24-hour expiry | `Adequate based on static inspection` | Invalidates token atomically in transaction |
| **Resend Verification** (`/resend-verification`) | HTML5 email input | Zod `resendVerificationSchema`, IP & email rate limit | Checks `emailVerifiedAt == null`, issues new token | `Adequate based on static inspection` | Neutral response prevents account enumeration |
| **Learner Profile Update** (`PATCH /api/learner/profile`) | Phone input sanitizer, live regex format test, section max 50 | Zod `updateProfileSchema`, `normalizeContactInfo` | User updates, GradeLevel enum | `Validation gap confirmed` | `recoveryEmail` unverified & non-unique (`VAL-003`) |
| **Tutor Profile Update** (`PATCH /api/tutor/profile`) | Phone input sanitizer, live regex format test, section max 50 | Zod `updateTutorProfileSchema`, `normalizeContactInfo` | User updates, GradeLevel enum | `Validation gap confirmed` | `recoveryEmail` omitted from update (`VAL-012`) |
| **Change Password** (`POST /api/{role}/profile/password`) | minLength 8, password match | Zod `changePasswordSchema` (current + new password) | Verifies current bcrypt password, hashes new password | `Validation gap confirmed` | Missing rate limiting (`VAL-008`) |
| **Profile Picture Upload** (`UploadThing`) | `@uploadthing/react` file picker | UploadThing router (max 2MB, image MIME, session check) | `profilePictureLocked` check, cloud file cleanup | `Adequate based on static inspection` | Deletes old file key via UTApi on replacement |
| **Profile Picture Self-Delete** (`DELETE /api/user/profile-picture`) | Confirmation dialog | Session check, `profilePictureLocked` check | Nullifies image and imageKey, deletes cloud asset | `Adequate based on static inspection` | Admin lock prevents removal |
| **Admin Avatar Moderation** (`POST /api/admin/users/[userId]/avatar-action`) | Action dropdown, reason modal | Zod `moderateAvatarSchema` (WARN, REMOVE, LOCK, UNLOCK) | Prevents admin target moderation, creates AuditLog | `Adequate based on static inspection` | Warn action requires reason |
| **Learner Browse Classes** (`GET /api/classes`) | Search & filter controls | Query parser (`q`, `subject`, `gradeLevel`, `page`, `pageSize`) | Filtered browse paginated; unfiltered personalized | `Validation gap confirmed` | Unbounded memory consumption in personalize mode (`VAL-004`) |
| **Class Enrollment** (`POST /api/classes/[classId]/enroll`) | Enroll button | Learner session check, status check, upcoming session check | `ClassEnrollment` unique compound key, capacity check | `Validation gap confirmed` | Capacity check outside transaction causes race condition (`VAL-002`) |
| **Class Unenrollment** (`DELETE /api/classes/[classId]/enroll`) | Unenroll confirmation | Learner session check, enrollment existence check | SCHEDULED status check, cascades topic request to ACCEPTED | `Adequate based on static inspection` | Notifications sent to tutor |
| **Tutor Class Creation** (`POST /api/tutor/classes`) | Multi-step form, session date picker, topic picker | Zod `createClassSchema`, `subjectExists`, topic normalization | Schedule overlap checks (`hasSessionOverlap`), class code generation | `Adequate based on static inspection` | Past dates rejected; internal overlap rejected |
| **Tutor Class Update** (`PATCH /api/tutor/classes/[classId]`) | Edit form | Zod `classDetailsSchema.partial()`, location check | Capacity reduction blocked below enrollment, topic in use check | `Validation gap confirmed` | Subject can be modified without certification check (`VAL-001`) |
| **Tutor Class Deletion** (`DELETE /api/tutor/classes/[classId]`) | Delete confirmation | Tutor ownership check, enrollments count check | Blocked if enrollments > 0, reopens linked topic requests | `Adequate based on static inspection` | Clean cascading deletion |
| **Add Session to Class** (`POST /api/tutor/classes/[classId]/sessions`) | Modal with date & topic selector | Zod `addSessionSchema`, topic membership check | Past date rejection, tutor session overlap check | `Adequate based on static inspection` | Scheduled class status enforced |
| **Update Single Session** (`PATCH /api/tutor/classes/[classId]/sessions/[sessionId]`) | Edit controls | Zod `updateSessionSchema`, topic membership check | Overlap check on SCHEDULED status, post-test notification trigger | `Adequate based on static inspection` | Clean status update |
| **Delete Single Session** (`DELETE /api/tutor/classes/[classId]/sessions/[sessionId]`) | Delete confirmation | Tutor ownership check, SCHEDULED status check | Blocked if last session with active enrollments | `Adequate based on static inspection` | Historical completed sessions preserved |
| **Class Appeal Filing** (`POST /api/tutor/classes/[classId]/appeal`) | Reason textarea (min 10) | Zod `createClassAppealSchema` (10-500 chars) | Only SUSPENDED or BANNED classes, duplicate pending appeal blocked | `Adequate based on static inspection` | Admin notified upon filing |
| **Admin Class Status Moderation** (`PATCH /api/admin/classes/[classId]`) | Moderation modal | Zod `updateClassStatusSchema` (SUSPENDED/BANNED/SCHEDULED) | Duration calculation, state transition rules, AuditLog | `Adequate based on static inspection` | Linked topic requests reopened on ban |
| **Admin Class Recommendation** (`POST /api/admin/classes/[classId]/recommendations`) | Learner select & note | Zod `createClassRecommendationSchema` | Learner role check, duplicate recommendation blocked | `Adequate based on static inspection` | Learner notified |
| **Admin Review Class Appeal** (`PATCH /api/admin/class-appeals/[appealId]`) | Decision & note | Zod `reviewClassAppealSchema` (APPROVE/REJECT) | Reinstates class if approved, AuditLog, notification | `Adequate based on static inspection` | Pending status check |
| **Auto Match Finder** (`POST /api/learner/match`) | Multi-select topics, slots, format filter | Zod `matchCriteriaSchema`, `subjectExists`, `topicExists` | Rank matches via `rankMatches`, max 20 results | `Adequate based on static inspection` | Matching feature flag respected |
| **Create Topic Request** (`POST /api/learner/topic-requests`) | Subject, topics, grade, slots, note | Zod `createTopicRequestSchema`, `subjectExists`, `topicExists` | `MAX_OPEN_REQUESTS` (10) cap, directed tutor check | `Adequate based on static inspection` | Directed tutor notification |
| **Cancel Topic Request** (`PATCH /api/learner/topic-requests/[id]`) | Cancel button | Zod `cancelTopicRequestSchema` (status: CANCELLED) | Ownership check, terminal state check | `Adequate based on static inspection` | Learner self-service cancel |
| **Accept Topic Request** (`POST /api/tutor/topic-requests/[id]/accept`) | Class schedule form | Zod `acceptTopicRequestSchema`, `tutorPoolWhere` eligibility | Strict certified topic check, overlap checks | `Adequate based on static inspection` | Atomic class create & request update |
| **Admin Moderate Topic Request** (`PATCH /api/admin/topic-requests/[id]`) | Status & reason | Zod `moderateTopicRequestSchema` (OPEN/CANCELLED) | Terminal state check, AuditLog, learner notification | `Adequate based on static inspection` | Re-open rules enforced |
| **Tutor Assessment Start** (`POST /api/tutor/assessments`) | Topic button | Zod `startAssessmentSchema`, `topicExists` | Resumes existing IN_PROGRESS, minBankSize check | `Adequate based on static inspection` | Randomizes questions via `pickQuestionIds` |
| **Tutor Assessment Submit** (`POST /api/tutor/assessments/[attemptId]/submit`) | MCQ quiz runner | Zod `submitAssessmentSchema` (answers array) | Graded via `gradeAttempt`, auto-certification check | `Adequate based on static inspection` | Does not downgrade existing certification |
| **Tutor Custom Question Author** (`POST /api/tutor/questions`) | Prompt, explanation, options (2-5) | Zod `authorTutorQuestionSchema` (exact 1 correct) | Class ownership check, class topic membership check | `Adequate based on static inspection` | Origin set to TUTOR |
| **Tutor Custom Question Edit** (`PATCH /api/tutor/questions/[questionId]`) | Edit modal | Zod `updateTutorQuestionSchema` | Locked once published on test or attempted | `Validation gap confirmed` | `topic` can be updated without taxonomy check (`VAL-010`) |
| **Session Test Question Config** (`PUT .../test/questions`) | Reorder & question picker | Zod `setSessionTestQuestionsSchema` (1-50 IDs) | Unique check, bank subject match or tutor ownership | `Adequate based on static inspection` | Locked once test published/attempted |
| **Session Test Status Transition** (`PATCH .../test/status`) | Publish / Close buttons | Zod `sessionTestStatusSchema` (PUBLISHED/CLOSED) | Min 1 question before publish, pre-test notification | `Adequate based on static inspection` | Draft cannot be closed directly |
| **Learner Session Test Start** (`POST .../test/[kind]/start`) | Start button | Path params `classId`, `sessionId`, `kind` | Session status gate (PRE vs POST window), single attempt | `Adequate based on static inspection` | In-progress attempt resumes safely |
| **Learner Session Test Submit** (`POST .../submit`) | MCQ runner | Zod `submitAssessmentSchema` | Graded via `gradeAttempt`, tutor notified on PRE | `Adequate based on static inspection` | Verified attempt ownership |
| **Admin Question Bank Manage** (`POST|PATCH /api/admin/assessment-questions`) | Bank form modal | Zod `createAssessmentQuestionSchema`, `updateAssessmentQuestionSchema` | `topicExists`, in-use question content locked (retire only) | `Adequate based on static inspection` | AuditLog created on changes |
| **Admin Assessment Config** (`PATCH /api/admin/assessment-configs`) | Platform config form | Zod `updateGlobalAssessmentConfigSchema` | Bounds checks (questionCount 1-50, passPercent 1-100) | `Adequate based on static inspection` | AuditLog records setting changes |
| **File Abuse Report** (`POST /api/learner/reports`) | Violation checkboxes, details | Zod `createReportSchema`, OTHER requires 10+ chars | Must be enrolled in class or taught by tutor, duplicate blocked | `Adequate based on static inspection` | Admin notification dispatched |
| **Admin Review Report** (`PATCH /api/admin/abuse-reports/[reportId]`) | Decision & note | Zod `reviewReportSchema` (RESOLVE/DISMISS) | Report status check, AuditLog, reporter notified | `Adequate based on static inspection` | Pending status enforced |
| **Admin User Moderation** (`PATCH /api/admin/users/[userId]`) | Suspend/Ban modal | Zod `updateUserStatusSchema` | Admin target protection, expiration computation, AuditLog | `Adequate based on static inspection` | Duration capped at 365 days |
| **Admin Registration Approval** (`PATCH /api/admin/registrations/[userId]`) | Approve/Decline modal | Zod `reviewRegistrationSchema` (APPROVE/DECLINE) | PENDING status check, AuditLog, welcome notification | `Adequate based on static inspection` | Prevents modifying non-pending |
| **Admin Platform Settings** (`PATCH /api/admin/settings`) | Toggle switches | Zod `updatePlatformSettingSchema` / `updateProfilePictureRequirementSchema` | Key whitelist, boolean or requirement enum | `Adequate based on static inspection` | Clean setting upsert |
| **Admin Taxonomy Management** (`POST|PATCH|DELETE /api/admin/subjects`, `/api/admin/topics`) | Subject/topic modal | Zod `createSubjectSchema`, `updateSubjectSchema`, `createTopicSchema` | Unique slug/name, usage count check blocks deletion | `Adequate based on static inspection` | Topic rename cascades to all tables |
| **Chatbot Query** (`POST /api/chatbot`) | Chat widget textarea | Zod `chatbotMessageSchema` (1-500 chars) | Rate limit (20/min), classifier score calculation, misses log | `Adequate based on static inspection` | Handles malformed JSON gracefully |
| **Global Search** (`GET /api/search`) | Search input with scope | Scope check (`all`, `tutorCode`, `subject`, `topic`, `classCode`), min 2 chars | Rate limit (40/min), role-filtered queries | `Potential gap — requirements unclear` | `q` lacks max length limit (`VAL-011`) |
| **Mark Notifications Read** (`POST /api/notifications/read`) | Notification bell click | Body `{ ids?: string[] }` | Updates only caller's notifications | `Potential gap — requirements unclear` | `ids` array length unconstrained (`VAL-013`) |
| **Health Check** (`GET /api/health`) | None (system monitoring) | No body or query params | Executes `SELECT 1` | `Adequate based on static inspection` | Errors masked from client |
| **Dev Data Factory** (`POST /api/dev`) | Dev tool board | Action dispatcher, clampInt helper | Hard-404 in production (`NODE_ENV === "production"`) | `Adequate based on static inspection` | Guarded against production use |

---

## 6. Frontend vs. Backend Comparison

### 6.1 Validation Rules That Differ Across Layers

1. **Section Field Lengths:**
   - *Frontend (`RegisterForm.tsx`):* No `maxLength` attribute.
   - *Backend (`auth.ts commonRegisterSchema`):* `min(1)` with no maximum.
   - *Frontend (`ProfileEditForm.tsx`):* Enforces `maxLength={50}`.
   - *Backend (`profile.ts updateProfileSchema`):* Enforces `max(50)`.
   - *Database (`prisma/schema.prisma`):* `VARCHAR(191)`.
   - *Impact:* Discrepancy allows users to enter long section strings during registration that are subsequently rejected by the database or truncated in profile edits.

2. **Contact Info Format Validation:**
   - *Frontend (`RegisterForm.tsx`):* Free-form text input with no pattern enforcement.
   - *Backend (`auth.ts commonRegisterSchema`):* Optional string with no pattern or length enforcement.
   - *Frontend (`ProfileEditForm.tsx`):* Real-time digit sanitization and live regex verification via `normalizeContactInfo`.
   - *Backend (`learner/profile/route.ts`):* Enforces Philippine mobile format (`09XXXXXXXXX`) via `normalizeContactInfo`.
   - *Impact:* A user can register with invalid contact information (e.g. text or invalid phone numbers), but will be unable to save their profile later unless they correct it to a valid Philippine mobile number.

3. **Question Authoring Prompt Lengths:**
   - *Frontend (`QuestionFormModal.tsx`):* HTML textarea enforces `maxLength={1000}` but has no `minLength`.
   - *Backend (`authorTutorQuestionSchema`, `createAssessmentQuestionSchema`):* Enforces `min(5)` and `max(1000)`.
   - *Impact:* Entering fewer than 5 characters submits to the server and relies on backend error feedback rather than client-side prevention.

4. **Class Meeting Link Format and Length:**
   - *Frontend (`ClassScheduleFields.tsx`):* `<input type="url">` with no character limit.
   - *Backend (`classDetailsSchema`):* `z.string().url()` with no `.max()` limit.
   - *Database (`schema.prisma`):* `String?` (`VARCHAR(191)`).
   - *Impact:* Valid URLs longer than 191 characters (common for videoconference links with lengthy query tokens) pass both frontend and Zod validation but fail during database insertion.

### 6.2 Endpoints Lacking Authoritative Server-Side Validation

1. **`PATCH /api/tutor/classes/[classId]` Subject Modification:**
   - The frontend `EditClassForm.tsx` does not display a subject selector (treating subject as immutable).
   - However, the server-side route handler accepts `subject` from the request body and updates the database record without verifying subject validity or tutor certification. Direct API requests can freely alter the subject.

2. **`PATCH /api/tutor/questions/[questionId]` Topic Modification:**
   - The question editor allows modifying `topic`, but the backend route does not verify whether the new topic exists in the subject catalog or matches the class's topics.

---

## 7. Security Findings

### 7.1 Confirmed Security Deficiencies

1. **Taxonomy & Certification Bypass (`VAL-001`):**
   - *Classification:* High Severity (Business Logic & Authorization Flaw).
   - *Demonstration:* An attacker acting as an authenticated tutor creates a class in an authorized subject (e.g. `MATH`). By issuing `PATCH /api/tutor/classes/{id}` with `{ "subject": "SCIENCE" }`, the tutor circumvents the administrative setting `requireCertificationForClassCreation`.
2. **Class Enrollment Race Condition (`VAL-002`):**
   - *Classification:* High Severity (Concurrency / Invariant Violation).
   - *Demonstration:* Issuing simultaneous parallel `POST /api/classes/{id}/enroll` requests when 1 seat remains allows both transactions to insert into `class_enrollments`, bypassing `maxStudents` limits.
3. **Password Reset Disruption / Account Ambiguity (`VAL-003`):**
   - *Classification:* Medium Severity (Account Recovery Logic).
   - *Demonstration:* A learner updates their `recoveryEmail` to match the target administrator's or user's email. When `POST /api/auth/forgot-password` runs `findFirst({ where: { OR: [{ email }, { recoveryEmail: email }] } })`, the query non-deterministically resolves to the attacker's account.

### 7.2 Potential Security Risks Requiring Verification

1. **Stored XSS via SVG Profile Pictures (Hypothesis):**
   - *Status:* Potential Risk — Dependent on UploadThing CDN configuration.
   - *Details:* UploadThing router permits image uploads (`image: { maxFileSize: "2MB", maxFileCount: 1 }`). By default, MIME filtering in some file upload libraries treats `image/svg+xml` as an image. If SVGs containing embedded JavaScript are uploaded and served with `Content-Type: image/svg+xml` without `Content-Security-Policy: default-src 'none'` on the CDN domain, stored XSS could theoretically occur.
   - *Mitigation Observed:* The application renders images via Next.js `<Image>` component or `<img src="..." />` tags, which execute in an isolated origin or suppress script execution. Verification of UploadThing's CDN response headers (`Content-Disposition: inline` vs `attachment`) is recommended.
2. **ReDoS (Regular Expression Denial of Service) in Normalizers:**
   - *Status:* Verified Safe.
   - *Details:* Regular expressions in `src/lib/contactInfo.ts` (`/^(?:\+?63|0)9\d{9}$/`), `src/lib/validations/availability.ts` (`/^([01]\d|2[0-3]):[0-5]\d$/`), and `src/lib/validations/subject.ts` (`/^[A-Z][A-Z0-9_]*$/`) were inspected. All expressions are linear and contain no nested quantifiers or catastrophic backtracking potential.
3. **SQL / NoSQL Injection:**
   - *Status:* Verified Safe.
   - *Details:* All database queries use Prisma Client methods with parameterized inputs. Raw queries (`$queryRaw`) only appear in `src/app/api/health/route.ts` with a hardcoded constant `SELECT 1`.

---

## 8. Test Coverage Gaps

The test suite contains 105 test files utilizing Vitest. However, validation-specific test coverage exhibits notable gaps:

### Priority 1: High-Priority Missing Validation Tests

1. **Class Subject Modification & Certification Immutability:**
   - *Current State:* `src/app/api/tutor/classes/[classId]/__tests__/route.test.ts` tests status transitions, suspensions, and student limits, but does not test `subject` updates or certification bypasses.
   - *Recommended Test:* Test that attempting to update `subject` on an existing class fails with 400/403 or is ignored.
2. **Concurrent Enrollment Capacity Race Condition:**
   - *Current State:* `src/app/api/classes/[classId]/enroll/__tests__/route.test.ts` tests full classes sequentially (`_count.enrollments >= maxStudents`).
   - *Recommended Test:* Test concurrent enrollment execution simulating race conditions.
3. **Registration Boundary & Length Checks:**
   - *Current State:* `src/lib/validations/__tests__/auth.test.ts` tests valid learners, invalid emails, and short passwords.
   - *Recommended Test:* Test boundary inputs exceeding 50, 100, and 191 characters for `section`, `firstName`, `lastName`, and `contactInfo`.

### Priority 2: Missing Unit Test Suites for Schema Modules

The following 14 schema modules in `src/lib/validations/` have no dedicated unit test files:
- `admin.ts`: Moderation action schemas (`updateUserStatusSchema`, `moderateAvatarSchema`, `reviewRegistrationSchema`).
- `assessment.ts`: MCQ schemas, option count bounds (`OPTION_COUNT_MIN`, `OPTION_COUNT_MAX`), single-correct refine assertions.
- `availability.ts`: Time format regex, `startTime < endTime` refine condition.
- `changePassword.ts`: Password rule inheritance and empty string checks.
- `chatbot.ts`: Message length boundaries.
- `classAppeal.ts`: Minimum 10-character explanation requirement.
- `classRecommendation.ts`: Learner ID presence and note length.
- `emailVerification.ts`: Token presence and email sanitization.
- `match.ts`: Slot counts, class format enum, `createTopicRequestSchema` validation.
- `passwordReset.ts`: Token and password format.
- `profile.ts`: Phone sanitization and length caps.
- `sessionTest.ts`: Option counts, prompt lengths, question IDs array bounds (1-50).
- `subject.ts`: Slug uppercase snake-case regex (`/^[A-Z][A-Z0-9_]*$/`), name lengths.
- `topicCertification.ts`: Subject and topic string boundaries.

---

## 9. Recommended Remediation Plan

### 9.1 Immediate Security and Data-Integrity Risks (Week 1)

1. **Disallow Subject Mutation on Classes (`VAL-001`):**
   - *Action:* Modify `src/lib/validations/class.ts` to omit `subject` from `classDetailsSchema` updates, or enforce `subjectExists` and certification checks in `src/app/api/tutor/classes/[classId]/route.ts`.
2. **Atomic Class Capacity Enforcement (`VAL-002`):**
   - *Action:* Move enrollment count verification inside the Prisma transaction in `src/app/api/classes/[classId]/enroll/route.ts` using `tx.classEnrollment.count()`.
3. **Constrain Recovery Email Uniqueness & Ambiguity (`VAL-003`):**
   - *Action:* Check for uniqueness before updating `recoveryEmail` in `src/app/api/learner/profile/route.ts`. Modify `src/app/api/auth/forgot-password/route.ts` to prioritize primary email lookups.

### 9.2 High-Priority Validation Improvements (Week 2)

4. **Cap Personalized Browse Queries (`VAL-004`):**
   - *Action:* In `src/app/api/classes/route.ts`, add a bounded limit (e.g., `take: 100`) to personalized browse queries.
5. **Enforce Boundary Lengths in Registration (`VAL-005`):**
   - *Action:* Add `.max(50)` to `section` and `.max(100)` to `contactInfo` in `commonRegisterSchema` (`src/lib/validations/auth.ts`).
6. **Graceful Malformed JSON Error Handling (`VAL-006`):**
   - *Action:* Wrap `req.json()` calls in API mutation handlers with a try/catch returning HTTP 400.
7. **Rate Limit Password Updates (`VAL-008`):**
   - *Action:* Integrate `rateLimit()` into `/api/learner/profile/password`, `/api/tutor/profile/password`, and `/api/admin/profile/password`.

### 9.3 Consistency and Maintainability Improvements (Week 3)

8. **Synchronize Form Attributes with Backend Schemas (`VAL-009`):**
   - *Action:* Add `maxLength` attributes to inputs in `RegisterForm.tsx` and integrate `normalizeContactInfo`.
9. **Persist Recovery Email on Signup (`VAL-007`):**
   - *Action:* Pass `recoveryEmail` into `registerAccount()` in `src/lib/registration.ts`.
10. **Validate Custom Question Topic Updates (`VAL-010`):**
    - *Action:* Validate `topic` against class topics in `PATCH /api/tutor/questions/[questionId]`.
11. **Constrain Search Query Parameters (`VAL-011`):**
    - *Action:* Cap `q` search parameter to 100 characters across all list endpoints.
12. **Enable Recovery Email for Tutors (`VAL-012`):**
    - *Action:* Extract and update `recoveryEmail` in `src/app/api/tutor/profile/route.ts`.
13. **Validate Batch Notification IDs (`VAL-013`):**
    - *Action:* Validate `ids` in `POST /api/notifications/read` using `z.array(z.string()).max(100)`.

### 9.4 Additional Regression Tests (Week 4)

14. **Expand Zod Unit Test Coverage (`VAL-014`):**
    - *Action:* Create dedicated unit tests in `src/lib/validations/__tests__/` for the 14 untested schemas.
15. **Add Integration Tests for Boundary Conditions:**
    - *Action:* Add API route tests verifying that malformed JSON payloads return HTTP 400 and over-long strings are rejected before reaching the database.

---

## 10. Audit Limitations

1. **Static Analysis Basis:** Findings in this report were derived from static code inspection, architecture review, and schema tracing across the repository.
2. **Read-Only Verification:** In strict accordance with audit instructions, no tests were executed that could write artifacts, alter working-tree state, modify databases, or affect package locks.
3. **Third-Party Service Assumptions:** Validation assumptions regarding UploadThing file routing and NextAuth JWT security rely on the default, documented behaviors of those libraries as configured in code.

---

## 11. Final Read-Only Verification

- **Report Creation Status:** `docs/reports/input-validation-audit.md` created successfully at repository root.
- **Repository Integrity:** No existing project files, configurations, database schemas, migrations, or tests were edited, overwritten, renamed, or deleted.
- **Workspace State Verification:**
  - *Pre-Audit Working Tree State:* Confirmed existence of pre-existing modified/untracked files from earlier work (recorded via `git status --short`).
  - *Post-Audit Working Tree State:* Only `docs/reports/input-validation-audit.md` was added as an untracked file; all pre-existing files remain in their exact pre-audit state.
- **Skipped Execution Checks:** Live database mutation tests and test runs that generate cache directories (e.g. `node_modules/.vitest`) were intentionally skipped to ensure complete environment immutability.
