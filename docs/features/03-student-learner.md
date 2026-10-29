# Student Learner features

## Role summary

`STUDENT_LEARNER` can discover and join classes, request help, take diagnostic tests, inspect personal progress, and privately report tutors/classes with which they have an enrollment relationship. Writes are scoped to the current learner. Admin and Tutor do not inherit these permissions. This role also has [shared account, notifications, search, help and chatbot features](06-shared-and-system.md).

## L01 — Dashboard and weekly schedule

- **Description:** Personal overview of enrollments, open requests and upcoming teaching meetings, with discovery and tool links.
- **Trigger/entry point:** `/learner` after sign-in or Dashboard navigation.
- **Underlying logic/business rules:** Server page counts own enrollments and OPEN requests, loads upcoming sessions from enrolled classes, and renders upcoming-session and weekly timetable components. Quick links navigate to browser, match, requests and other learner tools.
- **Inputs/outputs:** Current session and timetable navigation → counts, anonymized class/session cards and schedule; no writes.
- **Permissions/edge cases:** Own enrollment relationship limits the schedule. Empty states replace missing events. A session is not automatically completed because its date passes.
- **Evidence:** [learner dashboard](../../src/app/learner/page.tsx), [WeeklyTimetable](../../src/components/schedule/WeeklyTimetable.tsx).

## L02 — Browse, filter and inspect classes

- **Description:** Discovers published upcoming classes and opens subject/topics, sessions, capacity and tutor context.
- **Trigger/entry point:** `/learner/classes`, cards/table rows, `GET /api/classes?scope=browse`; detail `/learner/classes/[classId]`.
- **Underlying logic/business rules:** (1) Lazily reinstate elapsed class suspensions. (2) Select SCHEDULED, published classes with at least one future SCHEDULED session and no own enrollment. (3) Apply `q`, `subject`, `gradeLevel`, page/pageSize. Search spans class code, subject slug/resolved subject label, topic, and anonymous tutor ID. (4) Without explicit filters, rank using learner grade, subjects/topics from enrollments and OPEN requests, next meeting and available seats. Explicit filters use newest-first. (5) Serialize flattened topics/certifications and only own enrollment; tutor names/section appear only when enabled. (6) Paginate and return counts.
- **Inputs/outputs:** Query filters → `{classes,page,pageSize,total,counts}`. Cards/details include class code, description, topics, grade, sessions, location/link, capacity, tutor anonymous ID and verification context.
- **Permissions/edge cases:** Detail requires browsable class or existing enrollment. Full classes can appear in browse but enrollment fails. Completed/cancelled or unpublished classes are not general browse results. Existing enrollment can preserve access to historical/moderated data; unpublished detail has a special placeholder. The list is cached in the SPA for 60 seconds and invalidated on join/leave. Certification is displayed but default class creation does not require it.
- **Evidence:** [classes API](../../src/app/api/classes/route.ts), [class queries](../../src/lib/classQueries.ts), [browse ranking](../../src/lib/browseRanking.ts), [detail page](../../src/app/learner/classes/[classId]/page.tsx).

Default browse score is grade fit (exact 6, adjacent 3, any-grade 2, other 0) + interested subject 8 + 3 per interested topic + next-session soonness up to 4 over 14 days + 1 if seats remain. Ties use newest class. These are ordering signals, not enrollment eligibility conditions.

## L03 — Find tutors and inspect anonymized profiles

