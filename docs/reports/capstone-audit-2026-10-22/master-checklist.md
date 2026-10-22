# Master functional testing checklist

Check only after executing and attaching evidence. Source existence never checks a box. Companion test-cases.csv carries full cases.

## F-001 — Identity: Learner and tutor registration

Routes: /register; /register/learner; /register/tutor. Backend: /api/register. Tables: users, tutor_profiles, id_counters, verification_tokens.

- [ ] **TC-0001** Register learner QA Lumen, qa.learner@example.test, GRADE_9, QA-A, consent=true; one User and one unique anonymous ID persist after relogin
- [ ] **TC-0002** Register tutor QA Sol, qa.tutor@example.test, GRADE_10; exactly one TutorProfile belongs to the new User
- [ ] **TC-0003** Repeat normalized email, omit consent, use whitespace-only names; reject without extra rows
- [ ] **TC-0004** Use 7/8 characters and 72/73 UTF-8 bytes for password; weak blocked values rejected; accepted value stored as bcrypt hash
- [ ] **TC-0005** Submit recoveryEmail=qa.recovery@example.test; database must retain it (BUG-006)
- [ ] **TC-0006** Disable registrationOpen; return 403 and create zero rows

## F-002 — Identity: Credential login and role dashboard routing

Routes: /login; /dashboard. Backend: /api/auth/[...nextauth]. Tables: users.

- [ ] **TC-0007** Use valid role account; redirect to its portal; invalid email and password have identical generic message
- [ ] **TC-0008** Pending, declined, suspended, banned and unverified accounts follow correct guard messages and pages
- [ ] **TC-0009** After eleven attempts from one IP/email within ten minutes, throttle; uppercase and whitespace email variants must not evade limits
- [ ] **TC-0010** Manipulate callbackUrl to https://example.test; session must not redirect outside approved origin

## F-003 — Identity: Logout and JWT lifecycle

Routes: /logout; /dashboard. Backend: /api/auth/[...nextauth]. Tables: users.

- [ ] **TC-0011** Cancel logout keeps session; confirm clears session and subsequent protected calls fail
- [ ] **TC-0012** Use expired/tampered cookie; deny portal and API without revealing account data
- [ ] **TC-0013** Suspend logged-in tutor; replay direct API request before and after five-minute refresh; both must deny according to approved revocation policy (BUG-001)
- [ ] **TC-0014** Change/reset password; replay earlier device JWT; require documented revocation policy and reject if immediate revocation is required

## F-004 — Identity: Email verification and resend

Routes: /verify-email; /verify-email/check-email; /account-unverified. Backend: /api/auth/verify-email; /api/auth/resend-verification. Tables: users, verification_tokens.

- [ ] **TC-0015** Enable requireEmailVerification; capture link in isolated mail sink; login denied until one successful confirmation
- [ ] **TC-0016** Expired, reused and random token return 400 without updates; replacement invalidates prior unused token
- [ ] **TC-0017** Unknown/already-verified email produces same neutral response; fourth email request in fifteen minutes throttles
- [ ] **TC-0018** Two parallel confirmations consume token once; no inconsistent usedAt or verifiedAt

## F-005 — Identity: Password recovery and own password changes

Routes: /forgot-password; /reset-password; /learner/profile; /tutor/profile; /admin/settings. Backend: /api/auth/forgot-password; /api/auth/reset-password; /api/learner/profile/password; /api/tutor/profile/password; /api/admin/profile/password. Tables: users, password_reset_tokens.

- [ ] **TC-0019** Reset primary or recovery email via local mail sink; old password fails and new password succeeds
- [ ] **TC-0020** Random, expired, used token return 400; wrong current password returns 401 and preserves stored hash
- [ ] **TC-0021** Parallel use of one reset token with different new passwords permits at most one success
- [ ] **TC-0022** SMTP failure remains neutral and recoverable; never copy real tokens into evidence

## F-006 — Shared: Public landing and privacy information

Routes: /; /privacy-policy. Backend: Server components / sampleData. Tables: none.

- [ ] **TC-0023** Every registration/login/privacy anchor reaches existing target; sample matching and charts clearly remain demo data
- [ ] **TC-0024** Read consent and peer-identity statements against actual avatar and showTutorRealNames behavior; resolve contradictions

## F-007 — Shared: Account status and error pages

Routes: /account-declined; /pending-approval; /account-unverified; /unauthorized. Backend: Auth sentinels / proxy. Tables: users.

- [ ] **TC-0025** Each auth sentinel reaches correct status page and safe next action
- [ ] **TC-0026** Inject HTML-shaped decline reason; render text; no execution or confidential moderation details

## F-008 — Shared: Portal navigation, theme, timetable and help

Routes: /learner/help; /tutor/help; /admin/help; role layouts. Backend: PortalLayout / WeeklyTimetable / HelpCenter. Tables: none.

- [ ] **TC-0027** All role sidebar, topbar, timetable, profile, help and logout links resolve with correct active item
- [ ] **TC-0028** Toggle theme and reload; chosen theme persists with readable charts and dialogs
- [ ] **TC-0029** Keyboard opens/closes mobile navigation, modal and search; focus returns to trigger
- [ ] **TC-0030** Help search, FAQ expand/collapse and empty result work for each role

## F-009 — Shared: Role-aware global quick search

Routes: All portal topbars. Backend: /api/search. Tables: users, tutor_classes, subjects, topics.

- [ ] **TC-0031** q=A returns empty groups; q=QA returns bounded groups with working role-appropriate links
- [ ] **TC-0032** Search classCode, tutorCode, subject and topic scopes; tutor sees own classes; learner never receives real identity when hidden
- [ ] **TC-0033** Send HTML and SQL-like literal text; no execution or broadened data scope; forty-first request per minute throttles

## F-010 — Shared: Notifications and read state

Routes: /learner/notifications; /tutor/notifications; /admin/notifications. Backend: /api/notifications; /api/notifications/read. Tables: notifications.

- [ ] **TC-0034** Generate class enrollment event; recipient bell and list show one notification with valid portal link
- [ ] **TC-0035** Mark selected notification read then all read; unread count agrees after refresh
- [ ] **TC-0036** Send other user notification IDs; zero foreign rows change; take=0,-1,51,1.5 is clamped safely
- [ ] **TC-0037** Malformed body must not unexpectedly mark all unread records read

## F-011 — Shared: Deterministic chatbot and miss review

Routes: Portal ChatWidget; /admin/chatbot. Backend: /api/chatbot; /api/admin/chatbot-misses. Tables: chatbot_misses, tutor_classes, users.

- [ ] **TC-0038** Ask Where are my classes? and How do I reset my password?; answer links belong to caller role
- [ ] **TC-0039** Ask zxqv unknown QA; fallback records a sanitized miss visible only to admin grouping
- [ ] **TC-0040** Ask for matching classes; obey grade, status, capacity and identity filters
- [ ] **TC-0041** Disable chatbotEnabled; POST returns 403; oversized/empty message returns 400; twenty-first request per minute returns 429

## F-012 — Shared: Avatar upload, replace, remove and moderation

Routes: ProfilePictureUpload; UserAvatar; /admin/users/[id]. Backend: /api/uploadthing; /api/user/profile-picture; /api/admin/users/[userId]/avatar-action. Tables: users, audit_logs.

- [ ] **TC-0042** Upload safe 128px PNG then replace with JPEG; one current DB key/URL persists; old cloud object removed
- [ ] **TC-0043** Upload >2MB, two files, invalid content and oversized dimensions; reject without executable or unsafe stored asset
- [ ] **TC-0044** Locked avatar rejects upload and self-removal; admin remove/lock/unlock records correct audit action
- [ ] **TC-0045** Force DB failure after upload and cloud deletion failure; preserve or reconcile old/new object and DB reference
- [ ] **TC-0046** Verify avatar visibility for all 4x4 viewer/target roles, self and guest; identifiable photos must match approved privacy policy

## F-013 — Learner: Dashboard and own enrolled classes

Routes: /learner; /learner/my-classes. Backend: Server Prisma queries; /api/classes. Tables: users, tutor_classes, class_enrollments, class_recommendations.

- [ ] **TC-0047** Dashboard counts and upcoming sessions equal only caller enrollments; linked classes open
- [ ] **TC-0048** Enroll and unenroll in separate session; dashboard/my-classes update after intended refresh and relogin
- [ ] **TC-0049** No enrollments produces actionable empty state; cancelled sessions excluded from upcoming timetable

## F-014 — Learner: Browse and inspect classes

Routes: /learner/classes; /learner/classes/[classId]. Backend: /api/classes. Tables: tutor_classes, class_topics, class_sessions, topic_certifications, class_enrollments.

- [ ] **TC-0050** Filter by subject/topic/grade/format, sort, paginate and clear filters; displayed counts equal returned dataset
- [ ] **TC-0051** Unpublished, full, banned, suspended, cancelled and no-future-session records follow browse policy
- [ ] **TC-0052** Directly open unpublished/foreign class IDs; enforce visibility without leaking roster PII
- [ ] **TC-0053** Inspect meeting location, time, duration, verified topic and roster counts; API and DB values agree

## F-015 — Learner: Browse verified tutors and tutor detail

Routes: /learner/tutors; /learner/tutors/[tutorId]. Backend: /api/learner/tutors; server detail query. Tables: users, tutor_profiles, topic_certifications, tutor_classes.

- [ ] **TC-0054** Search anonymous ID and select two subjects; results certified in BOTH chosen subjects
- [ ] **TC-0055** Lower-grade, inactive and uncertified tutors excluded according to eligibility; paginate without duplicate rows
- [ ] **TC-0056** Detail tabs, schedule, verified topics and request action agree with API; hidden identities absent from HTML/network

## F-016 — Learner: Enroll and unenroll

Routes: /learner/classes/[classId]. Backend: /api/classes/[classId]/enroll. Tables: class_enrollments, topic_requests, topic_request_history, notifications.

- [ ] **TC-0057** POST eligible published future class; 201 and exactly one enrollment; linked ACCEPTED request becomes ENROLLED with history and notification
- [ ] **TC-0058** Duplicate enrollment 409; full class 409; missing class 404; disallowed grade 403
- [ ] **TC-0059** DELETE own scheduled enrollment; success, row absent, linked request ACCEPTED and tutor notified
- [ ] **TC-0060** Try unenrolling from completed/cancelled/suspended class or foreign learner; no unintended change
- [ ] **TC-0061** Two learners race for final seat; exactly one succeeds and count never exceeds maxStudents

## F-017 — Learner: Automatic class matching

Routes: /learner/match. Backend: /api/learner/match. Tables: tutor_classes, class_sessions, class_enrollments, topic_certifications.

- [ ] **TC-0062** For fixed now=2026-11-02T00:00:00Z, score two classes with controlled topic/certification/grade/slot inputs; order equals matching.ts weights
- [ ] **TC-0063** Exclude wrong subject, zero topic overlap, full, unpublished and past-only classes; solo/group filter works
- [ ] **TC-0064** No matches offers request creation without precreating records
- [ ] **TC-0065** Repeat Monday 15:00 Asia/Manila with UTC server; selected slot and rank remain correct (RISK-002)
- [ ] **TC-0066** Disable matchingEnabled; return 403 with recoverable UI

## F-018 — Learner: Create public or directed class request

Routes: /learner/requests; /learner/tutors/[tutorId]. Backend: /api/learner/topic-requests. Tables: topic_requests, topic_request_topics, topic_request_slots, topic_request_history, notifications.

- [ ] **TC-0067** Create MATH request using exact active catalog topic, GRADE_9, Monday 15:00-17:00, note=QA audit; persist OPEN, expiry=lastSubmittedAt+72h and CREATED history
- [ ] **TC-0068** Directed request visible only to intended eligible tutor and owner/admin; nonexistent/lower-grade tutor rejected
- [ ] **TC-0069** Create eleventh active request; reject; invalid subject/topic, reversed/overlapping slots and note 501 chars rejected
- [ ] **TC-0070** Refresh/relogin; topic, slots, directed target and remaining expiry agree with DB

## F-019 — Learner: Edit, cancel, renew and track request history

Routes: /learner/requests/[id]. Backend: /api/learner/topic-requests/[id]. Tables: topic_requests, topic_request_topics, topic_request_slots, topic_request_history.

- [ ] **TC-0071** Edit own OPEN request; all nested replacements atomic and history before/after reflects saved state
- [ ] **TC-0072** Cancel OPEN/ACCEPTED; forbid other invalid transitions and foreign IDs
- [ ] **TC-0073** At exactly expiry, hide from open tutor pool; renew only expired eligible request and reset 72h deadline
- [ ] **TC-0074** Track ACCEPTED to ENROLLED to FULFILLED across class completion; display append-only ordered history
- [ ] **TC-0075** Race cancel/renew/edit against acceptance; no duplicate class or silently overwritten transition

## F-020 — Learner: Take session PRE and POST tests

Routes: /learner/classes/[classId]/sessions/[sessionId]/test/[kind]. Backend: /api/learner/classes/[classId]/session-tests; /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start; /api/learner/session-test-attempts/[attemptId]; /api/learner/session-test-attempts/[attemptId]/submit. Tables: session_tests, session_test_questions, session_test_attempts, session_test_attempt_items.

- [ ] **TC-0076** Enrolled learner starts published PRE; no correctness/explanation fields before submit; resume same attempt after reload
- [ ] **TC-0077** Before session COMPLETED, POST unavailable; afterward identical question IDs/order served as POST
- [ ] **TC-0078** Submit 2 correct of 3 served questions; scorePercent=67, unanswered/foreign option wrong; values persist
- [ ] **TC-0079** Other learner attempt ID gives 404; repeated submit 409; invalid kind/nonenrollment/closed test denied
- [ ] **TC-0080** Disable sessionTestsEnabled mid-attempt and unenroll mid-attempt; apply explicitly approved access policy
- [ ] **TC-0081** Parallel start/submit leaves one attempt per test+learner+kind and one final result

## F-021 — Learner: Progress charts and result drill-down

Routes: /learner/progress. Backend: /api/learner/progress. Tables: session_test_attempts, session_test_attempt_items, class_enrollments.

- [ ] **TC-0082** PRE=40 POST=80 produces +40 percentage points for matched pair; absent POST shown missing, not zero
- [ ] **TC-0083** Charts/table show only caller; per-subject/session filters, tooltip and empty state agree with DB
- [ ] **TC-0084** Withdraw/re-enroll and cancelled session retain documented historical results without double count

## F-022 — Learner: File and track abuse reports

Routes: /learner/reports; class/tutor report dialogs. Backend: /api/learner/reports. Tables: reports, report_violations, notifications.

- [ ] **TC-0085** Report enrolled class or its tutor with OTHER and QA audit note; exactly one pending report with selected violations
- [ ] **TC-0086** Report unenrolled or nonexistent target denied; duplicate pending report rejected; empty violation/detail boundaries validated
- [ ] **TC-0087** Admin resolves/dismisses; learner sees status/resolution; other learner cannot read own-report list

## F-023 — Learner: Own profile and password settings

Routes: /learner/profile; /learner/profile/edit. Backend: /api/learner/profile; /api/learner/profile/password. Tables: users.

- [ ] **TC-0088** Change grade/section/contact/recovery email; normalize valid values and persist after logout/login
- [ ] **TC-0089** Try role, status, name, email and other user ID injection; protected values never change
- [ ] **TC-0090** Reject invalid contact, invalid grade and >50-character section; clearing optional recovery email stores intended null
- [ ] **TC-0091** After grade change, browsing, matching and class eligibility use the new grade consistently

