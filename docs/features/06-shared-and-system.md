# Shared and system features

## S01 — Own profile display and editing

- **Description:** Learners and Tutors inspect personal account information and edit permitted contact/academic fields; Admin can change own password under Settings.
- **Trigger/entry point:** `/learner/profile[/edit]`, `/tutor/profile[/edit]`; `PATCH /api/learner/profile` or `/api/tutor/profile`.
- **Underlying logic/business rules:** Server pages select current user, show real identity privately and anonymous ID for peer use. Shared form sends validated partial profile fields. APIs enforce exact role and current user ID, normalize Philippine mobile contact, and update only whitelisted fields.
- **Inputs/outputs:** Section (trimmed 1–50), grade GRADE_7–GRADE_12, contact ≤200 and optional normalized recovery email → updated selected fields and form feedback/navigation. Empty contact/recovery email becomes null when handled.
- **Permissions/edge cases:** No name, primary email, role or anonymous-ID self-edit. Learner handler persists recoveryEmail; Tutor handler does not. Contact accepts local 09 or 63/+63 mobile formats, removes separators and normalizes to local 09 form. Registration does not apply this strict mobile normalization. No avatar/upload/delete-account API.
- **Evidence:** [profile schema](../../src/lib/validations/profile.ts), [learner handler](../../src/app/api/learner/profile/route.ts), [tutor handler](../../src/app/api/tutor/profile/route.ts), [contact normalization](../../src/lib/contactInfo.ts).

## S02 — Change own password and sign out

- **Description:** Replaces a known password or ends the browser's current session.
- **Trigger/entry point:** Profile edit/password forms, Admin Settings; `POST /api/{learner|tutor|admin}/profile/password`; `/logout` confirmation.
- **Underlying logic/business rules:** Exact role/session required for password endpoint; validate currentPassword/newPassword, load current hash, bcrypt-compare, hash replacement at cost 12 and update user. Logout confirmation clears chatbot local history then calls NextAuth signOut with `/login` callback; Cancel returns to `/dashboard`.
- **Inputs/outputs:** Current and new password → `{message:"Password updated."}`; logout → session-cookie cleanup and login page.
- **Permissions/edge cases:** Wrong current password/user failure returns 401; new password follows shared 8-character/72-byte/blocklist rules. There is no explicit all-device JWT revocation on password change/reset. Logout removes `kt-chat-history`; role navigation preferences are a separate local setting.
- **Evidence:** [password core](../../src/lib/changePassword.ts), [logout](../../src/components/auth/LogoutConfirm.tsx), [client cleanup](../../src/lib/clientStorage.ts).

## S03 — Notifications, unread counts and deep links

- **Description:** Shows persisted workflow events to their intended users.
- **Trigger/entry point:** Portal bell, `/learner/notifications`, `/tutor/notifications`, `/admin/notifications`; `GET /api/notifications?take=N`; `POST /api/notifications/read`.
- **Underlying logic/business rules:** GET selects own newest notifications and own total unread. take defaults/caps at 50; bell fetches 8 on opening. Clicking a row sends its ID to mark read and follows optional link. Empty/omitted IDs marks all own unread rows read. Update is always scoped to current user and unread state; return remaining unread count. Writers generally use the same transaction as related business mutation.
- **Inputs/outputs:** Optional take; `{ids?:string[]}` → notifications/unreadCount or updated unreadCount. `readAt` is set; rows are not deleted.
- **Permissions/edge cases:** Any authenticated role, never another user's inbox. Invalid JSON on mark-read falls back to `{}` and can mark all read. UI optimistically updates some state; no push/socket delivery or automatic polling loop is implemented in bell. Full page is limited to recent 50, not an unlimited history paginator. In-app events are separate from SMTP account-token emails.
- **Evidence:** [notifications GET](../../src/app/api/notifications/route.ts), [mark read](../../src/app/api/notifications/read/route.ts), [writer helpers](../../src/lib/notifications.ts).