- **Description:** Finds active tutors with at least one certified topic and displays teaching scope, weekly teaching windows and classes.
- **Trigger/entry point:** `/learner/tutors`, `GET /api/learner/tutors`; tutor cards/info triggers → `/learner/tutors/[tutorId]`.
- **Underlying logic/business rules:** Select ACTIVE STUDENT_TUTOR users with certifications; filter `q` by anonymous ID and `subjects` comma-separated slugs (legacy `subject` supported). Multiple subjects use AND: tutor must be certified in each. Return verified-topic count, subjects, published-class count, next session and classes with at least one certified topic. Direct profile loads any Tutor User ID with a TutorProfile (without repeating directory ACTIVE/certification gates), then shows certified topics, published classes and a timetable of upcoming scheduled meetings in the next seven days. Scheduled published classes are visible; non-scheduled classes require the viewer's enrollment. Class tabs and request/report controls provide next actions.
- **Inputs/outputs:** ID, subjects, page/pageSize → paginated tutor DTOs; profile → anonymized identity, topics, timetable and class list. `showTutorRealNames` can expose tutor name/section.
- **Permissions/edge cases:** Directory requires certification even when uncertified standalone classes can otherwise exist. Grade/section/opaque identifiers are not equivalent to complete anonymity. Schedule entries represent teaching activity, not free/bookable slots. The profile report button uses enrollment in published classes as its UI condition; the report API checks the broader enrollment relationship. No manual availability editor or direct-message feature exists.
- **Evidence:** [tutors API](../../src/app/api/learner/tutors/route.ts), [profile page](../../src/app/learner/tutors/[tutorId]/page.tsx), [derived availability](../../src/lib/derivedAvailability.ts).

## L04 — Auto Match

- **Description:** Produces explainable ranked class matches from desired learning criteria.
- **Trigger/entry point:** `/learner/match`, match form → `POST /api/learner/match`.
- **Underlying logic/business rules:** Validate subject/topics against active catalog, check `matchingEnabled`, reinstate expired class suspensions, load visible candidates, remove own enrolled classes, run hard filters and scoring, return best 20 with reason fields.
- **Inputs:** Subject; 1–10 topics; optional grade; up to 21 preferred weekly `{day,startTime,endTime}` slots; optional `classFormat: SOLO|GROUP|ANY`. Days MONDAY–SUNDAY; times HH:MM with start < end.
- **Outputs:** `{matches:[{class,score,reasons}]}`; reasons include matched/verified topics, grade fit and schedule-fit count. UI can open a class or start a request when no fit exists. No enrollment is created.
- **Permissions/edge cases:** Disabled matching → 403; invalid catalog/criteria → 400. Hard exclude wrong subject, unpublished/non-SCHEDULED/full class, no future scheduled meeting, zero requested-topic overlap, or incompatible solo/group capacity. Grade mismatch and time mismatch reduce score rather than exclude. Schedule fit checks **start time** in the preferred window, not full session containment. Time interpretation is runtime-local.
- **Evidence:** [match handler](../../src/app/api/learner/match/route.ts), [matching engine](../../src/lib/matching.ts).

Score = 10 per requested matched topic + 5 per certified matched topic + 3 per fitting upcoming session + grade score (6/3/2/0) + soonness up to 2 decaying over 14 days. Round to two decimals; ties prefer the sooner next meeting.

## L05 — Enroll in or leave a class

- **Description:** Adds/removes the learner's class membership; joining a request-created class remains an explicit action.
- **Trigger/entry point:** Class detail Enroll/Leave controls → `POST` or `DELETE /api/classes/[classId]/enroll`.
- **Underlying logic/business rules:** Join loads class after expired-suspension repair, requires published/SCHEDULED, future scheduled meeting, free capacity and no existing membership. In a transaction create enrollment, move own linked ACCEPTED requests to ENROLLED, notify tutor. Leave requires existing class/enrollment and SCHEDULED class; delete enrollment, move own linked ENROLLED requests to ACCEPTED, notify tutor. UI invalidates class-browser cache and refreshes/navigates.
- **Inputs/outputs:** Class ID and session; no form body required. Join → enrollment row with HTTP 201; leave → success message. Membership, linked requests and notifications change together.
- **Permissions/edge cases:** 404 missing class/membership; 400 not accepting/no future sessions/non-SCHEDULED leave; 409 full/already joined. No learner schedule-conflict or grade restriction is enforced. Capacity is checked before the write transaction, so simultaneous joins can race. Leaving removes the relationship used by some result/progress/report views; attempt rows are separate records.
- **Evidence:** [enrollment handler](../../src/app/api/classes/[classId]/enroll/route.ts), [actions](../../src/components/learner/LearnerClassActions.tsx).

## L06 — My Classes and attendance information

