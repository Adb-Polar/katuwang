# Student Tutor features

## Role summary

`STUDENT_TUTOR` owns one TutorProfile and manages only its classes, sessions, custom questions and learner relationships. It can take topic-certification quizzes, request question-bank additions and act on eligible learner requests. It cannot moderate other accounts or author the Admin bank. Shared account/search/notifications/help/chat features are detailed in [Shared/system features](06-shared-and-system.md).

## T01 — Dashboard, class listing and teaching timetable

- **Description:** Summarizes own classes, students, certified topics, eligible requests and upcoming meetings.
- **Trigger/entry point:** `/tutor`, `/tutor/classes`; `GET /api/tutor/classes?status=...`.
- **Underlying logic/business rules:** Resolve current user's TutorProfile. Load own classes with flattened topics, date-ordered sessions and anonymized learner enrollments. Optional valid ClassStatus filters collection. Dashboard uses own profile/classes/certifications to count activity, derive eligible request count and show upcoming/weekly session views. Class management offers tabs, client filtering/sort and detail actions.
- **Inputs/outputs:** Status/filter/timetable navigation → own class data, counts, rosters and calendar; no writes.
- **Permissions/edge cases:** 404 absent TutorProfile. Historical classes remain available to owner. Calendar is derived from sessions, not a separately editable availability table.
- **Evidence:** [dashboard](../../src/app/tutor/page.tsx), [collection handler](../../src/app/api/tutor/classes/route.ts), [ClassManagement](../../src/components/tutor/ClassManagement.tsx).

## T02 — Create a class with initial sessions

- **Description:** Creates a subject/topic class and its initial individual meetings.
- **Trigger/entry point:** `/tutor/classes/new`, New Class form → `POST /api/tutor/classes`.
- **Underlying logic/business rules:** (1) Resolve TutorProfile and validate full payload. (2) Require an existing active subject. (3) Normalize whitespace/case keys and deduplicate topics; custom topics are allowed. (4) Resolve every session topic to a selected class topic. (5) If `requireCertificationForClassCreation` is on, require CERTIFIED for every selected topic. (6) Reject past session starts, internal batch overlaps and overlaps with tutor's SCHEDULED meetings in SCHEDULED classes. (7) Generate class code and create nested topics/sessions with class SCHEDULED status.
- **Inputs:** Subject, nullable grade, 1–10 topics (2–60 characters), description ≤500, capacity 1–10; optional building ≤100, room ≤50 or valid meeting URL, with at least one location/link value required. Initial `sessions` has 1–20 `{topic,scheduledAt,duration}` entries; ISO datetime; duration integer 15–240 minutes.
- **Outputs:** HTTP 201 class with topics and ordered sessions. Standalone creation uses the schema's `published=true` default; although the shared validator accepts `published`, this handler does not write it, so even `published:false` creates a published class. Visibility can subsequently be changed through class PATCH.
- **Permissions/edge cases:** 400 invalid data/topic/certification/past time; 409 overlap. Adjacent meetings are permitted. No learner conflicts, building/room collision detection or external conferencing provisioning. A topic with no certification can be taught when certification requirement is off, but may not be assessable until added to active taxonomy.
- **Evidence:** [create handler](../../src/app/api/tutor/classes/route.ts), [class schema](../../src/lib/validations/class.ts), [overlap logic](../../src/lib/classSessions.ts), [TutorClass defaults](../../prisma/schema.prisma).

## T03 — Inspect, edit, publish or unpublish an own class

- **Description:** Maintains class-level content and discovery visibility independently of meeting editing.
- **Trigger/entry point:** `/tutor/classes/[classId]`, `/tutor/classes/[classId]/edit`; management menu → `PATCH /api/tutor/classes/[classId]`.
- **Underlying logic/business rules:** Load class/owner and deny another tutor. Deny SUSPENDED/BANNED class edits. Validate partial class fields, normalize replacement topics, prevent capacity below current enrollments, preserve at least one location/link, and reject removing topics used by any class meeting. Replace topic children transactionally and update fields, including optional `published`.
- **Inputs/outputs:** Partial subject/grade/topics/description/capacity/location/meetingLink/published → updated class with topic strings and sessions. Visibility change affects learner discovery.
- **Permissions/edge cases:** 404 missing; 403 wrong owner/moderated; 400 invalid/capacity/used-topic removal. UI redirects completed-class edit page to detail, but API has broader allowances. Unlike creation, PATCH does not validate subject against active catalog or recheck certifications. Unpublishing does not remove enrollments or explicitly notify members.
- **Evidence:** [class item handler](../../src/app/api/tutor/classes/[classId]/route.ts), [edit page](../../src/app/tutor/classes/[classId]/edit/page.tsx), [management menu](../../src/components/tutor/ClassManageMenu.tsx).

