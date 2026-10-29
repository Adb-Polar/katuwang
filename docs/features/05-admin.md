# Admin features

## Role summary

`ADMIN` governs the platform across learners and tutors. Admin can inspect identity data, moderate non-admin accounts/classes, review registrations/certifications/appeals/reports, manage taxonomy and shared questions, tune settings and inspect operational statistics. Admin is not a super-role accepted by Tutor/Learner endpoints. Own password is editable under Settings; there is no general Admin profile editor or public Admin signup.

## A01 — Dashboard and attention queues

- **Description:** Global operational overview with links into pending work.
- **Trigger/entry point:** `/admin`.
- **Underlying logic/business rules:** Query learner/tutor counts, non-active/non-pending account count, SCHEDULED classes, PENDING certifications/registrations, OPEN question/class requests and PENDING class appeals. Read recent audit entries. Render counters, attention links and history.
- **Inputs/outputs:** Admin session → current counts and links; no mutation.
- **Permissions/edge cases:** Counts reflect stored statuses and do not automatically lift every elapsed suspension. “Needs attention” is a dashboard projection, not a queue worker.
- **Evidence:** [dashboard](../../src/app/admin/page.tsx).

## A02 — Browse accounts and inspect private detail

- **Description:** Searches Learner/Tutor accounts and exposes account/activity context for administration.
- **Trigger/entry point:** `/admin/users`, `GET /api/admin/users`; row → `/admin/users/[id]`.
- **Underlying logic/business rules:** Exclude Admin accounts; filter `q`, role, status and grade; validate sortable column/direction; paginate/count. Detail loads non-admin account, profile/class/enrollment activity and recent audit history. UI displays contact/identity/status context and links to related records.
- **Inputs/outputs:** Search and filters/page/sort → `{users,total,page,pageSize}`; private account detail.
- **Permissions/edge cases:** Admin-only; detail is read-only and unrelated IDs/admin accounts yield not-found. No user deletion, role reassignment or arbitrary identity editing endpoint is implemented.
- **Evidence:** [users collection](../../src/app/api/admin/users/route.ts), [account detail](../../src/app/admin/users/[id]/page.tsx).

## A03 — Suspend, ban or reactivate accounts

- **Description:** Changes a non-admin account's login eligibility.
- **Trigger/entry point:** Account table moderation controls → `PATCH /api/admin/users/[userId]`.
- **Underlying logic/business rules:** Confirm target exists and is not Admin. Validate status/reason/duration. Store status, nullable reason, update time and optional suspension expiry; write USER_STATUS_CHANGE audit row in same transaction. ACTIVE/BANNED clear expiry.
- **Inputs/outputs:** `{status:ACTIVE|SUSPENDED|BANNED,reason?,durationDays?}`; reason ≤500, duration positive integer ≤365 → selected status fields and audit entry.
- **Permissions/edge cases:** 404 missing target; 400 Admin target/invalid payload. Omitted duration gives indefinite suspension. Sign-in lifts expired suspension; cached JWT status refresh is delayed up to five minutes. Most APIs do not independently enforce inactive status. Status update does not cascade all owned classes into moderation or notify target. No transition restriction prevents using ACTIVE on a pending/declined non-admin target.
- **Evidence:** [user moderation](../../src/app/api/admin/users/[userId]/route.ts), [auth](../../src/lib/auth.ts).

## A04 — Review pending registrations

- **Description:** Approves or declines applicants created in PENDING state.
- **Trigger/entry point:** `/admin/registrations`; `GET /api/admin/registrations`; `PATCH .../[userId]`.
- **Underlying logic/business rules:** List pending applicants with `q`, role, grade, sort/direction and paging; default oldest-first. Review requires current PENDING status. APPROVE sets ACTIVE and clears reason; DECLINE sets DECLINED and optional reason. Write audit and, on approval only, welcome notification transactionally.
- **Inputs/outputs:** `{decision:APPROVE|DECLINE,reason?}` ≤500 → account ID/anonymous ID/status/reason; approval notification and audit.
- **Permissions/edge cases:** 400 if no longer pending; 404 absent. Enabling/disabling registration approval affects new registration behavior; review endpoint does not itself require flag to remain enabled. Approval does not verify email or send approval email. A stale code comment says BANNED for decline; actual assignment is DECLINED.
- **Evidence:** [registration list](../../src/app/api/admin/registrations/route.ts), [review](../../src/app/api/admin/registrations/[userId]/route.ts).