| Event type | Recipient / actual trigger |
| --- | --- |
| TOPIC_REQUEST_DIRECTED | Designated Tutor when learner creates directed request |
| TOPIC_REQUEST_ACCEPTED | Request owner when Tutor creates class by acceptance |
| TOPIC_REQUEST_REOPENED | Request owner after cancellation/deletion/ban reopens linked request; also Admin close/reopen (close message differs) |
| TOPIC_REQUEST_FULFILLED | Linked request owner when Tutor completes class |
| REGISTRATION_APPROVED | Applicant on Admin approval |
| REGISTRATION_REJECTED | Reserved type; no delivery on current decline path |
| CERTIFICATION_CERTIFIED / CERTIFICATION_REJECTED | Tutor on Admin certification review; automatic quiz submit does not use these helpers |
| QUESTION_REQUEST_NEW | Active Admins on new/reopened bank request |
| QUESTION_REQUEST_RESOLVED / QUESTION_REQUEST_DISMISSED | Requesting Tutor on Admin review |
| CLASS_ENROLLMENT_NEW / CLASS_ENROLLMENT_DROPPED | Class Tutor on learner join/leave |
| CLASS_CANCELLED / CLASS_COMPLETED | Other enrolled learners on whole-class cancellation/completion; banning sends CLASS_CANCELLED |
| CLASS_APPEAL_NEW | Active Admins on tutor appeal |
| CLASS_APPEAL_APPROVED / CLASS_APPEAL_REJECTED | Appealing Tutor on review |
| REPORT_NEW / REPORT_REVIEWED | Active Admins on filing; reporter on review |
| SESSION_PRETEST_OPEN | Enrolled learners when Tutor publishes test |
| SESSION_POSTTEST_OPEN | Enrolled learners when individual session becomes COMPLETED with PUBLISHED test |
| SESSION_PRETEST_TAKEN | Tutor when learner submits PRE |
| CLASS_RECOMMENDED_BY_ADMIN | Target learner on informational class recommendation |

## S04 — Role-aware global search

- **Description:** Finds relevant classes, accounts/tutors, topics and eligible requests from the portal header.
- **Trigger/entry point:** GlobalSearch box; `GET /api/search?q=...&scope=all|tutorCode|subject|topic|classCode`.
- **Underlying logic/business rules:** Require session; throttle 40/user/minute; trim q, return empty groups below 2 characters; default invalid scope to all. Resolve subject display names to slugs. Up to 6 results per group. Learner: browsable unenrolled classes, active certified tutors (names searchable only when setting permits) and active catalog topics. Tutor: own classes, eligible OPEN requests and topics. Admin: all classes, non-admin accounts including private name/email search, and topics. Return role-specific deep links.
- **Inputs/outputs:** q/scope → `{groups:[{kind,label,items:[{id,title,subtitle?,href}]}]}`; keyboard/row selection navigates.
- **Permissions/edge cases:** tutorCode scope searches anonymous ID only and suppresses classes/topics; classCode restricts class field. Tutor request result discovery does not check matchingEnabled even though acceptance does. Search does not itself run lazy suspension repair. Results are convenience links, not access tokens; destination guards still apply.
- **Evidence:** [search handler](../../src/app/api/search/route.ts), [search UI](../../src/components/layout/GlobalSearch.tsx).

## S05 — Role-specific help and FAQ navigation

- **Description:** Provides searchable guidance and step-based workflows without changing business state.
- **Trigger/entry point:** `/learner/help`, `/tutor/help`, `/admin/help`; portal Help control; HelpCenter search/expand links.
- **Underlying logic/business rules:** Load `HELP_CONTENT` for role and render relevant getting-started guides/FAQs. Search/expand controls filter/reveal local content. Guides link to implemented portal pages.
- **Inputs/outputs:** Search text/section controls → matching guidance and route links; no database writes.
- **Permissions/edge cases:** Role portal guards apply; help wording is static and may lag settings or backend rules. Learner guides cover join/match/request/leave; Tutor covers certification/create/accept/roster/appeal; Admin covers approvals/questions/settings/moderation/taxonomy. FAQs also explain consent, privacy, account states and recovery. Statements about data rights are guidance, not implemented deletion automation.
- **Evidence:** [HelpCenter](../../src/components/help/HelpCenter.tsx), [help content](../../src/lib/help/helpContent.ts).

## S06 — Intent-based assistant and learner recommendations