## T04 — Complete, cancel, reopen or delete a class

- **Description:** Manages whole-class lifecycle and linked request effects.
- **Trigger/entry point:** Class management controls; `PATCH /api/tutor/classes/[classId]` with `status`; `DELETE` same endpoint.
- **Underlying logic/business rules:** PATCH accepts SCHEDULED/COMPLETED/CANCELLED. Completing/cancelling changes all still-SCHEDULED meetings to that status. Completion marks linked ACCEPTED/ENROLLED requests FULFILLED and notifies request owners; cancellation reopens them and clears link. Other enrolled learners receive CLASS_COMPLETED/CLASS_CANCELLED, excluding request-linked learners already notified. Delete requires no enrollments, reopens linked ACCEPTED requests and notifies their learners, then deletes class and cascading children in a transaction.
- **Inputs/outputs:** Status or class ID → updated class/success message; meeting/request/notification changes or hard deletion.
- **Permissions/edge cases:** PATCH blocks moderated classes; DELETE has ownership and enrollment checks but no equivalent moderated-state ban. 400 if enrolled class is deleted. Returning class to SCHEDULED does not restore completed/cancelled meetings. Completing a class does not call the individual-session completion notification path. No strict terminal-state transition graph is enforced by Tutor PATCH.
- **Evidence:** [class item handler](../../src/app/api/tutor/classes/[classId]/route.ts).

## T05 — Add, reschedule, complete, cancel or delete a session

- **Description:** Controls one class meeting without replacing the whole class schedule.
- **Trigger/entry point:** Add Session modal/session row controls; `POST /api/tutor/classes/[classId]/sessions`; `PATCH/DELETE .../sessions/[sessionId]`.
- **Underlying logic/business rules:** Enforce ownership and class/session relationship; block moderated class. Add requires SCHEDULED class, exact selected class topic, valid future datetime/duration and no tutor overlap. PATCH validates partial topic/time/duration/status; for effective SCHEDULED status, rejects past time and overlap excluding itself. SCHEDULED → COMPLETED with PUBLISHED test updates session and notifies enrolled learners that POST is open. Delete only SCHEDULED meeting; cannot remove sole meeting when learners are enrolled; delete row with its cascading test records.
- **Inputs/outputs:** Add `{topic,scheduledAt,duration}`; patch partial same plus `status:SCHEDULED|COMPLETED|CANCELLED`; delete ID → new/updated session or message, possible notifications.
- **Permissions/edge cases:** 403 ownership/moderation, 404 class/session, 400 invalid/topic/past/state/last-session, 409 time conflict. PATCH does not require parent class to be SCHEDULED as Add does. Session completion is manual; no attendance record or clock-driven transition. Cancellation alone does not invoke whole-class request reopening.
- **Evidence:** [add handler](../../src/app/api/tutor/classes/[classId]/sessions/route.ts), [session item handler](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/route.ts).

## T06 — Browse eligible learner requests

- **Description:** Displays requests directed to this tutor and public requests overlapping certified teaching scope.
- **Trigger/entry point:** `/tutor/requests`; `GET /api/tutor/topic-requests?tab=open|public|directed|accepted&subject=...`.
- **Underlying logic/business rules:** Require matching enabled, resolve profile and certified topic pairs. OPEN pool = requests directed to own profile OR public requests whose subject and at least one topic match certification. Directed tab narrows to own, public narrows to no directed tutor. Accepted tab includes ACCEPTED/ENROLLED requests linked to own classes. Paginate; open views include preferred slots/note and anonymous learner grade/section, accepted views include linked class/capacity/enrollment counts.
- **Inputs/outputs:** Tab, subject, page/pageSize → `{requests,total,page,pageSize}`.
- **Permissions/edge cases:** Another tutor's directed requests are excluded. No certifications still allows own directed requests to appear, but acceptance has stricter content rules. Public eligibility requires some overlap, not certification for every originally requested topic. FULFILLED requests are excluded from accepted list.
- **Evidence:** [request browser API](../../src/app/api/tutor/topic-requests/route.ts), [visibility predicate](../../src/lib/topicRequestVisibility.ts).

