# Complete route reference

This inventory is extracted from current route modules. Role chapters explain workflows and side effects; this appendix accounts for every endpoint and browser entry point. Query keys and validation calls are source-level identifiers. An endpoint may apply additional nested helper checks; use the linked source and role chapter together.

## API conventions

Requests use same-origin NextAuth sessions for authenticated endpoints. JSON bodies are expected for writes unless the feature says no body. Success is normally 200, creations generally 201; exceptions such as resume/no-op are documented by role. Wrong-role or missing session generally returns 401; ownership failures vary between 403 and existence-hiding 404. Validation commonly returns first Zod issue as `{error}` with 400; conflicts often use 409; unexpected errors use 500. There is no common versioned response envelope or shared OpenAPI specification. Lists differ between arrays and paginated objects.

## API inventory

| Endpoint | Methods | Access | Feature chapter |
| --- | --- | --- | --- |
| [/api/admin/abuse-reports/[reportId]](../../src/app/api/admin/abuse-reports/[reportId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/abuse-reports](../../src/app/api/admin/abuse-reports/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-attempts/[attemptId]](../../src/app/api/admin/assessment-attempts/[attemptId]/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-attempts](../../src/app/api/admin/assessment-attempts/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-configs](../../src/app/api/admin/assessment-configs/route.ts) | GET, PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-questions/[questionId]](../../src/app/api/admin/assessment-questions/[questionId]/route.ts) | GET, PATCH, DELETE | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-questions/coverage](../../src/app/api/admin/assessment-questions/coverage/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/assessment-questions](../../src/app/api/admin/assessment-questions/route.ts) | GET, POST | Admin | [Details](05-admin.md) |
| [/api/admin/audit-log](../../src/app/api/admin/audit-log/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/certifications/[certificationId]](../../src/app/api/admin/certifications/[certificationId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/certifications](../../src/app/api/admin/certifications/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/chatbot-misses](../../src/app/api/admin/chatbot-misses/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/class-appeals/[appealId]](../../src/app/api/admin/class-appeals/[appealId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/class-appeals](../../src/app/api/admin/class-appeals/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/classes/[classId]/recommendations](../../src/app/api/admin/classes/[classId]/recommendations/route.ts) | GET, POST | Admin | [Details](05-admin.md) |
| [/api/admin/classes/[classId]](../../src/app/api/admin/classes/[classId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/classes](../../src/app/api/admin/classes/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/profile/password](../../src/app/api/admin/profile/password/route.ts) | POST | Admin | [Details](05-admin.md) |
| [/api/admin/question-requests/[requestId]](../../src/app/api/admin/question-requests/[requestId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/question-requests](../../src/app/api/admin/question-requests/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/registrations/[userId]](../../src/app/api/admin/registrations/[userId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/registrations](../../src/app/api/admin/registrations/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/reports](../../src/app/api/admin/reports/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/session-tests/[testId]/attempts/[attemptId]](../../src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/session-tests/[testId]/results](../../src/app/api/admin/session-tests/[testId]/results/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/session-tests](../../src/app/api/admin/session-tests/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/settings](../../src/app/api/admin/settings/route.ts) | GET, PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/subjects/[id]](../../src/app/api/admin/subjects/[id]/route.ts) | PATCH, DELETE | Admin | [Details](05-admin.md) |
| [/api/admin/subjects/[id]/topics](../../src/app/api/admin/subjects/[id]/topics/route.ts) | POST | Admin | [Details](05-admin.md) |
| [/api/admin/subjects](../../src/app/api/admin/subjects/route.ts) | GET, POST | Admin | [Details](05-admin.md) |
| [/api/admin/topic-requests/[id]](../../src/app/api/admin/topic-requests/[id]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/topic-requests](../../src/app/api/admin/topic-requests/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/admin/topics/[id]](../../src/app/api/admin/topics/[id]/route.ts) | PATCH, DELETE | Admin | [Details](05-admin.md) |
| [/api/admin/users/[userId]](../../src/app/api/admin/users/[userId]/route.ts) | PATCH | Admin | [Details](05-admin.md) |
| [/api/admin/users](../../src/app/api/admin/users/route.ts) | GET | Admin | [Details](05-admin.md) |
| [/api/auth/[...nextauth]](../../src/app/api/auth/[...nextauth]/route.ts) | GET, POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/auth/forgot-password](../../src/app/api/auth/forgot-password/route.ts) | POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/auth/resend-verification](../../src/app/api/auth/resend-verification/route.ts) | POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/auth/reset-password](../../src/app/api/auth/reset-password/route.ts) | POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/auth/verify-email](../../src/app/api/auth/verify-email/route.ts) | POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/chatbot](../../src/app/api/chatbot/route.ts) | POST | Authenticated roles | [Details](06-shared-and-system.md) |
| [/api/classes/[classId]/enroll](../../src/app/api/classes/[classId]/enroll/route.ts) | POST, DELETE | Learner | [Details](03-student-learner.md) |
| [/api/classes](../../src/app/api/classes/route.ts) | GET | Learner | [Details](03-student-learner.md) |
| [/api/dev](../../src/app/api/dev/route.ts) | GET, POST | Admin + non-production | [Details](06-shared-and-system.md) |
| [/api/learner/classes/[classId]/session-tests](../../src/app/api/learner/classes/[classId]/session-tests/route.ts) | GET | Learner | [Details](03-student-learner.md) |
| [/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts) | POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/match](../../src/app/api/learner/match/route.ts) | POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/profile/password](../../src/app/api/learner/profile/password/route.ts) | POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/profile](../../src/app/api/learner/profile/route.ts) | PATCH | Learner | [Details](03-student-learner.md) |
| [/api/learner/progress](../../src/app/api/learner/progress/route.ts) | GET | Learner | [Details](03-student-learner.md) |
| [/api/learner/reports](../../src/app/api/learner/reports/route.ts) | GET, POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/session-test-attempts/[attemptId]](../../src/app/api/learner/session-test-attempts/[attemptId]/route.ts) | GET | Learner | [Details](03-student-learner.md) |
| [/api/learner/session-test-attempts/[attemptId]/submit](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts) | POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/topic-requests/[id]](../../src/app/api/learner/topic-requests/[id]/route.ts) | PATCH | Learner | [Details](03-student-learner.md) |
| [/api/learner/topic-requests](../../src/app/api/learner/topic-requests/route.ts) | GET, POST | Learner | [Details](03-student-learner.md) |
| [/api/learner/tutors](../../src/app/api/learner/tutors/route.ts) | GET | Learner | [Details](03-student-learner.md) |
| [/api/notifications/read](../../src/app/api/notifications/read/route.ts) | POST | Authenticated roles | [Details](06-shared-and-system.md) |
| [/api/notifications](../../src/app/api/notifications/route.ts) | GET | Authenticated roles | [Details](06-shared-and-system.md) |
| [/api/register](../../src/app/api/register/route.ts) | POST | Public / auth protocol | [Details](02-guest-and-applicant.md) |
| [/api/search](../../src/app/api/search/route.ts) | GET | Authenticated roles | [Details](06-shared-and-system.md) |
| [/api/subjects](../../src/app/api/subjects/route.ts) | GET | Authenticated roles | [Details](06-shared-and-system.md) |
| [/api/tutor/assessments/[attemptId]](../../src/app/api/tutor/assessments/[attemptId]/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/assessments/[attemptId]/submit](../../src/app/api/tutor/assessments/[attemptId]/submit/route.ts) | POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/assessments](../../src/app/api/tutor/assessments/route.ts) | GET, POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/appeal](../../src/app/api/tutor/classes/[classId]/appeal/route.ts) | POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]](../../src/app/api/tutor/classes/[classId]/route.ts) | PATCH, DELETE | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts) | PATCH, DELETE | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts) | PUT | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]/test/results](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]/test](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts) | GET, POST, PATCH, DELETE | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions/[sessionId]/test/status](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts) | PATCH | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/sessions](../../src/app/api/tutor/classes/[classId]/sessions/route.ts) | POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes/[classId]/test-results](../../src/app/api/tutor/classes/[classId]/test-results/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/classes](../../src/app/api/tutor/classes/route.ts) | GET, POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/profile/password](../../src/app/api/tutor/profile/password/route.ts) | POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/profile](../../src/app/api/tutor/profile/route.ts) | PATCH | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/question-bank](../../src/app/api/tutor/question-bank/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/question-requests](../../src/app/api/tutor/question-requests/route.ts) | GET, POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/questions/[questionId]](../../src/app/api/tutor/questions/[questionId]/route.ts) | PATCH, DELETE | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/questions](../../src/app/api/tutor/questions/route.ts) | GET, POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/students](../../src/app/api/tutor/students/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/topic-certifications](../../src/app/api/tutor/topic-certifications/route.ts) | GET, POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/topic-requests/[id]/accept](../../src/app/api/tutor/topic-requests/[id]/accept/route.ts) | POST | Tutor | [Details](04-student-tutor.md) |
| [/api/tutor/topic-requests](../../src/app/api/tutor/topic-requests/route.ts) | GET | Tutor | [Details](04-student-tutor.md) |