- **Description:** Separates own upcoming, completed, and cancelled class history and provides access to sessions and meeting details.
- **Trigger/entry point:** `/learner/my-classes`; `GET /api/classes?scope=mine&status=upcoming|completed|cancelled`; class detail/session cards.
- **Underlying logic/business rules:** Scope to own enrollments. Upcoming includes SCHEDULED/SUSPENDED, completed includes COMPLETED, cancelled includes CANCELLED/BANNED. Apply search/subject/grade and newest-first pagination. Detail shows schedule/location/meeting-link context and diagnostic-test controls when applicable.
- **Inputs/outputs:** Tabs, filters, page → own class list and category counts; meeting link navigates externally.
- **Permissions/edge cases:** Classes remain in membership history after moderation; taking tests has separate guards. No in-app call, attendance marking, or automatic meeting completion is implemented. A location may be a building, room, URL, or combination.
- **Evidence:** [classes API](../../src/app/api/classes/route.ts), [detail view](../../src/components/classes/ClassDetailsView.tsx), [class detail](../../src/app/learner/classes/[classId]/page.tsx).

## L07 — Create and track public/directed class requests

- **Description:** Persists demand when a class does not fit; a directed request targets one tutor.
- **Trigger/entry point:** `/learner/requests`, matching fallback, tutor-profile Request control; `GET/POST /api/learner/topic-requests`.
- **Underlying logic/business rules:** Require matching enabled for creation. Validate active subject/topics and grade; resolve optional `directedTutorId` (Tutor User ID) to TutorProfile. Limit to 10 OPEN requests. Create request, deduplicated topic children and preferred-slot children transactionally; notify the designated tutor for directed requests. List only own requests with anonymized directed tutor and linked class/next-meeting data.
- **Inputs:** Match-style subject/topics/grade, optional preferred slots, note ≤500 characters, directed Tutor User ID; classFormat is accepted by shared validation but not persisted.
- **Outputs:** HTTP 201 serialized request; OPEN row and children; directed notification. Later acceptance exposes linked class for review/enrollment.
- **Permissions/edge cases:** 409 when OPEN quota reached; 400 unknown subject/topic/tutor. Directed creation validates Tutor role/profile but does not require ACTIVE status or certification. Public request visibility to tutors depends on certification overlap. Request creation does not reserve a seat or enroll.
- **Evidence:** [request collection](../../src/app/api/learner/topic-requests/route.ts), [request controls](../../src/components/learner/TopicRequestManager.tsx).

## L08 — Edit or cancel a class request

- **Description:** Revises an open request or withdraws an open/accepted request.
- **Trigger/entry point:** Request-manager Edit/Cancel → `PATCH /api/learner/topic-requests/[id]`.
- **Underlying logic/business rules:** Own request only. A payload containing `status` selects cancellation validation; only `{status:"CANCELLED"}` is allowed and only from OPEN/ACCEPTED. Cancellation clears class link. Otherwise require full request criteria and OPEN state; replace subject/grade/note/topics/slots after catalog checks.
- **Inputs/outputs:** Cancel status or complete criteria → `{id,status}` and changed row/children.
- **Permissions/edge cases:** Other user's request is hidden as 404. ENROLLED/FULFILLED/CANCELLED cannot be learner-cancelled; accepted request cannot be edited. Editing does not retarget the directed tutor despite the shared schema accepting the field. Cancellation does not delete the class a tutor already created. Reads/edits/cancellation are not uniformly gated by `matchingEnabled`.
- **Evidence:** [request item handler](../../src/app/api/learner/topic-requests/[id]/route.ts).

## L09 — Take PRE/POST session tests and inspect an attempt