## T07 — Accept request and create a class

- **Description:** Responds to one learner request by creating a published tutoring class.
- **Trigger/entry point:** Request Accept → `/tutor/requests/[id]/accept`; `POST /api/tutor/topic-requests/[id]/accept`.
- **Underlying logic/business rules:** Require matching enabled and OPEN request. Reuse eligible-pool predicate. Validate full class-creation body, same subject as request, normalized selected topics/session topics, and CERTIFIED status for **every proposed class topic regardless of platform certification toggle**. Reject past/overlapping meetings; generate code. Transaction creates published SCHEDULED class, changes request to ACCEPTED with class link and notifies learner to review/enroll.
- **Inputs/outputs:** Full class creation payload → HTTP 201 `{request:{id,status,fulfilledClassId},classId}` and navigation to class detail. No automatic enrollment or seat reservation.
- **Permissions/edge cases:** 403 ineligible/disabled; 400 request no longer OPEN, subject mismatch, uncertified topic or schedule data; 409 overlap. API does not enforce all requested topics, requested grade, or preferred windows in proposed class, beyond eligibility and same subject. Concurrent acceptance is not guarded by a conditional OPEN update inside transaction.
- **Evidence:** [accept handler](../../src/app/api/tutor/topic-requests/[id]/accept/route.ts), [accept form](../../src/components/tutor/AcceptRequestForm.tsx).

## T08 — View anonymized students and relationship history

- **Description:** Aggregates own learners across classes and opens a learner's relationship to this tutor.
- **Trigger/entry point:** `/tutor/students`, enrollment rows → `/tutor/students/[studentId]`; `GET /api/tutor/students`.
- **Underlying logic/business rules:** Query enrollments only in own classes; filter grade, section substring, subject, classId and anonymous-ID `q`; deduplicate by learner; collect class code/topics/enrolled date; paginate learner aggregate in memory. Detail requires at least one own-class enrollment for target.
- **Inputs/outputs:** Filters/page → `{students,total,page,pageSize}` with opaque ID, anonymous ID, grade, section and own-class membership. Detail lists enrolled own classes.
- **Permissions/edge cases:** No learner real name/email/contact, no arbitrary user lookup. 404 unrelated learner detail; 404 missing tutor profile. No teacher-added grade, attendance, private note, roster CSV export or learner-removal endpoint is implemented.
- **Evidence:** [students API](../../src/app/api/tutor/students/route.ts), [student detail](../../src/app/tutor/students/[studentId]/page.tsx).

## T09 — Assessment readiness, certification listing and manual requests

- **Description:** Shows taught topics, available quiz actions, certification state, previous scores and use in own classes. Supports requesting certification through an API separately from automated quiz grading.
- **Trigger/entry point:** `/tutor/assessments`; `GET /api/tutor/topic-certifications`; `POST` same endpoint; assessments tabs/other-topic controls.
- **Underlying logic/business rules:** Server assembles taught subject/topic pairs and per-topic BANK counts, current config, in-progress/latest completed attempts, open question requests and certification state. Certification collection adds `usedInClasses`. Manual request validates active catalog pair and upserts PENDING, clearing old review/certification fields. Existing CERTIFIED returns 200 unchanged.
- **Inputs/outputs:** Manual `{subject,topic}` → PENDING certification HTTP 201 or certified no-op 200; readiness/list data support start/resume/retake/request-question actions.
- **Permissions/edge cases:** Ownership is profile-scoped. Manual endpoint does not require passing a quiz or already teaching that topic. UI exposes automated quiz flow as primary action. Custom class topic may lack a valid catalog quiz.
- **Evidence:** [assessment page](../../src/app/tutor/assessments/page.tsx), [assessment status](../../src/lib/assessmentStatus.ts), [certification API](../../src/app/api/tutor/topic-certifications/route.ts).

## T10 — Start/resume, submit and review certification quizzes