## A05 — Browse global classes and inspect teaching context

- **Description:** Lists all classes for policy oversight, including history, sessions and anonymized enrolled learners.
- **Trigger/entry point:** `/admin/classes`, `GET /api/admin/classes`; detail `/admin/classes/[id]`.
- **Underlying logic/business rules:** Filter `q`, subject and status; parse allowed sort/direction; paginate with relation context. Detail loads topics, ordered sessions, tutor context, enrollments and moderation/recommendation controls.
- **Inputs/outputs:** Filters/page → class collection/counts; ID → class, session and roster detail; no content editing through this view.
- **Permissions/edge cases:** Admin-only, missing class 404/not-found. Administrative class access does not imply permission to use Tutor editing endpoints.
- **Evidence:** [class collection](../../src/app/api/admin/classes/route.ts), [class detail](../../src/app/admin/classes/[id]/page.tsx).

## A06 — Suspend, ban or reinstate classes

- **Description:** Removes unsafe classes from discovery or restores them.
- **Trigger/entry point:** Class moderation table/detail → `PATCH /api/admin/classes/[classId]`.
- **Underlying logic/business rules:** SUSPENDED only from SCHEDULED; BANNED from SCHEDULED/SUSPENDED; SCHEDULED reinstatement only from SUSPENDED/BANNED. Update reason and optional expiry, write CLASS_STATUS_CHANGE audit transactionally. On BANNED, reopen linked ACCEPTED/ENROLLED requests and clear their class links; notify linked learners and other enrolled learners through separate event types.
- **Inputs/outputs:** `{status:SCHEDULED|SUSPENDED|BANNED,reason?,durationDays?}` with moderation limits → updated class, audit, request and notification effects.
- **Permissions/edge cases:** 400 invalid transition; 404 missing. Banning does not delete class, enrollment or session rows. Suspension does not reopen requests. Reinstatement clears reason/expiry but does not reschedule meetings or restore detached requests. Timed suspension lifts only on selected learner-facing reads, not through a cron.
- **Evidence:** [class moderation](../../src/app/api/admin/classes/[classId]/route.ts), [lazy reinstatement](../../src/lib/moderation.ts).

## A07 — Review class appeals

- **Description:** Decides tutor objections to class moderation.
- **Trigger/entry point:** `/admin/class-appeals`; `GET /api/admin/class-appeals`; `PATCH .../[appealId]`.
- **Underlying logic/business rules:** List appeals by optional status, allowlisted sort/direction and paging. Require PENDING review target; store APPROVED/REJECTED, review note/reviewer/time. Approval sets linked class SCHEDULED and clears moderation fields. Log audit and notify tutor transactionally.
- **Inputs/outputs:** `{decision:APPROVE|REJECT,reviewNote?}` ≤500 → reviewed appeal, audit/notification, optional reinstatement.
- **Permissions/edge cases:** 400 already reviewed; 404 absent. Approval uses appeal's class association but does not revalidate the class's current moderation state or future schedule. Review can therefore supersede intervening class-state changes.
- **Evidence:** [appeal review](../../src/app/api/admin/class-appeals/[appealId]/route.ts).

## A08 — Review abuse reports