## Endpoint contracts

Error text below lists explicit literal business errors, excluding repeated Unauthorized/unexpected failures. Dynamic validation messages and helper-returned errors can add to these; absence is not a guarantee of success. Model names list direct reads/writes and are not a substitute for transaction semantics in feature chapters.

### `/api/admin/abuse-reports/[reportId]`

Source: [route.ts](../../src/app/api/admin/abuse-reports/[reportId]/route.ts).

Operations: PATCH: An admin resolves or dismisses a pending report.

Body validators: `reviewReportSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `report.findUnique`, `report.update`, `auditLog.create`.

Explicit restrictions/errors:

- Report not found.

- This report has already been reviewed.

### `/api/admin/abuse-reports`

Source: [route.ts](../../src/app/api/admin/abuse-reports/route.ts).

Operations: GET: List abuse reports (tabbed / paginated).

Query parameters: `status`, `targetType`, `page`, `pageSize`.

Direct model operations: `report.findMany`, `report.count`.

### `/api/admin/assessment-attempts/[attemptId]`

Source: [route.ts](../../src/app/api/admin/assessment-attempts/[attemptId]/route.ts).

Operations: GET: Full Attempt Detail (admin sees everything).

Direct model operations: `assessmentAttempt.findUnique`.

Explicit restrictions/errors:

- Attempt not found.

### `/api/admin/assessment-attempts`

Source: [route.ts](../../src/app/api/admin/assessment-attempts/route.ts).

Operations: GET: List Assessment Attempts (filtered / paginated).

Query parameters: `subject`, `topic`, `status`, `q`, `page`, `pageSize`.

Direct model operations: `assessmentAttempt.findMany`, `assessmentAttempt.count`.

### `/api/admin/assessment-configs`

Source: [route.ts](../../src/app/api/admin/assessment-configs/route.ts).

Operations: GET: The global assessment config; PATCH: Update the global assessment config.

Body validators: `updateGlobalAssessmentConfigSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `platformSetting.upsert`, `auditLog.create`.

### `/api/admin/assessment-questions/[questionId]`

Source: [route.ts](../../src/app/api/admin/assessment-questions/[questionId]/route.ts).

Operations: GET: One Bank Question; PATCH: Edit (pre-use) or Toggle `active` (any time); DELETE: Hard-delete an Unused Question.

Body validators: `updateAssessmentQuestionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `assessmentQuestion.findFirst`, `assessmentOption.deleteMany`, `assessmentOption.createMany`, `assessmentQuestion.update`, `auditLog.create`, `assessmentQuestion.delete`.

Explicit restrictions/errors:

- Question not found.

- This question has been used in an attempt. Retire it and create a new one to change its content.

- This question has been used in an attempt. Retire it instead of deleting.

### `/api/admin/assessment-questions/coverage`

Source: [route.ts](../../src/app/api/admin/assessment-questions/coverage/route.ts).

Operations: GET: Per-topic Bank Coverage.

Direct model operations: `assessmentQuestion.groupBy`, `questionRequest.groupBy`.

### `/api/admin/assessment-questions`

Source: [route.ts](../../src/app/api/admin/assessment-questions/route.ts).

Operations: GET: List Bank Questions (filtered / paginated); POST: Create a Bank Question.

Query parameters: `subject`, `topic`, `active`, `q`, `page`, `pageSize`.

Body validators: `createAssessmentQuestionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `assessmentQuestion.findMany`, `assessmentQuestion.count`, `assessmentQuestion.create`, `auditLog.create`.

### `/api/admin/audit-log`

Source: [route.ts](../../src/app/api/admin/audit-log/route.ts).

Operations: GET: Admin Moderation Action History (filtered / sorted / paginated).

Query parameters: `action`, `targetType`, `q`, `sort`, `dir`, `page`, `pageSize`.

Direct model operations: `auditLog.findMany`, `auditLog.count`, `auditLog.groupBy`.

### `/api/admin/certifications/[certificationId]`

Source: [route.ts](../../src/app/api/admin/certifications/[certificationId]/route.ts).

Operations: PATCH: Approve or Reject a Pending Topic Certification.

