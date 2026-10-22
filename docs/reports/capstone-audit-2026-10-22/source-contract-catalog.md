# Source contract catalog

Static extraction: direct Prisma calls omit helper/transitive effects. Status lists describe current code, not desired security behavior. Consult imported validators for exact request shapes. All endpoints require runtime verification.

## API-001: PATCH `/api/admin/abuse-reports/[reportId]`

- Source: `src/app/api/admin/abuse-reports/[reportId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: reviewReportSchema
- Direct DB calls: auditLog.create, report.findUnique, report.update
- Error contracts: Unauthorized.; Report not found.; This report has already been reviewed.; An unexpected error occurred. Please try again.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/report, @/lib/auditLog, @/lib/notifications

## API-002: GET `/api/admin/abuse-reports`

- Source: `src/app/api/admin/abuse-reports/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, status, targetType
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: report.count, report.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams

## API-003: GET `/api/admin/admins/[adminId]`

- Source: `src/app/api/admin/admins/[adminId]/route.ts`
- Roles detected: SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.findFirst
- Error contracts: Admin not found.; Failed to fetch admin details.
- Imports: @/lib/prisma, @/lib/permissions, @/lib/validations/admin, @/lib/auditLog

## API-004: PATCH `/api/admin/admins/[adminId]`

- Source: `src/app/api/admin/admins/[adminId]/route.ts`
- Roles detected: SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateAdminStatusSchema
- Direct DB calls: auditLog.create, user.findFirst, user.update
- Error contracts: You cannot suspend or modify your own account status.; Admin not found.; Cannot modify a Super Admin account.; Failed to update admin status.
- Imports: @/lib/prisma, @/lib/permissions, @/lib/validations/admin, @/lib/auditLog

## API-005: GET `/api/admin/admins`

- Source: `src/app/api/admin/admins/route.ts`
- Roles detected: SUPER_ADMIN
- Query parameters: page, pageSize, q, role, status
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.count, user.findMany
- Error contracts: Failed to fetch admin accounts.
- Imports: @/lib/prisma, @/lib/permissions, @/lib/validations/admin, @/lib/idGenerator, @/lib/passwordReset, @/lib/auditLog, @/lib/mail, @/lib/sortParams, @/lib/pagination

## API-006: POST `/api/admin/admins`

- Source: `src/app/api/admin/admins/route.ts`
- Roles detected: SUPER_ADMIN
- Query parameters: page, pageSize, q, role, status
- Validators: createAdminAccountSchema
- Direct DB calls: auditLog.create, passwordResetToken.create, user.create, user.findFirst
- Error contracts: An account with this email address already exists.; Failed to create admin account.
- Imports: @/lib/prisma, @/lib/permissions, @/lib/validations/admin, @/lib/idGenerator, @/lib/passwordReset, @/lib/auditLog, @/lib/mail, @/lib/sortParams, @/lib/pagination

## API-007: GET `/api/admin/assessment-attempts/[attemptId]`

- Source: `src/app/api/admin/assessment-attempts/[attemptId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentAttempt.findUnique
- Error contracts: Unauthorized.; Attempt not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/assessmentSerialize

## API-008: GET `/api/admin/assessment-attempts`

- Source: `src/app/api/admin/assessment-attempts/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, status, subject, topic
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentAttempt.count, assessmentAttempt.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma

## API-009: GET `/api/admin/assessment-configs`

- Source: `src/app/api/admin/assessment-configs/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/settings, @/lib/auditLog

## API-010: PATCH `/api/admin/assessment-configs`

- Source: `src/app/api/admin/assessment-configs/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateGlobalAssessmentConfigSchema
- Direct DB calls: auditLog.create, platformSetting.upsert
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/settings, @/lib/auditLog

## API-011: GET `/api/admin/assessment-questions/[questionId]`