- **Description:** Privately resolves or dismisses learner reports about tutors/classes.
- **Trigger/entry point:** `/admin/abuse-reports`; `GET /api/admin/abuse-reports`; `PATCH .../[reportId]`.
- **Underlying logic/business rules:** List by status/targetType, sort and paging with target/reporter/violations context. Require PENDING, set RESOLVED/DISMISSED with reviewer/time/note, audit and notify reporter transactionally.
- **Inputs/outputs:** `{decision:RESOLVE|DISMISS,resolutionNote?}` ≤500 → reviewed report plus audit/notification.
- **Permissions/edge cases:** 400 already reviewed; 404 absent. Resolving report does **not** suspend/ban tutor or class; use separate moderation actions. Notification wording says action was taken but handler only closes report. Distinct from analytical `/admin/reports`.
- **Evidence:** [report review](../../src/app/api/admin/abuse-reports/[reportId]/route.ts), [review table](../../src/components/admin/AbuseReportTable.tsx).

## A09 — Moderate class requests

- **Description:** Closes improper learner requests and reopens eligible closed/accepted requests.
- **Trigger/entry point:** `/admin/topic-requests`; `GET /api/admin/topic-requests`; `PATCH .../[id]`.
- **Underlying logic/business rules:** List with `q`, subject/status, public/directed `scope`, paging and allowlisted sort. Close to CANCELLED unless already CANCELLED/FULFILLED; reopen to OPEN only from CANCELLED/ACCEPTED. Clear fulfilledClassId on either update. Audit status change and notify learner transactionally.
- **Inputs/outputs:** `{status:OPEN|CANCELLED,reason?}` ≤500 → `{id,status}`, audit and notification.
- **Permissions/edge cases:** 400 invalid transition; 404 absent. Closing ENROLLED request is allowed and does not remove enrollment/class. Reopen does not enforce learner's 10-OPEN quota. Both close and reopen use TOPIC_REQUEST_REOPENED event type, with different message text. Feature is not uniformly controlled by matchingEnabled.
- **Evidence:** [request moderation](../../src/app/api/admin/topic-requests/[id]/route.ts).

## A10 — Recommend a class to a learner

- **Description:** Sends an informational invitation to consider a particular class.
- **Trigger/entry point:** Admin class detail recommendation form; `GET/POST /api/admin/classes/[classId]/recommendations`.
- **Underlying logic/business rules:** GET returns class recommendations newest-first with learner anonymous ID/grade/section. POST requires class and target STUDENT_LEARNER; reject duplicate class/learner pair. Create ClassRecommendation with optional note and issuer, then notify learner with class link transactionally.
- **Inputs/outputs:** `{learnerId,note?}` ≤500 → recommendation HTTP 201 plus notification. Learner decides whether to enroll.
- **Permissions/edge cases:** 404 target/class; 409 duplicate. API does not require published/SCHEDULED/non-full class or ACTIVE learner. No learner dismissal endpoint exists despite schema `dismissedAt`. Stored note is not included in notification text. Separate from chatbot's on-demand recommendations.
- **Evidence:** [recommendation handler](../../src/app/api/admin/classes/[classId]/recommendations/route.ts), [form](../../src/components/classes/RecommendClassForm.tsx).

## A11 — Manage subjects and topics

- **Description:** Maintains live taxonomy and synchronizes topic-name strings across business data.
- **Trigger/entry point:** `/admin/subjects`; `GET/POST /api/admin/subjects`; `PATCH/DELETE .../subjects/[id]`; `POST .../subjects/[id]/topics`; `PATCH/DELETE /api/admin/topics/[id]`.
- **Underlying logic/business rules:** GET includes inactive items, ordered by order/name. Create subject requires unique name/slug and appends order; slug is immutable UPPER_SNAKE_CASE, 2–40 characters, starting with letter. PATCH supports name/order/active with duplicate-name protection. Delete unused subject cascades topics; used subject returns 409 with deactivate guidance. Topic create normalizes name, enforces within-subject uniqueness and appends order. Topic rename transaction updates class topics, session topics, request topics, certifications, questions of both origins, assessment attempts and question requests before updating catalog. Topic delete deactivates if any of those uses exist, otherwise hard-deletes. All mutations audit and invalidate local server catalog cache.
- **Inputs/outputs:** Names 2–80; subject `{name,slug}`; topic `{name}`; PATCH name/order (0–999)/active → changed catalog row, audit; topic DELETE → `{message,soft}`.
- **Permissions/edge cases:** 400 empty/invalid updates; 404 missing; 409 duplicate/reference restrictions. Subject usage counts cover six subject-bearing models; topic usage covers seven paths. String-based rename can hit uniqueness collisions with pre-existing custom topic rows and fail transactionally. Deactivation preserves history; compile-time chatbot/coverage lists do not fully follow live taxonomy.
- **Evidence:** [subject handlers](../../src/app/api/admin/subjects/route.ts), [subject item](../../src/app/api/admin/subjects/[id]/route.ts), [topic item and propagation](../../src/app/api/admin/topics/[id]/route.ts).