Body validators: `reviewCertificationSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `topicCertification.findUnique`, `topicCertification.update`, `auditLog.create`.

Explicit restrictions/errors:

- Certification request not found.

- Only a pending certification request can be reviewed.

### `/api/admin/certifications`

Source: [route.ts](../../src/app/api/admin/certifications/route.ts).

Operations: GET: List Topic Certification Requests (tabbed / filtered / sorted).

Query parameters: `status`, `q`, `subject`, `sort`, `page`, `pageSize`.

Direct model operations: `topicCertification.findMany`, `topicCertification.count`.

### `/api/admin/chatbot-misses`

Source: [route.ts](../../src/app/api/admin/chatbot-misses/route.ts).

Operations: GET: chatbot misses grouped by normalised message (admin review).

Query parameters: `role`, `q`, `sort`, `dir`, `page`, `pageSize`.

Direct model operations: `chatbotMiss.findMany`.

### `/api/admin/class-appeals/[appealId]`

Source: [route.ts](../../src/app/api/admin/class-appeals/[appealId]/route.ts).

Operations: PATCH: An admin approves or rejects a pending class appeal.

Body validators: `reviewClassAppealSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `classAppeal.findUnique`, `classAppeal.update`, `tutorClass.update`, `auditLog.create`.

Explicit restrictions/errors:

- Appeal not found.

- This appeal has already been reviewed.

### `/api/admin/class-appeals`

Source: [route.ts](../../src/app/api/admin/class-appeals/route.ts).

Operations: GET: List class appeals (tabbed / paginated).

Query parameters: `status`, `page`, `pageSize`.

Direct model operations: `classAppeal.findMany`, `classAppeal.count`.

### `/api/admin/classes/[classId]/recommendations`

Source: [route.ts](../../src/app/api/admin/classes/[classId]/recommendations/route.ts).

Operations: GET: List Recommendations Issued for a Class; POST: Recommend This Class to a Learner.

Body validators: `createClassRecommendationSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `classRecommendation.findMany`, `tutorClass.findUnique`, `user.findFirst`, `classRecommendation.findUnique`, `classRecommendation.create`.

Explicit restrictions/errors:

- Class not found.

- Learner not found.

- This class has already been recommended to that learner.

### `/api/admin/classes/[classId]`

Source: [route.ts](../../src/app/api/admin/classes/[classId]/route.ts).

Operations: PATCH: Suspend, Ban, or Reinstate a Class.

Body validators: `updateClassStatusSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorClass.findUnique`, `tutorClass.update`, `auditLog.create`, `topicRequest.findMany`, `topicRequest.update`, `classEnrollment.findMany`.

Explicit restrictions/errors:

- Class not found.

- Only a scheduled class can be suspended.

- Only a scheduled or suspended class can be banned.

- Only a suspended or banned class can be reinstated.

### `/api/admin/classes`

Source: [route.ts](../../src/app/api/admin/classes/route.ts).

Operations: GET: List All Classes for Moderation.

Query parameters: `q`, `subject`, `status`, `page`, `pageSize`.

Direct model operations: `tutorClass.findMany`, `tutorClass.count`.

### `/api/admin/profile/password`

Source: [route.ts](../../src/app/api/admin/profile/password/route.ts).

Operations: POST: Change Own Password.

Body validators: `changePasswordSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

### `/api/admin/question-requests/[requestId]`

Source: [route.ts](../../src/app/api/admin/question-requests/[requestId]/route.ts).

Operations: PATCH: Resolve or Dismiss a Question Request.

Body validators: `resolveQuestionRequestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `questionRequest.findUnique`, `questionRequest.update`, `auditLog.create`.

Explicit restrictions/errors:

- Question request not found.

- Only an open request can be resolved.

### `/api/admin/question-requests`

Source: [route.ts](../../src/app/api/admin/question-requests/route.ts).

Operations: GET: List Question Requests (tabbed / filtered / paginated).

Query parameters: `status`, `subject`, `q`, `page`, `pageSize`.

Direct model operations: `questionRequest.findMany`, `questionRequest.count`.

### `/api/admin/registrations/[userId]`

Source: [route.ts](../../src/app/api/admin/registrations/[userId]/route.ts).

Operations: PATCH: Approve or Decline a Pending Registration.

Body validators: `reviewRegistrationSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.findUnique`, `user.update`, `auditLog.create`.

Explicit restrictions/errors:

- User not found.

- This account is not awaiting approval.

### `/api/admin/registrations`

Source: [route.ts](../../src/app/api/admin/registrations/route.ts).

Operations: GET: List Accounts Awaiting Approval.

Query parameters: `q`, `role`, `gradeLevel`, `page`, `pageSize`.

Direct model operations: `user.findMany`, `user.count`.

### `/api/admin/reports`

Source: [route.ts](../../src/app/api/admin/reports/route.ts).

Operations: GET: Platform Breakdown Counts for Admin Reports.

Direct model operations: `user.groupBy`, `tutorClass.groupBy`, `topicCertification.groupBy`, `classEnrollment.count`, `classEnrollment.findMany`.

### `/api/admin/session-tests/[testId]/attempts/[attemptId]`

Source: [route.ts](../../src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts).

Operations: GET: One Learner's Attempt (admin drill-down).

Direct model operations: `sessionTestAttempt.findUnique`.

Explicit restrictions/errors:

- Attempt not found.

### `/api/admin/session-tests/[testId]/results`

Source: [route.ts](../../src/app/api/admin/session-tests/[testId]/results/route.ts).

Operations: GET: Session Test Results (admin, read-only).

Explicit restrictions/errors:

- Test not found.

### `/api/admin/session-tests`

Source: [route.ts](../../src/app/api/admin/session-tests/route.ts).

Operations: GET: All Session Tests (read-only, paginated).

Query parameters: `subject`, `status`, `q`, `page`, `pageSize`.

Direct model operations: `sessionTest.findMany`, `sessionTest.count`.

### `/api/admin/settings`

Source: [route.ts](../../src/app/api/admin/settings/route.ts).

Operations: GET: List Platform Settings; PATCH: Update a Platform Setting.

Body validators: `updatePlatformSettingSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `platformSetting.upsert`.

### `/api/admin/subjects/[id]`

Source: [route.ts](../../src/app/api/admin/subjects/[id]/route.ts).

Body validators: `updateSubjectSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorClass.count`, `topicRequest.count`, `topicCertification.count`, `assessmentQuestion.count`, `assessmentAttempt.count`, `questionRequest.count`, `subject.findUnique`, `subject.findFirst`, `subject.update`, `auditLog.create`, `subject.delete`.

Explicit restrictions/errors:

