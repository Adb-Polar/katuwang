# Katuwang — Feature Checklist (Thesis Spec vs. Implementation)

Source: `docs/reference/Katuwang_...md`, §1.4 Scope and Delimitations + §3.2.1–3.2.3
(six core modules, four user roles). Checked against current codebase
(`prisma/schema.prisma`, `src/app/api/**`, `src/app/**/page.tsx`, `src/components/**`)
as of 2026-09-03.

Legend: ✅ implemented · ⚠️ partial · ❌ not implemented

---

## User Roles

| Role | Spec'd | Status |
|---|---|---|
| Student Learner | ✅ | ✅ `Role.STUDENT_LEARNER` |
| Student Tutor | ✅ | ✅ `Role.STUDENT_TUTOR` |
| ~~Teacher Moderator~~ | Named in thesis text | **Intentionally dropped.** Team decided the platform ships with 3 roles only (Learner, Tutor, Admin); moderation duties fold into `ADMIN`. The thesis reference doc is stale on this point — not a build gap. |
| Administrator | ✅ | ✅ `Role.ADMIN`, full `/admin` portal |

---

## 1. User Management Module

| Feature | Status | Notes |
|---|---|---|
| Registration (learner & tutor) | ✅ | `/register/learner`, `/register/tutor`, `POST /api/register` |
| Authentication (login/logout) | ✅ | NextAuth credentials + JWT, `/login`, `/logout` |
| Auto-generated anonymous usernames (`STU-####`/`TUT-####`) | ✅ | `generateAnonymousId()` in `src/lib/idGenerator.ts`, atomic via `IdCounter` |
| Password hashing (bcrypt) | ✅ | used in `/api/register`, auth callbacks |
| Password reset flow | ✅ | `/forgot-password`, `/reset-password`, `PasswordResetToken` model (token hashed, expiring, single-use); reset link emailed via `src/lib/mail.ts` (Nodemailer/SMTP, env-configured, console fallback when unset) |
| Role-Based Access Control | ✅ | `src/proxy.ts` middleware + per-route `getServerSession` checks |
| Profile management | ✅ | `/learner/profile`, `/tutor/profile`, `ProfileEditForm`/`ProfileView` |
| Admin approval of new registrations (optional gate) | ✅ | `AccountStatus.PENDING`, `/admin/registrations`, `requireRegistrationApproval` platform setting |
| Account moderation (suspend/ban) | ✅ | `AccountStatus` (`SUSPENDED`/`BANNED`), `statusExpiresAt`, `/admin/users` |
| Double-blind anonymity (no real names across peer boundary) | ✅ | peer-facing DTOs expose only `id`/`anonymousId`; `showTutorRealNames` admin toggle exists as an override |

## 2. Session Management Module

| Feature | Status | Notes |
|---|---|---|
| Tutor creates/manages classes | ✅ | `TutorClass` model, `/tutor/classes`, `ClassManagement.tsx` |
| Class scheduling (individual meetings) | ✅ | `ClassSession` model, `AddSessionModal`, `WeeklyScheduleView` |
| Session status tracking (scheduled/completed/cancelled) | ✅ | `SessionStatus` enum, `SessionActions.tsx` |
| One-on-one vs. group setup | ✅ | `TutorClass.maxStudents` |
| Class topics (sub-topics per class) | ✅ | `ClassTopic` model |
| Learner enrollment/unenrollment | ✅ | `ClassEnrollment` model, `/api/classes/[classId]/enroll` |
| Roster / enrolled learners view | ✅ | `EnrolledLearnersTable.tsx`, `StudentRoster.tsx` |
| Class moderation (suspend/ban/cancel) | ✅ | `ClassStatus` (`SUSPENDED`/`BANNED`), `ClassModerationPanel.tsx`, `/admin/classes` |
| Learner reports a tutor or class | ✅ | `Report` / `ReportViolation` models, `ReportButton.tsx`, `POST /api/learner/reports`, admin review at `/admin/abuse-reports` (resolve/dismiss + note only; enforcement stays on Users/Classes pages) — added 2026-09-10 |

## 3. Tutor Matching Module