## A12 — Author, edit, retire and delete bank questions

- **Description:** Manages shared single-answer MCQs used for tutor certification and optionally session tests.
- **Trigger/entry point:** `/admin/assessment/question-bank` (legacy `/admin/question-bank` redirects); `GET/POST /api/admin/assessment-questions`; `GET/PATCH/DELETE .../[questionId]`.
- **Underlying logic/business rules:** List BANK origin only; filter subject/topic/active/prompt q and paginate. POST validates active catalog pair and exactly one correct option, writes BANK question/options and audit. Item GET reports `inUse` based on certification or session attempt references. PATCH edits prompt/explanation/options only before use; active toggle allowed anytime. Replace options transactionally. DELETE allows only unused BANK question and writes audit.
- **Inputs/outputs:** `{subject,topic,prompt,explanation?,options}`; same MCQ limits as Tutor custom authoring. PATCH content and/or active → question/options/inUse; DELETE → message.
- **Permissions/edge cases:** 404 custom TUTOR question/absent; 409 content edits/deletion after attempts. Retiring preserves historical answers. Existing links in a published test without attempts are not included in `inUse`; link foreign keys may block deletion, and content can remain editable until attempted. Subject/topic are not editable through question PATCH.
- **Evidence:** [bank collection](../../src/app/api/admin/assessment-questions/route.ts), [bank item](../../src/app/api/admin/assessment-questions/[questionId]/route.ts).

## A13 — Inspect bank coverage and resolve question requests

- **Description:** Reveals thin assessment banks and handles tutor requests for additional content.
- **Trigger/entry point:** Question-bank coverage view; `GET /api/admin/assessment-questions/coverage`; `/admin/assessment/requests`; `GET /api/admin/question-requests`; `PATCH .../[requestId]`.
- **Underlying logic/business rules:** Coverage groups active BANK questions and OPEN requests by subject/topic, combines with global config and emits readiness for compile-time curated topic pairs. Request list filters status/subject/q and paginates; OPEN sorts oldest-first, reviewed by resolution time. Review requires OPEN, stores RESOLVED/DISMISSED with note/reviewer/time, audits and notifies tutor.
- **Inputs/outputs:** Request filters; `{status:RESOLVED|DISMISSED,resolutionNote?}` ≤500 → updated request and notification/audit. Coverage includes activeCount/config/ready/openRequests.
- **Permissions/edge cases:** Resolve does not automatically author questions or enforce readiness, despite success notification saying questions were added. Dynamic taxonomy additions may be absent from static coverage enumeration. No automatic certification is triggered by request resolution.
- **Evidence:** [coverage](../../src/app/api/admin/assessment-questions/coverage/route.ts), [request review](../../src/app/api/admin/question-requests/[requestId]/route.ts).

## A14 — Review certification quiz attempts