- Subject not found.

- Another subject already uses that name.

### `/api/admin/subjects/[id]/topics`

Source: [route.ts](../../src/app/api/admin/subjects/[id]/topics/route.ts).

Operations: POST: add a topic to a subject.

Body validators: `createTopicSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `subject.findUnique`, `topic.findFirst`, `topic.aggregate`, `topic.create`, `auditLog.create`.

Explicit restrictions/errors:

- Subject not found.

- That topic already exists for this subject.

### `/api/admin/subjects`

Source: [route.ts](../../src/app/api/admin/subjects/route.ts).

Operations: GET: full taxonomy (subjects + topics, including inactive); POST: create a subject.

Body validators: `createSubjectSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `subject.findMany`, `subject.findFirst`, `subject.aggregate`, `subject.create`, `auditLog.create`.

Explicit restrictions/errors:

- A subject with that name or slug already exists.

### `/api/admin/topic-requests/[id]`

Source: [route.ts](../../src/app/api/admin/topic-requests/[id]/route.ts).

Operations: PATCH: Close (→ CANCELLED) or re-open (→ OPEN) a topic request.

Body validators: `moderateTopicRequestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `topicRequest.findUnique`, `topicRequest.update`, `auditLog.create`.

Explicit restrictions/errors:

- Request not found.

- This request is already in a terminal state.

- Only a cancelled or accepted request can be re-opened.

### `/api/admin/topic-requests`

Source: [route.ts](../../src/app/api/admin/topic-requests/route.ts).

Operations: GET: List/search all topic requests platform-wide.

Query parameters: `q`, `subject`, `status`, `scope`, `page`, `pageSize`.

Direct model operations: `topicRequest.findMany`, `topicRequest.count`.

### `/api/admin/topics/[id]`

Source: [route.ts](../../src/app/api/admin/topics/[id]/route.ts).

Body validators: `updateTopicSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `classTopic.count`, `classSession.count`, `topicRequestTopic.count`, `topicCertification.count`, `assessmentQuestion.count`, `assessmentAttempt.count`, `questionRequest.count`, `classTopic.updateMany`, `classSession.updateMany`, `topicRequestTopic.updateMany`, `topicCertification.updateMany`, `assessmentQuestion.updateMany`, `assessmentAttempt.updateMany`, `questionRequest.updateMany`, `topic.findUnique`, `topic.findFirst`, `topic.update`, `auditLog.create`, `topic.delete`.

Explicit restrictions/errors:

- Topic not found.

- Another topic in this subject already uses that name.

### `/api/admin/users/[userId]`

Source: [route.ts](../../src/app/api/admin/users/[userId]/route.ts).

Operations: PATCH: Suspend, Ban, or Reactivate a Learner/Tutor Account.

Body validators: `updateUserStatusSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.findUnique`, `user.update`, `auditLog.create`.

Explicit restrictions/errors:

- User not found.

- Cannot modify an admin account.

### `/api/admin/users`

Source: [route.ts](../../src/app/api/admin/users/route.ts).

Operations: GET: List Learner + Tutor Accounts for Moderation.

Query parameters: `q`, `role`, `status`, `gradeLevel`, `page`, `pageSize`.

Direct model operations: `user.findMany`, `user.count`.

### `/api/auth/[...nextauth]`

Source: [route.ts](../../src/app/api/auth/[...nextauth]/route.ts).

Delegates GET/POST authentication protocol handling to NextAuth with shared credentials/JWT configuration; it is not a general-purpose public business API.

### `/api/auth/forgot-password`

Source: [route.ts](../../src/app/api/auth/forgot-password/route.ts).

Operations: POST: Request a password reset link.

Body validators: `forgotPasswordSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.findFirst`, `passwordResetToken.updateMany`, `passwordResetToken.create`.

### `/api/auth/resend-verification`

Source: [route.ts](../../src/app/api/auth/resend-verification/route.ts).

Operations: POST: Resend an email-verification link.

Body validators: `resendVerificationSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.findUnique`, `verificationToken.updateMany`, `verificationToken.create`.

### `/api/auth/reset-password`

Source: [route.ts](../../src/app/api/auth/reset-password/route.ts).

Operations: POST: Complete a password reset.

Body validators: `resetPasswordSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `passwordResetToken.findUnique`, `user.update`, `passwordResetToken.update`.

Explicit restrictions/errors:

- This reset link is invalid or has expired.

### `/api/auth/verify-email`

Source: [route.ts](../../src/app/api/auth/verify-email/route.ts).

Operations: POST: Confirm an email address via its verification token.

Body validators: `verifyEmailSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `verificationToken.findUnique`, `user.update`, `verificationToken.update`.

Explicit restrictions/errors:

- This verification link is invalid or has expired.

### `/api/chatbot`

Source: [route.ts](../../src/app/api/chatbot/route.ts).

Operations: POST: ask the intent-based assistant.

Body validators: `chatbotMessageSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.findUnique`.

Explicit restrictions/errors:

- The assistant is currently unavailable.

### `/api/classes/[classId]/enroll`

Source: [route.ts](../../src/app/api/classes/[classId]/enroll/route.ts).

Operations: POST: Enroll in a Class; DELETE: Unenroll from a Class.

Direct model operations: `tutorClass.findUnique`, `classEnrollment.findUnique`, `classEnrollment.create`, `topicRequest.updateMany`, `classEnrollment.delete`.

Explicit restrictions/errors:

- Class not found.

- This class is no longer accepting enrollments.

- This class has no upcoming sessions to enroll in.

- This class is already full.

- You are already enrolled in this class.

- You are not enrolled in this class.

- Cannot unenroll from a class that is already completed or cancelled.

### `/api/classes`

Source: [route.ts](../../src/app/api/classes/route.ts).

Operations: GET: Paginated Browsable / Enrolled Classes for a Learner.

Query parameters: `scope`, `page`, `pageSize`, `q`, `subject`, `gradeLevel`, `status`.

Direct model operations: `user.findUnique`, `classEnrollment.findMany`, `topicRequest.findMany`, `tutorClass.count`, `tutorClass.findMany`.

### `/api/dev`

Source: [route.ts](../../src/app/api/dev/route.ts).

Operations: GET: snapshot for the UI; POST: run one factory action.

Direct model operations: `user.findMany`, `user.count`, `tutorClass.findMany`, `user.create`, `tutorProfile.findUnique`, `tutorProfile.findFirst`, `tutorClass.create`, `tutorClass.findUnique`, `classEnrollment.create`, `topicRequest.create`, `tutorProfile.deleteMany`, `user.deleteMany`.

Explicit restrictions/errors:

- Not found.