- Source: `src/app/api/admin/assessment-questions/[questionId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; Question not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/auditLog

## API-012: PATCH `/api/admin/assessment-questions/[questionId]`

- Source: `src/app/api/admin/assessment-questions/[questionId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateAssessmentQuestionSchema
- Direct DB calls: assessmentOption.createMany, assessmentOption.deleteMany, assessmentQuestion.update, auditLog.create
- Error contracts: Unauthorized.; Question not found.; This question has been used in an attempt. Retire it and create a new one to change its content.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/auditLog

## API-013: DELETE `/api/admin/assessment-questions/[questionId]`

- Source: `src/app/api/admin/assessment-questions/[questionId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.delete, auditLog.create
- Error contracts: Unauthorized.; Question not found.; This question has been used in an attempt. Retire it instead of deleting.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/auditLog

## API-014: GET `/api/admin/assessment-questions/coverage`

- Source: `src/app/api/admin/assessment-questions/coverage/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.groupBy, questionRequest.groupBy
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjectTopics, @/lib/settings

## API-015: GET `/api/admin/assessment-questions`

- Source: `src/app/api/admin/assessment-questions/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: active, page, pageSize, q, subject, topic
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.count, assessmentQuestion.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/auditLog

## API-016: POST `/api/admin/assessment-questions`

- Source: `src/app/api/admin/assessment-questions/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: active, page, pageSize, q, subject, topic
- Validators: createAssessmentQuestionSchema
- Direct DB calls: assessmentQuestion.create, auditLog.create
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/auditLog

## API-017: GET `/api/admin/audit-log`

- Source: `src/app/api/admin/audit-log/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: action, dir, page, pageSize, q, sort, targetType
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: auditLog.count, auditLog.findMany, auditLog.groupBy
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/permissions

## API-018: PATCH `/api/admin/certifications/[certificationId]`

- Source: `src/app/api/admin/certifications/[certificationId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: reviewCertificationSchema
- Direct DB calls: auditLog.create, topicCertification.findUnique, topicCertification.update
- Error contracts: Unauthorized.; Certification request not found.; Only a pending certification request can be reviewed.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/notifications

## API-019: GET `/api/admin/certifications`

- Source: `src/app/api/admin/certifications/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, sort, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicCertification.count, topicCertification.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma

## API-020: GET `/api/admin/chatbot-misses`

- Source: `src/app/api/admin/chatbot-misses/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: dir, page, pageSize, q, role, sort
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: chatbotMiss.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/chatbot/misses

## API-021: PATCH `/api/admin/class-appeals/[appealId]`

- Source: `src/app/api/admin/class-appeals/[appealId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: reviewClassAppealSchema
- Direct DB calls: auditLog.create, classAppeal.findUnique, classAppeal.update, tutorClass.update
- Error contracts: Unauthorized.; Appeal not found.; This appeal has already been reviewed.; An unexpected error occurred. Please try again.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/classAppeal, @/lib/auditLog, @/lib/notifications

## API-022: GET `/api/admin/class-appeals`

- Source: `src/app/api/admin/class-appeals/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, status
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classAppeal.count, classAppeal.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams

## API-023: GET `/api/admin/classes/[classId]/recommendations`

- Source: `src/app/api/admin/classes/[classId]/recommendations/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classRecommendation.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/classRecommendation, @/lib/notifications

## API-024: POST `/api/admin/classes/[classId]/recommendations`

- Source: `src/app/api/admin/classes/[classId]/recommendations/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: createClassRecommendationSchema
- Direct DB calls: classRecommendation.create, classRecommendation.findUnique, tutorClass.findUnique, user.findFirst
- Error contracts: Unauthorized.; Class not found.; Learner not found.; This class has already been recommended to that learner.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/classRecommendation, @/lib/notifications

## API-025: PATCH `/api/admin/classes/[classId]`

- Source: `src/app/api/admin/classes/[classId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateClassStatusSchema
- Direct DB calls: auditLog.create, classEnrollment.findMany, topicRequest.findMany, tutorClass.findUnique, tutorClass.update
- Error contracts: Unauthorized.; Class not found.; Only a scheduled class can be suspended.; Only a scheduled or suspended class can be banned.; Only a suspended or banned class can be reinstated.; An unexpected error occurred.
- Imports: @/lib/updateTopicRequest, @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/moderation, @/lib/notifications

## API-026: GET `/api/admin/classes`

- Source: `src/app/api/admin/classes/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: tutorClass.count, tutorClass.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams

## API-027: POST `/api/admin/profile/password`

- Source: `src/app/api/admin/profile/password/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: changePasswordSchema
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/validations/changePassword, @/lib/changePassword

## API-028: PATCH `/api/admin/question-requests/[requestId]`

- Source: `src/app/api/admin/question-requests/[requestId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: resolveQuestionRequestSchema
- Direct DB calls: auditLog.create, questionRequest.findUnique, questionRequest.update
- Error contracts: Unauthorized.; Question request not found.; Only an open request can be resolved.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/auditLog, @/lib/notifications

## API-029: GET `/api/admin/question-requests`

- Source: `src/app/api/admin/question-requests/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: questionRequest.count, questionRequest.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma

## API-030: PATCH `/api/admin/registrations/[userId]`

- Source: `src/app/api/admin/registrations/[userId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: reviewRegistrationSchema
- Direct DB calls: auditLog.create, user.findUnique, user.update
- Error contracts: Unauthorized.; User not found.; This account is not awaiting approval.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/notifications

## API-031: GET `/api/admin/registrations`

- Source: `src/app/api/admin/registrations/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: gradeLevel, page, pageSize, q, role
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.count, user.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams

## API-032: GET `/api/admin/reports`

- Source: `src/app/api/admin/reports/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.count, classEnrollment.findMany, topicCertification.groupBy, tutorClass.groupBy, user.groupBy
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma

## API-033: GET `/api/admin/session-tests/[testId]/attempts/[attemptId]`

- Source: `src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTestAttempt.findUnique
- Error contracts: Unauthorized.; Attempt not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/sessionTestSerialize

## API-034: GET `/api/admin/session-tests/[testId]/results`

- Source: `src/app/api/admin/session-tests/[testId]/results/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; Test not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/sessionTestResults

## API-035: GET `/api/admin/session-tests`

- Source: `src/app/api/admin/session-tests/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTest.count, sessionTest.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma

## API-036: GET `/api/admin/settings`

- Source: `src/app/api/admin/settings/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/settings

## API-037: PATCH `/api/admin/settings`

- Source: `src/app/api/admin/settings/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updatePlatformSettingSchema, updateProfilePictureRequirementSchema
- Direct DB calls: platformSetting.upsert
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/settings

## API-038: PATCH `/api/admin/subjects/[id]`

- Source: `src/app/api/admin/subjects/[id]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateSubjectSchema
- Direct DB calls: auditLog.create, subject.findFirst, subject.findUnique, subject.update
- Error contracts: Unauthorized.; Subject not found.; Another subject already uses that name.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/auditLog

## API-039: DELETE `/api/admin/subjects/[id]`

- Source: `src/app/api/admin/subjects/[id]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: auditLog.create, subject.delete, subject.findUnique
- Error contracts: Unauthorized.; Subject not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/auditLog

## API-040: POST `/api/admin/subjects/[id]/topics`

- Source: `src/app/api/admin/subjects/[id]/topics/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: createTopicSchema
- Direct DB calls: auditLog.create, subject.findUnique, topic.aggregate, topic.create, topic.findFirst
- Error contracts: Unauthorized.; Subject not found.; That topic already exists for this subject.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/subjectTopics, @/lib/auditLog

## API-041: GET `/api/admin/subjects`

- Source: `src/app/api/admin/subjects/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: subject.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/auditLog

## API-042: POST `/api/admin/subjects`

- Source: `src/app/api/admin/subjects/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: createSubjectSchema
- Direct DB calls: auditLog.create, subject.aggregate, subject.create, subject.findFirst
- Error contracts: Unauthorized.; A subject with that name or slug already exists.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/auditLog

## API-043: PATCH `/api/admin/topic-requests/[id]`

- Source: `src/app/api/admin/topic-requests/[id]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: moderateTopicRequestSchema
- Direct DB calls: auditLog.create, topicRequest.findUnique, topicRequest.update
- Error contracts: Unauthorized.; Request not found.; This request is already in a terminal state.; Only a cancelled or accepted request can be re-opened.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/notifications, @/lib/topicRequestHistory

## API-044: GET `/api/admin/topic-requests`

- Source: `src/app/api/admin/topic-requests/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: page, pageSize, q, scope, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicRequest.count, topicRequest.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams

## API-045: PATCH `/api/admin/topics/[id]`

- Source: `src/app/api/admin/topics/[id]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateTopicSchema
- Direct DB calls: auditLog.create, topic.findFirst, topic.findUnique, topic.update
- Error contracts: Unauthorized.; Topic not found.; Another topic in this subject already uses that name.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/subjectTopics, @/lib/auditLog

## API-046: DELETE `/api/admin/topics/[id]`

- Source: `src/app/api/admin/topics/[id]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: auditLog.create, topic.delete, topic.findUnique, topic.update
- Error contracts: Unauthorized.; Topic not found.; An unexpected error occurred.
- Imports: @/lib/permissions, @/lib/auth, @/lib/prisma, @/lib/subjects, @/lib/validations/subject, @/lib/subjectTopics, @/lib/auditLog

## API-047: POST `/api/admin/users/[userId]/avatar-action`

- Source: `src/app/api/admin/users/[userId]/avatar-action/route.ts`
- Roles detected: ADMIN, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: moderateAvatarSchema
- Direct DB calls: auditLog.create, user.findUnique, user.update
- Error contracts: Unauthorized.; User not found.; Cannot moderate an admin account.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/notifications

## API-048: PATCH `/api/admin/users/[userId]`

- Source: `src/app/api/admin/users/[userId]/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: none extracted
- Validators: updateUserStatusSchema
- Direct DB calls: auditLog.create, user.findUnique, user.update
- Error contracts: Unauthorized.; User not found.; Cannot modify an admin account.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/admin, @/lib/auditLog, @/lib/moderation, @/lib/permissions

## API-049: GET `/api/admin/users`

- Source: `src/app/api/admin/users/route.ts`
- Roles detected: ADMIN, SUPER_ADMIN
- Query parameters: gradeLevel, page, pageSize, q, role, status
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.count, user.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/sortParams, @/lib/permissions

## API-050: GET `/api/auth/[...nextauth]`

- Source: `src/app/api/auth/[...nextauth]/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts:
- Imports: @/lib/auth

## API-051: POST `/api/auth/[...nextauth]`

- Source: `src/app/api/auth/[...nextauth]/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts:
- Imports: @/lib/auth

## API-052: POST `/api/auth/forgot-password`

- Source: `src/app/api/auth/forgot-password/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: forgotPasswordSchema
- Direct DB calls: passwordResetToken.create, passwordResetToken.updateMany, user.findFirst
- Error contracts: An unexpected error occurred. Please try again.
- Imports: @/lib/prisma, @/lib/validations/passwordReset, @/lib/passwordReset, @/lib/mail, @/lib/rateLimit, @/lib/datetime

## API-053: POST `/api/auth/resend-verification`

- Source: `src/app/api/auth/resend-verification/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: resendVerificationSchema
- Direct DB calls: user.findUnique, verificationToken.create, verificationToken.updateMany
- Error contracts: An unexpected error occurred. Please try again.
- Imports: @/lib/prisma, @/lib/validations/emailVerification, @/lib/emailVerification, @/lib/mail, @/lib/rateLimit, @/lib/datetime

## API-054: POST `/api/auth/reset-password`

- Source: `src/app/api/auth/reset-password/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: resetPasswordSchema
- Direct DB calls: passwordResetToken.findUnique, passwordResetToken.update, user.update
- Error contracts: An unexpected error occurred. Please try again.
- Imports: @/lib/prisma, @/lib/validations/passwordReset, @/lib/passwordReset, @/lib/rateLimit, @/lib/datetime

## API-055: POST `/api/auth/verify-email`

- Source: `src/app/api/auth/verify-email/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: verifyEmailSchema
- Direct DB calls: user.update, verificationToken.findUnique, verificationToken.update
- Error contracts: An unexpected error occurred. Please try again.
- Imports: @/lib/prisma, @/lib/validations/emailVerification, @/lib/emailVerification, @/lib/rateLimit, @/lib/datetime

## API-056: POST `/api/chatbot`

- Source: `src/app/api/chatbot/route.ts`
- Roles detected: authenticated role
- Query parameters: none extracted
- Validators: chatbotMessageSchema
- Direct DB calls: user.findUnique
- Error contracts: Unauthorized.; The assistant is currently unavailable.; An unexpected error occurred. Please try again.
- Imports: @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/validations/chatbot, @/lib/chatbot/respond, @/lib/chatbot/types, @/lib/rateLimit, @/lib/datetime

## API-057: POST `/api/classes/[classId]/enroll`

- Source: `src/app/api/classes/[classId]/enroll/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.create, classEnrollment.findUnique, topicRequest.findMany, tutorClass.findUnique, user.findUnique
- Error contracts: Unauthorized.; Class not found.; You cannot enroll in a class taught by a tutor in a lower grade level.; You cannot enroll in a class targeted at a lower grade level than your own.; This class is no longer accepting enrollments.; This class has no upcoming sessions to enroll in.; This class is already full.; You are already enrolled in this class.; An unexpected error occurred.
- Imports: @/lib/updateTopicRequest, @/lib/auth, @/lib/prisma, @/lib/moderation, @/lib/gradeLevels, @/lib/notifications

## API-058: DELETE `/api/classes/[classId]/enroll`

- Source: `src/app/api/classes/[classId]/enroll/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.delete, classEnrollment.findUnique, topicRequest.findMany, tutorClass.findUnique
- Error contracts: Unauthorized.; Class not found.; You are not enrolled in this class.; Cannot unenroll from a class that is already completed or cancelled.; An unexpected error occurred.
- Imports: @/lib/updateTopicRequest, @/lib/auth, @/lib/prisma, @/lib/moderation, @/lib/gradeLevels, @/lib/notifications

## API-059: GET `/api/classes`

- Source: `src/app/api/classes/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: gradeLevel, page, pageSize, q, scope, status, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: tutorClass.count, tutorClass.findMany, user.findUnique
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/moderation, @/lib/settings, @/lib/classQueries, @/lib/browseRanking, @/lib/subjects

## API-060: GET `/api/dev`

- Source: `src/app/api/dev/route.ts`
- Roles detected: ADMIN, STUDENT_LEARNER, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: tutorClass.findMany, user.count, user.findMany
- Error contracts:
- Imports: @/lib/topicRequestHistory, @/lib/prisma, @/lib/idGenerator, @/lib/registration, @/lib/subjectTopics

## API-061: POST `/api/dev`

- Source: `src/app/api/dev/route.ts`
- Roles detected: ADMIN, STUDENT_LEARNER, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.create, topicRequest.create, tutorClass.create, tutorClass.findUnique, tutorProfile.deleteMany, tutorProfile.findFirst, tutorProfile.findUnique, user.create, user.deleteMany, user.findMany, user.update
- Error contracts: Invalid JSON body.; , error);
    return NextResponse.json({ error: ; role must be STUDENT_LEARNER, STUDENT_TUTOR or ADMIN.; That tutor has no tutor profile.; No tutors exist yet — create a tutor first.; classId is required.; Class not found.; No learners exist yet — create a learner first.
- Imports: @/lib/topicRequestHistory, @/lib/prisma, @/lib/idGenerator, @/lib/registration, @/lib/subjectTopics

## API-062: GET `/api/health`

- Source: `src/app/api/health/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts:
- Imports: @/lib/prisma

## API-063: GET `/api/learner/classes/[classId]/session-tests`

- Source: `src/app/api/learner/classes/[classId]/session-tests/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.findUnique, classSession.findMany
- Error contracts: Unauthorized.; You are not enrolled in this class.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma

## API-064: POST `/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start`

- Source: `src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTest.findUnique, sessionTestAttempt.create, sessionTestAttempt.findUnique
- Error contracts: Unauthorized.; Session tests are disabled.; Not found.; Test not found.; This test is closed.; You have already completed this test.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/sessionTestAccess, @/lib/sessionTestSerialize, @/lib/settings

## API-065: POST `/api/learner/match`

- Source: `src/app/api/learner/match/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: matchCriteriaSchema
- Direct DB calls: tutorClass.findMany
- Error contracts: Unauthorized.; Matching is currently unavailable.; Invalid subject.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/moderation, @/lib/classQueries, @/lib/settings, @/lib/validations/match, @/lib/subjects, @/lib/matching

## API-066: POST `/api/learner/profile/password`

- Source: `src/app/api/learner/profile/password/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: changePasswordSchema
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/validations/changePassword, @/lib/changePassword

## API-067: PATCH `/api/learner/profile`

- Source: `src/app/api/learner/profile/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: updateProfileSchema
- Direct DB calls: user.update
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/profile

## API-068: GET `/api/learner/progress`

- Source: `src/app/api/learner/progress/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: classId
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma

## API-069: GET `/api/learner/reports`

- Source: `src/app/api/learner/reports/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: report.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/report, @/lib/notifications

## API-070: POST `/api/learner/reports`

- Source: `src/app/api/learner/reports/route.ts`
- Roles detected: ADMIN, STUDENT_LEARNER, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: createReportSchema
- Direct DB calls: classEnrollment.findFirst, classEnrollment.findUnique, report.create, report.findFirst, tutorClass.findUnique, user.findFirst, user.findMany
- Error contracts: Unauthorized.; Tutor not found.; You can only report a tutor whose class you have joined.; You already have a report about this tutor awaiting review.; Class not found.; You can only report a class you are enrolled in.; You already have a report about this class awaiting review.; An unexpected error occurred. Please try again.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/report, @/lib/notifications

## API-071: GET `/api/learner/session-test-attempts/[attemptId]`

- Source: `src/app/api/learner/session-test-attempts/[attemptId]/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTestAttempt.findUnique
- Error contracts: Unauthorized.; Attempt not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/sessionTestSerialize

## API-072: POST `/api/learner/session-test-attempts/[attemptId]/submit`

- Source: `src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: submitAssessmentSchema
- Direct DB calls: sessionTest.findUnique, sessionTestAttempt.findUnique, sessionTestAttempt.update, sessionTestAttemptItem.update
- Error contracts: Unauthorized.; Attempt not found.; This attempt has already been submitted.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/sessionTestSerialize, @/lib/gradeAttempt, @/lib/notifications

## API-073: PATCH `/api/learner/topic-requests/[id]`

- Source: `src/app/api/learner/topic-requests/[id]/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: cancelTopicRequestSchema, createTopicRequestSchema
- Direct DB calls: topicRequest.count, topicRequest.findUnique, topicRequest.update
- Error contracts: Unauthorized.; Request not found.; Only an open or accepted request can be cancelled.; Only an expired request can be renewed.; You already have 10 active requests.; Only an open request can be edited.; Invalid subject.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/match, @/lib/subjects, @/lib/topicRequestHistory

## API-074: GET `/api/learner/topic-requests`

- Source: `src/app/api/learner/topic-requests/route.ts`
- Roles detected: STUDENT_LEARNER
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicRequest.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/validations/match, @/lib/subjects, @/lib/gradeLevels, @/lib/notifications, @/lib/topicRequestHistory

## API-075: POST `/api/learner/topic-requests`

- Source: `src/app/api/learner/topic-requests/route.ts`
- Roles detected: STUDENT_LEARNER, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: createTopicRequestSchema
- Direct DB calls: topicRequest.count, topicRequest.create, tutorProfile.findUnique, user.findFirst
- Error contracts: Unauthorized.; Matching is currently unavailable.; Grade level is required.; Invalid subject.; The selected tutor could not be found.; You cannot request tutoring from a tutor in a lower grade level.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/validations/match, @/lib/subjects, @/lib/gradeLevels, @/lib/notifications, @/lib/topicRequestHistory

## API-076: GET `/api/learner/tutors`

- Source: `src/app/api/learner/tutors/route.ts`
- Roles detected: STUDENT_LEARNER, STUDENT_TUTOR
- Query parameters: page, pageSize, q, subject, subjects
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.count, user.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/moderation, @/lib/gradeLevels

## API-077: POST `/api/notifications/read`

- Source: `src/app/api/notifications/read/route.ts`
- Roles detected: authenticated role
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: notification.count, notification.updateMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma

## API-078: GET `/api/notifications`

- Source: `src/app/api/notifications/route.ts`
- Roles detected: authenticated role
- Query parameters: take
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: notification.count, notification.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma

## API-079: POST `/api/register`

- Source: `src/app/api/register/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: registerSchema
- Direct DB calls: helper/provider managed
- Error contracts: Registration is currently closed.; An account with this email already exists.; , error);
    return NextResponse.json(
      { error:
- Imports: @/lib/validations/auth, @/lib/settings, @/lib/registration, @/lib/mail, @/lib/rateLimit, @/lib/datetime

## API-080: GET `/api/search`

- Source: `src/app/api/search/route.ts`
- Roles detected: ADMIN, STUDENT_LEARNER, STUDENT_TUTOR, SUPER_ADMIN
- Query parameters: q, scope
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicRequest.findMany, tutorClass.findMany, tutorProfile.findUnique, user.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/classQueries, @/lib/gradeLevels, @/lib/subjects, @/lib/settings, @/lib/topicRequestVisibility, @/lib/portalPaths, @/lib/rateLimit, @/lib/datetime

## API-081: GET `/api/subjects`

- Source: `src/app/api/subjects/route.ts`
- Roles detected: authenticated role
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/subjects

## API-082: GET `/api/tutor/assessments/[attemptId]`

- Source: `src/app/api/tutor/assessments/[attemptId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentAttempt.findUnique
- Error contracts: Unauthorized.; Attempt not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/assessmentSerialize

## API-083: POST `/api/tutor/assessments/[attemptId]/submit`

- Source: `src/app/api/tutor/assessments/[attemptId]/submit/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: submitAssessmentSchema
- Direct DB calls: assessmentAttempt.findUnique, assessmentAttempt.update, assessmentAttemptItem.update, topicCertification.findUnique, topicCertification.upsert
- Error contracts: Unauthorized.; Attempt not found.; This attempt has already been submitted.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/validations/assessment, @/lib/assessmentSerialize, @/lib/gradeAttempt

## API-084: GET `/api/tutor/assessments`

- Source: `src/app/api/tutor/assessments/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentAttempt.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/settings, @/lib/assessmentPicker, @/lib/assessmentSerialize

## API-085: POST `/api/tutor/assessments`

- Source: `src/app/api/tutor/assessments/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: startAssessmentSchema
- Direct DB calls: assessmentAttempt.aggregate, assessmentAttempt.create, assessmentAttempt.findFirst, assessmentQuestion.count, topicCertification.findUnique, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; You're already verified for this topic.; This topic doesn't have enough questions yet. Request that an admin add some.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/settings, @/lib/assessmentPicker, @/lib/assessmentSerialize

## API-086: POST `/api/tutor/classes/[classId]/appeal`

- Source: `src/app/api/tutor/classes/[classId]/appeal/route.ts`
- Roles detected: ADMIN, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: createClassAppealSchema
- Direct DB calls: classAppeal.create, classAppeal.findFirst, tutorClass.findUnique, tutorProfile.findUnique, user.findMany
- Error contracts: Unauthorized.; Class not found.; Forbidden.; Only a suspended or banned class can be appealed.; An appeal for this class is already awaiting review.; An unexpected error occurred. Please try again.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/classAppeal, @/lib/notifications

## API-087: PATCH `/api/tutor/classes/[classId]`

- Source: `src/app/api/tutor/classes/[classId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.findMany, classSession.updateMany, topicRequest.findMany, tutorClass.findUnique, tutorClass.update, tutorProfile.findUnique
- Error contracts: Unauthorized.; Class not found.; Forbidden.; This class was suspended or banned by an administrator and can't be modified.; Invalid class status.; Target grade cannot be higher than your current grade level.; Please select at least one topic.; Please provide a location (building/room) or a meeting link.; An unexpected error occurred.
- Imports: @/lib/updateTopicRequest, @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/subjectTopics, @/lib/gradeLevels, @/lib/notifications

## API-088: DELETE `/api/tutor/classes/[classId]`

- Source: `src/app/api/tutor/classes/[classId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicRequest.findMany, tutorClass.delete, tutorClass.findUnique, tutorProfile.findUnique
- Error contracts: Unauthorized.; Class not found.; Forbidden.; Cannot delete a class that has enrolled learners. Please cancel the class instead.; An unexpected error occurred.
- Imports: @/lib/updateTopicRequest, @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/subjectTopics, @/lib/gradeLevels, @/lib/notifications

## API-089: PATCH `/api/tutor/classes/[classId]/sessions/[sessionId]`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: updateSessionSchema
- Direct DB calls: classEnrollment.findMany, classSession.update, sessionTest.findUnique, tutorClass.findUnique, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; Class not found.; Forbidden.; This class was suspended or banned by an administrator and can't be modified.; Session not found.; Session topic must be one of the class's selected topics.; Cannot schedule a session in the past.; Time conflict detected: You already have a session scheduled during this time.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/classSessions, @/lib/datetime, @/lib/notifications

## API-090: DELETE `/api/tutor/classes/[classId]/sessions/[sessionId]`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classSession.delete, tutorClass.findUnique, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; Class not found.; Forbidden.; This class was suspended or banned by an administrator and can't be modified.; Session not found.; Cannot delete a completed or cancelled session; its record is kept for history.; Cannot delete the only session of a class with enrolled learners — cancel or delete the whole class instead.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/classSessions, @/lib/datetime, @/lib/notifications

## API-091: GET `/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTestAttempt.findUnique
- Error contracts: Unauthorized.; Test not found.; Attempt not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/sessionTestAccess, @/lib/sessionTestSerialize

## API-092: PUT `/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: setSessionTestQuestionsSchema
- Direct DB calls: assessmentQuestion.findMany, sessionTest.findUniqueOrThrow, sessionTestQuestion.createMany, sessionTestQuestion.deleteMany
- Error contracts: Unauthorized.; Test not found.; The question set is locked once the test is published or attempted.; Duplicate question in the list.; One or more questions are not available for this test.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/sessionTestSerialize

## API-093: GET `/api/tutor/classes/[classId]/sessions/[sessionId]/test/results`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/results/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; Test not found.; Test not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/sessionTestAccess, @/lib/sessionTestResults

## API-094: GET `/api/tutor/classes/[classId]/sessions/[sessionId]/test`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/sessionTestSerialize, @/lib/settings

## API-095: POST `/api/tutor/classes/[classId]/sessions/[sessionId]/test`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: createSessionTestSchema
- Direct DB calls: sessionTest.create
- Error contracts: Unauthorized.; Session tests are disabled.; This session already has a test.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/sessionTestSerialize, @/lib/settings

## API-096: PATCH `/api/tutor/classes/[classId]/sessions/[sessionId]/test`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: updateSessionTestSchema
- Direct DB calls: sessionTest.update
- Error contracts: Unauthorized.; Test not found.; Only a draft test can be edited.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/sessionTestSerialize, @/lib/settings

## API-097: DELETE `/api/tutor/classes/[classId]/sessions/[sessionId]/test`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: sessionTest.delete
- Error contracts: Unauthorized.; Test not found.; Only a draft test with no attempts can be deleted.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/sessionTestSerialize, @/lib/settings

## API-098: PATCH `/api/tutor/classes/[classId]/sessions/[sessionId]/test/status`

- Source: `src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: sessionTestStatusSchema
- Direct DB calls: classEnrollment.findMany, sessionTest.update
- Error contracts: Unauthorized.; Test not found.; Session tests are disabled.; Only a draft test can be published.; Add at least one question before publishing.; Only a published test can be closed.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess, @/lib/notifications, @/lib/settings

## API-099: POST `/api/tutor/classes/[classId]/sessions`

- Source: `src/app/api/tutor/classes/[classId]/sessions/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: addSessionSchema
- Direct DB calls: classSession.create, tutorClass.findUnique, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; Class not found.; Forbidden.; This class was suspended or banned by an administrator and can't be modified.; Cannot add a session to a class that isn't scheduled.; Session topic must be one of the class's selected topics.; Cannot schedule a session in the past.; Time conflict detected: You already have a session scheduled during this time.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/classSessions, @/lib/datetime

## API-100: GET `/api/tutor/classes/[classId]/test-results`

- Source: `src/app/api/tutor/classes/[classId]/test-results/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; Class not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/sessionTestAccess, @/lib/sessionTestResults

## API-101: GET `/api/tutor/classes`

- Source: `src/app/api/tutor/classes/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: status
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: tutorClass.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/subjectTopics, @/lib/subjects, @/lib/gradeLevels, @/lib/settings, @/lib/classSessions, @/lib/datetime, @/lib/idGenerator

## API-102: POST `/api/tutor/classes`

- Source: `src/app/api/tutor/classes/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: status
- Validators: createClassSchema
- Direct DB calls: topicCertification.findMany, tutorClass.create, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; A profile picture is required to create classes. Please upload one in your profile settings.; Target grade cannot be higher than your current grade level.; Invalid subject.; Please select at least one topic.; Every session's topic must be one of the class's selected topics.; Cannot schedule a session in the past.; Two or more of the submitted sessions overlap each other.; Time conflict detected: You already have a session scheduled during this time.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/class, @/lib/subjectTopics, @/lib/subjects, @/lib/gradeLevels, @/lib/settings, @/lib/classSessions, @/lib/datetime, @/lib/idGenerator

## API-103: POST `/api/tutor/profile/password`

- Source: `src/app/api/tutor/profile/password/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: changePasswordSchema
- Direct DB calls: helper/provider managed
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/validations/changePassword, @/lib/changePassword

## API-104: PATCH `/api/tutor/profile`

- Source: `src/app/api/tutor/profile/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: updateTutorProfileSchema
- Direct DB calls: user.update
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/profile

## API-105: GET `/api/tutor/question-bank`

- Source: `src/app/api/tutor/question-bank/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: page, pageSize, q, subject, topic
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.count, assessmentQuestion.findMany
- Error contracts: Unauthorized.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma

## API-106: GET `/api/tutor/question-requests`

- Source: `src/app/api/tutor/question-requests/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: questionRequest.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/notifications

## API-107: POST `/api/tutor/question-requests`

- Source: `src/app/api/tutor/question-requests/route.ts`
- Roles detected: ADMIN, STUDENT_TUTOR
- Query parameters: none extracted
- Validators: requestQuestionsSchema
- Direct DB calls: questionRequest.findUnique, questionRequest.upsert, tutorProfile.findUnique, user.findMany
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/assessment, @/lib/subjects, @/lib/notifications

## API-108: PATCH `/api/tutor/questions/[questionId]`

- Source: `src/app/api/tutor/questions/[questionId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: updateTutorQuestionSchema
- Direct DB calls: assessmentOption.createMany, assessmentOption.deleteMany, assessmentQuestion.update
- Error contracts: Unauthorized.; Question not found.; This question is on a published test and can no longer be edited.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest

## API-109: DELETE `/api/tutor/questions/[questionId]`

- Source: `src/app/api/tutor/questions/[questionId]/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.delete, sessionTestQuestion.deleteMany
- Error contracts: Unauthorized.; Question not found.; This question is on a published test and can no longer be deleted.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest

## API-110: GET `/api/tutor/questions`

- Source: `src/app/api/tutor/questions/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: topic
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: assessmentQuestion.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess

## API-111: POST `/api/tutor/questions`

- Source: `src/app/api/tutor/questions/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: topic
- Validators: authorTutorQuestionSchema
- Direct DB calls: assessmentQuestion.create
- Error contracts: Unauthorized.; Topic must be one of the class's topics.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/sessionTest, @/lib/sessionTestAccess

## API-112: GET `/api/tutor/students`

- Source: `src/app/api/tutor/students/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: classId, gradeLevel, page, pageSize, q, section, subject
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: classEnrollment.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma

## API-113: GET `/api/tutor/topic-certifications`

- Source: `src/app/api/tutor/topic-certifications/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicCertification.findMany, tutorClass.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/topicCertification, @/lib/subjects

## API-114: POST `/api/tutor/topic-certifications`

- Source: `src/app/api/tutor/topic-certifications/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: requestTopicCertificationSchema
- Direct DB calls: topicCertification.findUnique, topicCertification.upsert, tutorProfile.findUnique
- Error contracts: Unauthorized.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/validations/topicCertification, @/lib/subjects

## API-115: POST `/api/tutor/topic-requests/[id]/accept`

- Source: `src/app/api/tutor/topic-requests/[id]/accept/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: none extracted
- Validators: acceptTopicRequestSchema
- Direct DB calls: topicCertification.findMany, topicRequest.findFirst, topicRequest.findUnique, topicRequest.findUniqueOrThrow, topicRequest.update, tutorClass.create, tutorProfile.findUnique
- Error contracts: Unauthorized.; Matching is currently unavailable.; Tutor profile not found.; Request not found.; This request is no longer open.; You cannot teach students in a higher grade level than your own.; You are not eligible to accept this request.; Target grade cannot be higher than your current grade level.; The class subject must match the request's subject.; Please select at least one topic.; Every session's topic must be one of the class's selected topics.; Cannot schedule a session in the past.; Two or more of the submitted sessions overlap each other.; Time conflict detected: You already have a session scheduled during this time.; This request has expired.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/validations/match, @/lib/subjectTopics, @/lib/classSessions, @/lib/datetime, @/lib/idGenerator, @/lib/topicRequestVisibility, @/lib/topicRequestHistory, @/lib/gradeLevels, @/lib/notifications

## API-116: GET `/api/tutor/topic-requests`

- Source: `src/app/api/tutor/topic-requests/route.ts`
- Roles detected: STUDENT_TUTOR
- Query parameters: page, pageSize, subject, tab
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: topicCertification.findMany, topicRequest.count, topicRequest.findMany, tutorProfile.findUnique
- Error contracts: Unauthorized.; Matching is currently unavailable.; Tutor profile not found.; An unexpected error occurred.
- Imports: @/lib/pagination, @/lib/auth, @/lib/prisma, @/lib/settings, @/lib/topicRequestVisibility

## API-117: GET `/api/uploadthing`

- Source: `src/app/api/uploadthing/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts:
- Imports:

## API-118: POST `/api/uploadthing`

- Source: `src/app/api/uploadthing/route.ts`
- Roles detected: public/provider/dev guard: inspect source
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: helper/provider managed
- Error contracts:
- Imports:

## API-119: GET `/api/user/profile-picture`

- Source: `src/app/api/user/profile-picture/route.ts`
- Roles detected: authenticated role
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.findUnique
- Error contracts: Unauthorized.; User not found.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma

## API-120: DELETE `/api/user/profile-picture`

- Source: `src/app/api/user/profile-picture/route.ts`
- Roles detected: authenticated role
- Query parameters: none extracted
- Validators: provider/helper/manual/no body; inspect source
- Direct DB calls: user.findUnique, user.update
- Error contracts: Unauthorized.; User not found.; Profile picture editing has been locked by an administrator.; An unexpected error occurred.
- Imports: @/lib/auth, @/lib/prisma