- **Description:** Offers predefined role-aware navigation, FAQs and small talk; Learners can request live class suggestions.
- **Trigger/entry point:** Floating portal ChatWidget, suggestion chips/cards/links → `POST /api/chatbot`.
- **Underlying logic/business rules:** Require session, 20/user/minute and chatbotEnabled. Validate trimmed 1–500 message. Load grade, build role context, tokenize/normalize and typo-correct known keywords. Score intent keywords (1), phrase patterns (3), FAQ keywords (2). Candidate must score ≥2 and score/max(3,tokenCount) ≥0.35. Intents obey role allowlists; category priorities break intent ties, intent beats equal-score FAQ. Navigation/FAQ returns predefined text/links. Learner recommendation extracts static subject/topic keywords and loads live classes; named topic uses matching engine, otherwise choose soonest available subject classes. Return at most 3 cards; no match suggests a class request. Unmatched message is stored as ChatbotMiss with role/user/time, then fallback suggestions returned.
- **Inputs/outputs:** `{message}` → `{reply:{text,intentId,category,links?,cards?,suggestions?}}`; non-production also exposes debugScore. Client stores last 30 turns in localStorage (`kt-chat-history`) and logout clears it.
- **Permissions/edge cases:** 403 disabled; 400 invalid; 429 throttled. This is not an LLM/external tutoring service: it cannot grade arbitrary schoolwork, write bank content, enroll users, or moderate accounts. Navigation requires user action; recommendation does not enroll. Static recognition omits custom taxonomy additions; recommendation branch does not check matchingEnabled or reinstate elapsed class suspensions. Miss logging failure is nonfatal; stored transcript is browser-local while only unmatched queries are server-persisted.
- **Evidence:** [chat endpoint](../../src/app/api/chatbot/route.ts), [classifier](../../src/lib/chatbot/classifier.ts), [response orchestration](../../src/lib/chatbot/respond.ts), [recommendation](../../src/lib/chatbot/recommend.ts), [ChatWidget](../../src/components/chatbot/ChatWidget.tsx).

Navigation intents include learner enroll/leave/match/request/find-tutors/my-classes; shared notifications/profile/password/logout/help/search; Tutor create/certify/accept/students/appeal/sessions/bank-request; Admin registrations/certifications/bank/moderation/reports/settings/users/appeals/audit/subjects/bank-requests/chatbot. FAQ topics include cost, online/in-person sessions, anonymity/IDs, grades/subjects, becoming Tutor, pass outcome, matching/no-match, cancellations, group/solo, assistant scope, uploads, data use, role differences, pending/declined accounts, capacity/multiple sessions, profile editing, deletion requests, Taglish, emails, offline/mobile support and reporting. These are information responses, not additional backend capabilities.

## S07 — Portal UI, tables, schedules and charts

- **Description:** Common interaction framework supporting role-specific workflows.
- **Trigger/entry point:** Role layouts; sidebar/menu groups, pagination/search/sort controls, dialogs, chart panels and timetable navigation.
- **Underlying logic/business rules:** PortalLayout uses role navigation configuration, badges, mobile navigation and collapsible group preferences persisted under role-specific browser keys. Shared hooks fetch and paginate lists; sorting is backend allowlisted where exposed or client-local where implemented. UI primitives render loading/empty/error/confirmation/prompt states. Timetables project sessions; chart components use theme colors, tooltips and data tables.
- **Inputs/outputs:** Navigation/search/sort/page/confirmation → UI changes, downstream API requests or business forms. Preferences do not modify account permissions.
- **Permissions/edge cases:** UI-hidden action is not backend authorization. Some lists are entirely in memory while APIs paginate; names of controls do not imply server filters. No production theme-toggle workflow should be inferred solely from archived design scripts.
- **Evidence:** [PortalLayout](../../src/components/layout/PortalLayout.tsx), [hooks](../../src/hooks), [UI primitives](../../src/components/ui), [charts](../../src/components/charts).

## S08 — Taxonomy delivery and caches

- **Description:** Supplies active subjects/topics to all authenticated roles and validates subject/topic inputs.
- **Trigger/entry point:** `GET /api/subjects`; `getSubjects`, `subjectExists`, `topicExists`; `useSubjectCatalog` dropdowns.
- **Underlying logic/business rules:** Server loads all subject/topic rows with 60-second process cache and shared in-flight read; normal public API filters active subjects/topics. Admin mutations invalidate current-process cache. Failed DB reads return static fallback without caching it. Client initially renders static values then replaces with module-cached live catalog.
- **Inputs/outputs:** No API parameters → `{subjects:[{slug,name,topics:string[]} ]}`. Helpers return validated membership/catalog data.
- **Permissions/edge cases:** API requires authentication. In a multi-instance process each cache is separate; client module cache has no expiry. `topicExists` checks active topics using `getTopics`, which does not independently reject an inactive parent subject; routes calling subjectExists first are stricter. Static fallback makes outage validation behavior differ from current DB catalog.
- **Evidence:** [subjects API](../../src/app/api/subjects/route.ts), [catalog helpers](../../src/lib/subjects.ts), [client hook](../../src/hooks/useSubjectCatalog.ts).