- Invalid JSON body.

- role must be STUDENT_LEARNER, STUDENT_TUTOR or ADMIN.

- That tutor has no tutor profile.

- No tutors exist yet — create a tutor first.

- classId is required.

- Class not found.

- No learners exist yet — create a learner first.

Body dispatcher uses `action`: createUsers, createClass, enroll, createTopicRequests, wipeDevData. See D01 for per-action inputs and restrictions.

### `/api/learner/classes/[classId]/session-tests`

Source: [route.ts](../../src/app/api/learner/classes/[classId]/session-tests/route.ts).

Operations: GET: This Class's Sessions With Their Test Status (learner view).

Direct model operations: `classEnrollment.findUnique`, `classSession.findMany`.

Explicit restrictions/errors:

- You are not enrolled in this class.

### `/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start`

Source: [route.ts](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts).

Operations: POST: Start (or Resume) a PRE/POST Session Test.

Direct model operations: `sessionTest.findUnique`, `sessionTestAttempt.findUnique`, `sessionTestAttempt.create`.

Explicit restrictions/errors:

- Session tests are disabled.

- Not found.

- Test not found.

- This test is closed.

- You have already completed this test.

### `/api/learner/match`

Source: [route.ts](../../src/app/api/learner/match/route.ts).

Operations: POST: Rank browsable classes against a learner's criteria.

Body validators: `matchCriteriaSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorClass.findMany`.

Explicit restrictions/errors:

- Matching is currently unavailable.

- Invalid subject.

### `/api/learner/profile/password`

Source: [route.ts](../../src/app/api/learner/profile/password/route.ts).

Operations: POST: Change Own Password.

Body validators: `changePasswordSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

### `/api/learner/profile`

Source: [route.ts](../../src/app/api/learner/profile/route.ts).

Operations: PATCH: Update Own Editable Profile Fields.

Body validators: `updateProfileSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.update`.

### `/api/learner/progress`

Source: [route.ts](../../src/app/api/learner/progress/route.ts).

Operations: GET: The Learner's Own Pre/Post-Test Progress — chart (b).

Query parameters: `classId`.

Direct model operations: `classEnrollment.findMany`.

### `/api/learner/reports`

Source: [route.ts](../../src/app/api/learner/reports/route.ts).

Operations: GET: The caller's own reports; POST: A learner reports a tutor or a class.

Body validators: `createReportSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `report.findMany`, `user.findFirst`, `classEnrollment.findFirst`, `report.findFirst`, `tutorClass.findUnique`, `classEnrollment.findUnique`, `report.create`, `user.findMany`.

Explicit restrictions/errors:

- Tutor not found.

- You can only report a tutor whose class you have joined.

- You already have a report about this tutor awaiting review.

- Class not found.

- You can only report a class you are enrolled in.

- You already have a report about this class awaiting review.

### `/api/learner/session-test-attempts/[attemptId]`

Source: [route.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/route.ts).

Operations: GET: One of the Learner's Own Session-Test Attempts.

Direct model operations: `sessionTestAttempt.findUnique`.

Explicit restrictions/errors:

- Attempt not found.

### `/api/learner/session-test-attempts/[attemptId]/submit`

Source: [route.ts](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts).

Operations: POST: Grade & Submit a Session-Test Attempt.

Body validators: `submitAssessmentSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `sessionTestAttempt.findUnique`, `sessionTestAttemptItem.update`, `sessionTestAttempt.update`, `sessionTest.findUnique`.

Explicit restrictions/errors:

- Attempt not found.

- This attempt has already been submitted.

### `/api/learner/topic-requests/[id]`

Source: [route.ts](../../src/app/api/learner/topic-requests/[id]/route.ts).

Operations: PATCH: Cancel or edit one's own topic request.

Body validators: `cancelTopicRequestSchema`, `createTopicRequestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `topicRequest.findUnique`, `topicRequest.update`.

Explicit restrictions/errors:

- Request not found.

- Only an open or accepted request can be cancelled.

- Only an open request can be edited.

- Invalid subject.

### `/api/learner/topic-requests`

Source: [route.ts](../../src/app/api/learner/topic-requests/route.ts).

Operations: GET: The caller's own topic requests; POST: Create a topic request.

Body validators: `createTopicRequestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `topicRequest.findMany`, `user.findFirst`, `topicRequest.count`, `topicRequest.create`, `tutorProfile.findUnique`.

Explicit restrictions/errors:

- Matching is currently unavailable.

- Invalid subject.

- The selected tutor could not be found.

### `/api/learner/tutors`

Source: [route.ts](../../src/app/api/learner/tutors/route.ts).

Operations: GET: Browsable tutors (learner-facing, anonymized).

Query parameters: `q`, `subjects`, `subject`, `page`, `pageSize`.

Direct model operations: `user.findMany`, `user.count`.

### `/api/notifications/read`

Source: [route.ts](../../src/app/api/notifications/read/route.ts).

Operations: POST: Mark notifications read.

Direct model operations: `notification.updateMany`, `notification.count`.

### `/api/notifications`

Source: [route.ts](../../src/app/api/notifications/route.ts).

Operations: GET: The caller's own notifications, newest first.

Query parameters: `take`.

Direct model operations: `notification.findMany`, `notification.count`.

### `/api/register`

Source: [route.ts](../../src/app/api/register/route.ts).

Body validators: `registerSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Explicit restrictions/errors:

- Registration is currently closed.

- An account with this email already exists.

### `/api/search`

Source: [route.ts](../../src/app/api/search/route.ts).

Operations: GET: cross-cutting quick search for the top-bar box.

Query parameters: `q`, `scope`.

Direct model operations: `tutorClass.findMany`, `user.findMany`, `tutorProfile.findUnique`, `topicRequest.findMany`.

### `/api/subjects`

Source: [route.ts](../../src/app/api/subjects/route.ts).

Operations: GET: active subjects + topics, for populating dropdowns.

### `/api/tutor/assessments/[attemptId]`

Source: [route.ts](../../src/app/api/tutor/assessments/[attemptId]/route.ts).

Operations: GET: One of the Tutor's Own Attempts.

Direct model operations: `assessmentAttempt.findUnique`.

Explicit restrictions/errors:

- Attempt not found.

### `/api/tutor/assessments/[attemptId]/submit`

Source: [route.ts](../../src/app/api/tutor/assessments/[attemptId]/submit/route.ts).

Operations: POST: Grade & Submit an Attempt.