- **Description:** Measures tutor knowledge per subject/topic and updates certification status.
- **Trigger/entry point:** Start/Resume/Retake → `POST /api/tutor/assessments`, `/tutor/assessments/[attemptId]`; history → `GET /api/tutor/assessments`, `GET .../[attemptId]`; submit → `POST .../[attemptId]/submit`.
- **Underlying logic/business rules:** Validate active catalog pair. Resume an existing IN_PROGRESS attempt first. Otherwise reject already CERTIFIED; require active BANK count ≥ global minBankSize (default 5). Serve min(questionCount, active count), default 5, randomized with previous completed attempt's questions deprioritized. Transaction assigns next per-topic attempt number, stores question IDs/order and passPercent snapshot (default 80). Submit once, grade served questions server-side using full denominator. Store PASSED/FAILED with scores/timestamps and item results. Preserve existing CERTIFIED badge. Passed + auto-certify → CERTIFIED; passed without → PENDING with pass note; failed → REJECTED with retake note.
- **Inputs/outputs:** Start `{subject,topic}` → concealed-answer attempt HTTP 201 or resumed 200. Submit `{answers:[{questionId,optionId}]}` (1–50) → revealed graded attempt. History summary includes attempt number, status, counts, score and threshold.
- **Permissions/edge cases:** Other-owner attempt hidden as 404; submitted resubmission 409; thin bank 409 with `BANK_NOT_READY`; certified start 409. Answers missing/invalid count wrong, duplicate question answers use last, foreign question IDs do not add marks. Correct options/explanations withheld until submitted. No enforced timer, cooldown, maximum attempts or persistent answer autosave was found. Tutor-owned questions cannot fill the certification pool.
- **Evidence:** [assessment start](../../src/app/api/tutor/assessments/route.ts), [submit](../../src/app/api/tutor/assessments/[attemptId]/submit/route.ts), [picker](../../src/lib/assessmentPicker.ts), [grader](../../src/lib/gradeAttempt.ts).

## T11 — Request more assessment questions

- **Description:** Asks Admins to populate a subject/topic bank and tracks resolution.
- **Trigger/entry point:** Assessment Request Questions control; `GET/POST /api/tutor/question-requests`.
- **Underlying logic/business rules:** Validate catalog pair; unique TutorProfile/subject/topic key. Existing OPEN request returns neutral existing-open message 200. Otherwise create/reopen OPEN and clear previous resolution data, then notify active Admins in transaction. Own GET returns newest-first requests.
- **Inputs/outputs:** `{subject,topic,note?}` (note ≤500) → request HTTP 201 or existing-open message; notifications and request row.
- **Permissions/edge cases:** Thin-bank readiness is UI guidance; endpoint does not itself require bank to be thin. Resolution does not automatically create questions; actual readiness must be rechecked. Only own requests listed.
- **Evidence:** [question-request handler](../../src/app/api/tutor/question-requests/route.ts).

## T12 — Build, edit, delete, publish and close session tests

- **Description:** Creates one reusable ordered diagnostic question set for a meeting's PRE and POST runs.
- **Trigger/entry point:** Session test builder `/tutor/classes/[classId]/sessions/[sessionId]/test`; `GET/POST/PATCH/DELETE .../test`; `PUT .../test/questions`; `PATCH .../test/status`.
- **Underlying logic/business rules:** Shared loader enforces own class, non-moderated status and child session relationship. POST requires sessionTestsEnabled and no existing test, then creates DRAFT. Metadata PATCH requires DRAFT. Question PUT requires DRAFT with zero attempts; reject duplicate IDs and require each to be active BANK content of class subject or own TUTOR content; replace ordered links transactionally. Publish requires enabled setting, DRAFT and ≥1 question; set PUBLISHED/publishedAt and notify enrolled learners that PRE is open. Close only PUBLISHED → CLOSED/closedAt. Delete only DRAFT with zero attempts.
- **Inputs/outputs:** Title 3–120, instructions ≤2000; questionIds 1–50 in display order; `{status:PUBLISHED|CLOSED}` → test definition/state/attempt count, notifications or deletion message.
- **Permissions/edge cases:** 404 absent; 403 owner/moderation/disabled creation or publish; 409 existing/locked/invalid transition; 400 empty/duplicate/unavailable questions. Closing has no reopen-to-draft/published route. Disable flag does not stop draft editing or closing. Bank selection enforces subject but not same session topic; owned custom selection is not subject-restricted in the PUT predicate. Publishing can occur after session completion, so PRE notification text may not match actual start window.
- **Evidence:** [test handlers](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/route.ts), [questions](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/questions/route.ts), [status](../../src/app/api/tutor/classes/[classId]/sessions/[sessionId]/test/status/route.ts).

## T13 — Browse bank and manage own custom session questions