## F-024 — Tutor: Own profile and password settings

Routes: /tutor/profile; /tutor/profile/edit. Backend: /api/tutor/profile; /api/tutor/profile/password. Tables: users.

- [ ] **TC-0092** Change grade/section/contact/recovery email; normalize valid values and persist after logout/login
- [ ] **TC-0093** Try role, status, name, email and other user ID injection; protected values never change
- [ ] **TC-0094** Reject invalid contact, invalid grade and >50-character section; clearing optional recovery email stores intended null
- [ ] **TC-0095** After grade change, browsing, matching and class eligibility use the new grade consistently

## F-025 — Tutor: Dashboard, classes and weekly schedule

Routes: /tutor; /tutor/classes. Backend: /api/tutor/classes; server queries. Tables: tutor_profiles, tutor_classes, class_sessions, class_enrollments.

- [ ] **TC-0096** Dashboard counts equal tutor-owned DB rows; status tabs, search, pagination and schedule links work
- [ ] **TC-0097** No classes/certifications produce useful empty state; cross-tutor class not exposed
- [ ] **TC-0098** Completed/cancelled sessions render history correctly without occupying active schedule

## F-026 — Tutor: Create class with sessions

Routes: /tutor/classes/new. Backend: /api/tutor/classes. Tables: tutor_classes, class_topics, class_sessions, id_counters.

- [ ] **TC-0099** Create QA MATH class with catalog topic, capacity=2, building=QA Lab, room=1, future 60-minute session; code unique and children atomic
- [ ] **TC-0100** Boundary capacity 0/1/10/11, duration 14/15/240/241, topics 0/1/10/11, sessions 0/1/20/21; reject outside bounds
- [ ] **TC-0101** Reject no location/link, invalid link, higher target grade, past and overlapping sessions
- [ ] **TC-0102** Enable certification gate; uncertified selected topic denied; gate off allows creation but must align approved objectives (BUG-003)
- [ ] **TC-0103** Concurrent overlapping creations must not book same tutor twice

## F-027 — Tutor: Edit, cancel, delete and publish class

Routes: /tutor/classes/[classId]; /tutor/classes/[classId]/edit. Backend: /api/tutor/classes/[classId]. Tables: tutor_classes, class_topics, class_sessions, class_enrollments, topic_requests, topic_request_history.

- [ ] **TC-0104** GET owned class only; PATCH description/location/capacity/publication/status with allowed transitions; refresh persists
- [ ] **TC-0105** Capacity cannot shrink below enrolled count; removing topic cannot invalidate remaining sessions
- [ ] **TC-0106** Cancel class updates dependent scheduled sessions and linked requests/history as specified
- [ ] **TC-0107** DELETE only deletable class; enrolled/completed-history cases must retain required evidence
- [ ] **TC-0108** Suspended/banned or other tutor class edits/deletion denied; forged owner ID ignored

## F-028 — Tutor: Add, reschedule, complete, cancel and delete session

Routes: /tutor/classes/[classId]. Backend: /api/tutor/classes/[classId]/sessions; /api/tutor/classes/[classId]/sessions/[sessionId]. Tables: class_sessions, tutor_classes, topic_requests, topic_request_history, notifications.

- [ ] **TC-0109** Add upcoming selected-topic session; update time/duration; verify cross-class overlap and back-to-back boundary
- [ ] **TC-0110** Mark COMPLETED; POST test becomes available; final-session/class status and fulfilled requests consistent
- [ ] **TC-0111** Cancel session; future timetable removes it; allowed scheduled session delete removes only that row
- [ ] **TC-0112** DELETE completed/cancelled or attempted-test session denied; mismatched class/session IDs denied
- [ ] **TC-0113** Race completion against reschedule/cancel; state and history never contradict

## F-029 — Tutor: Appeal moderated class

Routes: /tutor/classes/[classId]. Backend: /api/tutor/classes/[classId]/appeal. Tables: class_appeals, tutor_classes, notifications.

- [ ] **TC-0114** Owner submits QA appeal on suspended/banned class; one PENDING appeal; admin notified
- [ ] **TC-0115** Reject duplicate pending, empty/oversized reason, normal class and foreign ownership
- [ ] **TC-0116** Admin approves/rejects with note; correct class state and tutor notification persist

## F-030 — Tutor: Student roster and student detail

Routes: /tutor/students; /tutor/students/[studentId]. Backend: /api/tutor/students; server detail queries. Tables: class_enrollments, users, tutor_classes.

- [ ] **TC-0117** One learner enrolled in two own classes appears according to aggregation policy and detail lists both
- [ ] **TC-0118** Student not in own classes returns not-found/denied; no real name/email/contact appears to tutor
- [ ] **TC-0119** Filters, sort, paging, class links and avatar visibility match privacy requirements

## F-031 — Tutor: Certification summary, request and qualifying assessment

Routes: /tutor/assessments; /tutor/assessments/[attemptId]. Backend: /api/tutor/topic-certifications; /api/tutor/assessments; /api/tutor/assessments/[attemptId]; /api/tutor/assessments/[attemptId]/submit. Tables: topic_certifications, assessment_attempts, assessment_attempt_items, assessment_questions, assessment_options.

- [ ] **TC-0120** Request current topic; list certification and attempt history; inadequate bank prompts question request
- [ ] **TC-0121** Start/resume attempt; BANK-only random questions and no pre-submit answer flags; questionCount/passPercent snapshot retained
- [ ] **TC-0122** At threshold score pass; below threshold fail; no existing CERTIFIED badge downgraded on failed retake
- [ ] **TC-0123** autoCertifyOnAssessmentPass false creates PENDING for admin; true grants CERTIFIED; repeated submit 409
- [ ] **TC-0124** Access tutor question bank before quiz; correct-answer keys must not defeat qualification (BUG-002)
- [ ] **TC-0125** Concurrent starts/submits create consistent attemptNo and one terminal certification decision

## F-032 — Tutor: Question-bank browse and missing-question requests

Routes: /tutor/assessments; SessionTestBuilder. Backend: /api/tutor/question-bank; /api/tutor/question-requests. Tables: assessment_questions, question_requests.

- [ ] **TC-0126** Filter active bank by subject/topic/search/page; exclude other tutors custom questions
- [ ] **TC-0127** Request questions with 500-character note; duplicate topic request behaves deterministically without extra row
- [ ] **TC-0128** Admin resolves/dismisses; tutor sees latest status; no other tutor request identity exposed
- [ ] **TC-0129** Qualification answers must remain protected while permitting session-test authoring

## F-033 — Tutor: Author, edit and delete custom test questions

Routes: SessionTestBuilder / QuestionFormModal. Backend: /api/tutor/questions; /api/tutor/questions/[questionId]. Tables: assessment_questions, assessment_options.

- [ ] **TC-0130** CREATE own TUTOR question with exactly one correct option; READ own question list
- [ ] **TC-0131** PATCH unused own prompt/options; DELETE unused own question; preserve other questions
- [ ] **TC-0132** Reject 0/2 correct options, duplicate IDs, wrong subject/topic and foreign owner question
- [ ] **TC-0133** Published or attempted question editing/deletion cannot mutate historical results; draft linkage handled safely

## F-034 — Tutor: Session-test create, read, edit, delete and ordering

Routes: /tutor/classes/[classId]/sessions/[sessionId]/test. Backend: /api/tutor/classes/[classId]/sessions/[sessionId]/test; /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions. Tables: session_tests, session_test_questions, assessment_questions.

- [ ] **TC-0134** POST one DRAFT test per session; GET and PATCH title/instructions; DELETE only unattempted draft
- [ ] **TC-0135** PUT ordered mixed BANK and own TUTOR question IDs; serve exact stable order
- [ ] **TC-0136** Reject duplicate, retired, wrong-topic, foreign-custom IDs and duplicate session test creation
- [ ] **TC-0137** Attempted/published question set locked; parent class/session mismatch denied

## F-035 — Tutor: Publish and close session test

Routes: SessionTestBuilder. Backend: /api/tutor/classes/[classId]/sessions/[sessionId]/test/status. Tables: session_tests, notifications.

- [ ] **TC-0138** Publish nonempty DRAFT; publishedAt set and learner PRE available
- [ ] **TC-0139** Publish empty/non-DRAFT or close non-PUBLISHED returns expected 400/409 with no mutation
- [ ] **TC-0140** Close published test; closedAt set, new attempts blocked; sessionTestsEnabled false blocks publication

## F-036 — Tutor: Session-test results and class roll-up

Routes: /tutor/classes/[classId]/sessions/[sessionId]/test/results; ClassProgressPanel. Backend: /api/tutor/classes/[classId]/sessions/[sessionId]/test/results; /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]; /api/tutor/classes/[classId]/test-results. Tables: session_test_attempts, session_test_attempt_items.

- [ ] **TC-0141** Controlled paired results produce exact per-question rates and per-learner percentage-point delta
- [ ] **TC-0142** Unsubmitted/missing pair not counted as completed zero score; denominators match submitted rows
- [ ] **TC-0143** Drill-down constrained to test/session/class/tutor owner; anonymous learner only; class roll-up agrees with session results

## F-037 — Tutor: Accept public or directed class request

Routes: /tutor/requests; /tutor/requests/[id]; /tutor/requests/[id]/accept. Backend: /api/tutor/topic-requests; /api/tutor/topic-requests/[id]/accept. Tables: topic_requests, topic_request_history, tutor_classes, class_sessions, notifications.

- [ ] **TC-0144** Eligible tutor accepts OPEN active request with future class payload; one class linked, status ACCEPTED, learner notification; no automatic enrollment
- [ ] **TC-0145** Foreign-directed, expired, already accepted, higher-grade, incompatible subject/topic and conflicting schedule denied
- [ ] **TC-0146** Two tutors accept same request concurrently; exactly one class wins; no orphan extra class
- [ ] **TC-0147** Open/accepted/history tabs and 72-hour expiry filters agree with learner/admin

## F-038 — Administration: Dashboard analytics and reports

Routes: /admin; /admin/reports. Backend: /api/admin/reports; server aggregates. Tables: users, tutor_classes, class_enrollments, topic_certifications.

- [ ] **TC-0148** Fixture with known role/status counts, enrollments and certifications yields exact dashboards
- [ ] **TC-0149** Filters/date buckets/chart tables reflect same population; zero denominators never NaN
- [ ] **TC-0150** CSV download if offered handles =SUM(1+1), commas, quotes and newlines safely; no unintended identity export

## F-039 — Administration: Student account lookup, editing and moderation

Routes: /admin/users; /admin/users/[id]. Backend: /api/admin/users; /api/admin/users/[userId]. Tables: users, audit_logs, notifications.

- [ ] **TC-0151** List/filter/search/sort/paginate users; detail real identity visible only to admin roles
- [ ] **TC-0152** Suspend with reason/until, ban and reinstate; one audit record each; expired suspension correctly clears
- [ ] **TC-0153** Update permitted identity/account fields; reject duplicate email and student privilege escalation
- [ ] **TC-0154** ADMIN cannot target administrative account via student-management API; super-admin-only functions enforced
- [ ] **TC-0155** Logged-in banned target loses API authority (BUG-001)

## F-040 — Administration: Registration approval and decline

Routes: /admin/registrations. Backend: /api/admin/registrations; /api/admin/registrations/[userId]. Tables: users, audit_logs, notifications.

- [ ] **TC-0156** Enable approval; pending queue lists new account; approve ACTIVE or decline DECLINED with safe reason
- [ ] **TC-0157** Review nonpending/missing user rejected; duplicate/concurrent review has single final decision
- [ ] **TC-0158** Approved account still requires verified email if setting on; disabled approval does not silently approve prior pending

## F-041 — Administration: Admin account provisioning and status

Routes: /admin/admins. Backend: /api/admin/admins; /api/admin/admins/[adminId]. Tables: users, audit_logs.

- [ ] **TC-0159** SUPER_ADMIN creates QA ADMIN and lists/detail account; password hashed; duplicate email rejected
- [ ] **TC-0160** Ordinary ADMIN, tutor, learner and guest denied GET/POST/PATCH regardless of hidden menu
- [ ] **TC-0161** Cannot suspend own SUPER_ADMIN or modify another SUPER_ADMIN; status changes audit correctly
- [ ] **TC-0162** Provisioned ADMIN logs in; no API promotes student to SUPER_ADMIN

## F-042 — Administration: Class moderation and recommendations

Routes: /admin/classes; /admin/classes/[id]. Backend: /api/admin/classes; /api/admin/classes/[classId]; /api/admin/classes/[classId]/recommendations. Tables: tutor_classes, class_recommendations, audit_logs, notifications.

- [ ] **TC-0163** Filter and view class/roster; suspend SCHEDULED, ban permitted states, reinstate moderated state with reason/until
- [ ] **TC-0164** Reject invalid transition; automatic expiry reinstates and records intended state
- [ ] **TC-0165** Recommend eligible class to learner; unique pair and notification/link persist; duplicate returns 409
- [ ] **TC-0166** Recommended full/unpublished/ineligible class must not bypass enrollment grade/capacity policy

## F-043 — Administration: Appeal and abuse report review

Routes: /admin/class-appeals; /admin/abuse-reports. Backend: /api/admin/class-appeals; /api/admin/class-appeals/[appealId]; /api/admin/abuse-reports; /api/admin/abuse-reports/[reportId]. Tables: class_appeals, reports, report_violations, tutor_classes, audit_logs, notifications.

- [ ] **TC-0167** Review pending appeal APPROVED/REJECTED; class status, reviewer/time and note persist
- [ ] **TC-0168** Resolve/dismiss pending abuse report; reviewedBy, reviewedAt, note and audit agree
- [ ] **TC-0169** Repeat review, invalid decision and missing IDs rejected; parallel decisions cannot overwrite silently
- [ ] **TC-0170** Moderation list filters/pagination/detail and reporter privacy enforced

## F-044 — Administration: Certification review and attempt inspection

Routes: /admin/assessment/certifications; /admin/assessment/results; /admin/certifications. Backend: /api/admin/certifications; /api/admin/certifications/[certificationId]; /api/admin/assessment-attempts; /api/admin/assessment-attempts/[attemptId]. Tables: topic_certifications, assessment_attempts, assessment_attempt_items, audit_logs, notifications.

- [ ] **TC-0171** Inspect full attempts as admin; scores/options agree with stored submission
- [ ] **TC-0172** Approve/reject PENDING certification; timestamps/review note and tutor badge correct
- [ ] **TC-0173** Reject review of nonpending/missing ID; legacy /admin/certifications redirects correctly
- [ ] **TC-0174** Failed/no attempt must not be approved contrary to chosen certification rules

## F-045 — Administration: Assessment bank CRUD, coverage and configuration

Routes: /admin/assessment/question-bank; /admin/question-bank. Backend: /api/admin/assessment-questions; /api/admin/assessment-questions/[questionId]; /api/admin/assessment-questions/coverage; /api/admin/assessment-configs. Tables: assessment_questions, assessment_options, platform_settings, audit_logs.

- [ ] **TC-0175** CREATE BANK question; READ detail/list/coverage; PATCH unused prompt/options; DELETE unused only
- [ ] **TC-0176** Used question cannot content-edit/delete; retirement active=false retains attempt history; published-but-unattempted links remain stable
- [ ] **TC-0177** Question prompt 4/5/1000/1001 chars, option 0/1/500/501 chars and exactly-one-correct validation enforced
- [ ] **TC-0178** Config questionCount=1/50, passPercent=1/100, minBankSize=1/200 accepted; beyond range rejected
- [ ] **TC-0179** Ensure questionCount > minBankSize policy cannot start empty/undersized quiz; legacy bank URL redirects