Body validators: `submitAssessmentSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `assessmentAttempt.findUnique`, `topicCertification.findUnique`, `assessmentAttemptItem.update`, `assessmentAttempt.update`, `topicCertification.upsert`.

Explicit restrictions/errors:

- Attempt not found.

- This attempt has already been submitted.

### `/api/tutor/assessments`

Source: [route.ts](../../src/app/api/tutor/assessments/route.ts).

Operations: GET: The Tutor's Own Attempts (summary, newest first); POST: Start (or Resume) an Assessment for a Topic.

Body validators: `startAssessmentSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `assessmentAttempt.findMany`, `assessmentAttempt.findFirst`, `topicCertification.findUnique`, `assessmentQuestion.count`, `assessmentAttempt.aggregate`, `assessmentAttempt.create`.

Explicit restrictions/errors:

- Tutor profile not found.

- You're already verified for this topic.

- This topic doesn't have enough questions yet. Request that an admin add some.

### `/api/tutor/classes/[classId]/appeal`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/appeal/route.ts).

Operations: POST: A tutor appeals a suspension/ban on one of their classes.

Body validators: `createClassAppealSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `tutorClass.findUnique`, `classAppeal.findFirst`, `classAppeal.create`, `user.findMany`.

Explicit restrictions/errors:

- Class not found.

- Forbidden.

- Only a suspended or banned class can be appealed.

- An appeal for this class is already awaiting review.

### `/api/tutor/classes/[classId]`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/route.ts).

Direct model operations: `tutorClass.findUnique`, `tutorProfile.findUnique`, `classSession.updateMany`, `tutorClass.update`, `topicRequest.findMany`, `topicRequest.update`, `classEnrollment.findMany`, `tutorClass.delete`.

Explicit restrictions/errors:

- Class not found.

- Forbidden.

- This class was suspended or banned by an administrator and can't be modified.

- Invalid class status.

- Please select at least one topic.

- Please provide a location (building/room) or a meeting link.

- Cannot delete a class that has enrolled learners. Please cancel the class instead.

### `/api/tutor/classes/[classId]/sessions/[sessionId]`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts).

Operations: PATCH: Reschedule or Change Status of a Single Session; DELETE: Remove a Single Session.

Body validators: `updateSessionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `tutorClass.findUnique`, `classSession.update`, `sessionTest.findUnique`, `classEnrollment.findMany`, `classSession.delete`.

Explicit restrictions/errors:

- Tutor profile not found.

- Class not found.

- Forbidden.

- This class was suspended or banned by an administrator and can't be modified.

- Session not found.

- Session topic must be one of the class's selected topics.

- Cannot schedule a session in the past.

- Time conflict detected: You already have a session scheduled during this time.

- Cannot delete a completed or cancelled session; its record is kept for history.

- Cannot delete the only session of a class with enrolled learners — cancel or delete the whole class instead.

### `/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route.ts).

Operations: GET: One Learner's Attempt on This Test (tutor drill-down).

Direct model operations: `sessionTestAttempt.findUnique`.

Explicit restrictions/errors:

- Test not found.

- Attempt not found.

### `/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts).

Operations: PUT: Replace the Test's Ordered Question Set.

Body validators: `setSessionTestQuestionsSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `assessmentQuestion.findMany`, `sessionTestQuestion.deleteMany`, `sessionTestQuestion.createMany`, `sessionTest.findUniqueOrThrow`.

Explicit restrictions/errors:

- Test not found.

- The question set is locked once the test is published or attempted.

- Duplicate question in the list.

- One or more questions are not available for this test.

### `/api/tutor/classes/[classId]/sessions/[sessionId]/test/results`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route.ts).

Operations: GET: Results — charts (c) per-question rate + (d) per-learner delta.

Explicit restrictions/errors:

- Test not found.

### `/api/tutor/classes/[classId]/sessions/[sessionId]/test`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts).

Operations: GET: This Session's Test (may not exist yet); POST: Create the Session's Test; PATCH: Edit Title / Instructions (DRAFT only); DELETE: Remove a Draft, Unattempted Test.

Body validators: `createSessionTestSchema`, `updateSessionTestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `sessionTest.create`, `sessionTest.update`, `sessionTest.delete`.

Explicit restrictions/errors:

- Session tests are disabled.

- This session already has a test.

- Test not found.

- Only a draft test can be edited.

- Only a draft test with no attempts can be deleted.

### `/api/tutor/classes/[classId]/sessions/[sessionId]/test/status`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts).

Operations: PATCH: Publish or Close a Test.

Body validators: `sessionTestStatusSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `sessionTest.update`, `classEnrollment.findMany`.

Explicit restrictions/errors:

- Test not found.

- Session tests are disabled.

- Only a draft test can be published.

- Add at least one question before publishing.

- Only a published test can be closed.

### `/api/tutor/classes/[classId]/sessions`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/sessions/route.ts).

Operations: POST: Add a New Session to an Existing Class.

Body validators: `addSessionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `tutorClass.findUnique`, `classSession.create`.

Explicit restrictions/errors:

- Tutor profile not found.

- Class not found.

- Forbidden.

- This class was suspended or banned by an administrator and can't be modified.

- Cannot add a session to a class that isn't scheduled.

- Session topic must be one of the class's selected topics.

- Cannot schedule a session in the past.

- Time conflict detected: You already have a session scheduled during this time.

### `/api/tutor/classes/[classId]/test-results`

Source: [route.ts](../../src/app/api/tutor/classes/[classId]/test-results/route.ts).

Operations: GET: Class Roll-up — chart (a) pre-vs-post average per session.

Explicit restrictions/errors:

- Class not found.

### `/api/tutor/classes`

Source: [route.ts](../../src/app/api/tutor/classes/route.ts).

Operations: GET: Fetch Tutor's Classes; POST: Create a New Class (with its initial sessions).

Query parameters: `status`.

Body validators: `createClassSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `tutorClass.findMany`, `topicCertification.findMany`, `tutorClass.create`.

Explicit restrictions/errors:

- Tutor profile not found.

- Invalid subject.

- Please select at least one topic.

- Every session's topic must be one of the class's selected topics.

- Cannot schedule a session in the past.

- Two or more of the submitted sessions overlap each other.

- Time conflict detected: You already have a session scheduled during this time.

### `/api/tutor/profile/password`

Source: [route.ts](../../src/app/api/tutor/profile/password/route.ts).

Operations: POST: Change Own Password.

Body validators: `changePasswordSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

### `/api/tutor/profile`

Source: [route.ts](../../src/app/api/tutor/profile/route.ts).

Operations: PATCH: Update Own Editable Profile Fields.