- **Description:** Uses shared active Admin-authored questions or authors private tutor-owned MCQs for diagnostic tests.
- **Trigger/entry point:** Builder bank/custom tabs; `GET /api/tutor/question-bank`; `GET/POST /api/tutor/questions`; `PATCH/DELETE /api/tutor/questions/[questionId]`.
- **Underlying logic/business rules:** Bank GET filters active BANK content by subject, topic and prompt `q`, paginated, including options/correct flags. Own GET filters TUTOR origin/profile and optional topic. Author POST loads own non-moderated class, derives subject and requires topic in class topics; create question/options with owner and origin. PATCH/DELETE load own TUTOR question; lock if any session attempt item references it or any linked test is non-DRAFT. Editable options are replaced transactionally. Delete detaches draft-test links before deleting question/options.
- **Inputs/outputs:** Author `{classId,topic,prompt,explanation?,options:[{text,isCorrect}]}`. Prompt 5–1000, explanation ≤1000, 2–6 options each 1–500, exactly one correct. PATCH allows partial topic/content/options → question data; DELETE → message.
- **Permissions/edge cases:** 404 other-owner question; 409 locked. PATCH topic is not rechecked against original class/catalog. BANK answers are intentionally visible to tutors for test construction, including topics also used in certification. This limits assessment secrecy. Tutor questions never feed certification quizzes or Admin bank editor.
- **Evidence:** [bank browser](../../src/app/api/tutor/question-bank/route.ts), [custom collection](../../src/app/api/tutor/questions/route.ts), [custom item](../../src/app/api/tutor/questions/[questionId]/route.ts).

## T14 — View class/session results and individual answers

- **Description:** Evaluates learner PRE/POST improvement through class rollup, question rates and anonymized paired learner scores.
- **Trigger/entry point:** Class progress panel; `/tutor/classes/[classId]/sessions/[sessionId]/test/results`; `GET .../[classId]/test-results`; `GET .../test/results`; `GET .../test/attempts/[attemptId]`.
- **Underlying logic/business rules:** Enforce owned non-moderated class/session/test. Class rollup emits chronological sessions with nullable average PRE/POST/delta and paired counts; total delta averages all paired learner-session deltas. Per-test results correlate submitted attempts by learner and question position; return enrolled learners with anonymous IDs, attempt links, paired delta and per-question correct rates. Individual drilldown validates attempt/test association and serializes revealed submitted content as implemented.
- **Inputs/outputs:** Class/session/attempt IDs → rollup, aggregate test results or learner attempt and anonymous label; Recharts plots and data tables render results.
- **Permissions/edge cases:** Missing scores are null, never fabricated zeroes. `avgDelta` is mean of individual paired deltas, not difference between independently averaged PRE/POST groups. Per-test learner rows use current enrollments; question rates use submitted attempts, which can include departed learners. No learner real name/contact in result DTOs. Moderated-class helper also blocks these read endpoints.
- **Evidence:** [aggregation](../../src/lib/sessionTestResults.ts), [results UI](../../src/components/tutor/SessionTestResults.tsx), [class results](../../src/app/api/tutor/classes/[classId]/test-results/route.ts).

## T15 — Appeal class suspension or ban

- **Description:** Contests Admin moderation on an owned class and displays the review outcome.
- **Trigger/entry point:** Appeal card on moderated class; `POST /api/tutor/classes/[classId]/appeal`.
- **Underlying logic/business rules:** Validate reason; confirm own class is SUSPENDED/BANNED; reject existing PENDING appeal. Create PENDING appeal and notify active Admins transactionally. Class context renders appeal history/review note; Admin review can reinstate class.
- **Inputs/outputs:** `{reason}` 10–500 characters → appeal HTTP 201 and Admin notifications.
- **Permissions/edge cases:** 403 other owner; 404 missing class; 400 non-moderated; 409 already pending. Account suspension/ban is a separate restriction and has no analogous public account-appeal endpoint. Previous reviewed appeal does not prohibit a new one if class remains moderated.
- **Evidence:** [appeal handler](../../src/app/api/tutor/classes/[classId]/appeal/route.ts), [appeal card](../../src/components/tutor/ClassAppealCard.tsx).

## T16 — Own profile and shared tools

`/tutor/profile` and `/tutor/profile/edit` expose own profile; PATCH writes grade, section and normalized contact. The tutor handler currently omits recoveryEmail despite shared form/schema support. Password, notifications, help, assistant, search and navigation preferences follow [Shared/system features](06-shared-and-system.md).