| Feature | Status | Notes |
|---|---|---|
| Weighted scoring algorithm (subject, grade compatibility, availability) | ✅ | `src/lib/matching.ts` → `rankMatches()`, called from `POST /api/learner/match` |
| Learner-submitted tutor/topic request (fallback when no match) | ✅ | `TopicRequest`, `TopicRequestTopic`, `TopicRequestSlot` models; `/learner/requests` |
| Preferred setup selection (1-on-1 vs. group) in request | ✅ | `MatchCriteria.classFormat: "SOLO" \| "GROUP" \| "ANY"` in `src/lib/matching.ts`, applied in the match-ranking API |
| Tutor accepts an open topic request (auto-creates a class) | ✅ | `POST /api/tutor/topic-requests/[id]/accept`, `AcceptRequestModal.tsx` (replaces the old `/fulfill` route, removed 2026-09-03 by `docs/plans/topic-requests-v2.md`) |
| Public vs. directed (tutor-specific) topic requests | ✅ | `TopicRequest.directedTutorProfileId`; landed 2026-09-03 via `docs/plans/topic-requests-v2.md` |
| Request lifecycle (OPEN → ACCEPTED → ENROLLED → FULFILLED, re-open on cancel) | ✅ | `TopicRequestStatus` enum, enroll/unenroll + class status hooks |
| In-app notifications (directed request, accepted, re-opened, fulfilled) | ✅ | new `Notification` model, `/api/notifications`, badge in `PortalLayout` |
| In-app notifications — cross-module events | ✅ | expanded 2026-09-04 (Changes.md Part 18): `REGISTRATION_APPROVED`, `CERTIFICATION_CERTIFIED/REJECTED`, `QUESTION_REQUEST_RESOLVED/DISMISSED`, `CLASS_ENROLLMENT_NEW/DROPPED`, `CLASS_CANCELLED/COMPLETED`; topbar bell dropdown + unread dot in `PortalLayout`; per-row read-on-click; Admin portal at parity (`/admin/notifications`) |
| Admin moderation of topic requests | ✅ | `/admin/topic-requests`, `TopicRequestModerationTable.tsx` |
| Admin can toggle matching availability | ✅ | `matchingEnabled` platform setting |
| Learner tutor browsing (list + profile) | ✅ | `/learner/tutors` card grid (`TutorBrowser.tsx`, `GET /api/learner/tutors`) over verified tutors, filterable by ID + subject; opens the existing `/learner/tutors/[tutorId]` profile. Landed 2026-09-04 (Changes.md Part 28). |
| Global quick search (classes / tutors / topics) | ✅ | Top-bar box in every portal (`GlobalSearch.tsx`, `GET /api/search`), role-scoped results, ⌘K + keyboard nav. Replaced the previously unwired input. Part 28. |
| Admin-editable subjects & topics | ✅ | landed 2026-09-04 (Changes.md Part 25). `Subject`/`Topic` tables + `/admin/subjects` CRUD; replaced the `SubjectArea` enum + static `SUBJECT_TOPICS` map. `subject` columns are now `String` slugs; validation via `src/lib/subjects.ts`; client dropdowns via `useSubjectCatalog()`. Topic rename fans out to all denormalised `topic` columns. See `docs/plans/subject-topic-management.md`. |

## 4. Assessment Module

| Feature | Status | Notes |
|---|---|---|
| Tutor qualifying assessment (must pass before teaching a topic) | ✅ | `TopicCertification`, `AssessmentAttempt`/`AssessmentAttemptItem`, `AssessmentQuizRunner.tsx`, `/tutor/assessments` |
| Admin-authored question bank per subject/topic | ✅ | `AssessmentQuestion`/`AssessmentOption`, `/admin/assessment/question-bank`, `QuestionBankManager.tsx` (subject → topic → questions drill-down) |
| Global assessment config (question count, pass %, min bank size) | ✅ | One platform-wide set on **Settings → Assessment**; stored as `PlatformSetting` rows, read via `getAssessmentConfig()`. Replaced per-`(subject, topic)` `TopicAssessmentConfig`, which was dropped entirely on 2026-09-03 — see `docs/plans/global-assessment-config.md`. |
| Tutor can request more questions be added for a topic | ✅ | `QuestionRequest` model, `/api/admin/question-requests`, `/admin` review UI |
| Admin certifies/rejects a tutor's topic request | ✅ | `TopicCertificationStatus`, `/api/admin/certifications` |
| **Learner pre-test (before a session)** | ✅ | `SessionTest`/`SessionTestQuestion`/`SessionTestAttempt(+Item)`, one test per `ClassSession` served twice (`kind: PRE\|POST` on the attempt). Tutor builder (`/tutor/classes/[classId]/sessions/[sessionId]/test`), learner take/resume/review (`/learner/classes/[classId]/sessions/[sessionId]/test/[kind]`), admin read-only list + results (`/admin/session-tests`). Scoped per-session, not per-class — see `docs/reference/decisions.md`. |
| **Learner post-test (after a session, to measure progress)** | ✅ | Same model as above — opens automatically when the tutor marks that session COMPLETED; pre→post score-gain reporting for tutor (charts + per-learner/per-question breakdown), learner (`/learner/progress`), and admin. Diagnostic only (no pass/fail), per thesis delimitation. `sessionTestsEnabled` platform-setting kill switch. |