Body validators: `updateTutorProfileSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `user.update`.

### `/api/tutor/question-bank`

Source: [route.ts](../../src/app/api/tutor/question-bank/route.ts).

Operations: GET: Browse the Admin Question Bank (for building a session test).

Query parameters: `subject`, `topic`, `q`, `page`, `pageSize`.

Direct model operations: `assessmentQuestion.findMany`, `assessmentQuestion.count`.

### `/api/tutor/question-requests`

Source: [route.ts](../../src/app/api/tutor/question-requests/route.ts).

Operations: GET: The Tutor's Own Question Requests; POST: Ask an Admin to Add Questions for a Topic.

Body validators: `requestQuestionsSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `questionRequest.findMany`, `questionRequest.findUnique`, `questionRequest.upsert`, `user.findMany`.

Explicit restrictions/errors:

- Tutor profile not found.

### `/api/tutor/questions/[questionId]`

Source: [route.ts](../../src/app/api/tutor/questions/[questionId]/route.ts).

Operations: PATCH: Edit an Own Custom Question; DELETE: Remove an Own Custom Question.

Body validators: `updateTutorQuestionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `assessmentQuestion.findFirst`, `assessmentOption.deleteMany`, `assessmentOption.createMany`, `assessmentQuestion.update`, `sessionTestQuestion.deleteMany`, `assessmentQuestion.delete`.

Explicit restrictions/errors:

- Question not found.

- This question is on a published test and can no longer be edited.

- This question is on a published test and can no longer be deleted.

### `/api/tutor/questions`

Source: [route.ts](../../src/app/api/tutor/questions/route.ts).

Operations: GET: The Tutor's Own Custom Questions; POST: Author a Custom Question for a Session Test.

Query parameters: `topic`.

Body validators: `authorTutorQuestionSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `assessmentQuestion.findMany`, `assessmentQuestion.create`.

Explicit restrictions/errors:

- Tutor profile not found.

- Topic must be one of the class's topics.

### `/api/tutor/students`

Source: [route.ts](../../src/app/api/tutor/students/route.ts).

Operations: GET: Aggregate Roster Across All of the Tutor's Classes.

Query parameters: `gradeLevel`, `section`, `subject`, `classId`, `q`, `page`, `pageSize`.

Direct model operations: `tutorProfile.findUnique`, `classEnrollment.findMany`.

Explicit restrictions/errors:

- Tutor profile not found.

### `/api/tutor/topic-certifications`

Source: [route.ts](../../src/app/api/tutor/topic-certifications/route.ts).

Operations: GET: List the Tutor's Topic Certifications; POST: Request an Assessment for a Topic.