- **Description:** Inspects tutor attempt scores and per-question answers for review.
- **Trigger/entry point:** `/admin/assessment/results`; `GET /api/admin/assessment-attempts`; detail `GET .../[attemptId]` via modal.
- **Underlying logic/business rules:** Filter subject/topic/status and anonymous tutor q; sort submitted/started descending and paginate. Detail loads ordered question/options and selections, serializes with reveal:true and tutor ID/anonymous ID.
- **Inputs/outputs:** Filters/attempt ID → attempt summary collection or full revealed attempt.
- **Permissions/edge cases:** Admin-only; absent attempt 404. Backend supports IN_PROGRESS filtering/detail despite “completed” UI wording. Read-only; no regrade, score override or attempt deletion endpoint.
- **Evidence:** [attempt list](../../src/app/api/admin/assessment-attempts/route.ts), [detail](../../src/app/api/admin/assessment-attempts/[attemptId]/route.ts).

## A15 — Approve/reject topic certifications

- **Description:** Makes a pending tutor subject/topic verification decision.
- **Trigger/entry point:** `/admin/assessment/certifications` (legacy `/admin/certifications` redirects); `GET /api/admin/certifications`; `PATCH .../[certificationId]`.
- **Underlying logic/business rules:** List by status/q/subject, requested/subject/certified/reviewed ordering and paging with tab counts. Require PENDING certification. CERTIFIED writes certifiedAt/reviewedAt and clears reviewNote; REJECTED clears certifiedAt and saves reviewNote. Both audit and notify tutor transactionally.
- **Inputs/outputs:** `{status:CERTIFIED|REJECTED,reviewNote?}` ≤500 → certification and event/audit.
- **Permissions/edge cases:** 400 non-pending; 404 absent. Approval does not verify a passed quiz exists; manual PENDING requests can be approved. Approval ignores supplied note. No direct badge revocation endpoint from CERTIFIED exists here.
- **Evidence:** [certifications](../../src/app/api/admin/certifications/route.ts), [decision](../../src/app/api/admin/certifications/[certificationId]/route.ts).

## A16 — Inspect all session tests and diagnostic results

- **Description:** Reviews tutor-built diagnostics and anonymized learner PRE/POST data platform-wide.
- **Trigger/entry point:** `/admin/session-tests`; `GET /api/admin/session-tests`; `GET .../[testId]/results`; `GET .../[testId]/attempts/[attemptId]`.
- **Underlying logic/business rules:** Filter subject/status/q and paginate newest tests. Results use shared PRE/POST aggregation. Attempt drilldown requires attempt belongs to specified test and uses reveal:true, with learner anonymous ID.
- **Inputs/outputs:** Filters/test/attempt IDs → tests, totals, question rates, anonymous paired learner scores and answer detail.
- **Permissions/edge cases:** Admin-only; 404 missing test or association mismatch. Read-only global oversight, not Tutor authoring. Drilldown does not require SUBMITTED status; Admin/Tutor reveal paths expose answer keys even for IN_PROGRESS attempts. Shared aggregation denominator caveats apply.
- **Evidence:** [session-test list](../../src/app/api/admin/session-tests/route.ts), [results](../../src/app/api/admin/session-tests/[testId]/results/route.ts), [attempt](../../src/app/api/admin/session-tests/[testId]/attempts/[attemptId]/route.ts), [aggregation](../../src/lib/sessionTestResults.ts).

## A17 — Platform reports, charts and CSV export

- **Description:** Summarizes global usage and enrollment trends for administrators.
- **Trigger/entry point:** `/admin/reports`, `GET /api/admin/reports`; Export CSV button.
- **Underlying logic/business rules:** Parallel group counts for user role/grade/status, class subject/status and certification status; count enrollments; bucket existing enrollment rows into zero-filled 30-day local-calendar daily series. Frontend renders charts/tables and builds a browser CSV.
- **Inputs/outputs:** GET has no filtering contract. JSON breakdowns plus enrollment total/last30Days/byDay. Export downloads `katuwang-report-YYYY-MM-DD.csv` with section/label/count columns.
- **Permissions/edge cases:** Admin-only; no server export job or automatic scheduled report. Counts use currently retained records: deleted enrollments no longer contribute to historical activity. CSV is quoted with CRLF rows; export does not create a database record.
- **Evidence:** [report API](../../src/app/api/admin/reports/route.ts), [ReportsView](../../src/components/admin/ReportsView.tsx), [CSV helpers](../../src/lib/csv.ts).