## 5. Chatbot Assistant Module

| Feature | Status | Notes |
|---|---|---|
| Intent-based response logic | ✅ | `src/lib/chatbot/` — deterministic tokenise + keyword/synonym/regex scoring with typo-tolerant matching and a length-normalized confidence gate (`classifier.ts`), **no LLM**. ~35 role-aware intents in `intents.ts` |
| Navigation help intents | ✅ | Per-role deep links into every portal section, including Help & FAQs, global search, and admin moderation queues |
| FAQ knowledge base | 🟡 | `faq.ts` — 26 entries, each grounded in a role doc or codebase fact; the `/admin/chatbot` review page (below) now closes the grow-from-misses loop, still pending real TRIS stakeholder interviews |
| Session recommendation intent (learner) | ✅ | `recommend.ts` — extracts subject/topic from the message and ranks live classes via the existing `rankMatches` engine; falls back to "post a topic request" |
| Chat UI widget | ✅ | `src/components/chatbot/ChatWidget.tsx` — floating launcher in every portal, `localStorage` transcript, quick-reply chips, class cards |
| Admin on/off toggle | ✅ | `chatbotEnabled` platform setting (default ON) on `/admin/settings`; route 403s + widget hides when off |
| Unmatched-query logging | ✅ | `chatbot_misses` table (`ChatbotMiss` model), surfaced at `/admin/chatbot` — grouped by normalised wording, role-filterable, sortable (Changes.md Part 30) |

Landed 2026-09-04 (Changes.md Part 19); usability pass (typo tolerance,
narrowed `smalltalk_capabilities`, confidence gate, admin misses review, KB
expansion) landed the same day (Part 30).

## 6. Analytics Dashboard Module (Admin)

| Feature | Status | Notes |
|---|---|---|
| Users by role/grade/status breakdown | ✅ | `GET /api/admin/reports` |
| Classes by subject/status breakdown | ✅ | same route |
| Certification status breakdown | ✅ | same route |
| Enrollment trend (rolling 30-day daily series) | ✅ | same route, zero-filled daily buckets |
| Visual charts/report UI | ✅ | `/admin/reports`, `ReportsView.tsx` |
| Admin audit log of moderation actions | ✅ | `AuditLog` model, `/admin/audit-log`, `AuditLogTable.tsx` (not one of the 6 named modules, but supports the platform's governance/security scope) |

---

## Cross-Cutting / Delimitation Checks

| Item | Spec says | Status |
|---|---|---|
| File upload for learning materials | Explicitly **out of scope** | ✅ correctly absent — no upload endpoints/models exist |
| Browser/device-agnostic responsive web app | In scope | ✅ Tailwind 4 + DaisyUI 5 responsive layout (`PortalLayout.tsx`) |
| Free/non-profit, no payment flows | Implied | ✅ no billing code anywhere |
| Chatbot scope limited to nav/FAQ/recommendation (no replacing tutoring) | In scope, limited | ✅ built 2026-09-04 as a deterministic intent matcher (no LLM), usability pass same day; nav help + FAQ + learner class recommendation only — see §5 and `docs/reference/chatbot.md` |
| Analytics limited to descriptive stats (no ML/predictive) | In scope, limited | ✅ current reports are purely descriptive aggregates — no ML added, consistent with delimitation |

---

## Summary

| Module | Completion |
|---|---|
| 1. User Management | ✅ Complete |
| 2. Session Management | ✅ Complete |
| 3. Tutor Matching | ✅ Complete (Topic Requests v2 — directed requests, accept-to-class, notifications, admin moderation — landed 2026-09-03) |
| 4. Assessment | ✅ Complete — tutor qualification assessment, plus per-session learner pre/post-test (landed 2026-09-05, `Changes.md` Part 29) |
| 5. Chatbot Assistant | ✅ Complete (intent-based — nav help, FAQ, class recommendation, per-portal widget, admin misses review — landed 2026-09-04, usability pass same day; FAQ KB is grounded but still pending real stakeholder interviews) |
| 6. Analytics Dashboard | ✅ Complete |

**Biggest gaps to close next:** grow the chatbot FAQ knowledge base further from `/admin/chatbot` + TRIS stakeholder interviews.

**Note on roles:** the thesis reference document names a 4th "Teacher Moderator" role, but the team decided to ship with 3 roles only (Learner, Tutor, Admin). Treat the reference doc's mentions of Teacher Moderator / Moderator Portal as stale, not a missing feature.