## F-046 — Administration: Question request resolution

Routes: /admin/assessment/requests. Backend: /api/admin/question-requests; /api/admin/question-requests/[requestId]. Tables: question_requests, audit_logs, notifications.

- [ ] **TC-0180** Filter OPEN requests; populate bank then RESOLVED with note, or DISMISSED
- [ ] **TC-0181** Repeat/non-OPEN/unknown request decision rejected; tutor sees resolution
- [ ] **TC-0182** Resolving request does not imply adequate bank without count check

## F-047 — Administration: Curriculum subject and topic CRUD

Routes: /admin/subjects. Backend: /api/admin/subjects; /api/admin/subjects/[id]; /api/admin/subjects/[id]/topics; /api/admin/topics/[id]; /api/subjects. Tables: subjects, topics, tutor_classes, class_topics, class_sessions, topic_request_topics, assessment_questions, topic_certifications.

- [ ] **TC-0183** CREATE subject/topic; READ admin and active public catalog; PATCH name/order/active; DELETE unused subject/topic
- [ ] **TC-0184** Duplicate slug/name/per-subject topic rejected; inactive taxonomy removed from new selectors
- [ ] **TC-0185** Rename used topic; all denormalized class/session/request/question/certification references updated atomically
- [ ] **TC-0186** Delete in-use subject rejected; in-use topic soft-deactivated; historical results preserved
- [ ] **TC-0187** Catalog cache invalidates after edits and on second app process; DB outage must not silently accept stale inactive topic

## F-048 — Administration: Class-request moderation and history

Routes: /admin/topic-requests; /admin/topic-requests/[id]. Backend: /api/admin/topic-requests; /api/admin/topic-requests/[id]. Tables: topic_requests, topic_request_history, audit_logs, notifications.

- [ ] **TC-0188** Filter active/expired/status rows and inspect exact history chronology
- [ ] **TC-0189** Permitted moderation/reopen action records actor and before/after snapshot plus new deadline where specified
- [ ] **TC-0190** Missing/invalid ID and forbidden transitions rejected; learner/tutor never accesses admin history through direct API

## F-049 — Administration: Platform flags, avatar policy and own password

Routes: /admin/settings. Backend: /api/admin/settings; /api/admin/profile/password; /api/admin/assessment-configs. Tables: platform_settings, audit_logs, users.

- [ ] **TC-0191** Toggle each of nine boolean flags one at a time; new request behavior changes and persists after restart
- [ ] **TC-0192** Set profilePictureRequirement OPTIONAL/TUTORS_ONLY/ALL_USERS; each affected role sees correct gate
- [ ] **TC-0193** Reject unknown key, string boolean, invalid policy and unauthorized call; one audit per successful setting change
- [ ] **TC-0194** Reconcile requireCertificationForClassCreation=false and showTutorRealNames=true with approved certification/privacy objectives

## F-050 — Administration: Audit log filters and evidence

Routes: /admin/audit-log. Backend: /api/admin/audit-log. Tables: audit_logs, users.

- [ ] **TC-0195** Moderate known QA target then filter action/target/admin/date/sort/page; one accurate actor/reason record
- [ ] **TC-0196** No password/token/secret in reasons; student/guest direct request denied
- [ ] **TC-0197** Force operation rollback; no success audit survives failed mutation; real identities remain admin-only

## F-051 — Administration: Read-only learner session-test inspection

Routes: /admin/session-tests. Backend: /api/admin/session-tests; /api/admin/session-tests/[testId]/results; /api/admin/session-tests/[testId]/attempts/[attemptId]. Tables: session_tests, session_test_attempts, session_test_attempt_items.

- [ ] **TC-0198** Filter tests and drill into exact learner attempt; aggregate equals tutor and learner views
- [ ] **TC-0199** Wrong test/attempt pairing gives 404; student cannot access admin result data
- [ ] **TC-0200** No mutation buttons or update endpoints invented for admin read-only inspection

## F-052 — Operations: Health, production dev guards and safe data utilities

