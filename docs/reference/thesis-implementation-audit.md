# Katuwang — Thesis Proposal vs. Implementation Audit

> Performed 2026-09-23. Compares `docs/reference/thesis.md` (the capstone proposal)
> against the current codebase, independently of `decisions.md` /
> `feature-checklist.md` (this audit was done from a fresh read of the primary
> source, not those secondary summaries — though its conclusions on role count
> and module completeness end up agreeing with them). Not a living document —
> a point-in-time defense-prep audit. If the thesis text or the code changes
> significantly after this date, re-run rather than trust this file blindly.

**Method note:** Built from three sources: (1) a fresh, first-principles
extraction of the entire `docs/reference/thesis.md` (1,606 lines — the file's
~450KB size is mostly base64-embedded appendix images, not text); (2) a
citation-level implementation inventory from fresh reads of
`src/lib/matching.ts`, `src/lib/chatbot/*`, `src/lib/auth.ts`,
`next.config.ts`, `src/proxy.ts`, and three representative end-to-end traces;
(3) direct verification of the single most consequential finding (§14 #1).
Where a thesis diagram (ERD, DFD, Use Case, System Architecture, all four UI
mockups) is an **embedded image with no extractable text**, that is stated
plainly and marked UNCLEAR rather than guessed at.

---

## 1. Overall Implementation Status

The system is substantially more complete than the thesis's own embedded
progress-tracker appendix claims (see §13), and closely follows the thesis's
*design decisions* (bcrypt, RBAC, weighted-scoring matching, deterministic
chatbot) almost exactly. The gaps are concentrated in three places: (a) the
thesis is **internally inconsistent** on role count and ISO/IEC 25010
characteristics — independent of any code comparison; (b) the **formal
ISO/IEC 25010 evaluation** (Objective 5) has not been conducted — no survey,
no measurements exist in the repo; (c) one specific implementation detail —
**the tutor-certification gate on class creation defaults to off** —
contradicts both the thesis's Significance section and the project's *own
already-submitted* Module-01 DFD. That third item is the one to flag as most
urgent; details in §14.

All six named modules (User Management, Session Management, Tutor Matching,
Assessment, Chatbot, Analytics) exist and function end-to-end. The system
also implements a large amount of trust/safety and hardening machinery
(moderation, appeals, abuse reports, audit log, rate limiting, security
headers) that the thesis never specified at all — a genuine positive, not a
gap.

---

## 2. Requirements Traceability Matrix

Status legend per the audit spec: IMPLEMENTED / PARTIALLY IMPLEMENTED / NOT
IMPLEMENTED / MODIFIED / REPLACED / ADDED / UNCLEAR. Evidence is abbreviated;
full citations are in §§4–12.

| ID | Thesis Requirement | Where in Thesis | Status | Evidence | Notes |
|---|---|---|---|---|---|
| T-OBJ-GEN | Design/develop/evaluate Katuwang, aligned to Tulong Dunong / RA 12028 | §1.2 (L299) | PARTIALLY IMPLEMENTED | Build: done. Evaluation: not done | Alignment claim itself is unverifiable (policy framing, not a testable feature) |
| T-OBJ-01 | Platform with core modules | §1.2 (L303) | IMPLEMENTED | `feature-checklist.md`, all 6 modules ✅ | |
| T-OBJ-02 | Matching by subject/topic/grade/availability | §1.2 (L304) | MODIFIED | `matching.ts` weights (§10) | "Availability" ≠ stored field, see §6/§14 |
| T-OBJ-03 | Chatbot: nav/FAQ/recommendation | §1.2 (L305) | IMPLEMENTED | `src/lib/chatbot/*` (§10) | |
| T-OBJ-04 | Analytics for students, tutors, admins | §1.2 (L306) | IMPLEMENTED | `/admin/reports`, `/learner/progress`, tutor session-test charts | Exceeds Scope wording (admin-only), matches this objective |
| T-OBJ-05 | ISO/IEC 25010 evaluation, 6 characteristics | §1.2 (L307) | NOT IMPLEMENTED | No survey/measurement artifacts anywhere in repo | See §12, §14 |
| T-SIG-01 | Admin dashboard reduces scheduling burden | §1.3 (L313) | IMPLEMENTED | `/admin/reports`, `/admin/classes` | |
| T-SIG-02 | Weighted matching + pre/post-tests + RA 10173 | §1.3 (L315) | IMPLEMENTED | §10, §11 | |
| T-SIG-03 | "guarantee tutors are assessed and certified prior to being paired" | §1.3 (L317) | **CONTRADICTED BY DEFAULT CONFIG** | `settings.ts:19` `requireCertificationForClassCreation: false` | Headline issue, §14 #1 |
| T-SIG-04 | Teachers use analytics dashboard, "direct students to platform" | §1.3 (L319) | NOT IMPLEMENTED | No Teacher role exists in `Role` enum | Follows from Teacher Moderator being dropped |
| T-SIG-05 | Reusable reference for future researchers | §1.3 (L323) | UNCLEAR | Not a testable code claim | |
| T-SCOPE-01/02 | 6 modules; anonymized usernames; bcrypt; RBAC | §1.4 (L329-331) | IMPLEMENTED | `idGenerator.ts`, `auth.ts` | |
| T-SCOPE-03 | Tutors organize/monitor sessions | §1.4 (L331) | IMPLEMENTED | `ClassSession`, `/tutor/classes` | |
| T-SCOPE-04 | Weighted matching + fallback topic request + 1-on-1/group choice | §1.4 (L331) | IMPLEMENTED | `matching.ts`, `TopicRequest`, `classFormat` filter | |
| T-SCOPE-05 | Tutor assessment gates registration; pre/post-test per session | §1.4 (L331) | **MODIFIED / OVERSTATED** | Gate is optional, off by default; per-session pre/post-test IS implemented as described | Split finding — see §14 #1, #8 |
| T-SCOPE-06 | Chatbot: intent-based, nav/FAQ/recommend | §1.4 (L331) | IMPLEMENTED | §10 | |
| T-SCOPE-07 | Analytics dashboard "for administrators" | §1.4 (L331) | IMPLEMENTED (narrower than built) | Code serves 3 audiences, not just admin | Internally inconsistent with T-OBJ-04 |
| T-SCOPE-08 | Responsive, all browsers/devices | §1.4 (L333) | PARTIALLY IMPLEMENTED — VERIFICATION REQUIRED | Tailwind/DaisyUI responsive layout exists; no automated cross-browser test suite | Manual spot-checks only (`docs/backlog/TOTEST.txt`) |
| T-SCOPE-09 | ISO/IEC 25010 evaluation scope | §1.4 (L333) | NOT IMPLEMENTED | same as T-OBJ-05 | |
| T-DELIM-01 | Free, non-profit | §1.4 (L337) | IMPLEMENTED | No billing code anywhere | |
| T-DELIM-02 | No file upload (in-person tutoring) | §1.4 (L337) | IMPLEMENTED | No upload endpoints/models exist | |
| T-DELIM-03 | Chatbot doesn't replace tutoring | §1.4 (L337) | IMPLEMENTED | Nav/FAQ/recommend only, no generative chat | |
| T-DELIM-04 | Analytics stays descriptive, no ML | §1.4 (L337) | IMPLEMENTED | `/api/admin/reports` — pure aggregates | |
| T-DELIM-05 | No outcome guarantee | §1.4 (L337) | N/A | Disclaimer, not a feature | |
| T-LIT-03/04/05/06 | RA 10173, Privacy by Design, minors' data protection, informed consent | §2.2–2.3 | PARTIALLY IMPLEMENTED | Anonymized DTOs, `consentGiven` boolean | No verified guardian identity — §14 #10 |
| T-GAP-01 | "tutors, learners, and instructor moderators" (3 named types) | §2.3 (L433) | N/A | Thesis-internal wording variant | Contributes to role-count inconsistency |
| T-IPO-01 | Input: learners, tutors, **teachers** | §2.4 Fig.1 (L443) | NOT IMPLEMENTED | No teacher-facing input path exists | |
| T-IPO-03 | Post-session feedback/rating; teacher observation; "class groups" | §2.4 (L453) | NOT IMPLEMENTED | No learner→tutor rating/review model exists in schema; no teacher-observation feature; no "class group" grouping concept beyond `TutorClass` roster | Genuine unimplemented feature, not previously flagged in project's own docs |
| T-DEF-TM | "Teacher Moderator" formally defined | §2.5 (L487) | NOT IMPLEMENTED (deliberate) | `Role` enum has 3 values | `decisions.md`, confirmed by project owner 2026-09-03 |
| T-DEF-USE | Usability defined via "students and teacher moderators" | §2.5 (L491) | N/A | Definition, not a feature | Assumes a role that doesn't exist |
| T-DEF-DM | Data minimization (grade level + subject only) | §2.5 (L463) | IMPLEMENTED | Peer-facing DTOs select only `id`/`anonymousId` + grade/section | |
| T-TECH-01/03 | Next 16.2.4, React 19.2, Tailwind 4.0, **MySQL** 9.7.0, Prisma 7.7.0, NextAuth 4.24.14 | §3.1.1 Table 1 | MODIFIED (version drift + DB product) | `package.json`: Next 16.2.12, Prisma 7.8.0, NextAuth 4.24.15; DB is **MariaDB** via `@prisma/adapter-mariadb` | §14 #9, #12 |
| T-SEC-01 | Bcrypt selected, justified vs. alternatives | §3.1.3.1 Table 4 | IMPLEMENTED | `bcrypt.compare`, cost 12 | |
| T-SEC-02 | RBAC, **3 roles** (Admin/Tutor/Learner), example permissions | §3.1.3.2 Table 5 | IMPLEMENTED | `proxy.ts` guard exactly matches this section | The one role-count statement in the thesis that *does* match the code |
| T-MATCH-01 | Weighted scoring over ML, criteria: subject/grade/availability | §3.1.3.3 Table 6 | MODIFIED | `matching.ts` weights (§10) | Criteria expanded (topic-level, cert bonus, soonness); "availability" semantics differ, §14 #7 |
| T-DES-03 | Explicitly rejects ML ("no historical interaction data yet") | §3.1.3.3 (L624) | IMPLEMENTED | Confirmed: zero external AI/ML calls anywhere in `src/lib/matching.ts` or `src/lib/chatbot/*` | |
| T-ID-01/02 | ID gen: generate → check uniqueness → retry on collision | §3.1.4 (L641-648) | MODIFIED / REPLACED | `idGenerator.ts` uses atomic `IdCounter.increment` | Functionally superior, but doesn't match the described algorithm — §14 #11 |
| T-METH-02 | Requirements Planning names **4 roles** incl. Teacher Moderator | §3.2.1 (L657) | N/A | Thesis-internal contradiction with T-SEC-02 | §13 |
| T-METH-04 | Top backlog items: matching, session mgmt, auth/RBAC, pre/post-test | §3.2.3 (L664) | IMPLEMENTED | All 4 shipped | |
| T-EVAL-01 | Survey to **4** user groups incl. Teacher Moderators | §3.3 (L694) | NOT IMPLEMENTED | No survey conducted; also assumes a non-existent role | |
| T-ISO-TABLE | ISO characteristics: incl. "**Flexibility**" (not Portability) | §3.3 Table 7 (L703) | N/A | 3rd distinct wording of the ISO list in this one document | §13 |

*(Covers every requirement extracted from the thesis; pure Scrum-ceremony
process description — Daily Scrum format, Retrospective cadence, etc. — is
omitted as not applicable to a code audit.)*

---

## 3. Objectives Verification

| Objective | Implementation | Status | Evidence | Gap |
|---|---|---|---|---|
| **General**: design/develop/evaluate, aligned to Tulong Dunong / RA 12028 | Built and functioning | PARTIALLY MET | Full app exists | The "**evaluate**" half is unmet — no ISO 25010 evaluation was conducted |
| **Specific 1**: web-based platform, core modules | 6/6 modules built | MET | `feature-checklist.md` | None |
| **Specific 2**: matching by subject/topic/grade/availability | `src/lib/matching.ts` | MOSTLY MET | Weighted scoring exists and runs | "Availability" is not a stored tutor input; it's inferred from already-scheduled sessions (§14 #7) |
| **Specific 3**: chatbot for nav/FAQ/recommendation | `src/lib/chatbot/*` | MET | Deterministic intent+FAQ matcher, ~35 intents, 26 FAQ entries, `recommend.ts` reuses the matching engine | None |
| **Specific 4**: analytics dashboard, students/tutors/admins | `/admin/reports`, `/learner/progress`, tutor session-test charts | MET | All three surfaces exist and render real data | None against this wording (though narrower Scope wording says admin-only — internal thesis inconsistency, not a code gap) |
| **Specific 5**: evaluate via ISO/IEC 25010, 6 characteristics | — | **NOT MET** | Zero survey/measurement artifacts found repo-wide | This objective is currently fully open |

---

## 4. Feature Audit (end-to-end traces)

**Tutor creates a class** — `NewClassForm.tsx` → `createClassSchema`
(`validations/class.ts:75`) → `POST /api/tutor/classes` → role check
(`STUDENT_TUTOR`) + `TutorProfile` existence check → subject/topic validation
→ **conditional** certification check (`requireCertificationForClassCreation`,
default `false`) → past-date/overlap checks → `prisma.tutorClass.create` →
visible in `/tutor/classes`. **Fully wired**, but the certification step is
the one link in this chain that doesn't behave the way the thesis says it
should (§14 #1).

**Learner takes a session pre/post-test** —
`/learner/classes/[classId]/sessions/[sessionId]/test/[kind]` →
`POST .../test/[kind]/start` → role check + `sessionTestsEnabled`
kill-switch + enrollment check (`sessionTestAccess.ts`) → window rules (PRE
closes at session completion, POST opens only after completion) → submit
route auto-grades → score/gain surfaces on `/learner/progress` and the
tutor's results view. **Matches thesis wording exactly** ("before and after
each tutoring session").

**Admin suspends an account** — `UserManagementTable.tsx` →
`updateUserStatusSchema` → `PATCH /api/admin/users/[userId]` → role check +
"can't touch another admin" guard → `computeExpiresAt()` → transactional
`user.update` + `auditLog.create` → enforced at next login (`auth.ts`) and
mid-session via the 5-minute JWT re-check → visible in `/admin/audit-log`.
**Fully wired, matches RBAC intent.**

Module-by-module summary — see §2 for citations; all six named modules are
IMPLEMENTED, with the caveats already noted for Assessment (certification
gate) and Analytics (audience wording).

---

## 5. Added Features

None of these appear anywhere in the thesis extraction:

- Learner-filed abuse reports on a tutor/class (`Report`/`ReportViolation`, `/admin/abuse-reports`)
- Tutor appeals against class moderation (`ClassAppeal`)
- Admin-to-learner class recommendations (`ClassRecommendation`) — distinct from the chatbot's own recommendation intent
- Admin moderation audit log (`AuditLog`, `/admin/audit-log`)
- DB-backed in-app notification system (bell/badge, `Notification` model) across all three portals
- Password-reset + optional email-verification flows (`PasswordResetToken`, `VerificationToken`, SMTP via Nodemailer)
- Self-service profile edit + change-password for all three roles
- Global cross-portal search (`GET /api/search`)
- Nine admin-configurable platform-setting toggles (feature kill-switches)
- Admin-editable Subject/Topic catalogue (replacing what the thesis assumes is a fixed subject list)
- Class publish/unpublish; in-person location fields (`building`/`room`)
- Security hardening never specified by the thesis: login rate-limiting, anti-enumeration dummy-bcrypt-compare, mid-session JWT role/status re-check, CSP + 5 other security headers, HSTS
- Dev-only test-data factory (`/dev`) — not user-facing, excluded from the feature comparison proper

---

## 6. Modified Features

| Feature | Thesis says | Code does | Why it matters |
|---|---|---|---|
| Tutor certification gate | Implied mandatory prerequisite | Optional `PlatformSetting`, **defaults off**, not set by seed script either | §14 #1 — the single biggest finding |
| Tutor "availability" | A stated input to matching | Not stored at all; derived from a tutor's already-scheduled `ClassSession` rows; matching's "schedule fit" scores against existing sessions, not a standing availability calendar | §14 #7 |
| Global tutor qualification status | Implied single tutor status (the project's own earlier build-guide draft even had `TutorStatus: PENDING/PARTIAL/CERTIFIED/REJECTED` on `TutorProfile`) | No such field exists on the current `TutorProfile` model at all — qualification is purely per-`(subject, topic)` via `TopicCertification` | Reinforces #1/#8 — there is no "is this tutor certified" flag to check globally, only per-topic |
| Anonymous ID generation algorithm | Generate → check uniqueness → retry on collision | Atomic `IdCounter.increment` (no collision possible by construction) | §14 #11 — functionally better, doesn't match the paper's described algorithm |
| Analytics audience | Scope text: admin-only | Serves learner, tutor, and admin | Code exceeds the narrower of two conflicting thesis statements |
| Database engine | Named "MySQL 9.7.0" | MariaDB via `@prisma/adapter-mariadb` (MySQL-protocol-compatible) | §14 #9 |
| "Topic request" terminology | Not named this way in thesis (thesis just says "tutor request") | UI copy says "class request" (data model/routes still `TopicRequest`) | Cosmetic only, per `decisions.md` |

---

## 7. Removed/Unimplemented Features

- **Teacher Moderator role** — entirely absent; deliberate cut (`decisions.md`, confirmed 2026-09-03)
- **Teacher-facing analytics/dashboard access** — follows from the above
- **Post-session learner feedback/rating of tutors** — the IPO "Feedback" component (T-IPO-03) describes learners rating tutor efficacy/session quality; no rating/review model exists anywhere in the schema
- **Teacher observation of "class groups"** — no such concept exists in the schema (closest analog, `TutorClass`, has no teacher-facing view)
- **Formal ISO/IEC 25010 evaluation** (Objective 5 / Table 7 survey) — not conducted
- **Verified/authenticated guardian consent** — only a self-attested checkbox exists
- **Mandatory tutor certification before operating as a tutor** — exists only as an optional, off-by-default setting

---

## 8. Database Comparison

**A genuine limitation, stated plainly rather than guessed around:** the
thesis's ERD, DFD, Use Case Diagram, System Architecture Design, and all four
UI mockups are **appendix headings followed only by an embedded image** — no
extractable text. The original thesis ERD cannot be compared against the
current schema because it cannot be read from the document. This is marked
**UNCLEAR / REQUIRES VERIFICATION** — a real ERD-level diff would require
opening that image directly.

What's available instead: the project already produced an independent,
code-accurate Data Flow Diagram for the IT124 Module-01 System Design
Refinement submission (`docs/to-submit/m01-presentation/assets/DFD.md`),
with an explicit data-store → Prisma-model map. Current schema: **32
models, 17 enums**. That DFD is a good candidate to substitute into the
thesis's system-design chapter in place of the unreadable original — **with
one fix first**: its own Process 4.0 description ("gated on a CERTIFIED row
per topic") has exactly the same overstatement problem as the thesis text —
see §14 #1, verified directly against the running code (`route.ts` +
`settings.ts:19`, and confirmed the seed script never sets that flag
either).

---

## 9. Role and Permission Comparison

| Role | Thesis | Code | Status | Differences |
|---|---|---|---|---|
| Student Learner | Named consistently everywhere | `STUDENT_LEARNER` | IMPLEMENTED | Matches |
| Student Tutor | Named consistently everywhere | `STUDENT_TUTOR` | IMPLEMENTED | Matches |
| Teacher Moderator | Named in 3+ sections (Requirements Planning §3.2.1, Evaluation §3.3, Definition of Terms, Significance, IPO) as a 4th role with session/analytics monitoring duties | **Does not exist** | NOT IMPLEMENTED | Deliberately dropped (`decisions.md`); moderation folded into `ADMIN` |
| Administrator | Named in all sections, but the **RBAC design section (§3.1.3.2)** names only 3 roles total (Admin/Tutor/Learner, no Teacher Moderator) | `ADMIN` | IMPLEMENTED | Code matches the thesis's own RBAC section exactly — the mismatch is *the thesis disagreeing with itself*, not code diverging from a single clear spec |

`proxy.ts` enforcement: exact path-prefix guard (`/admin`→ADMIN,
`/tutor`→STUDENT_TUTOR, `/learner`→STUDENT_LEARNER), plus a universal
non-`ACTIVE`-status block ahead of the role check. This matches the RBAC
rigor implied by §3.1.3.2's Table 5 examples closely (e.g. "administrators
cannot change other users' records without authorization" ↔ the code's
explicit "can't modify another admin" guard).

---

## 10. AI/Matching/Chatbot Comparison

**Neither system is AI or ML in any technical sense — both are ordinary
deterministic application logic, exactly as the thesis itself argues for
(not overclaimed).**

**Matching** (`src/lib/matching.ts`) — deterministic weighted scoring, no
randomness, no model inference:
```
score = (matched topics × 10) + (verified-certified topic matches × 5)
      + (sessions inside preferred slot × 3) + gradeScore(6/3/2/0) + soonness(0–2 decaying)
```
Hard filters (excluded, not scored low): subject mismatch, not
`SCHEDULED`+`published`, full capacity, `classFormat` mismatch, zero topic
overlap. This matches Table 6's stated rationale ("pre-established,
human-interpretable rules" vs. "black-box ML") precisely, and extends it
with a certified-topic bonus and a recency/soonness term the thesis doesn't
name but which is a faithful elaboration of "availability."

**Chatbot** (`src/lib/chatbot/*`) — tokenize (lowercase, accent-strip,
stopword-drop, Taglish synonym map) → typo-correct (edit-distance-1 snap) →
score (keyword=1, regex pattern=3, FAQ keyword=2) → must clear both
`MIN_SCORE=2` and a length-normalized `MIN_CONFIDENCE=0.35` →
category-priority tie-break (recommend>nav>faq>smalltalk). Confirmed via
repo-wide grep: **zero calls to any external AI/LLM API** anywhere in
`src/lib/chatbot/`. Matches T-SCOPE-06/T-DELIM-03 exactly.

The one place the thesis's own literature review (T-LIT-01) cites an
ML-based comparator (HELM Learning) — that's context/motivation, not a
Katuwang requirement, and the thesis's own design-alternatives table
explicitly and correctly rejects ML for Katuwang itself. No inconsistency
there.

---

## 11. Security and Privacy Comparison

| Requirement | Thesis | Code | Status |
|---|---|---|---|
| Password hashing | Bcrypt, justified vs. 4 alternatives (Table 4) | `bcrypt`/`bcryptjs`, cost 12 | IMPLEMENTED |
| RBAC | 3 roles (§3.1.3.2) | `proxy.ts` exact match | IMPLEMENTED |
| Anonymized IDs | Sequential, RA 10173-motivated | Atomic counter (better than described algorithm) | IMPLEMENTED (algorithm differs, §14 #11) |
| Data minimization | Grade level + subject only, no real name/school ID | Peer-facing DTOs select only `id`/`anonymousId` + non-identifying fields | IMPLEMENTED |
| Privacy by Design | "incorporated from the outset" | Anonymity enforced at the query layer app-wide | IMPLEMENTED (qualitative claim, can't be numerically verified) |
| Informed/guardian consent | Invoked once, no mechanism specified | Single self-attested checkbox (`consentGiven`); no verified guardian identity | **PARTIALLY IMPLEMENTED** — §14 #10 |
| CSRF | Not mentioned | NextAuth's default credentials-flow protection presumed present | UNCLEAR — not independently re-verified this audit |
| XSS | Not mentioned | React default escaping; but CSP allows `'unsafe-inline'` for script/style, a **self-documented** tradeoff in `next.config.ts`'s own comment (Next App Router injects both without a nonce) | PARTIALLY IMPLEMENTED — honest, known residual surface, not an oversight |
| SQL injection | Not mentioned | Zero raw SQL anywhere (`grep` confirmed); all access via Prisma query builder | IMPLEMENTED |
| Rate limiting, security headers, anti-enumeration, mid-session re-check | **Not specified anywhere in the thesis** | Extensive — 8 endpoints rate-limited, CSP+HSTS+5 headers, dummy-bcrypt-compare, 5-min JWT re-check | ADDED — exceeds thesis scope, a genuine strength to lead with in defense |

---

## 12. Non-Functional Requirements

| ISO characteristic (thesis wording varies, see §13) | Implemented? | Evidence | Verdict |
|---|---|---|---|
| Functional suitability | Yes, extensively | 6 modules, 99 test files, 729/729 passing (`pnpm test`, run live during this audit) | Best-evidenced NFR |
| Performance efficiency | — | **No evidence found** — no load/perf test config, no benchmark scripts, no measurements | NOT EVALUATED |
| Interaction capability / Usability | Partial | Working responsive UI across 3 portals; no formal usability survey/SUS score conducted | IMPLEMENTATION EXISTS — VERIFICATION REQUIRED |
| Reliability | Partial | 729/729 automated tests is real evidence at the code level; no uptime/crash-recovery data (nothing deployed yet — `docs/plans/deployment.md` is "planning only") | IMPLEMENTATION EXISTS — VERIFICATION REQUIRED |
| Portability / Flexibility (thesis names both, inconsistently) | Partial | Tailwind/DaisyUI responsive layout; no automated cross-browser/device test suite; some manual spot-checks logged in `docs/backlog/TOTEST.txt` | IMPLEMENTATION EXISTS — VERIFICATION REQUIRED |
| Security | Yes, strongly | See §11 | Well-evidenced |
| **Formal ISO/IEC 25010 evaluation itself** (Objective 5, Table 7 survey) | No | Zero survey instruments, responses, or weighted-mean calculations exist anywhere in the repo | NOT IMPLEMENTED |

---

## 13. Thesis Inconsistencies (thesis vs. itself)

| Thesis Statement | Contradicts | Problem | Recommended Thesis Update |
|---|---|---|---|
| §3.1.3.2: "three different user roles... Administrator, Student Tutor, Student Learner" | §3.2.1, §3.3, Definition of Terms, Significance, IPO all name/assume a 4th "Teacher Moderator" | Two irreconcilable role counts in the same document | Pick one (recommend 3, since that's what's built and matches your own RBAC design section) and do a global find-and-remove of every "Teacher Moderator" reference |
| §1.2/§1.4: ISO characteristics = "...reliability, **portability**, security" (6 items) vs. §2.4: "...reliability, and **safety**" (5 items, "usability" not "interaction capability") vs. §3.3 Table 7: "...reliability, **flexibility**, security" (6 items, "flexibility" swapping in for "portability") | Three different lists for the same evaluation framework | Standardize on the official ISO/IEC 25010 characteristic names and use them identically in every section |
| §1.2 Objective 4: dashboard "for students, tutors and administrators" vs. §1.4 Scope: dashboard "for administrators" vs. §1.3 Significance: dashboard used by "Teachers" | Three different audiences named for one feature | Reconcile before defense — the actual system serves learner+tutor+admin, no teacher |
| §1.4 Scope: assessment "qualifies student tutors before they can register as a tutor" | §3.1.3.2/actual RBAC design has no notion of a registration-time gate at all | The thesis's own scope oversells what its own design section (and the code) implement | Reword to describe per-topic certification gating class creation, not registration |
| Embedded progress-report appendix (Aug 2026, "Week 2 of 16") marks nearly everything Sprint 2–8 "Pending"/"Not Yet Started" | The actual repository (confirmed via `Changes.md`, 84 logged parts through 2026-09-23) has all 6 modules fully built | A panelist reading this appendix will believe the project is far less done than it is | Update or remove this appendix before submission — it is now badly stale and undersells the actual work |
| Plaintext test credentials embedded in the thesis body (`black@gmail.com`/`white@gmail.com`, password `password`) | The thesis's entire premise is student-data privacy/security | Presenting literal credentials in an academic paper about a privacy-focused system reads poorly | Remove or redact before submission |

---

## 14. Potential Defense Issues

**#1 — Tutor certification gate is optional and off by default, contradicting
both the thesis and the project's own submitted DFD.** *Evidence:*
`src/lib/settings.ts:19` (`requireCertificationForClassCreation: false`),
confirmed against the actual route logic
(`src/app/api/tutor/classes/route.ts` — the certification check only runs
`if (requireCertification)`), and confirmed the seed script
(`prisma/seed.ts`) never sets this flag either — so the current
demo/seeded database also runs uncertified-by-default. *Why it matters:* the
thesis's Significance section says the assessment module "guarantee[s]"
certification before pairing; the project's own already-submitted Module-01
DFD explicitly states class creation is "gated on a CERTIFIED row per
topic." Both are currently false for the running system unless an admin
manually flips a setting nobody seeds on. *What the thesis says:*
certification is a guarantee. *What the system does:* certification is
opt-in, and opted out by default. *Recommended action:* either flip the
platform default to `true` before defense (a config change, not a code
change — low risk), or be fully prepared to explain the deliberate
reasoning if it should stay optional, and correct the DFD/thesis wording
either way.

**#2 — Role-count self-contradiction in the thesis (3 vs. 4 roles).** §13.
*Recommended action:* a global text pass removing "Teacher
Moderator"/4-role framing, citing `decisions.md`'s existing rationale.

**#3 — ISO/IEC 25010 characteristic list stated three different ways in the
same document.** §13. Trivial to fix, easy for a panelist to catch if they
flip between chapters.

**#4 — The ISO/IEC 25010 evaluation itself has never been conducted.** No
survey, no data. If Objective 5 is part of the grading rubric, it is
currently fully unmet. *Recommended action:* run the Table 7 survey (even a
small one) before defense, or explicitly scope it as "future work" in the
paper.

**#5 — The thesis's embedded progress-report appendix is badly stale and
undersells the project.** §13. *Recommended action:* update or delete
before submission — pure upside to fix, no tradeoff.

**#6 — Plaintext demo credentials embedded in the thesis text.** §13. Minor
but easy ammunition for a panelist asking about security discipline in a
privacy-focused thesis.

**#7 — "Tutor availability" doesn't exist as stored data.** *Evidence:* no
`availability` field on `TutorProfile` in the current schema;
`src/lib/derivedAvailability.ts` exists but per the `docs/roles/TUTOR.md`
audit, isn't actually wired into any page. The matching engine's "schedule
fit" term scores against a class's *already-scheduled* sessions, not an
independent availability calendar. *Why it matters:* Objective 2 and the
matching design-rationale table both name "availability" as an input.
*Recommended action:* be ready to explain precisely this — it's a
legitimate, arguably better design (no stale self-reported data), but it is
not what a literal reading of the objective describes.

**#8 — "Qualifies... before they can register as a tutor" overstates the
actual gate.** Related to #1 — even when the setting is on, it gates
class-creation-per-topic, not the tutor account's existence; there's also
no global tutor-qualification-status field any more (removed in favor of
purely per-topic `TopicCertification`). *Recommended action:* reword the
thesis's Scope section to match the per-topic, class-creation-time gate
that actually exists.

**#9 — Thesis names "MySQL," running database is MariaDB.** Minor,
one-line thesis fix.

**#10 — Guardian consent is a self-attested checkbox, not a verified
identity.** If a panelist asks "how do you verify parental consent for
minors," the honest, complete answer is: it isn't verified independently —
the registrant checks a box. Have this answer ready rather than
overclaiming compliance.

**#11 — Anonymous-ID algorithm described in the thesis doesn't match the
code.** The thesis describes a generate→check→retry loop; the code uses an
atomic counter increment. Functionally better, but if a panelist asks to
trace the pseudocode against the paper, they won't match. One-paragraph
thesis fix.

**#12 — Pinned dependency versions in Table 1 are stale.** Purely cosmetic
(`16.2.4`→`16.2.12` etc.) — trivial find-and-replace.

**#13 — Post-session learner feedback/rating of tutors (from the IPO
"Feedback" component) doesn't exist.** Not previously documented anywhere as
a gap (not in `feature-checklist.md` either) — genuinely new finding from
this audit. If a panelist has read the Conceptual Framework closely, they
may ask about it.

---

## 15. Recommended Thesis Changes

1. Resolve the 3-vs-4-role contradiction globally (recommend keeping 3,
   matching what's built and matching §3.1.3.2's own design rationale) —
   touches §1.3, §2.3, §2.5, §3.2.1, §3.3.
2. Standardize the ISO/IEC 25010 characteristic list to one canonical
   wording across §1.2, §1.4, §2.4, §3.3, Table 7.
3. Reword the assessment-module Scope text (§1.4) to describe a per-topic,
   class-creation-time gate — not a registration-time gate — and match it
   to whatever the default setting should be (see Code Changes below).
4. Reconcile the analytics-dashboard audience (§1.2 vs. §1.4 vs. §1.3) to
   "learners, tutors, and administrators" — matches what's actually built,
   and drop the "Teachers" claim from Significance.
5. Update or remove the embedded self-progress-report appendix — it is now
   several months and dozens of shipped features out of date.
6. Remove the plaintext demo credentials from the thesis body.
7. Update Table 1's pinned dependency versions to match current
   `package.json`.
8. Correct "MySQL" to "MariaDB" (or describe it as "a MySQL-protocol-
   compatible database," which is technically accurate either way).
9. Rewrite the anonymous-ID generation algorithm description (§3.1.4) to
   describe the actual atomic-counter mechanism.
10. Reword the "tutor availability" language in Objective 2 / §3.1.3.3 to
    describe availability as derived from a tutor's scheduled sessions, not
    a separately stated calendar — or, alternatively, treat this as a code
    gap to close (see below) if the paper's original framing should stand.
11. Consider adding a short "Known Limitations" subsection acknowledging:
    self-attested (not verified) guardian consent, and that the formal
    ISO/IEC 25010 evaluation is not yet complete — both are honest,
    defensible, and preempt a panelist's question rather than getting
    caught by it.
12. Either remove the post-session tutor-rating/feedback and
    teacher-observation claims from the Conceptual Framework, or add them
    to a "future work" section — they don't exist in the current build.
13. Replace the unreadable embedded ERD/DFD/Use-Case/Architecture images
    with the project's own already-built, code-accurate DFD
    (`docs/to-submit/m01-presentation/assets/DFD.md`) — after fixing that
    DFD's own certification-gate wording (issue #1) so it doesn't just
    relocate the same inconsistency.

## 16. Recommended Code Changes

**Critical implementation gap (if the code should match the thesis as
currently written):**
- Flip `requireCertificationForClassCreation` to default `true` (and set it
  explicitly in `prisma/seed.ts`), so the running system actually enforces
  what the Significance section and the submitted DFD both claim. This is
  a one-line default change plus a seed-script line, not a schema change.

**Minor differences (defensible either way — pick a side and make the docs
match):**
- Decide whether "tutor availability" should become a real, stated input
  again (a schema addition) or whether the thesis text should be updated to
  describe the current derived-from-sessions behavior instead. The latter is
  the better design, but that's a project-owner call.
- Consider a lightweight learner→tutor post-session rating, if the IPO
  "Feedback" component should be more than aspirational — this is
  genuinely unimplemented and was not previously tracked anywhere in the
  project's own docs.
- If the paper's registration-time framing should hold literally, that
  would require gating `TutorProfile` activation on certification rather
  than gating class creation — a larger change, not recommended this close
  to defense; reword the thesis instead (see §15 item 3).

---

## 17. Final Implementation Inventory

| Feature | Proposed | Implemented | Modified | Added | Missing | Notes |
|---|---|---|---|---|---|---|
| User registration/auth/RBAC | ✓ | ✓ | | | | 3 roles, matches thesis's own RBAC section |
| Anonymous ID generation | ✓ | ✓ | ✓ | | | Algorithm differs (atomic counter vs. described retry loop) |
| Teacher Moderator role | ✓ | | | | ✓ | Deliberately dropped |
| Session/class management | ✓ | ✓ | | | | |
| Tutor matching (weighted scoring) | ✓ | ✓ | ✓ | | | "Availability" semantics differ |
| Topic-request fallback | ✓ | ✓ | | | | |
| Tutor topic certification | ✓ | ✓ | ✓ | | | Gate is optional, off by default |
| Global tutor qualification status | ✓ (implied) | | | | ✓ | No global status field exists any more |
| Learner pre/post-test per session | ✓ | ✓ | | | | Matches thesis wording exactly |
| Chatbot (deterministic intent/FAQ/recommend) | ✓ | ✓ | | | | |
| Analytics dashboard | ✓ | ✓ | ✓ | | | Broader audience than Scope text says, narrower than Significance's "teachers" claim |
| RA 10173 anonymity / data minimization | ✓ | ✓ | | | | |
| Guardian/informed consent | ✓ (vague) | ✓ (self-attested only) | ✓ | | | Not independently verified |
| Post-session tutor rating/feedback | ✓ (IPO) | | | | ✓ | Genuinely unimplemented, newly flagged |
| Teacher observation / class groups | ✓ (IPO) | | | | ✓ | |
| ISO/IEC 25010 formal evaluation | ✓ | | | | ✓ | No survey conducted |
| Abuse reports, class appeals, audit log, notifications, password reset, self-service profile, global search, platform settings, subject/topic admin catalogue | | ✓ | | ✓ | | Not in thesis at all |
| Rate limiting, security headers, anti-enumeration, mid-session re-check | | ✓ | | ✓ | | Exceeds thesis's Security section |

---

Nothing in the thesis or the code was changed to produce this audit. The one
item to act on first is **§14 #1**: it's cheap to fix (a config default + a
seed line) and it's the one place two of the project's own already-written
documents plus the running system all disagree with each other on something
a panelist could trivially demo live.