Body validators: `requestTopicCertificationSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `topicCertification.findMany`, `tutorClass.findMany`, `topicCertification.findUnique`, `topicCertification.upsert`.

Explicit restrictions/errors:

- Tutor profile not found.

### `/api/tutor/topic-requests/[id]/accept`

Source: [route.ts](../../src/app/api/tutor/topic-requests/[id]/accept/route.ts).

Operations: POST: Accept an open topic request by auto-creating a class.

Body validators: `acceptTopicRequestSchema`. Their field constraints are specified in the role chapters and [validation modules](../../src/lib/validations).

Direct model operations: `tutorProfile.findUnique`, `topicRequest.findUnique`, `topicCertification.findMany`, `topicRequest.findFirst`, `tutorClass.create`, `topicRequest.update`.

Explicit restrictions/errors:

- Matching is currently unavailable.

- Tutor profile not found.

- Request not found.

- This request is no longer open.

- You are not eligible to accept this request.

- The class subject must match the request's subject.

- Please select at least one topic.

- Every session's topic must be one of the class's selected topics.

- Cannot schedule a session in the past.

- Two or more of the submitted sessions overlap each other.

- Time conflict detected: You already have a session scheduled during this time.

### `/api/tutor/topic-requests`

Source: [route.ts](../../src/app/api/tutor/topic-requests/route.ts).

Operations: GET: Topic requests a tutor can act on.

Query parameters: `tab`, `subject`, `page`, `pageSize`.

Direct model operations: `tutorProfile.findUnique`, `topicRequest.count`, `topicRequest.findMany`, `topicCertification.findMany`.

Explicit restrictions/errors:

- Matching is currently unavailable.

- Tutor profile not found.

## Browser pages

Portal layouts/proxy protect role prefixes. Non-production pages have their own environment gates. A server-rendered detail page may query Prisma directly without a corresponding GET item API.

| Browser route | Behavior / composition | Source |
| --- | --- | --- |
| `/account-declined` | AuthLayout, BrandMark | [page](../../src/app/account-declined/page.tsx) |
| `/account-unverified` | AuthLayout, BrandMark, ResendVerificationButton | [page](../../src/app/account-unverified/page.tsx) |
| `/admin/abuse-reports` | Abuse Reports | [page](../../src/app/admin/abuse-reports/page.tsx) |
| `/admin/assessment/certifications` | Tutor Certifications | [page](../../src/app/admin/assessment/certifications/page.tsx) |
| `/admin/assessment/question-bank` | Question Bank | [page](../../src/app/admin/assessment/question-bank/page.tsx) |
| `/admin/assessment/requests` | Question Requests | [page](../../src/app/admin/assessment/requests/page.tsx) |
| `/admin/assessment/results` | Attempt Results | [page](../../src/app/admin/assessment/results/page.tsx) |
| `/admin/audit-log` | Audit Log | [page](../../src/app/admin/audit-log/page.tsx) |
| `/admin/certifications` | Redirect → /admin/assessment/certifications | [page](../../src/app/admin/certifications/page.tsx) |
| `/admin/chatbot` | Chatbot | [page](../../src/app/admin/chatbot/page.tsx) |
| `/admin/class-appeals` | Class Appeals | [page](../../src/app/admin/class-appeals/page.tsx) |
| `/admin/classes/[id]` | ClassDetailsView, SessionsList, RecommendClassForm, AnonymousIdBadge | [page](../../src/app/admin/classes/[id]/page.tsx) |
| `/admin/classes` | All Classes | [page](../../src/app/admin/classes/page.tsx) |
| `/admin/help` | Help & FAQs | [page](../../src/app/admin/help/page.tsx) |
| `/admin/notifications` | Notifications | [page](../../src/app/admin/notifications/page.tsx) |
| `/admin` | Admin Dashboard | [page](../../src/app/admin/page.tsx) |
| `/admin/question-bank` | Redirect → /admin/assessment/question-bank | [page](../../src/app/admin/question-bank/page.tsx) |
| `/admin/registrations` | Registration Approvals | [page](../../src/app/admin/registrations/page.tsx) |
| `/admin/reports` | Platform Reports | [page](../../src/app/admin/reports/page.tsx) |
| `/admin/session-tests` | Session Tests | [page](../../src/app/admin/session-tests/page.tsx) |
| `/admin/settings` | Platform Settings | [page](../../src/app/admin/settings/page.tsx) |
| `/admin/subjects` | Subjects & Topics | [page](../../src/app/admin/subjects/page.tsx) |
| `/admin/topic-requests` | Class Requests | [page](../../src/app/admin/topic-requests/page.tsx) |
| `/admin/users/[id]` | BackLink, PageHeader, AnonymousIdBadge, StatusBadge | [page](../../src/app/admin/users/[id]/page.tsx) |
| `/admin/users` | Learner & Tutor Accounts | [page](../../src/app/admin/users/page.tsx) |
| `/dashboard` | Server-rendered route; see linked page | [page](../../src/app/dashboard/page.tsx) |
| `/dev/charts` | Non-production only; DevChartLab | [page](../../src/app/dev/charts/page.tsx) |
| `/dev/login` | Non-production only; Tutors | [page](../../src/app/dev/login/page.tsx) |
| `/dev` | Non-production only; DevDataFactory | [page](../../src/app/dev/page.tsx) |
| `/forgot-password` | ForgotPasswordForm, AuthLayout | [page](../../src/app/forgot-password/page.tsx) |
| `/learner/classes/[classId]` | LearnerClassActions, TutorInfoTrigger, SessionTestsCard, MyProgressView | [page](../../src/app/learner/classes/[classId]/page.tsx) |
| `/learner/classes/[classId]/sessions/[sessionId]/test/[kind]` | SessionTestRunner | [page](../../src/app/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/page.tsx) |
| `/learner/classes` | Browse classes | [page](../../src/app/learner/classes/page.tsx) |
| `/learner/help` | Help & FAQs | [page](../../src/app/learner/help/page.tsx) |
| `/learner/match` | Auto Match | [page](../../src/app/learner/match/page.tsx) |
| `/learner/my-classes` | My classes | [page](../../src/app/learner/my-classes/page.tsx) |
| `/learner/notifications` | Notifications | [page](../../src/app/learner/notifications/page.tsx) |
| `/learner` | Welcome back | [page](../../src/app/learner/page.tsx) |
| `/learner/profile/edit` | ProfileEditView | [page](../../src/app/learner/profile/edit/page.tsx) |
| `/learner/profile` | ProfileView | [page](../../src/app/learner/profile/page.tsx) |
| `/learner/progress` | MyProgressView | [page](../../src/app/learner/progress/page.tsx) |
| `/learner/reports` | My Reports | [page](../../src/app/learner/reports/page.tsx) |
| `/learner/requests` | Class requests | [page](../../src/app/learner/requests/page.tsx) |
| `/learner/tutors/[tutorId]` | WeeklyTimetable, RequestTopicButton, ReportButton, TutorProfileClassTabs | [page](../../src/app/learner/tutors/[tutorId]/page.tsx) |
| `/learner/tutors` | Find tutors | [page](../../src/app/learner/tutors/page.tsx) |
| `/login` | LoginForm, AuthLayout | [page](../../src/app/login/page.tsx) |
| `/logout` | AuthLayout, LogoutConfirm | [page](../../src/app/logout/page.tsx) |
| `/` | StoryTimeline, PrivacyPayoff, StoryEnd, LandingFooter | [page](../../src/app/page.tsx) |
| `/pending-approval` | AuthLayout, BrandMark | [page](../../src/app/pending-approval/page.tsx) |
| `/privacy-policy` | BrandMark | [page](../../src/app/privacy-policy/page.tsx) |
| `/register/learner` | RegisterForm, AuthLayout | [page](../../src/app/register/learner/page.tsx) |
| `/register` | AuthLayout, BrandMark | [page](../../src/app/register/page.tsx) |
| `/register/tutor` | RegisterForm, AuthLayout | [page](../../src/app/register/tutor/page.tsx) |
| `/reset-password` | ResetPasswordForm, AuthLayout | [page](../../src/app/reset-password/page.tsx) |
| `/tutor/assessments/[attemptId]` | AssessmentQuizRunner | [page](../../src/app/tutor/assessments/[attemptId]/page.tsx) |
| `/tutor/assessments` | Your assessments | [page](../../src/app/tutor/assessments/page.tsx) |
| `/tutor/classes/[classId]/edit` | EditClassForm | [page](../../src/app/tutor/classes/[classId]/edit/page.tsx) |
| `/tutor/classes/[classId]` | ClassManageMenu, ClassAppealCard, SessionTestsCard, ClassProgressPanel | [page](../../src/app/tutor/classes/[classId]/page.tsx) |
| `/tutor/classes/[classId]/sessions/[sessionId]/test` | SessionTestBuilder | [page](../../src/app/tutor/classes/[classId]/sessions/[sessionId]/test/page.tsx) |
| `/tutor/classes/[classId]/sessions/[sessionId]/test/results` | SessionTestResults | [page](../../src/app/tutor/classes/[classId]/sessions/[sessionId]/test/results/page.tsx) |
| `/tutor/classes/new` | Schedule a tutoring class | [page](../../src/app/tutor/classes/new/page.tsx) |
| `/tutor/classes` | Your classes | [page](../../src/app/tutor/classes/page.tsx) |
| `/tutor/help` | Help & FAQs | [page](../../src/app/tutor/help/page.tsx) |
| `/tutor/notifications` | Notifications | [page](../../src/app/tutor/notifications/page.tsx) |
| `/tutor` | Manage your tutoring | [page](../../src/app/tutor/page.tsx) |
| `/tutor/profile/edit` | ProfileEditView | [page](../../src/app/tutor/profile/edit/page.tsx) |
| `/tutor/profile` | ProfileView | [page](../../src/app/tutor/profile/page.tsx) |
| `/tutor/requests/[id]/accept` | Accept & create class | [page](../../src/app/tutor/requests/[id]/accept/page.tsx) |
| `/tutor/requests` | Class requests | [page](../../src/app/tutor/requests/page.tsx) |
| `/tutor/students/[studentId]` | Anonymized profile | [page](../../src/app/tutor/students/[studentId]/page.tsx) |
| `/tutor/students` | Your students | [page](../../src/app/tutor/students/page.tsx) |
| `/unauthorized` | AuthLayout | [page](../../src/app/unauthorized/page.tsx) |
| `/verify-email/check-email` | AuthLayout, BrandMark, ResendVerificationButton | [page](../../src/app/verify-email/check-email/page.tsx) |
| `/verify-email` | VerifyEmailForm, AuthLayout | [page](../../src/app/verify-email/page.tsx) |

Inventory totals: **85 API route modules, 110 exported HTTP methods, 74 browser pages**. These totals count dynamic modules once, not every possible resource URL.