- **Description:** Answers the same tutor-built diagnostic question set before and after a session; these tests have no certification pass threshold.
- **Trigger/entry point:** Class test cards; `/learner/classes/[classId]/sessions/[sessionId]/test/[kind]`; `GET /api/learner/classes/[classId]/session-tests`; `POST .../test/PRE|POST/start`; `GET /api/learner/session-test-attempts/[attemptId]`; `POST .../[attemptId]/submit`.
- **Underlying logic/business rules:** Listing requires enrollment and hides DRAFT tests as absent. Start checks role, sessionTestsEnabled, enrollment, class moderation and session membership. Require PUBLISHED test. Resume own IN_PROGRESS attempt before evaluating session-status windows; submitted attempts cannot restart. New PRE requires SCHEDULED session; new POST requires COMPLETED; CANCELLED blocks new starts. Snapshot ordered question IDs and count, with unique learner/test/kind constraint and concurrent-start recovery. Submit grades server-side, saves each selection/correctness plus rounded score and SUBMITTED timestamp transactionally. PRE submission notifies tutor. Serialization hides correct options/explanations until submitted.
- **Inputs/outputs:** `kind` is uppercase PRE or POST. Submission `{answers:[{questionId,optionId}]}` with 1–50 answers → graded attempt; own GET reveals completed answers. Draft attempts/results never expose other learners' data.
- **Permissions/edge cases:** 403 disabled/start access; 404 draft/missing/other-owner attempt; 409 closed/already submitted/window closed. Missing/invalid option answers count wrong; extraneous questions are ignored; duplicate answer IDs use last entry. POST does not require prior PRE. Existing attempts can be fetched/submitted by owner after test closure or lost enrollment because those endpoints do not repeat start gates. In-progress UI selections are local component state, not server autosaved answers.
- **Evidence:** [start handler](../../src/app/api/learner/classes/[classId]/sessions/[sessionId]/test/[kind]/start/route.ts), [submit](../../src/app/api/learner/session-test-attempts/[attemptId]/submit/route.ts), [access helpers](../../src/lib/sessionTestAccess.ts), [runner](../../src/components/quiz/SessionTestRunner.tsx).

## L10 — Personal progress

- **Description:** Charts the learner's own PRE and POST scores and improvement per session.
- **Trigger/entry point:** `/learner/progress`, optional class filter; `GET /api/learner/progress?classId=...`.
- **Underlying logic/business rules:** Load own enrollments, sessions and non-DRAFT tests; select only own submitted attempts. Build chronological series with class code, subject, topic, scheduled date, nullable pre/post and paired delta. Compute tested-session count, paired count and rounded average paired delta.
- **Inputs/outputs:** Optional enrolled class ID → `{series,summary:{sessionsWithTest,pairedCount,avgDelta}}`; charts/data tables render gaps for unavailable scores.
- **Permissions/edge cases:** No cohort averages or tutor identity; an unrelated class filter yields no enrollment-derived rows. Missing is null, not zero; delta needs both submissions. Progress reflects currently retained enrollment relationships.
- **Evidence:** [progress handler](../../src/app/api/learner/progress/route.ts), [progress UI](../../src/components/learner/MyProgressView.tsx).

## L11 — Report a tutor/class and track review

- **Description:** Privately flags policy or conduct problems and displays the administration's response.
- **Trigger/entry point:** Report button in relevant class/tutor context → `POST /api/learner/reports`; `/learner/reports` → `GET /api/learner/reports`.
- **Underlying logic/business rules:** Validate target type/id and at least one violation. Tutor target is a Tutor User ID; require an enrollment in any class owned by that tutor. Class report requires current enrollment in that class. Block another PENDING own report for the same target; deduplicate violations; create report/violation children and notify active Admins transactionally. Own listing includes target label, violations, details, state, resolution note and review date, excluding reviewer identity.
- **Inputs/outputs:** `{targetType:TUTOR|CLASS,targetId,violations,details?}`; details ≤1000, with ≥10 characters required for OTHER. Creation → report row HTTP 201; listing → `{reports}`.
- **Permissions/edge cases:** 403 no relationship; 404 invalid target; 409 pending duplicate. Review does not itself suspend or ban the reported party. Violation labels differ in UI by target, but the schema accepts the shared violation union. No attachment upload, self-edit, delete, or appeal of a report decision is implemented.
- **Evidence:** [reports handler](../../src/app/api/learner/reports/route.ts), [report validation](../../src/lib/validations/report.ts), [violation labels](../../src/lib/reportViolations.ts).

## L12 — Own profile and shared tools

Profile routes `/learner/profile` and `/learner/profile/edit` display own identity and allow section, grade, contact and recovery-email edits. Password change, logout, notifications, search, help, assistant and navigation preferences follow [Shared/system features](06-shared-and-system.md), with learner-scoped results and class recommendations.