## S09 — Platform settings/defaults and action gates

| Key | Default | Enforced effect |
| --- | --- | --- |
| registrationOpen | true | Blocks public account creation when false |
| requireRegistrationApproval | false | New accounts are PENDING instead of ACTIVE |
| requireEmailVerification | false | Registration issues verification token; sign-in rejects null emailVerifiedAt |
| requireCertificationForClassCreation | false | Standalone create requires certification of every topic when enabled; acceptance always requires it |
| matchingEnabled | true | Gates Auto Match, learner request creation and Tutor request listing/acceptance; not every related read/edit/search path |
| showTutorRealNames | false | Adds tutor name/section in selected learner DTOs/profile/search; does not expose learner names to tutors |
| autoCertifyOnAssessmentPass | false | Passed certification quiz immediately certifies when true; otherwise remains PENDING |
| chatbotEnabled | true | Controls widget rendering and chatbot API |
| sessionTestsEnabled | true | Gates test creation, publication and learner start; existing history/edit/submit paths remain |

Global numeric settings: `assessmentQuestionCount=5`, `assessmentPassPercent=80`, `assessmentMinBankSize=5`. Store as string-valued PlatformSetting rows. Flag reads return true only for stored `"true"`; absent flags use defaults. Numeric resolver falls back for missing/unparseable/nonpositive values. Live API validates bounds. See [Admin configuration](05-admin.md#a20--configure-platform-flags-and-global-assessment-tuning).

## S10 — Automatic grading and results aggregation

- **Description:** Shared deterministic MCQ scoring and PRE/POST improvement calculations.
- **Trigger/entry point:** Tutor quiz submit, Learner diagnostic submit, Tutor/Admin/learner result reads.
- **Underlying logic/business rules:** Build answer map by question ID; for each served item, select option only when it belongs to that question. Missing/invalid answers are null and incorrect; ignore unserved IDs. Score = round(correct/servedCount ×100). Certification compares snapshotted threshold; diagnostic tests have no pass/fail. PRE/POST comparison joins learner/test or question position. Means round to integers and use null for no observations.
- **Inputs/outputs:** Served items and answers → correctness, count and percentage; submitted attempts → paired score delta and question correct-rate deltas.
- **Permissions/edge cases:** Duplicate answers use last map value. Payload requires at least one answer but does not require all questions answered. Paired average improvement differs from independent POST mean minus PRE mean. Questions are referenced by ID rather than immutable content snapshots; content lock rules matter.
- **Evidence:** [grading](../../src/lib/gradeAttempt.ts), [results](../../src/lib/sessionTestResults.ts), [serialization](../../src/lib/sessionTestSerialize.ts).

## S11 — Request-driven maintenance, identifiers and SMTP

- **Description:** Performs automatic housekeeping synchronously in user requests, and sends token emails.
- **Trigger/entry point:** Sign-in, selected learner class/tutor/match reads and enroll; registration/reset/resend workflows; ID generation.
- **Underlying logic/business rules:** Sign-in reactivates an expired account suspension. `reinstateExpiredClasses` bulk-restores elapsed timed SUSPENDED classes on selected reads. JWT callback rechecks account after five minutes. Rate-limit map drops expired buckets lazily. Atomic `IdCounter` increment gives TUT-/STU- identifiers and class C- code; tutor/learner counter rows must be provisioned, class counter upserts. Nodemailer reuses transporter; SMTP_HOST/MAIL_FROM enable sending, SMTP_PORT defaults 587 and secure defaults for port 465, optional auth. Missing mail config logs recipient/subject and returns without sending.
- **Inputs/outputs:** Runtime state/clock/env variable names → status repair, fresh IDs, cleaned counters or SMTP email. No scheduled task was found.
- **Permissions/edge cases:** Repair is not immediate at expiry without an invoking request and does not write audit/notification. User reactivation is not performed by generic JWT refresh. Token/password writes have transactions but pre-transaction token checks are not conditional consume locks. Failed mail is caught by current public token callers. No queue retry, delivery tracking, webhook processing or mail worker.
- **Evidence:** [moderation](../../src/lib/moderation.ts), [ID generation](../../src/lib/idGenerator.ts), [mail](../../src/lib/mail.ts), [auth](../../src/lib/auth.ts).

## S12 — Rate limiting and response security

| Action | Limit per fixed window |
| --- | --- |
| Sign-in | 10 per IP+email / 10 minutes |
| Register | 5 per IP / 60 minutes |
| Forgot password / resend verification | 5 per IP and 3 per email / 15 minutes |
| Reset password / verify email | 10 per IP / 15 minutes |
| Chatbot | 20 per user / minute |
| Global search | 40 per user / minute |

Limits are in-process Maps, not database/Redis quotas; effective allowance grows with instances/restarts. Limiting is skipped under Vitest or `RATE_LIMIT_DISABLED=1`. IP uses first forwarded header value, then real-IP, then unknown. HTTP throttling generally returns 429 with Retry-After; sign-in reports authentication error text.

[Next configuration](../../next.config.ts) sends CSP (self assets/connections, inline script/style, dev unsafe-eval), frame denial, nosniff, referrer policy, camera/microphone/geolocation denial and HSTS. These headers are implementation facts, not a claim of comprehensive security certification.

## D01 — Development previews, quick login and data factory

- **Description:** Supports manual test-data creation and UI preview in non-production.
- **Trigger/entry point:** `/dev`, `/dev/login`, `/dev/charts`; `GET/POST /api/dev`.
- **Underlying logic/business rules:** Pages return not-found in production; quick-login page loads all users and groups by role, then uses normal credentials sign-in with a fixed development password. Chart Lab uses sample visualization data. API guard additionally requires signed-in Admin and returns 404 for unauthenticated/wrong-role callers. GET returns tutor/learner lists, counts, up to 100 recent classes and development metadata. POST dispatches one action below.
- **Inputs/outputs:** JSON action → generated data/message or 400 unknown action; current database is used. These tools were inspected, not executed during documentation work.
- **Permissions/edge cases:** Non-production page gates do not require Admin, unlike factory API. No separate Developer role. Factory writes bypass some real workflows and do not prove production validation succeeds. Do not run wipe/seed commands merely to read documentation.
- **Evidence:** [dev API](../../src/app/api/dev/route.ts), [quick login](../../src/app/dev/login/page.tsx), [Chart Lab](../../src/components/dev/DevChartLab.tsx).

| Factory action | Inputs and behavior |
| --- | --- |
| createUsers | role Tutor/Learner/Admin; count clamped 1–50; optional grade/section/pending. Learner/Tutor use shared registration core; Admin direct insert. Uses @dev.test domain and shared test password, no verification flag |
| createClass | optional tutorUserId or first available profile; seeded subject/topic selection; topicCount up to 6, sessionCount 1–10, capacity 1–10, optional grade/published/status. Generates scheduled/completed/cancelled class without normal overlap/location/certification validation |
| enroll | required classId; optional learnerId or random count capped by seats. Inserts enrollments, skips duplicates; does not run normal request synchronization/notifications or eligibility workflow |
| createTopicRequests | count 1–40, random existing learners and static topics, OPEN requests with sample Monday slot; no normal per-user quota/gate/notification flow |
| wipeDevData | Finds all @dev.test users, deletes TutorProfiles then users in transaction and relies on cascades. Existing references can still restrict deletion; no universal cleanup guarantee |

## D02 — Seed and migration operator workflows

- **Description:** Provisions schema, essential counters/catalog and demonstration assessment/session content outside browser features.
- **Trigger/entry point:** Prisma CLI using `prisma.config.ts`; `prisma/seed.ts`, `seedEssentials.ts`, `seed-session-tests.ts`; historical migration SQL.
- **Underlying logic/business rules:** Prisma configuration points at current schema, migration directory and seed command; scripts perform direct model operations with their own fixtures/defaults. Migration history includes role removal, class/session normalization, requests/matching, account recovery/approval and assessment bank changes.
- **Inputs/outputs:** Operator command and database configuration → schema/data changes. Current package postinstall only generates Prisma client.
- **Permissions/edge cases:** Operator database access is not role-based application permission. Scripts can reset or create demo data; exact behavior must be reviewed before execution. No cron, CI scheduler or application endpoint automatically invokes them.
- **Evidence:** [Prisma configuration](../../prisma.config.ts), [seed scripts](../../prisma), [package scripts](../../package.json).
