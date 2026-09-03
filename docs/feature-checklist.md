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

## 4. Assessment Module

| Feature | Status | Notes |
|---|---|---|
| Tutor qualifying assessment (must pass before teaching a topic) | ✅ | `TopicCertification`, `AssessmentAttempt`/`AssessmentAttemptItem`, `AssessmentQuizRunner.tsx`, `/tutor/assessments` |
| Admin-authored question bank per subject/topic | ✅ | `AssessmentQuestion`/`AssessmentOption`, `/admin/assessment/question-bank`, `QuestionBankManager.tsx` (subject → topic → questions drill-down) |
| Global assessment config (question count, pass %, min bank size) | ✅ | One platform-wide set on **Settings → Assessment**; stored as `PlatformSetting` rows, read via `getAssessmentConfig()`. Replaced per-`(subject, topic)` `TopicAssessmentConfig`, which was dropped entirely on 2026-09-03 — see `docs/plans/global-assessment-config.md`. |
| Tutor can request more questions be added for a topic | ✅ | `QuestionRequest` model, `/api/admin/question-requests`, `/admin` review UI |
| Admin certifies/rejects a tutor's topic request | ✅ | `TopicCertificationStatus`, `/api/admin/certifications` |
| **Learner pre-test (before a session)** | ⚠️ | Not on `main` — `AssessmentAttempt` there is scoped to `TutorProfile` only. **Built and committed on the unmerged branch `class-pre-post-tests` (commit `1b6662c`)**: `ClassTest`/`ClassTestQuestion`/`ClassTestAttempt(+Item)` models, tutor builder UI, learner take/resume/review flow, admin read-only results. See `docs/reference/decisions.md`. |
| **Learner post-test (after a session, to measure progress)** | ⚠️ | Same branch/commit as above — includes pre→post score-gain reporting for tutor/learner/admin. Diagnostic only (no pass/fail), per thesis delimitation. |

## 5. Chatbot Assistant Module

| Feature | Status | Notes |
|---|---|---|
| Intent-based responder for navigation help | ❌ | No chatbot code found (`grep -ri "chatbot\|intent"` across `src/` returns nothing) |
| FAQ answering | ❌ | Not implemented |
| Session/tutor recommendation via chat | ❌ | Not implemented (matching exists via a form UI, not chat) |

**Entire module is unbuilt.**

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
| Chatbot scope limited to nav/FAQ/recommendation (no replacing tutoring) | In scope, limited | ❌ module doesn't exist yet, so the delimitation is moot until built |
| Analytics limited to descriptive stats (no ML/predictive) | In scope, limited | ✅ current reports are purely descriptive aggregates — no ML added, consistent with delimitation |

---

## Summary

| Module | Completion |
|---|---|
| 1. User Management | ✅ Complete |
| 2. Session Management | ✅ Complete |
| 3. Tutor Matching | ✅ Complete (Topic Requests v2 — directed requests, accept-to-class, notifications, admin moderation — landed 2026-09-03) |
| 4. Assessment | ⚠️ Tutor qualification assessment is complete on `main`; learner pre/post-test is built but **sitting unmerged** on `class-pre-post-tests` |
| 5. Chatbot Assistant | ❌ Not started |
| 6. Analytics Dashboard | ✅ Complete |

**Biggest gaps to close next:** (1) Chatbot Assistant module (whole module, 0% built), (2) decide whether/when to merge `class-pre-post-tests` — the learner pre/post-test work already exists, it's just not on `main`.

**Note on roles:** the thesis reference document names a 4th "Teacher Moderator" role, but the team decided to ship with 3 roles only (Learner, Tutor, Admin). Treat the reference doc's mentions of Teacher Moderator / Moderator Portal as stale, not a missing feature.