Routes: /dev; /dev/login; /dev/charts. Backend: /api/health; /api/dev; scripts/*. Tables: users, tutor_classes, class_enrollments, topic_requests.

- [ ] **TC-0201** Health returns 200 connected or 503 disconnected and Cache-Control no-store without internal credentials
- [ ] **TC-0202** Production GET/POST /api/dev and all dev pages return 404 before DB access
- [ ] **TC-0203** Local dev factory create users/classes/enrollment/requests and cleanup tested only on disposable database; never shared data
- [ ] **TC-0204** Migrations replay to fresh disposable MariaDB, seed essentials and super-admin bootstrap are idempotent and cannot seed demo credentials into production

## Complete page, API, database and component coverage

Every page has separate normal/navigation and six viewport cases in test-cases.csv. Every exported API method has separate valid, invalid/failure, authentication (when applicable), ID boundary (when applicable) and concurrent mutation cases. Every Prisma model has a constraint/relationship case. Every reusable component has an interaction/accessibility case. These are explicit case rows, not implied coverage.

## API

- [ ] **TC-0205** API-001 positive PATCH /api/admin/abuse-reports/[reportId]
- [ ] **TC-0206** API-001 anonymous/wrong role/inactive PATCH /api/admin/abuse-reports/[reportId]
- [ ] **TC-0207** API-001 invalid/missing/foreign ID PATCH /api/admin/abuse-reports/[reportId]
- [ ] **TC-0208** API-001 invalid request/failure PATCH /api/admin/abuse-reports/[reportId]
- [ ] **TC-0209** API-001 duplicate/concurrent PATCH /api/admin/abuse-reports/[reportId]
- [ ] **TC-0210** API-002 positive GET /api/admin/abuse-reports
- [ ] **TC-0211** API-002 anonymous/wrong role/inactive GET /api/admin/abuse-reports
- [ ] **TC-0212** API-002 invalid request/failure GET /api/admin/abuse-reports
- [ ] **TC-0213** API-003 positive GET /api/admin/admins/[adminId]
- [ ] **TC-0214** API-003 anonymous/wrong role/inactive GET /api/admin/admins/[adminId]
- [ ] **TC-0215** API-003 invalid/missing/foreign ID GET /api/admin/admins/[adminId]
- [ ] **TC-0216** API-003 invalid request/failure GET /api/admin/admins/[adminId]
- [ ] **TC-0217** API-004 positive PATCH /api/admin/admins/[adminId]
- [ ] **TC-0218** API-004 anonymous/wrong role/inactive PATCH /api/admin/admins/[adminId]
- [ ] **TC-0219** API-004 invalid/missing/foreign ID PATCH /api/admin/admins/[adminId]
- [ ] **TC-0220** API-004 invalid request/failure PATCH /api/admin/admins/[adminId]
- [ ] **TC-0221** API-004 duplicate/concurrent PATCH /api/admin/admins/[adminId]
- [ ] **TC-0222** API-005 positive GET /api/admin/admins
- [ ] **TC-0223** API-005 anonymous/wrong role/inactive GET /api/admin/admins
- [ ] **TC-0224** API-005 invalid request/failure GET /api/admin/admins
- [ ] **TC-0225** API-006 positive POST /api/admin/admins
- [ ] **TC-0226** API-006 anonymous/wrong role/inactive POST /api/admin/admins
- [ ] **TC-0227** API-006 invalid request/failure POST /api/admin/admins
- [ ] **TC-0228** API-006 duplicate/concurrent POST /api/admin/admins
- [ ] **TC-0229** API-007 positive GET /api/admin/assessment-attempts/[attemptId]
- [ ] **TC-0230** API-007 anonymous/wrong role/inactive GET /api/admin/assessment-attempts/[attemptId]
- [ ] **TC-0231** API-007 invalid/missing/foreign ID GET /api/admin/assessment-attempts/[attemptId]
- [ ] **TC-0232** API-007 invalid request/failure GET /api/admin/assessment-attempts/[attemptId]
- [ ] **TC-0233** API-008 positive GET /api/admin/assessment-attempts
- [ ] **TC-0234** API-008 anonymous/wrong role/inactive GET /api/admin/assessment-attempts
- [ ] **TC-0235** API-008 invalid request/failure GET /api/admin/assessment-attempts
- [ ] **TC-0236** API-009 positive GET /api/admin/assessment-configs
- [ ] **TC-0237** API-009 anonymous/wrong role/inactive GET /api/admin/assessment-configs
- [ ] **TC-0238** API-009 invalid request/failure GET /api/admin/assessment-configs
- [ ] **TC-0239** API-010 positive PATCH /api/admin/assessment-configs
- [ ] **TC-0240** API-010 anonymous/wrong role/inactive PATCH /api/admin/assessment-configs
- [ ] **TC-0241** API-010 invalid request/failure PATCH /api/admin/assessment-configs
- [ ] **TC-0242** API-010 duplicate/concurrent PATCH /api/admin/assessment-configs
- [ ] **TC-0243** API-011 positive GET /api/admin/assessment-questions/[questionId]
- [ ] **TC-0244** API-011 anonymous/wrong role/inactive GET /api/admin/assessment-questions/[questionId]
- [ ] **TC-0245** API-011 invalid/missing/foreign ID GET /api/admin/assessment-questions/[questionId]
- [ ] **TC-0246** API-011 invalid request/failure GET /api/admin/assessment-questions/[questionId]
- [ ] **TC-0247** API-012 positive PATCH /api/admin/assessment-questions/[questionId]
- [ ] **TC-0248** API-012 anonymous/wrong role/inactive PATCH /api/admin/assessment-questions/[questionId]
- [ ] **TC-0249** API-012 invalid/missing/foreign ID PATCH /api/admin/assessment-questions/[questionId]
- [ ] **TC-0250** API-012 invalid request/failure PATCH /api/admin/assessment-questions/[questionId]
- [ ] **TC-0251** API-012 duplicate/concurrent PATCH /api/admin/assessment-questions/[questionId]
- [ ] **TC-0252** API-013 positive DELETE /api/admin/assessment-questions/[questionId]
- [ ] **TC-0253** API-013 anonymous/wrong role/inactive DELETE /api/admin/assessment-questions/[questionId]
- [ ] **TC-0254** API-013 invalid/missing/foreign ID DELETE /api/admin/assessment-questions/[questionId]
- [ ] **TC-0255** API-013 invalid request/failure DELETE /api/admin/assessment-questions/[questionId]
- [ ] **TC-0256** API-013 duplicate/concurrent DELETE /api/admin/assessment-questions/[questionId]
- [ ] **TC-0257** API-014 positive GET /api/admin/assessment-questions/coverage
- [ ] **TC-0258** API-014 anonymous/wrong role/inactive GET /api/admin/assessment-questions/coverage
- [ ] **TC-0259** API-014 invalid request/failure GET /api/admin/assessment-questions/coverage
- [ ] **TC-0260** API-015 positive GET /api/admin/assessment-questions
- [ ] **TC-0261** API-015 anonymous/wrong role/inactive GET /api/admin/assessment-questions
- [ ] **TC-0262** API-015 invalid request/failure GET /api/admin/assessment-questions
- [ ] **TC-0263** API-016 positive POST /api/admin/assessment-questions
- [ ] **TC-0264** API-016 anonymous/wrong role/inactive POST /api/admin/assessment-questions
- [ ] **TC-0265** API-016 invalid request/failure POST /api/admin/assessment-questions
- [ ] **TC-0266** API-016 duplicate/concurrent POST /api/admin/assessment-questions
- [ ] **TC-0267** API-017 positive GET /api/admin/audit-log
- [ ] **TC-0268** API-017 anonymous/wrong role/inactive GET /api/admin/audit-log
- [ ] **TC-0269** API-017 invalid request/failure GET /api/admin/audit-log
- [ ] **TC-0270** API-018 positive PATCH /api/admin/certifications/[certificationId]
- [ ] **TC-0271** API-018 anonymous/wrong role/inactive PATCH /api/admin/certifications/[certificationId]
- [ ] **TC-0272** API-018 invalid/missing/foreign ID PATCH /api/admin/certifications/[certificationId]
- [ ] **TC-0273** API-018 invalid request/failure PATCH /api/admin/certifications/[certificationId]
- [ ] **TC-0274** API-018 duplicate/concurrent PATCH /api/admin/certifications/[certificationId]
- [ ] **TC-0275** API-019 positive GET /api/admin/certifications
- [ ] **TC-0276** API-019 anonymous/wrong role/inactive GET /api/admin/certifications
- [ ] **TC-0277** API-019 invalid request/failure GET /api/admin/certifications
- [ ] **TC-0278** API-020 positive GET /api/admin/chatbot-misses
- [ ] **TC-0279** API-020 anonymous/wrong role/inactive GET /api/admin/chatbot-misses
- [ ] **TC-0280** API-020 invalid request/failure GET /api/admin/chatbot-misses
- [ ] **TC-0281** API-021 positive PATCH /api/admin/class-appeals/[appealId]
- [ ] **TC-0282** API-021 anonymous/wrong role/inactive PATCH /api/admin/class-appeals/[appealId]
- [ ] **TC-0283** API-021 invalid/missing/foreign ID PATCH /api/admin/class-appeals/[appealId]
- [ ] **TC-0284** API-021 invalid request/failure PATCH /api/admin/class-appeals/[appealId]
- [ ] **TC-0285** API-021 duplicate/concurrent PATCH /api/admin/class-appeals/[appealId]
- [ ] **TC-0286** API-022 positive GET /api/admin/class-appeals
- [ ] **TC-0287** API-022 anonymous/wrong role/inactive GET /api/admin/class-appeals
- [ ] **TC-0288** API-022 invalid request/failure GET /api/admin/class-appeals
- [ ] **TC-0289** API-023 positive GET /api/admin/classes/[classId]/recommendations
- [ ] **TC-0290** API-023 anonymous/wrong role/inactive GET /api/admin/classes/[classId]/recommendations
- [ ] **TC-0291** API-023 invalid/missing/foreign ID GET /api/admin/classes/[classId]/recommendations
- [ ] **TC-0292** API-023 invalid request/failure GET /api/admin/classes/[classId]/recommendations
- [ ] **TC-0293** API-024 positive POST /api/admin/classes/[classId]/recommendations
- [ ] **TC-0294** API-024 anonymous/wrong role/inactive POST /api/admin/classes/[classId]/recommendations
- [ ] **TC-0295** API-024 invalid/missing/foreign ID POST /api/admin/classes/[classId]/recommendations
- [ ] **TC-0296** API-024 invalid request/failure POST /api/admin/classes/[classId]/recommendations
- [ ] **TC-0297** API-024 duplicate/concurrent POST /api/admin/classes/[classId]/recommendations
- [ ] **TC-0298** API-025 positive PATCH /api/admin/classes/[classId]
- [ ] **TC-0299** API-025 anonymous/wrong role/inactive PATCH /api/admin/classes/[classId]
- [ ] **TC-0300** API-025 invalid/missing/foreign ID PATCH /api/admin/classes/[classId]
- [ ] **TC-0301** API-025 invalid request/failure PATCH /api/admin/classes/[classId]
- [ ] **TC-0302** API-025 duplicate/concurrent PATCH /api/admin/classes/[classId]
- [ ] **TC-0303** API-026 positive GET /api/admin/classes
- [ ] **TC-0304** API-026 anonymous/wrong role/inactive GET /api/admin/classes
- [ ] **TC-0305** API-026 invalid request/failure GET /api/admin/classes
- [ ] **TC-0306** API-027 positive POST /api/admin/profile/password
- [ ] **TC-0307** API-027 anonymous/wrong role/inactive POST /api/admin/profile/password
- [ ] **TC-0308** API-027 invalid request/failure POST /api/admin/profile/password
- [ ] **TC-0309** API-027 duplicate/concurrent POST /api/admin/profile/password
- [ ] **TC-0310** API-028 positive PATCH /api/admin/question-requests/[requestId]
- [ ] **TC-0311** API-028 anonymous/wrong role/inactive PATCH /api/admin/question-requests/[requestId]
- [ ] **TC-0312** API-028 invalid/missing/foreign ID PATCH /api/admin/question-requests/[requestId]
- [ ] **TC-0313** API-028 invalid request/failure PATCH /api/admin/question-requests/[requestId]
- [ ] **TC-0314** API-028 duplicate/concurrent PATCH /api/admin/question-requests/[requestId]
- [ ] **TC-0315** API-029 positive GET /api/admin/question-requests
- [ ] **TC-0316** API-029 anonymous/wrong role/inactive GET /api/admin/question-requests
- [ ] **TC-0317** API-029 invalid request/failure GET /api/admin/question-requests
- [ ] **TC-0318** API-030 positive PATCH /api/admin/registrations/[userId]
- [ ] **TC-0319** API-030 anonymous/wrong role/inactive PATCH /api/admin/registrations/[userId]
- [ ] **TC-0320** API-030 invalid/missing/foreign ID PATCH /api/admin/registrations/[userId]
- [ ] **TC-0321** API-030 invalid request/failure PATCH /api/admin/registrations/[userId]
- [ ] **TC-0322** API-030 duplicate/concurrent PATCH /api/admin/registrations/[userId]
- [ ] **TC-0323** API-031 positive GET /api/admin/registrations
- [ ] **TC-0324** API-031 anonymous/wrong role/inactive GET /api/admin/registrations
- [ ] **TC-0325** API-031 invalid request/failure GET /api/admin/registrations
- [ ] **TC-0326** API-032 positive GET /api/admin/reports
- [ ] **TC-0327** API-032 anonymous/wrong role/inactive GET /api/admin/reports
- [ ] **TC-0328** API-032 invalid request/failure GET /api/admin/reports
- [ ] **TC-0329** API-033 positive GET /api/admin/session-tests/[testId]/attempts/[attemptId]
- [ ] **TC-0330** API-033 anonymous/wrong role/inactive GET /api/admin/session-tests/[testId]/attempts/[attemptId]
- [ ] **TC-0331** API-033 invalid/missing/foreign ID GET /api/admin/session-tests/[testId]/attempts/[attemptId]
- [ ] **TC-0332** API-033 invalid request/failure GET /api/admin/session-tests/[testId]/attempts/[attemptId]
- [ ] **TC-0333** API-034 positive GET /api/admin/session-tests/[testId]/results
- [ ] **TC-0334** API-034 anonymous/wrong role/inactive GET /api/admin/session-tests/[testId]/results
- [ ] **TC-0335** API-034 invalid/missing/foreign ID GET /api/admin/session-tests/[testId]/results
- [ ] **TC-0336** API-034 invalid request/failure GET /api/admin/session-tests/[testId]/results
- [ ] **TC-0337** API-035 positive GET /api/admin/session-tests
- [ ] **TC-0338** API-035 anonymous/wrong role/inactive GET /api/admin/session-tests
- [ ] **TC-0339** API-035 invalid request/failure GET /api/admin/session-tests
- [ ] **TC-0340** API-036 positive GET /api/admin/settings
- [ ] **TC-0341** API-036 anonymous/wrong role/inactive GET /api/admin/settings
- [ ] **TC-0342** API-036 invalid request/failure GET /api/admin/settings
- [ ] **TC-0343** API-037 positive PATCH /api/admin/settings
- [ ] **TC-0344** API-037 anonymous/wrong role/inactive PATCH /api/admin/settings
- [ ] **TC-0345** API-037 invalid request/failure PATCH /api/admin/settings
- [ ] **TC-0346** API-037 duplicate/concurrent PATCH /api/admin/settings
- [ ] **TC-0347** API-038 positive PATCH /api/admin/subjects/[id]
- [ ] **TC-0348** API-038 anonymous/wrong role/inactive PATCH /api/admin/subjects/[id]
- [ ] **TC-0349** API-038 invalid/missing/foreign ID PATCH /api/admin/subjects/[id]
- [ ] **TC-0350** API-038 invalid request/failure PATCH /api/admin/subjects/[id]
- [ ] **TC-0351** API-038 duplicate/concurrent PATCH /api/admin/subjects/[id]
- [ ] **TC-0352** API-039 positive DELETE /api/admin/subjects/[id]
- [ ] **TC-0353** API-039 anonymous/wrong role/inactive DELETE /api/admin/subjects/[id]
- [ ] **TC-0354** API-039 invalid/missing/foreign ID DELETE /api/admin/subjects/[id]
- [ ] **TC-0355** API-039 invalid request/failure DELETE /api/admin/subjects/[id]
- [ ] **TC-0356** API-039 duplicate/concurrent DELETE /api/admin/subjects/[id]
- [ ] **TC-0357** API-040 positive POST /api/admin/subjects/[id]/topics
- [ ] **TC-0358** API-040 anonymous/wrong role/inactive POST /api/admin/subjects/[id]/topics
- [ ] **TC-0359** API-040 invalid/missing/foreign ID POST /api/admin/subjects/[id]/topics
- [ ] **TC-0360** API-040 invalid request/failure POST /api/admin/subjects/[id]/topics
- [ ] **TC-0361** API-040 duplicate/concurrent POST /api/admin/subjects/[id]/topics
- [ ] **TC-0362** API-041 positive GET /api/admin/subjects
- [ ] **TC-0363** API-041 anonymous/wrong role/inactive GET /api/admin/subjects
- [ ] **TC-0364** API-041 invalid request/failure GET /api/admin/subjects
- [ ] **TC-0365** API-042 positive POST /api/admin/subjects
- [ ] **TC-0366** API-042 anonymous/wrong role/inactive POST /api/admin/subjects
- [ ] **TC-0367** API-042 invalid request/failure POST /api/admin/subjects
- [ ] **TC-0368** API-042 duplicate/concurrent POST /api/admin/subjects
- [ ] **TC-0369** API-043 positive PATCH /api/admin/topic-requests/[id]
- [ ] **TC-0370** API-043 anonymous/wrong role/inactive PATCH /api/admin/topic-requests/[id]
- [ ] **TC-0371** API-043 invalid/missing/foreign ID PATCH /api/admin/topic-requests/[id]
- [ ] **TC-0372** API-043 invalid request/failure PATCH /api/admin/topic-requests/[id]
- [ ] **TC-0373** API-043 duplicate/concurrent PATCH /api/admin/topic-requests/[id]
- [ ] **TC-0374** API-044 positive GET /api/admin/topic-requests
- [ ] **TC-0375** API-044 anonymous/wrong role/inactive GET /api/admin/topic-requests
- [ ] **TC-0376** API-044 invalid request/failure GET /api/admin/topic-requests
- [ ] **TC-0377** API-045 positive PATCH /api/admin/topics/[id]
- [ ] **TC-0378** API-045 anonymous/wrong role/inactive PATCH /api/admin/topics/[id]
- [ ] **TC-0379** API-045 invalid/missing/foreign ID PATCH /api/admin/topics/[id]
- [ ] **TC-0380** API-045 invalid request/failure PATCH /api/admin/topics/[id]
- [ ] **TC-0381** API-045 duplicate/concurrent PATCH /api/admin/topics/[id]
- [ ] **TC-0382** API-046 positive DELETE /api/admin/topics/[id]
- [ ] **TC-0383** API-046 anonymous/wrong role/inactive DELETE /api/admin/topics/[id]
- [ ] **TC-0384** API-046 invalid/missing/foreign ID DELETE /api/admin/topics/[id]
- [ ] **TC-0385** API-046 invalid request/failure DELETE /api/admin/topics/[id]
- [ ] **TC-0386** API-046 duplicate/concurrent DELETE /api/admin/topics/[id]
- [ ] **TC-0387** API-047 positive POST /api/admin/users/[userId]/avatar-action
- [ ] **TC-0388** API-047 anonymous/wrong role/inactive POST /api/admin/users/[userId]/avatar-action
- [ ] **TC-0389** API-047 invalid/missing/foreign ID POST /api/admin/users/[userId]/avatar-action
- [ ] **TC-0390** API-047 invalid request/failure POST /api/admin/users/[userId]/avatar-action
- [ ] **TC-0391** API-047 duplicate/concurrent POST /api/admin/users/[userId]/avatar-action
- [ ] **TC-0392** API-048 positive PATCH /api/admin/users/[userId]
- [ ] **TC-0393** API-048 anonymous/wrong role/inactive PATCH /api/admin/users/[userId]
- [ ] **TC-0394** API-048 invalid/missing/foreign ID PATCH /api/admin/users/[userId]
- [ ] **TC-0395** API-048 invalid request/failure PATCH /api/admin/users/[userId]
- [ ] **TC-0396** API-048 duplicate/concurrent PATCH /api/admin/users/[userId]
- [ ] **TC-0397** API-049 positive GET /api/admin/users
- [ ] **TC-0398** API-049 anonymous/wrong role/inactive GET /api/admin/users
- [ ] **TC-0399** API-049 invalid request/failure GET /api/admin/users
- [ ] **TC-0400** API-050 positive GET /api/auth/[...nextauth]
- [ ] **TC-0401** API-050 invalid/missing/foreign ID GET /api/auth/[...nextauth]
- [ ] **TC-0402** API-050 invalid request/failure GET /api/auth/[...nextauth]
- [ ] **TC-0403** API-051 positive POST /api/auth/[...nextauth]
- [ ] **TC-0404** API-051 invalid/missing/foreign ID POST /api/auth/[...nextauth]
- [ ] **TC-0405** API-051 invalid request/failure POST /api/auth/[...nextauth]
- [ ] **TC-0406** API-051 duplicate/concurrent POST /api/auth/[...nextauth]
- [ ] **TC-0407** API-052 positive POST /api/auth/forgot-password
- [ ] **TC-0408** API-052 invalid request/failure POST /api/auth/forgot-password
- [ ] **TC-0409** API-052 duplicate/concurrent POST /api/auth/forgot-password
- [ ] **TC-0410** API-053 positive POST /api/auth/resend-verification
- [ ] **TC-0411** API-053 invalid request/failure POST /api/auth/resend-verification
- [ ] **TC-0412** API-053 duplicate/concurrent POST /api/auth/resend-verification
- [ ] **TC-0413** API-054 positive POST /api/auth/reset-password
- [ ] **TC-0414** API-054 invalid request/failure POST /api/auth/reset-password
- [ ] **TC-0415** API-054 duplicate/concurrent POST /api/auth/reset-password
- [ ] **TC-0416** API-055 positive POST /api/auth/verify-email
- [ ] **TC-0417** API-055 invalid request/failure POST /api/auth/verify-email
- [ ] **TC-0418** API-055 duplicate/concurrent POST /api/auth/verify-email
- [ ] **TC-0419** API-056 positive POST /api/chatbot
- [ ] **TC-0420** API-056 anonymous/wrong role/inactive POST /api/chatbot
- [ ] **TC-0421** API-056 invalid request/failure POST /api/chatbot
- [ ] **TC-0422** API-056 duplicate/concurrent POST /api/chatbot
- [ ] **TC-0423** API-057 positive POST /api/classes/[classId]/enroll
- [ ] **TC-0424** API-057 anonymous/wrong role/inactive POST /api/classes/[classId]/enroll
- [ ] **TC-0425** API-057 invalid/missing/foreign ID POST /api/classes/[classId]/enroll
- [ ] **TC-0426** API-057 invalid request/failure POST /api/classes/[classId]/enroll
- [ ] **TC-0427** API-057 duplicate/concurrent POST /api/classes/[classId]/enroll
- [ ] **TC-0428** API-058 positive DELETE /api/classes/[classId]/enroll
- [ ] **TC-0429** API-058 anonymous/wrong role/inactive DELETE /api/classes/[classId]/enroll
- [ ] **TC-0430** API-058 invalid/missing/foreign ID DELETE /api/classes/[classId]/enroll
- [ ] **TC-0431** API-058 invalid request/failure DELETE /api/classes/[classId]/enroll
- [ ] **TC-0432** API-058 duplicate/concurrent DELETE /api/classes/[classId]/enroll
- [ ] **TC-0433** API-059 positive GET /api/classes
- [ ] **TC-0434** API-059 anonymous/wrong role/inactive GET /api/classes
- [ ] **TC-0435** API-059 invalid request/failure GET /api/classes
- [ ] **TC-0436** API-060 positive GET /api/dev
- [ ] **TC-0437** API-060 anonymous/wrong role/inactive GET /api/dev
- [ ] **TC-0438** API-060 invalid request/failure GET /api/dev
- [ ] **TC-0439** API-061 positive POST /api/dev
- [ ] **TC-0440** API-061 anonymous/wrong role/inactive POST /api/dev
- [ ] **TC-0441** API-061 invalid request/failure POST /api/dev
- [ ] **TC-0442** API-061 duplicate/concurrent POST /api/dev
- [ ] **TC-0443** API-062 positive GET /api/health
- [ ] **TC-0444** API-062 invalid request/failure GET /api/health
- [ ] **TC-0445** API-063 positive GET /api/learner/classes/[classId]/session-tests
- [ ] **TC-0446** API-063 anonymous/wrong role/inactive GET /api/learner/classes/[classId]/session-tests
- [ ] **TC-0447** API-063 invalid/missing/foreign ID GET /api/learner/classes/[classId]/session-tests
- [ ] **TC-0448** API-063 invalid request/failure GET /api/learner/classes/[classId]/session-tests
- [ ] **TC-0449** API-064 positive POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start
- [ ] **TC-0450** API-064 anonymous/wrong role/inactive POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start
- [ ] **TC-0451** API-064 invalid/missing/foreign ID POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start
- [ ] **TC-0452** API-064 invalid request/failure POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start
- [ ] **TC-0453** API-064 duplicate/concurrent POST /api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start
- [ ] **TC-0454** API-065 positive POST /api/learner/match
- [ ] **TC-0455** API-065 anonymous/wrong role/inactive POST /api/learner/match
- [ ] **TC-0456** API-065 invalid request/failure POST /api/learner/match
- [ ] **TC-0457** API-065 duplicate/concurrent POST /api/learner/match
- [ ] **TC-0458** API-066 positive POST /api/learner/profile/password
- [ ] **TC-0459** API-066 anonymous/wrong role/inactive POST /api/learner/profile/password
- [ ] **TC-0460** API-066 invalid request/failure POST /api/learner/profile/password
- [ ] **TC-0461** API-066 duplicate/concurrent POST /api/learner/profile/password
- [ ] **TC-0462** API-067 positive PATCH /api/learner/profile
- [ ] **TC-0463** API-067 anonymous/wrong role/inactive PATCH /api/learner/profile
- [ ] **TC-0464** API-067 invalid request/failure PATCH /api/learner/profile
- [ ] **TC-0465** API-067 duplicate/concurrent PATCH /api/learner/profile
- [ ] **TC-0466** API-068 positive GET /api/learner/progress
- [ ] **TC-0467** API-068 anonymous/wrong role/inactive GET /api/learner/progress
- [ ] **TC-0468** API-068 invalid request/failure GET /api/learner/progress
- [ ] **TC-0469** API-069 positive GET /api/learner/reports
- [ ] **TC-0470** API-069 anonymous/wrong role/inactive GET /api/learner/reports
- [ ] **TC-0471** API-069 invalid request/failure GET /api/learner/reports
- [ ] **TC-0472** API-070 positive POST /api/learner/reports
- [ ] **TC-0473** API-070 anonymous/wrong role/inactive POST /api/learner/reports
- [ ] **TC-0474** API-070 invalid request/failure POST /api/learner/reports
- [ ] **TC-0475** API-070 duplicate/concurrent POST /api/learner/reports
- [ ] **TC-0476** API-071 positive GET /api/learner/session-test-attempts/[attemptId]
- [ ] **TC-0477** API-071 anonymous/wrong role/inactive GET /api/learner/session-test-attempts/[attemptId]
- [ ] **TC-0478** API-071 invalid/missing/foreign ID GET /api/learner/session-test-attempts/[attemptId]
- [ ] **TC-0479** API-071 invalid request/failure GET /api/learner/session-test-attempts/[attemptId]
- [ ] **TC-0480** API-072 positive POST /api/learner/session-test-attempts/[attemptId]/submit
- [ ] **TC-0481** API-072 anonymous/wrong role/inactive POST /api/learner/session-test-attempts/[attemptId]/submit
- [ ] **TC-0482** API-072 invalid/missing/foreign ID POST /api/learner/session-test-attempts/[attemptId]/submit
- [ ] **TC-0483** API-072 invalid request/failure POST /api/learner/session-test-attempts/[attemptId]/submit
- [ ] **TC-0484** API-072 duplicate/concurrent POST /api/learner/session-test-attempts/[attemptId]/submit
- [ ] **TC-0485** API-073 positive PATCH /api/learner/topic-requests/[id]
- [ ] **TC-0486** API-073 anonymous/wrong role/inactive PATCH /api/learner/topic-requests/[id]
- [ ] **TC-0487** API-073 invalid/missing/foreign ID PATCH /api/learner/topic-requests/[id]
- [ ] **TC-0488** API-073 invalid request/failure PATCH /api/learner/topic-requests/[id]
- [ ] **TC-0489** API-073 duplicate/concurrent PATCH /api/learner/topic-requests/[id]
- [ ] **TC-0490** API-074 positive GET /api/learner/topic-requests
- [ ] **TC-0491** API-074 anonymous/wrong role/inactive GET /api/learner/topic-requests
- [ ] **TC-0492** API-074 invalid request/failure GET /api/learner/topic-requests
- [ ] **TC-0493** API-075 positive POST /api/learner/topic-requests
- [ ] **TC-0494** API-075 anonymous/wrong role/inactive POST /api/learner/topic-requests
- [ ] **TC-0495** API-075 invalid request/failure POST /api/learner/topic-requests
- [ ] **TC-0496** API-075 duplicate/concurrent POST /api/learner/topic-requests
- [ ] **TC-0497** API-076 positive GET /api/learner/tutors
- [ ] **TC-0498** API-076 anonymous/wrong role/inactive GET /api/learner/tutors
- [ ] **TC-0499** API-076 invalid request/failure GET /api/learner/tutors
- [ ] **TC-0500** API-077 positive POST /api/notifications/read
- [ ] **TC-0501** API-077 anonymous/wrong role/inactive POST /api/notifications/read
- [ ] **TC-0502** API-077 invalid request/failure POST /api/notifications/read
- [ ] **TC-0503** API-077 duplicate/concurrent POST /api/notifications/read
- [ ] **TC-0504** API-078 positive GET /api/notifications
- [ ] **TC-0505** API-078 anonymous/wrong role/inactive GET /api/notifications
- [ ] **TC-0506** API-078 invalid request/failure GET /api/notifications
- [ ] **TC-0507** API-079 positive POST /api/register
- [ ] **TC-0508** API-079 invalid request/failure POST /api/register
- [ ] **TC-0509** API-079 duplicate/concurrent POST /api/register
- [ ] **TC-0510** API-080 positive GET /api/search
- [ ] **TC-0511** API-080 anonymous/wrong role/inactive GET /api/search
- [ ] **TC-0512** API-080 invalid request/failure GET /api/search
- [ ] **TC-0513** API-081 positive GET /api/subjects
- [ ] **TC-0514** API-081 anonymous/wrong role/inactive GET /api/subjects
- [ ] **TC-0515** API-081 invalid request/failure GET /api/subjects
- [ ] **TC-0516** API-082 positive GET /api/tutor/assessments/[attemptId]
- [ ] **TC-0517** API-082 anonymous/wrong role/inactive GET /api/tutor/assessments/[attemptId]
- [ ] **TC-0518** API-082 invalid/missing/foreign ID GET /api/tutor/assessments/[attemptId]
- [ ] **TC-0519** API-082 invalid request/failure GET /api/tutor/assessments/[attemptId]
- [ ] **TC-0520** API-083 positive POST /api/tutor/assessments/[attemptId]/submit
- [ ] **TC-0521** API-083 anonymous/wrong role/inactive POST /api/tutor/assessments/[attemptId]/submit
- [ ] **TC-0522** API-083 invalid/missing/foreign ID POST /api/tutor/assessments/[attemptId]/submit
- [ ] **TC-0523** API-083 invalid request/failure POST /api/tutor/assessments/[attemptId]/submit
- [ ] **TC-0524** API-083 duplicate/concurrent POST /api/tutor/assessments/[attemptId]/submit
- [ ] **TC-0525** API-084 positive GET /api/tutor/assessments
- [ ] **TC-0526** API-084 anonymous/wrong role/inactive GET /api/tutor/assessments
- [ ] **TC-0527** API-084 invalid request/failure GET /api/tutor/assessments
- [ ] **TC-0528** API-085 positive POST /api/tutor/assessments
- [ ] **TC-0529** API-085 anonymous/wrong role/inactive POST /api/tutor/assessments
- [ ] **TC-0530** API-085 invalid request/failure POST /api/tutor/assessments
- [ ] **TC-0531** API-085 duplicate/concurrent POST /api/tutor/assessments
- [ ] **TC-0532** API-086 positive POST /api/tutor/classes/[classId]/appeal
- [ ] **TC-0533** API-086 anonymous/wrong role/inactive POST /api/tutor/classes/[classId]/appeal
- [ ] **TC-0534** API-086 invalid/missing/foreign ID POST /api/tutor/classes/[classId]/appeal
- [ ] **TC-0535** API-086 invalid request/failure POST /api/tutor/classes/[classId]/appeal
- [ ] **TC-0536** API-086 duplicate/concurrent POST /api/tutor/classes/[classId]/appeal
- [ ] **TC-0537** API-087 positive PATCH /api/tutor/classes/[classId]
- [ ] **TC-0538** API-087 anonymous/wrong role/inactive PATCH /api/tutor/classes/[classId]
- [ ] **TC-0539** API-087 invalid/missing/foreign ID PATCH /api/tutor/classes/[classId]
- [ ] **TC-0540** API-087 invalid request/failure PATCH /api/tutor/classes/[classId]
- [ ] **TC-0541** API-087 duplicate/concurrent PATCH /api/tutor/classes/[classId]
- [ ] **TC-0542** API-088 positive DELETE /api/tutor/classes/[classId]
- [ ] **TC-0543** API-088 anonymous/wrong role/inactive DELETE /api/tutor/classes/[classId]
- [ ] **TC-0544** API-088 invalid/missing/foreign ID DELETE /api/tutor/classes/[classId]
- [ ] **TC-0545** API-088 invalid request/failure DELETE /api/tutor/classes/[classId]
- [ ] **TC-0546** API-088 duplicate/concurrent DELETE /api/tutor/classes/[classId]
- [ ] **TC-0547** API-089 positive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0548** API-089 anonymous/wrong role/inactive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0549** API-089 invalid/missing/foreign ID PATCH /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0550** API-089 invalid request/failure PATCH /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0551** API-089 duplicate/concurrent PATCH /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0552** API-090 positive DELETE /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0553** API-090 anonymous/wrong role/inactive DELETE /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0554** API-090 invalid/missing/foreign ID DELETE /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0555** API-090 invalid request/failure DELETE /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0556** API-090 duplicate/concurrent DELETE /api/tutor/classes/[classId]/sessions/[sessionId]
- [ ] **TC-0557** API-091 positive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]
- [ ] **TC-0558** API-091 anonymous/wrong role/inactive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]
- [ ] **TC-0559** API-091 invalid/missing/foreign ID GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]
- [ ] **TC-0560** API-091 invalid request/failure GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/attempts/[attemptId]
- [ ] **TC-0561** API-092 positive PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions
- [ ] **TC-0562** API-092 anonymous/wrong role/inactive PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions
- [ ] **TC-0563** API-092 invalid/missing/foreign ID PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions
- [ ] **TC-0564** API-092 invalid request/failure PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions
- [ ] **TC-0565** API-092 duplicate/concurrent PUT /api/tutor/classes/[classId]/sessions/[sessionId]/test/questions
- [ ] **TC-0566** API-093 positive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/results
- [ ] **TC-0567** API-093 anonymous/wrong role/inactive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/results
- [ ] **TC-0568** API-093 invalid/missing/foreign ID GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/results
- [ ] **TC-0569** API-093 invalid request/failure GET /api/tutor/classes/[classId]/sessions/[sessionId]/test/results
- [ ] **TC-0570** API-094 positive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0571** API-094 anonymous/wrong role/inactive GET /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0572** API-094 invalid/missing/foreign ID GET /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0573** API-094 invalid request/failure GET /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0574** API-095 positive POST /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0575** API-095 anonymous/wrong role/inactive POST /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0576** API-095 invalid/missing/foreign ID POST /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0577** API-095 invalid request/failure POST /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0578** API-095 duplicate/concurrent POST /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0579** API-096 positive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0580** API-096 anonymous/wrong role/inactive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0581** API-096 invalid/missing/foreign ID PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0582** API-096 invalid request/failure PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0583** API-096 duplicate/concurrent PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0584** API-097 positive DELETE /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0585** API-097 anonymous/wrong role/inactive DELETE /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0586** API-097 invalid/missing/foreign ID DELETE /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0587** API-097 invalid request/failure DELETE /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0588** API-097 duplicate/concurrent DELETE /api/tutor/classes/[classId]/sessions/[sessionId]/test
- [ ] **TC-0589** API-098 positive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status
- [ ] **TC-0590** API-098 anonymous/wrong role/inactive PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status
- [ ] **TC-0591** API-098 invalid/missing/foreign ID PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status
- [ ] **TC-0592** API-098 invalid request/failure PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status
- [ ] **TC-0593** API-098 duplicate/concurrent PATCH /api/tutor/classes/[classId]/sessions/[sessionId]/test/status
- [ ] **TC-0594** API-099 positive POST /api/tutor/classes/[classId]/sessions
- [ ] **TC-0595** API-099 anonymous/wrong role/inactive POST /api/tutor/classes/[classId]/sessions
- [ ] **TC-0596** API-099 invalid/missing/foreign ID POST /api/tutor/classes/[classId]/sessions
- [ ] **TC-0597** API-099 invalid request/failure POST /api/tutor/classes/[classId]/sessions
- [ ] **TC-0598** API-099 duplicate/concurrent POST /api/tutor/classes/[classId]/sessions
- [ ] **TC-0599** API-100 positive GET /api/tutor/classes/[classId]/test-results
- [ ] **TC-0600** API-100 anonymous/wrong role/inactive GET /api/tutor/classes/[classId]/test-results
- [ ] **TC-0601** API-100 invalid/missing/foreign ID GET /api/tutor/classes/[classId]/test-results
- [ ] **TC-0602** API-100 invalid request/failure GET /api/tutor/classes/[classId]/test-results
- [ ] **TC-0603** API-101 positive GET /api/tutor/classes
- [ ] **TC-0604** API-101 anonymous/wrong role/inactive GET /api/tutor/classes
- [ ] **TC-0605** API-101 invalid request/failure GET /api/tutor/classes
- [ ] **TC-0606** API-102 positive POST /api/tutor/classes
- [ ] **TC-0607** API-102 anonymous/wrong role/inactive POST /api/tutor/classes
- [ ] **TC-0608** API-102 invalid request/failure POST /api/tutor/classes
- [ ] **TC-0609** API-102 duplicate/concurrent POST /api/tutor/classes
- [ ] **TC-0610** API-103 positive POST /api/tutor/profile/password
- [ ] **TC-0611** API-103 anonymous/wrong role/inactive POST /api/tutor/profile/password
- [ ] **TC-0612** API-103 invalid request/failure POST /api/tutor/profile/password
- [ ] **TC-0613** API-103 duplicate/concurrent POST /api/tutor/profile/password
- [ ] **TC-0614** API-104 positive PATCH /api/tutor/profile
- [ ] **TC-0615** API-104 anonymous/wrong role/inactive PATCH /api/tutor/profile
- [ ] **TC-0616** API-104 invalid request/failure PATCH /api/tutor/profile
- [ ] **TC-0617** API-104 duplicate/concurrent PATCH /api/tutor/profile
- [ ] **TC-0618** API-105 positive GET /api/tutor/question-bank
- [ ] **TC-0619** API-105 anonymous/wrong role/inactive GET /api/tutor/question-bank
- [ ] **TC-0620** API-105 invalid request/failure GET /api/tutor/question-bank
- [ ] **TC-0621** API-106 positive GET /api/tutor/question-requests
- [ ] **TC-0622** API-106 anonymous/wrong role/inactive GET /api/tutor/question-requests
- [ ] **TC-0623** API-106 invalid request/failure GET /api/tutor/question-requests
- [ ] **TC-0624** API-107 positive POST /api/tutor/question-requests
- [ ] **TC-0625** API-107 anonymous/wrong role/inactive POST /api/tutor/question-requests
- [ ] **TC-0626** API-107 invalid request/failure POST /api/tutor/question-requests
- [ ] **TC-0627** API-107 duplicate/concurrent POST /api/tutor/question-requests
- [ ] **TC-0628** API-108 positive PATCH /api/tutor/questions/[questionId]
- [ ] **TC-0629** API-108 anonymous/wrong role/inactive PATCH /api/tutor/questions/[questionId]
- [ ] **TC-0630** API-108 invalid/missing/foreign ID PATCH /api/tutor/questions/[questionId]
- [ ] **TC-0631** API-108 invalid request/failure PATCH /api/tutor/questions/[questionId]
- [ ] **TC-0632** API-108 duplicate/concurrent PATCH /api/tutor/questions/[questionId]
- [ ] **TC-0633** API-109 positive DELETE /api/tutor/questions/[questionId]
- [ ] **TC-0634** API-109 anonymous/wrong role/inactive DELETE /api/tutor/questions/[questionId]
- [ ] **TC-0635** API-109 invalid/missing/foreign ID DELETE /api/tutor/questions/[questionId]
- [ ] **TC-0636** API-109 invalid request/failure DELETE /api/tutor/questions/[questionId]
- [ ] **TC-0637** API-109 duplicate/concurrent DELETE /api/tutor/questions/[questionId]
- [ ] **TC-0638** API-110 positive GET /api/tutor/questions
- [ ] **TC-0639** API-110 anonymous/wrong role/inactive GET /api/tutor/questions
- [ ] **TC-0640** API-110 invalid request/failure GET /api/tutor/questions
- [ ] **TC-0641** API-111 positive POST /api/tutor/questions
- [ ] **TC-0642** API-111 anonymous/wrong role/inactive POST /api/tutor/questions
- [ ] **TC-0643** API-111 invalid request/failure POST /api/tutor/questions
- [ ] **TC-0644** API-111 duplicate/concurrent POST /api/tutor/questions
- [ ] **TC-0645** API-112 positive GET /api/tutor/students
- [ ] **TC-0646** API-112 anonymous/wrong role/inactive GET /api/tutor/students
- [ ] **TC-0647** API-112 invalid request/failure GET /api/tutor/students
- [ ] **TC-0648** API-113 positive GET /api/tutor/topic-certifications
- [ ] **TC-0649** API-113 anonymous/wrong role/inactive GET /api/tutor/topic-certifications
- [ ] **TC-0650** API-113 invalid request/failure GET /api/tutor/topic-certifications
- [ ] **TC-0651** API-114 positive POST /api/tutor/topic-certifications
- [ ] **TC-0652** API-114 anonymous/wrong role/inactive POST /api/tutor/topic-certifications
- [ ] **TC-0653** API-114 invalid request/failure POST /api/tutor/topic-certifications
- [ ] **TC-0654** API-114 duplicate/concurrent POST /api/tutor/topic-certifications
- [ ] **TC-0655** API-115 positive POST /api/tutor/topic-requests/[id]/accept
- [ ] **TC-0656** API-115 anonymous/wrong role/inactive POST /api/tutor/topic-requests/[id]/accept
- [ ] **TC-0657** API-115 invalid/missing/foreign ID POST /api/tutor/topic-requests/[id]/accept
- [ ] **TC-0658** API-115 invalid request/failure POST /api/tutor/topic-requests/[id]/accept
- [ ] **TC-0659** API-115 duplicate/concurrent POST /api/tutor/topic-requests/[id]/accept
- [ ] **TC-0660** API-116 positive GET /api/tutor/topic-requests
- [ ] **TC-0661** API-116 anonymous/wrong role/inactive GET /api/tutor/topic-requests
- [ ] **TC-0662** API-116 invalid request/failure GET /api/tutor/topic-requests
- [ ] **TC-0663** API-117 positive GET /api/uploadthing
- [ ] **TC-0664** API-117 invalid request/failure GET /api/uploadthing
- [ ] **TC-0665** API-118 positive POST /api/uploadthing
- [ ] **TC-0666** API-118 invalid request/failure POST /api/uploadthing
- [ ] **TC-0667** API-118 duplicate/concurrent POST /api/uploadthing
- [ ] **TC-0668** API-119 positive GET /api/user/profile-picture
- [ ] **TC-0669** API-119 anonymous/wrong role/inactive GET /api/user/profile-picture
- [ ] **TC-0670** API-119 invalid request/failure GET /api/user/profile-picture
- [ ] **TC-0671** API-120 positive DELETE /api/user/profile-picture
- [ ] **TC-0672** API-120 anonymous/wrong role/inactive DELETE /api/user/profile-picture
- [ ] **TC-0673** API-120 invalid request/failure DELETE /api/user/profile-picture
- [ ] **TC-0674** API-120 duplicate/concurrent DELETE /api/user/profile-picture
## Frontend

- [ ] **TC-0675** /account-declined page and navigation
- [ ] **TC-0682** /account-unverified page and navigation
- [ ] **TC-0689** /admin/abuse-reports page and navigation
- [ ] **TC-0696** /admin/admins page and navigation
- [ ] **TC-0703** /admin/assessment/certifications page and navigation
- [ ] **TC-0710** /admin/assessment/question-bank page and navigation
- [ ] **TC-0717** /admin/assessment/requests page and navigation
- [ ] **TC-0724** /admin/assessment/results page and navigation
- [ ] **TC-0731** /admin/audit-log page and navigation
- [ ] **TC-0738** /admin/certifications page and navigation
- [ ] **TC-0745** /admin/chatbot page and navigation
- [ ] **TC-0752** /admin/class-appeals page and navigation
- [ ] **TC-0759** /admin/classes/[id] page and navigation
- [ ] **TC-0766** /admin/classes page and navigation
- [ ] **TC-0773** /admin/help page and navigation
- [ ] **TC-0780** /admin/notifications page and navigation
- [ ] **TC-0787** /admin page and navigation
- [ ] **TC-0794** /admin/question-bank page and navigation
- [ ] **TC-0801** /admin/registrations page and navigation
- [ ] **TC-0808** /admin/reports page and navigation
- [ ] **TC-0815** /admin/session-tests page and navigation
- [ ] **TC-0822** /admin/settings page and navigation
- [ ] **TC-0829** /admin/subjects page and navigation
- [ ] **TC-0836** /admin/topic-requests/[id] page and navigation
- [ ] **TC-0843** /admin/topic-requests page and navigation
- [ ] **TC-0850** /admin/users/[id] page and navigation
- [ ] **TC-0857** /admin/users page and navigation
- [ ] **TC-0864** /dashboard page and navigation
- [ ] **TC-0871** /dev/charts page and navigation
- [ ] **TC-0878** /dev/login page and navigation
- [ ] **TC-0885** /dev page and navigation
- [ ] **TC-0892** /forgot-password page and navigation
- [ ] **TC-0899** /learner/classes/[classId] page and navigation
- [ ] **TC-0906** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] page and navigation
- [ ] **TC-0913** /learner/classes page and navigation
- [ ] **TC-0920** /learner/help page and navigation
- [ ] **TC-0927** /learner/match page and navigation
- [ ] **TC-0934** /learner/my-classes page and navigation
- [ ] **TC-0941** /learner/notifications page and navigation
- [ ] **TC-0948** /learner page and navigation
- [ ] **TC-0955** /learner/profile/edit page and navigation
- [ ] **TC-0962** /learner/profile page and navigation
- [ ] **TC-0969** /learner/progress page and navigation
- [ ] **TC-0976** /learner/reports page and navigation
- [ ] **TC-0983** /learner/requests/[id] page and navigation
- [ ] **TC-0990** /learner/requests page and navigation
- [ ] **TC-0997** /learner/tutors/[tutorId] page and navigation
- [ ] **TC-1004** /learner/tutors page and navigation
- [ ] **TC-1011** /login page and navigation
- [ ] **TC-1018** /logout page and navigation
- [ ] **TC-1025** / page and navigation
- [ ] **TC-1032** /pending-approval page and navigation
- [ ] **TC-1039** /privacy-policy page and navigation
- [ ] **TC-1046** /register/learner page and navigation
- [ ] **TC-1053** /register page and navigation
- [ ] **TC-1060** /register/tutor page and navigation
- [ ] **TC-1067** /reset-password page and navigation
- [ ] **TC-1074** /tutor/assessments/[attemptId] page and navigation
- [ ] **TC-1081** /tutor/assessments page and navigation
- [ ] **TC-1088** /tutor/classes/[classId]/edit page and navigation
- [ ] **TC-1095** /tutor/classes/[classId] page and navigation
- [ ] **TC-1102** /tutor/classes/[classId]/sessions/[sessionId]/test page and navigation
- [ ] **TC-1109** /tutor/classes/[classId]/sessions/[sessionId]/test/results page and navigation
- [ ] **TC-1116** /tutor/classes/new page and navigation
- [ ] **TC-1123** /tutor/classes page and navigation
- [ ] **TC-1130** /tutor/help page and navigation
- [ ] **TC-1137** /tutor/notifications page and navigation
- [ ] **TC-1144** /tutor page and navigation
- [ ] **TC-1151** /tutor/profile/edit page and navigation
- [ ] **TC-1158** /tutor/profile page and navigation
- [ ] **TC-1165** /tutor/requests/[id]/accept page and navigation
- [ ] **TC-1172** /tutor/requests/[id] page and navigation
- [ ] **TC-1179** /tutor/requests page and navigation
- [ ] **TC-1186** /tutor/students/[studentId] page and navigation
- [ ] **TC-1193** /tutor/students page and navigation
- [ ] **TC-1200** /unauthorized page and navigation
- [ ] **TC-1207** /verify-email/check-email page and navigation
- [ ] **TC-1214** /verify-email page and navigation
## Responsive UI

- [ ] **TC-0676** /account-declined at 320px
- [ ] **TC-0677** /account-declined at 375px
- [ ] **TC-0678** /account-declined at 768px
- [ ] **TC-0679** /account-declined at 1024px
- [ ] **TC-0680** /account-declined at 1440px
- [ ] **TC-0681** /account-declined at 1920px
- [ ] **TC-0683** /account-unverified at 320px
- [ ] **TC-0684** /account-unverified at 375px
- [ ] **TC-0685** /account-unverified at 768px
- [ ] **TC-0686** /account-unverified at 1024px
- [ ] **TC-0687** /account-unverified at 1440px
- [ ] **TC-0688** /account-unverified at 1920px
- [ ] **TC-0690** /admin/abuse-reports at 320px
- [ ] **TC-0691** /admin/abuse-reports at 375px
- [ ] **TC-0692** /admin/abuse-reports at 768px
- [ ] **TC-0693** /admin/abuse-reports at 1024px
- [ ] **TC-0694** /admin/abuse-reports at 1440px
- [ ] **TC-0695** /admin/abuse-reports at 1920px
- [ ] **TC-0697** /admin/admins at 320px
- [ ] **TC-0698** /admin/admins at 375px
- [ ] **TC-0699** /admin/admins at 768px
- [ ] **TC-0700** /admin/admins at 1024px
- [ ] **TC-0701** /admin/admins at 1440px
- [ ] **TC-0702** /admin/admins at 1920px
- [ ] **TC-0704** /admin/assessment/certifications at 320px
- [ ] **TC-0705** /admin/assessment/certifications at 375px
- [ ] **TC-0706** /admin/assessment/certifications at 768px
- [ ] **TC-0707** /admin/assessment/certifications at 1024px
- [ ] **TC-0708** /admin/assessment/certifications at 1440px
- [ ] **TC-0709** /admin/assessment/certifications at 1920px
- [ ] **TC-0711** /admin/assessment/question-bank at 320px
- [ ] **TC-0712** /admin/assessment/question-bank at 375px
- [ ] **TC-0713** /admin/assessment/question-bank at 768px
- [ ] **TC-0714** /admin/assessment/question-bank at 1024px
- [ ] **TC-0715** /admin/assessment/question-bank at 1440px
- [ ] **TC-0716** /admin/assessment/question-bank at 1920px
- [ ] **TC-0718** /admin/assessment/requests at 320px
- [ ] **TC-0719** /admin/assessment/requests at 375px
- [ ] **TC-0720** /admin/assessment/requests at 768px
- [ ] **TC-0721** /admin/assessment/requests at 1024px
- [ ] **TC-0722** /admin/assessment/requests at 1440px
- [ ] **TC-0723** /admin/assessment/requests at 1920px
- [ ] **TC-0725** /admin/assessment/results at 320px
- [ ] **TC-0726** /admin/assessment/results at 375px
- [ ] **TC-0727** /admin/assessment/results at 768px
- [ ] **TC-0728** /admin/assessment/results at 1024px
- [ ] **TC-0729** /admin/assessment/results at 1440px
- [ ] **TC-0730** /admin/assessment/results at 1920px
- [ ] **TC-0732** /admin/audit-log at 320px
- [ ] **TC-0733** /admin/audit-log at 375px
- [ ] **TC-0734** /admin/audit-log at 768px
- [ ] **TC-0735** /admin/audit-log at 1024px
- [ ] **TC-0736** /admin/audit-log at 1440px
- [ ] **TC-0737** /admin/audit-log at 1920px
- [ ] **TC-0739** /admin/certifications at 320px
- [ ] **TC-0740** /admin/certifications at 375px
- [ ] **TC-0741** /admin/certifications at 768px
- [ ] **TC-0742** /admin/certifications at 1024px
- [ ] **TC-0743** /admin/certifications at 1440px
- [ ] **TC-0744** /admin/certifications at 1920px
- [ ] **TC-0746** /admin/chatbot at 320px
- [ ] **TC-0747** /admin/chatbot at 375px
- [ ] **TC-0748** /admin/chatbot at 768px
- [ ] **TC-0749** /admin/chatbot at 1024px
- [ ] **TC-0750** /admin/chatbot at 1440px
- [ ] **TC-0751** /admin/chatbot at 1920px
- [ ] **TC-0753** /admin/class-appeals at 320px
- [ ] **TC-0754** /admin/class-appeals at 375px
- [ ] **TC-0755** /admin/class-appeals at 768px
- [ ] **TC-0756** /admin/class-appeals at 1024px
- [ ] **TC-0757** /admin/class-appeals at 1440px
- [ ] **TC-0758** /admin/class-appeals at 1920px
- [ ] **TC-0760** /admin/classes/[id] at 320px
- [ ] **TC-0761** /admin/classes/[id] at 375px
- [ ] **TC-0762** /admin/classes/[id] at 768px
- [ ] **TC-0763** /admin/classes/[id] at 1024px
- [ ] **TC-0764** /admin/classes/[id] at 1440px
- [ ] **TC-0765** /admin/classes/[id] at 1920px
- [ ] **TC-0767** /admin/classes at 320px
- [ ] **TC-0768** /admin/classes at 375px
- [ ] **TC-0769** /admin/classes at 768px
- [ ] **TC-0770** /admin/classes at 1024px
- [ ] **TC-0771** /admin/classes at 1440px
- [ ] **TC-0772** /admin/classes at 1920px
- [ ] **TC-0774** /admin/help at 320px
- [ ] **TC-0775** /admin/help at 375px
- [ ] **TC-0776** /admin/help at 768px
- [ ] **TC-0777** /admin/help at 1024px
- [ ] **TC-0778** /admin/help at 1440px
- [ ] **TC-0779** /admin/help at 1920px
- [ ] **TC-0781** /admin/notifications at 320px
- [ ] **TC-0782** /admin/notifications at 375px
- [ ] **TC-0783** /admin/notifications at 768px
- [ ] **TC-0784** /admin/notifications at 1024px
- [ ] **TC-0785** /admin/notifications at 1440px
- [ ] **TC-0786** /admin/notifications at 1920px
- [ ] **TC-0788** /admin at 320px
- [ ] **TC-0789** /admin at 375px
- [ ] **TC-0790** /admin at 768px
- [ ] **TC-0791** /admin at 1024px
- [ ] **TC-0792** /admin at 1440px
- [ ] **TC-0793** /admin at 1920px
- [ ] **TC-0795** /admin/question-bank at 320px
- [ ] **TC-0796** /admin/question-bank at 375px
- [ ] **TC-0797** /admin/question-bank at 768px
- [ ] **TC-0798** /admin/question-bank at 1024px
- [ ] **TC-0799** /admin/question-bank at 1440px
- [ ] **TC-0800** /admin/question-bank at 1920px
- [ ] **TC-0802** /admin/registrations at 320px
- [ ] **TC-0803** /admin/registrations at 375px
- [ ] **TC-0804** /admin/registrations at 768px
- [ ] **TC-0805** /admin/registrations at 1024px
- [ ] **TC-0806** /admin/registrations at 1440px
- [ ] **TC-0807** /admin/registrations at 1920px
- [ ] **TC-0809** /admin/reports at 320px
- [ ] **TC-0810** /admin/reports at 375px
- [ ] **TC-0811** /admin/reports at 768px
- [ ] **TC-0812** /admin/reports at 1024px
- [ ] **TC-0813** /admin/reports at 1440px
- [ ] **TC-0814** /admin/reports at 1920px
- [ ] **TC-0816** /admin/session-tests at 320px
- [ ] **TC-0817** /admin/session-tests at 375px
- [ ] **TC-0818** /admin/session-tests at 768px
- [ ] **TC-0819** /admin/session-tests at 1024px
- [ ] **TC-0820** /admin/session-tests at 1440px
- [ ] **TC-0821** /admin/session-tests at 1920px
- [ ] **TC-0823** /admin/settings at 320px
- [ ] **TC-0824** /admin/settings at 375px
- [ ] **TC-0825** /admin/settings at 768px
- [ ] **TC-0826** /admin/settings at 1024px
- [ ] **TC-0827** /admin/settings at 1440px
- [ ] **TC-0828** /admin/settings at 1920px
- [ ] **TC-0830** /admin/subjects at 320px
- [ ] **TC-0831** /admin/subjects at 375px
- [ ] **TC-0832** /admin/subjects at 768px
- [ ] **TC-0833** /admin/subjects at 1024px
- [ ] **TC-0834** /admin/subjects at 1440px
- [ ] **TC-0835** /admin/subjects at 1920px
- [ ] **TC-0837** /admin/topic-requests/[id] at 320px
- [ ] **TC-0838** /admin/topic-requests/[id] at 375px
- [ ] **TC-0839** /admin/topic-requests/[id] at 768px
- [ ] **TC-0840** /admin/topic-requests/[id] at 1024px
- [ ] **TC-0841** /admin/topic-requests/[id] at 1440px
- [ ] **TC-0842** /admin/topic-requests/[id] at 1920px
- [ ] **TC-0844** /admin/topic-requests at 320px
- [ ] **TC-0845** /admin/topic-requests at 375px
- [ ] **TC-0846** /admin/topic-requests at 768px
- [ ] **TC-0847** /admin/topic-requests at 1024px
- [ ] **TC-0848** /admin/topic-requests at 1440px
- [ ] **TC-0849** /admin/topic-requests at 1920px
- [ ] **TC-0851** /admin/users/[id] at 320px
- [ ] **TC-0852** /admin/users/[id] at 375px
- [ ] **TC-0853** /admin/users/[id] at 768px
- [ ] **TC-0854** /admin/users/[id] at 1024px
- [ ] **TC-0855** /admin/users/[id] at 1440px
- [ ] **TC-0856** /admin/users/[id] at 1920px
- [ ] **TC-0858** /admin/users at 320px
- [ ] **TC-0859** /admin/users at 375px
- [ ] **TC-0860** /admin/users at 768px
- [ ] **TC-0861** /admin/users at 1024px
- [ ] **TC-0862** /admin/users at 1440px
- [ ] **TC-0863** /admin/users at 1920px
- [ ] **TC-0865** /dashboard at 320px
- [ ] **TC-0866** /dashboard at 375px
- [ ] **TC-0867** /dashboard at 768px
- [ ] **TC-0868** /dashboard at 1024px
- [ ] **TC-0869** /dashboard at 1440px
- [ ] **TC-0870** /dashboard at 1920px
- [ ] **TC-0872** /dev/charts at 320px
- [ ] **TC-0873** /dev/charts at 375px
- [ ] **TC-0874** /dev/charts at 768px
- [ ] **TC-0875** /dev/charts at 1024px
- [ ] **TC-0876** /dev/charts at 1440px
- [ ] **TC-0877** /dev/charts at 1920px
- [ ] **TC-0879** /dev/login at 320px
- [ ] **TC-0880** /dev/login at 375px
- [ ] **TC-0881** /dev/login at 768px
- [ ] **TC-0882** /dev/login at 1024px
- [ ] **TC-0883** /dev/login at 1440px
- [ ] **TC-0884** /dev/login at 1920px
- [ ] **TC-0886** /dev at 320px
- [ ] **TC-0887** /dev at 375px
- [ ] **TC-0888** /dev at 768px
- [ ] **TC-0889** /dev at 1024px
- [ ] **TC-0890** /dev at 1440px
- [ ] **TC-0891** /dev at 1920px
- [ ] **TC-0893** /forgot-password at 320px
- [ ] **TC-0894** /forgot-password at 375px
- [ ] **TC-0895** /forgot-password at 768px
- [ ] **TC-0896** /forgot-password at 1024px
- [ ] **TC-0897** /forgot-password at 1440px
- [ ] **TC-0898** /forgot-password at 1920px
- [ ] **TC-0900** /learner/classes/[classId] at 320px
- [ ] **TC-0901** /learner/classes/[classId] at 375px
- [ ] **TC-0902** /learner/classes/[classId] at 768px
- [ ] **TC-0903** /learner/classes/[classId] at 1024px
- [ ] **TC-0904** /learner/classes/[classId] at 1440px
- [ ] **TC-0905** /learner/classes/[classId] at 1920px
- [ ] **TC-0907** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 320px
- [ ] **TC-0908** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 375px
- [ ] **TC-0909** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 768px
- [ ] **TC-0910** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 1024px
- [ ] **TC-0911** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 1440px
- [ ] **TC-0912** /learner/classes/[classId]/sessions/[sessionId]/test/[kind] at 1920px
- [ ] **TC-0914** /learner/classes at 320px
- [ ] **TC-0915** /learner/classes at 375px
- [ ] **TC-0916** /learner/classes at 768px
- [ ] **TC-0917** /learner/classes at 1024px
- [ ] **TC-0918** /learner/classes at 1440px
- [ ] **TC-0919** /learner/classes at 1920px
- [ ] **TC-0921** /learner/help at 320px
- [ ] **TC-0922** /learner/help at 375px
- [ ] **TC-0923** /learner/help at 768px
- [ ] **TC-0924** /learner/help at 1024px
- [ ] **TC-0925** /learner/help at 1440px
- [ ] **TC-0926** /learner/help at 1920px
- [ ] **TC-0928** /learner/match at 320px
- [ ] **TC-0929** /learner/match at 375px
- [ ] **TC-0930** /learner/match at 768px
- [ ] **TC-0931** /learner/match at 1024px
- [ ] **TC-0932** /learner/match at 1440px
- [ ] **TC-0933** /learner/match at 1920px
- [ ] **TC-0935** /learner/my-classes at 320px
- [ ] **TC-0936** /learner/my-classes at 375px
- [ ] **TC-0937** /learner/my-classes at 768px
- [ ] **TC-0938** /learner/my-classes at 1024px
- [ ] **TC-0939** /learner/my-classes at 1440px
- [ ] **TC-0940** /learner/my-classes at 1920px
- [ ] **TC-0942** /learner/notifications at 320px
- [ ] **TC-0943** /learner/notifications at 375px
- [ ] **TC-0944** /learner/notifications at 768px
- [ ] **TC-0945** /learner/notifications at 1024px
- [ ] **TC-0946** /learner/notifications at 1440px
- [ ] **TC-0947** /learner/notifications at 1920px
- [ ] **TC-0949** /learner at 320px
- [ ] **TC-0950** /learner at 375px
- [ ] **TC-0951** /learner at 768px
- [ ] **TC-0952** /learner at 1024px
- [ ] **TC-0953** /learner at 1440px
- [ ] **TC-0954** /learner at 1920px
- [ ] **TC-0956** /learner/profile/edit at 320px
- [ ] **TC-0957** /learner/profile/edit at 375px
- [ ] **TC-0958** /learner/profile/edit at 768px
- [ ] **TC-0959** /learner/profile/edit at 1024px
- [ ] **TC-0960** /learner/profile/edit at 1440px
- [ ] **TC-0961** /learner/profile/edit at 1920px
- [ ] **TC-0963** /learner/profile at 320px
- [ ] **TC-0964** /learner/profile at 375px
- [ ] **TC-0965** /learner/profile at 768px
- [ ] **TC-0966** /learner/profile at 1024px
- [ ] **TC-0967** /learner/profile at 1440px
- [ ] **TC-0968** /learner/profile at 1920px
- [ ] **TC-0970** /learner/progress at 320px
- [ ] **TC-0971** /learner/progress at 375px
- [ ] **TC-0972** /learner/progress at 768px
- [ ] **TC-0973** /learner/progress at 1024px
- [ ] **TC-0974** /learner/progress at 1440px
- [ ] **TC-0975** /learner/progress at 1920px
- [ ] **TC-0977** /learner/reports at 320px
- [ ] **TC-0978** /learner/reports at 375px
- [ ] **TC-0979** /learner/reports at 768px
- [ ] **TC-0980** /learner/reports at 1024px
- [ ] **TC-0981** /learner/reports at 1440px
- [ ] **TC-0982** /learner/reports at 1920px
- [ ] **TC-0984** /learner/requests/[id] at 320px
- [ ] **TC-0985** /learner/requests/[id] at 375px
- [ ] **TC-0986** /learner/requests/[id] at 768px
- [ ] **TC-0987** /learner/requests/[id] at 1024px
- [ ] **TC-0988** /learner/requests/[id] at 1440px
- [ ] **TC-0989** /learner/requests/[id] at 1920px
- [ ] **TC-0991** /learner/requests at 320px
- [ ] **TC-0992** /learner/requests at 375px
- [ ] **TC-0993** /learner/requests at 768px
- [ ] **TC-0994** /learner/requests at 1024px
- [ ] **TC-0995** /learner/requests at 1440px
- [ ] **TC-0996** /learner/requests at 1920px
- [ ] **TC-0998** /learner/tutors/[tutorId] at 320px
- [ ] **TC-0999** /learner/tutors/[tutorId] at 375px
- [ ] **TC-1000** /learner/tutors/[tutorId] at 768px
- [ ] **TC-1001** /learner/tutors/[tutorId] at 1024px
- [ ] **TC-1002** /learner/tutors/[tutorId] at 1440px
- [ ] **TC-1003** /learner/tutors/[tutorId] at 1920px
- [ ] **TC-1005** /learner/tutors at 320px
- [ ] **TC-1006** /learner/tutors at 375px
- [ ] **TC-1007** /learner/tutors at 768px
- [ ] **TC-1008** /learner/tutors at 1024px
- [ ] **TC-1009** /learner/tutors at 1440px
- [ ] **TC-1010** /learner/tutors at 1920px
- [ ] **TC-1012** /login at 320px
- [ ] **TC-1013** /login at 375px
- [ ] **TC-1014** /login at 768px
- [ ] **TC-1015** /login at 1024px
- [ ] **TC-1016** /login at 1440px
- [ ] **TC-1017** /login at 1920px
- [ ] **TC-1019** /logout at 320px
- [ ] **TC-1020** /logout at 375px
- [ ] **TC-1021** /logout at 768px
- [ ] **TC-1022** /logout at 1024px
- [ ] **TC-1023** /logout at 1440px
- [ ] **TC-1024** /logout at 1920px
- [ ] **TC-1026** / at 320px
- [ ] **TC-1027** / at 375px
- [ ] **TC-1028** / at 768px
- [ ] **TC-1029** / at 1024px
- [ ] **TC-1030** / at 1440px
- [ ] **TC-1031** / at 1920px
- [ ] **TC-1033** /pending-approval at 320px
- [ ] **TC-1034** /pending-approval at 375px
- [ ] **TC-1035** /pending-approval at 768px
- [ ] **TC-1036** /pending-approval at 1024px
- [ ] **TC-1037** /pending-approval at 1440px
- [ ] **TC-1038** /pending-approval at 1920px
- [ ] **TC-1040** /privacy-policy at 320px
- [ ] **TC-1041** /privacy-policy at 375px
- [ ] **TC-1042** /privacy-policy at 768px
- [ ] **TC-1043** /privacy-policy at 1024px
- [ ] **TC-1044** /privacy-policy at 1440px
- [ ] **TC-1045** /privacy-policy at 1920px
- [ ] **TC-1047** /register/learner at 320px
- [ ] **TC-1048** /register/learner at 375px
- [ ] **TC-1049** /register/learner at 768px
- [ ] **TC-1050** /register/learner at 1024px
- [ ] **TC-1051** /register/learner at 1440px
- [ ] **TC-1052** /register/learner at 1920px
- [ ] **TC-1054** /register at 320px
- [ ] **TC-1055** /register at 375px
- [ ] **TC-1056** /register at 768px
- [ ] **TC-1057** /register at 1024px
- [ ] **TC-1058** /register at 1440px
- [ ] **TC-1059** /register at 1920px
- [ ] **TC-1061** /register/tutor at 320px
- [ ] **TC-1062** /register/tutor at 375px
- [ ] **TC-1063** /register/tutor at 768px
- [ ] **TC-1064** /register/tutor at 1024px
- [ ] **TC-1065** /register/tutor at 1440px
- [ ] **TC-1066** /register/tutor at 1920px
- [ ] **TC-1068** /reset-password at 320px
- [ ] **TC-1069** /reset-password at 375px
- [ ] **TC-1070** /reset-password at 768px
- [ ] **TC-1071** /reset-password at 1024px
- [ ] **TC-1072** /reset-password at 1440px
- [ ] **TC-1073** /reset-password at 1920px
- [ ] **TC-1075** /tutor/assessments/[attemptId] at 320px
- [ ] **TC-1076** /tutor/assessments/[attemptId] at 375px
- [ ] **TC-1077** /tutor/assessments/[attemptId] at 768px
- [ ] **TC-1078** /tutor/assessments/[attemptId] at 1024px
- [ ] **TC-1079** /tutor/assessments/[attemptId] at 1440px
- [ ] **TC-1080** /tutor/assessments/[attemptId] at 1920px
- [ ] **TC-1082** /tutor/assessments at 320px
- [ ] **TC-1083** /tutor/assessments at 375px
- [ ] **TC-1084** /tutor/assessments at 768px
- [ ] **TC-1085** /tutor/assessments at 1024px
- [ ] **TC-1086** /tutor/assessments at 1440px
- [ ] **TC-1087** /tutor/assessments at 1920px
- [ ] **TC-1089** /tutor/classes/[classId]/edit at 320px
- [ ] **TC-1090** /tutor/classes/[classId]/edit at 375px
- [ ] **TC-1091** /tutor/classes/[classId]/edit at 768px
- [ ] **TC-1092** /tutor/classes/[classId]/edit at 1024px
- [ ] **TC-1093** /tutor/classes/[classId]/edit at 1440px
- [ ] **TC-1094** /tutor/classes/[classId]/edit at 1920px
- [ ] **TC-1096** /tutor/classes/[classId] at 320px
- [ ] **TC-1097** /tutor/classes/[classId] at 375px
- [ ] **TC-1098** /tutor/classes/[classId] at 768px
- [ ] **TC-1099** /tutor/classes/[classId] at 1024px
- [ ] **TC-1100** /tutor/classes/[classId] at 1440px
- [ ] **TC-1101** /tutor/classes/[classId] at 1920px
- [ ] **TC-1103** /tutor/classes/[classId]/sessions/[sessionId]/test at 320px
- [ ] **TC-1104** /tutor/classes/[classId]/sessions/[sessionId]/test at 375px
- [ ] **TC-1105** /tutor/classes/[classId]/sessions/[sessionId]/test at 768px
- [ ] **TC-1106** /tutor/classes/[classId]/sessions/[sessionId]/test at 1024px
- [ ] **TC-1107** /tutor/classes/[classId]/sessions/[sessionId]/test at 1440px
- [ ] **TC-1108** /tutor/classes/[classId]/sessions/[sessionId]/test at 1920px
- [ ] **TC-1110** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 320px
- [ ] **TC-1111** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 375px
- [ ] **TC-1112** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 768px
- [ ] **TC-1113** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 1024px
- [ ] **TC-1114** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 1440px
- [ ] **TC-1115** /tutor/classes/[classId]/sessions/[sessionId]/test/results at 1920px
- [ ] **TC-1117** /tutor/classes/new at 320px
- [ ] **TC-1118** /tutor/classes/new at 375px
- [ ] **TC-1119** /tutor/classes/new at 768px
- [ ] **TC-1120** /tutor/classes/new at 1024px
- [ ] **TC-1121** /tutor/classes/new at 1440px
- [ ] **TC-1122** /tutor/classes/new at 1920px
- [ ] **TC-1124** /tutor/classes at 320px
- [ ] **TC-1125** /tutor/classes at 375px
- [ ] **TC-1126** /tutor/classes at 768px
- [ ] **TC-1127** /tutor/classes at 1024px
- [ ] **TC-1128** /tutor/classes at 1440px
- [ ] **TC-1129** /tutor/classes at 1920px
- [ ] **TC-1131** /tutor/help at 320px
- [ ] **TC-1132** /tutor/help at 375px
- [ ] **TC-1133** /tutor/help at 768px
- [ ] **TC-1134** /tutor/help at 1024px
- [ ] **TC-1135** /tutor/help at 1440px
- [ ] **TC-1136** /tutor/help at 1920px
- [ ] **TC-1138** /tutor/notifications at 320px
- [ ] **TC-1139** /tutor/notifications at 375px
- [ ] **TC-1140** /tutor/notifications at 768px
- [ ] **TC-1141** /tutor/notifications at 1024px
- [ ] **TC-1142** /tutor/notifications at 1440px
- [ ] **TC-1143** /tutor/notifications at 1920px
- [ ] **TC-1145** /tutor at 320px
- [ ] **TC-1146** /tutor at 375px
- [ ] **TC-1147** /tutor at 768px
- [ ] **TC-1148** /tutor at 1024px
- [ ] **TC-1149** /tutor at 1440px
- [ ] **TC-1150** /tutor at 1920px
- [ ] **TC-1152** /tutor/profile/edit at 320px
- [ ] **TC-1153** /tutor/profile/edit at 375px
- [ ] **TC-1154** /tutor/profile/edit at 768px
- [ ] **TC-1155** /tutor/profile/edit at 1024px
- [ ] **TC-1156** /tutor/profile/edit at 1440px
- [ ] **TC-1157** /tutor/profile/edit at 1920px
- [ ] **TC-1159** /tutor/profile at 320px
- [ ] **TC-1160** /tutor/profile at 375px
- [ ] **TC-1161** /tutor/profile at 768px
- [ ] **TC-1162** /tutor/profile at 1024px
- [ ] **TC-1163** /tutor/profile at 1440px
- [ ] **TC-1164** /tutor/profile at 1920px
- [ ] **TC-1166** /tutor/requests/[id]/accept at 320px
- [ ] **TC-1167** /tutor/requests/[id]/accept at 375px
- [ ] **TC-1168** /tutor/requests/[id]/accept at 768px
- [ ] **TC-1169** /tutor/requests/[id]/accept at 1024px
- [ ] **TC-1170** /tutor/requests/[id]/accept at 1440px
- [ ] **TC-1171** /tutor/requests/[id]/accept at 1920px
- [ ] **TC-1173** /tutor/requests/[id] at 320px
- [ ] **TC-1174** /tutor/requests/[id] at 375px
- [ ] **TC-1175** /tutor/requests/[id] at 768px
- [ ] **TC-1176** /tutor/requests/[id] at 1024px
- [ ] **TC-1177** /tutor/requests/[id] at 1440px
- [ ] **TC-1178** /tutor/requests/[id] at 1920px
- [ ] **TC-1180** /tutor/requests at 320px
- [ ] **TC-1181** /tutor/requests at 375px
- [ ] **TC-1182** /tutor/requests at 768px
- [ ] **TC-1183** /tutor/requests at 1024px
- [ ] **TC-1184** /tutor/requests at 1440px
- [ ] **TC-1185** /tutor/requests at 1920px
- [ ] **TC-1187** /tutor/students/[studentId] at 320px
- [ ] **TC-1188** /tutor/students/[studentId] at 375px
- [ ] **TC-1189** /tutor/students/[studentId] at 768px
- [ ] **TC-1190** /tutor/students/[studentId] at 1024px
- [ ] **TC-1191** /tutor/students/[studentId] at 1440px
- [ ] **TC-1192** /tutor/students/[studentId] at 1920px
- [ ] **TC-1194** /tutor/students at 320px
- [ ] **TC-1195** /tutor/students at 375px
- [ ] **TC-1196** /tutor/students at 768px
- [ ] **TC-1197** /tutor/students at 1024px
- [ ] **TC-1198** /tutor/students at 1440px
- [ ] **TC-1199** /tutor/students at 1920px
- [ ] **TC-1201** /unauthorized at 320px
- [ ] **TC-1202** /unauthorized at 375px
- [ ] **TC-1203** /unauthorized at 768px
- [ ] **TC-1204** /unauthorized at 1024px
- [ ] **TC-1205** /unauthorized at 1440px
- [ ] **TC-1206** /unauthorized at 1920px
- [ ] **TC-1208** /verify-email/check-email at 320px
- [ ] **TC-1209** /verify-email/check-email at 375px
- [ ] **TC-1210** /verify-email/check-email at 768px
- [ ] **TC-1211** /verify-email/check-email at 1024px
- [ ] **TC-1212** /verify-email/check-email at 1440px
- [ ] **TC-1213** /verify-email/check-email at 1920px
- [ ] **TC-1215** /verify-email at 320px
- [ ] **TC-1216** /verify-email at 375px
- [ ] **TC-1217** /verify-email at 768px
- [ ] **TC-1218** /verify-email at 1024px
- [ ] **TC-1219** /verify-email at 1440px
- [ ] **TC-1220** /verify-email at 1920px
## Components

- [ ] **TC-1221** TopicRequestDetail
- [ ] **TC-1222** AbuseReportTable
- [ ] **TC-1223** AdminManagementTable
- [ ] **TC-1224** AuditLogTable
- [ ] **TC-1225** CertificationReviewTable
- [ ] **TC-1226** ChatbotMissesTable
- [ ] **TC-1227** ClassAppealTable
- [ ] **TC-1228** ClassModerationTable
- [ ] **TC-1229** CreateAdminModal
- [ ] **TC-1230** PlatformSettingsForm
- [ ] **TC-1231** QuestionBankManager
- [ ] **TC-1232** RegistrationApprovalTable
- [ ] **TC-1233** ReportsView
- [ ] **TC-1234** SessionTestsTable
- [ ] **TC-1235** SubjectTopicManager
- [ ] **TC-1236** TopicRequestModerationTable
- [ ] **TC-1237** UserAvatarModerationCard
- [ ] **TC-1238** UserManagementTable
- [ ] **TC-1239** AuthLayout
- [ ] **TC-1240** ForgotPasswordForm
- [ ] **TC-1241** LoginForm
- [ ] **TC-1242** LogoutConfirm
- [ ] **TC-1243** RegisterForm
- [ ] **TC-1244** ResendVerificationButton
- [ ] **TC-1245** ResetPasswordForm
- [ ] **TC-1246** VerifyEmailForm
- [ ] **TC-1247** BarChartCard
- [ ] **TC-1248** DataTable
- [ ] **TC-1249** DeltaBar
- [ ] **TC-1250** GroupedBarChart
- [ ] **TC-1251** ProgressAreaChart
- [ ] **TC-1252** RateBarChart
- [ ] **TC-1253** index
- [ ] **TC-1254** progressTooltip
- [ ] **TC-1255** useThemeColors
- [ ] **TC-1256** ChatMessage
- [ ] **TC-1257** ChatWidget
- [ ] **TC-1258** chatbotClient
- [ ] **TC-1259** ClassCard
- [ ] **TC-1260** ClassDetailsView
- [ ] **TC-1261** ClassEmptyState
- [ ] **TC-1262** ClassModerationPanel
- [ ] **TC-1263** EnrolledLearnersTable
- [ ] **TC-1264** RecommendClassForm
- [ ] **TC-1265** SessionTestsCard
- [ ] **TC-1266** SessionsList
- [ ] **TC-1267** classStatus
- [ ] **TC-1268** DevChartLab
- [ ] **TC-1269** DevDataFactory
- [ ] **TC-1270** DevLoginBoard
- [ ] **TC-1271** HelpCenter
- [ ] **TC-1272** LandingFooter
- [ ] **TC-1273** LandingHero
- [ ] **TC-1274** LandingNav
- [ ] **TC-1275** Logo
- [ ] **TC-1276** MatchResultSample
- [ ] **TC-1277** PrivacyPayoff
- [ ] **TC-1278** SampleMatchForm
- [ ] **TC-1279** SampleProgress
- [ ] **TC-1280** StoryEnd
- [ ] **TC-1281** StoryTimeline
- [ ] **TC-1282** TutorProfileSample
- [ ] **TC-1283** sampleData
- [ ] **TC-1284** GlobalSearch
- [ ] **TC-1285** PortalLayout
- [ ] **TC-1286** ClassBrowser
- [ ] **TC-1287** LearnerClassActions
- [ ] **TC-1288** MatchCriteriaFields
- [ ] **TC-1289** MatchFinder
- [ ] **TC-1290** MyProgressView
- [ ] **TC-1291** MyReportsList
- [ ] **TC-1292** ReportButton
- [ ] **TC-1293** RequestTopicButton
- [ ] **TC-1294** TopicRequestManager
- [ ] **TC-1295** TutorBrowser
- [ ] **TC-1296** TutorInfoTrigger
- [ ] **TC-1297** TutorProfileClassTabs
- [ ] **TC-1298** NotificationBell
- [ ] **TC-1299** NotificationList
- [ ] **TC-1300** notificationMeta
- [ ] **TC-1301** ChangePasswordForm
- [ ] **TC-1302** ProfileEditForm
- [ ] **TC-1303** ProfileEditView
- [ ] **TC-1304** ProfilePictureUpload
- [ ] **TC-1305** ProfileView
- [ ] **TC-1306** UserAvatar
- [ ] **TC-1307** SessionProvider
- [ ] **TC-1308** QuestionFormModal
- [ ] **TC-1309** SessionTestRunner
- [ ] **TC-1310** WeeklyTimetable
- [ ] **TC-1311** AcceptRequestForm
- [ ] **TC-1312** AddSessionModal
- [ ] **TC-1313** AssessmentHistory
- [ ] **TC-1314** AssessmentQuizRunner
- [ ] **TC-1315** AssessmentsSummaryCard
- [ ] **TC-1316** AssessmentsTabs
- [ ] **TC-1317** ClassAppealCard
- [ ] **TC-1318** ClassManageMenu
- [ ] **TC-1319** ClassManagement
- [ ] **TC-1320** ClassProgressPanel
- [ ] **TC-1321** ClassScheduleFields
- [ ] **TC-1322** EditClassForm
- [ ] **TC-1323** NewClassForm
- [ ] **TC-1324** OtherTopicAssessment
- [ ] **TC-1325** SessionActions
- [ ] **TC-1326** SessionTestBuilder
- [ ] **TC-1327** SessionTestResults
- [ ] **TC-1328** StudentRoster
- [ ] **TC-1329** TopicCertificationList
- [ ] **TC-1330** TopicRequestBrowser
- [ ] **TC-1331** WeeklyScheduleView
- [ ] **TC-1332** AnonymousIdBadge
- [ ] **TC-1333** AuditLogLink
- [ ] **TC-1334** BackLink
- [ ] **TC-1335** BrandMark
- [ ] **TC-1336** CharCount
- [ ] **TC-1337** ConfirmDialog
- [ ] **TC-1338** EmptyState
- [ ] **TC-1339** FeedbackBanner
- [ ] **TC-1340** FormField
- [ ] **TC-1341** LoadingRow
- [ ] **TC-1342** Modal
- [ ] **TC-1343** PageHeader
- [ ] **TC-1344** Pagination
- [ ] **TC-1345** PromptDialog
- [ ] **TC-1346** SearchInput
- [ ] **TC-1347** SortableTh
- [ ] **TC-1348** StatCard
- [ ] **TC-1349** StatusBadge
- [ ] **TC-1350** Tabs
- [ ] **TC-1351** TopicChip
## Database

- [ ] **TC-1352** User schema/constraints/relations
- [ ] **TC-1353** PasswordResetToken schema/constraints/relations
- [ ] **TC-1354** VerificationToken schema/constraints/relations
- [ ] **TC-1355** TutorProfile schema/constraints/relations
- [ ] **TC-1356** TopicCertification schema/constraints/relations
- [ ] **TC-1357** IdCounter schema/constraints/relations
- [ ] **TC-1358** Subject schema/constraints/relations
- [ ] **TC-1359** Topic schema/constraints/relations
- [ ] **TC-1360** TutorClass schema/constraints/relations
- [ ] **TC-1361** ClassTopic schema/constraints/relations
- [ ] **TC-1362** ClassSession schema/constraints/relations
- [ ] **TC-1363** ClassEnrollment schema/constraints/relations
- [ ] **TC-1364** TopicRequest schema/constraints/relations
- [ ] **TC-1365** TopicRequestHistory schema/constraints/relations
- [ ] **TC-1366** TopicRequestTopic schema/constraints/relations
- [ ] **TC-1367** TopicRequestSlot schema/constraints/relations
- [ ] **TC-1368** ClassRecommendation schema/constraints/relations
- [ ] **TC-1369** AuditLog schema/constraints/relations
- [ ] **TC-1370** PlatformSetting schema/constraints/relations
- [ ] **TC-1371** AssessmentQuestion schema/constraints/relations
- [ ] **TC-1372** AssessmentOption schema/constraints/relations
- [ ] **TC-1373** AssessmentAttempt schema/constraints/relations
- [ ] **TC-1374** AssessmentAttemptItem schema/constraints/relations
- [ ] **TC-1375** QuestionRequest schema/constraints/relations
- [ ] **TC-1376** Notification schema/constraints/relations
- [ ] **TC-1377** ChatbotMiss schema/constraints/relations
- [ ] **TC-1378** ClassAppeal schema/constraints/relations
- [ ] **TC-1379** Report schema/constraints/relations
- [ ] **TC-1380** ReportViolation schema/constraints/relations
- [ ] **TC-1381** SessionTest schema/constraints/relations
- [ ] **TC-1382** SessionTestQuestion schema/constraints/relations
- [ ] **TC-1383** SessionTestAttempt schema/constraints/relations
- [ ] **TC-1384** SessionTestAttemptItem schema/constraints/relations
## Security

- [ ] **TC-1385** Peer privacy matrix
- [ ] **TC-1386** Same-site/CSRF/CORS
- [ ] **TC-1387** Stored/reflected XSS and injection
- [ ] **TC-1388** Secret and dependency review
- [ ] **TC-1389** Account/session revocation
## Reliability

- [ ] **TC-1390** Atomic assessment submission
- [ ] **TC-1391** Enrollment capacity and scheduling races
- [ ] **TC-1392** Backup and recovery
- [ ] **TC-1395** Offline, slow link and restart
## Performance

- [ ] **TC-1393** Page and API baselines
- [ ] **TC-1394** Realistic load and dataset scale
## Compatibility

- [ ] **TC-1396** Chrome Edge Firefox Safari
## Executed failures requiring fixes

- [ ] TC-1397 inactive tutor denied — FAIL.
- [ ] TC-1398 qualification keys protected — FAIL.
- [ ] TC-1399 banned admin denied — FAIL.
- [ ] TC-1400 whitespace-only signup rejected — FAIL.
- [ ] TC-1401 generated production route types pass — FAIL / BUG-009.