## A18 — Inspect audit history

- **Description:** Searches administrator actions and related moderation context.
- **Trigger/entry point:** `/admin/audit-log`, AuditLogLink controls; `GET /api/admin/audit-log`.
- **Underlying logic/business rules:** Filter action/targetType/q; validate sortable field and direction; count/paginate; return log rows with admin context and distinct action/targetType options.
- **Inputs/outputs:** Filters, sort/dir, page/pageSize → logs, counts and filter metadata.
- **Permissions/edge cases:** Read-only Admin access. AuditLog has no update/delete API. It is an application audit of selected administrative mutations, not exhaustive traffic/account activity: auth, learner/tutor operations, lazy reinstatement and recommendations are not all logged.
- **Evidence:** [audit endpoint](../../src/app/api/admin/audit-log/route.ts), [action constants](../../src/lib/auditLog.ts).

## A19 — Review chatbot misses

- **Description:** Groups questions the assistant could not confidently answer, to guide future knowledge-base changes.
- **Trigger/entry point:** `/admin/chatbot`; `GET /api/admin/chatbot-misses`.
- **Underlying logic/business rules:** Load stored misses; tokenize/normalize and group by role+normalized message; track count, firstSeen, lastSeen and latest sample. Filter role/q, sort lastSeen/count/firstSeen and direction, paginate groups in memory.
- **Inputs/outputs:** Filters/page → grouped miss summaries and total. Does not expose sender ID in aggregate output.
- **Permissions/edge cases:** Admin-only, read-only. No runtime FAQ editor or automatic training; source FAQ/intent files must be edited separately. Schema comment saying “no admin UI” is stale. Raw miss text may contain user-entered personal data.
- **Evidence:** [miss endpoint](../../src/app/api/admin/chatbot-misses/route.ts), [aggregation](../../src/lib/chatbot/misses.ts).

## A20 — Configure platform flags and global assessment tuning

- **Description:** Changes registration, discovery, identity and assessment behavior.
- **Trigger/entry point:** `/admin/settings`; `GET/PATCH /api/admin/settings`; `GET/PATCH /api/admin/assessment-configs`.
- **Underlying logic/business rules:** Read fallback-aware flags. PATCH accepts allowlisted boolean key/value and upserts string value with audit. Assessment PATCH validates at least one provided numeric field, upserts global settings and audit in transaction; returns resolved config. Existing attempts preserve snapshotted pass mark.
- **Inputs/outputs:** Flag `{key,value:boolean}` or partial `{questionCount,passPercent,minBankSize}` → persisted setting and audit. Numeric limits: questionCount 1–50; passPercent 1–100; minBankSize 1–200. Flags/defaults and exact effects are listed in Shared/system features.
- **Permissions/edge cases:** 400 invalid/empty tuning/key; Admin-only. No per-topic configuration remains; values apply globally. Question count and minimum bank size are independent; serving uses min(count, actual pool). Turning on verification can block existing unverified accounts. API gates differ by action, so a disabled feature may retain read/history/edit paths.
- **Evidence:** [settings API](../../src/app/api/admin/settings/route.ts), [assessment settings](../../src/app/api/admin/assessment-configs/route.ts), [defaults](../../src/lib/settings.ts).

## A21 — Own account, shared tools and non-production factory

Admin Settings includes own-password form → `POST /api/admin/profile/password` with currentPassword/newPassword. Notifications `/admin/notifications`, help `/admin/help`, role-aware search/assistant and portal navigation follow [Shared/system features](06-shared-and-system.md). In non-production only, an authenticated Admin may use `/api/dev` factory actions documented there; no other production business role gains these powers.
