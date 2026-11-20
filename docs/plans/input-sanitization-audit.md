# Input Sanitization & Validation Audit

**Status:** The **High and Medium** gaps are fixed (2026-11-18, Changes.md Part 91): U1, T1, A1, A4, A6, X2, X6, X7. **Low** gaps are still open and await a decision. See [Fix candidates](#fix-candidates).
**Date:** 2026-11-18
**Audited revision:** `origin/develop` @ `774ab11`.

**Scope:** every user-editable field in:
- `/learner/**`, `/tutor/**`, `/admin/**`
- the public auth pages: `/login`, `/register`, `/forgot-password` (code-based recovery), `/reset-password`, `/verify-email`
- the account-level surfaces that develop adds:
  - recovery email
  - avatar upload
  - account deletion
  - admin accounts
  - certificates

Rate limiting is out of scope because it is handled on `feat/route-rate-limiting`.

**Method:** I read every schema in `src/lib/validations/`, every `route.ts` under `src/app/api/` (including inline Zod in the newer routes) and every `<input>`/`<textarea>` in `src/components/**` and `src/app/**`. I confirmed two behaviours by running Zod 4.4 directly in node:
- `z.string().trim().url()` accepts `javascript:` and `data:` URLs.
- A `.min(1).trim()` chain accepts `"   "` and stores `""`.

Nothing was written to the database.

## Severity scale

| Level | Meaning |
|---|---|
| **High** | A peer can plant something dangerous or privacy-leaking that another user then sees, or a business rule can be bypassed |
| **Medium** | Bad data can be persisted, raw HTML gets injected into email, or the server returns 500 instead of 400 on reachable input |
| **Low** | The client and server limits disagree, or a UX or consistency issue. The server still rejects the bad input |

## Global observations

- **Rendering is safe.** `dangerouslySetInnerHTML` appears nowhere in `src/`. All user text renders through React text nodes, which escape it.
- **Forms rely on native constraints.** `ValidatedForm` (`src/components/ui/ValidatedForm.tsx`) uses the browser's own validation (`required`, `minLength`, `maxLength`, `pattern`, `min`/`max`) and adds inline messages and focus. So a missing client attribute means the user gets no inline feedback and only sees the server's 400.
- **Emails:**
  - Auth emails now carry only server-generated codes or URLs.
  - The certificate email HTML-escapes its user text (`src/lib/certificates/email.ts:4`).
  - **The admin-invite email does not escape `firstName`.** See **X2**.
- **Certificate PDF:** `pdf-lib` `drawText` with CR/LF/tab stripped. There is no injection surface.
- **CSV:** `src/lib/csv.ts` `toCsv` has no guard against formula injection (a leading `= + - @`). It has one caller, `/admin/reports`. Its labels are enums, dates and subject slugs (slugs are regex-restricted and checked with `subjectExists` on every class write), so it is **not currently exploitable**. This is defence in depth only. See **X1**.
- **Prisma `String` maps to `VARCHAR(191)`** (MariaDB). A server string with no `.max()` that is longer than 191 characters fails at the DB, so the user gets a **500 instead of a 400**.
- **Zod 4 runs `.trim()` in chain order.** In `z.string().min(1).max(50).trim()` the checks run *before* the trim:
  - Whitespace-only input passes `min(1)` and is saved as `""`.
  - Padded input can fail `max` even though the trimmed value would fit.
  - The safe order is `.trim().min().max()`, which the newer schemas already use.
- **Already fixed on develop** (these were found on the old base and need no action):
  - Tutor class `PATCH` now runs `classTeachingError`: subject/topic catalog check, grade eligibility and certification.
  - Admin reason textareas now have `maxLength={500}`.
  - Subject and topic manager inputs now have `maxLength` and `pattern`.
  - Email links no longer fall back to the request `Host` (codes and cookies are used now).
  - Certificate filters are Zod-bounded.

---

## Public auth pages

| Field | Page / component | API route | Server rule | Client rule | Gap | Sev |
|---|---|---|---|---|---|---|
| First / last name | `/register/*` · `RegisterForm.tsx:132,144` | `POST /api/register` | `.min(1).max(50).trim()`. No allowed-character rule | `type=text required`. No `maxLength` | **A1** Whitespace-only names pass (trim runs after `min`) and are saved as `""`. **A2** No `maxLength={50}` on the client. **A3** No character allow-list, so digits, emoji and symbols are accepted (rendering is still safe) | Med / Low / Low |
| Student ID number, adviser name | `RegisterForm.tsx:157,170` | `POST /api/register` | `trim().min(1).max(191)` | `required maxLength=191` | None | — |
| Section | `RegisterForm.tsx:202` | `POST /api/register` | `.min(1).trim()`. **No max** | `type=text required`. No `maxLength` | **A4** Whitespace-only passes. No max (profile caps it at 50), so a value over 191 characters gives a 500. No client `maxLength={50}` | Med |
| Email | `RegisterForm.tsx:217` | `POST /api/register` | trim, lowercase, `email()`. **No max** | `type=email required` | **A5** A value over 191 characters gives a 500. No client `maxLength` | Low |
| Recovery email | `RegisterForm.tsx:229` | `POST /api/register` | trim, lowercase, `email()`, optional. No max | `type=email` | Same as A5 | Low |
| Contact info | `RegisterForm.tsx:233` | `POST /api/register` | `trim().optional()` only. **No max and no format.** `normalizeContactInfo` is **not** called | `type=text`, placeholder "Phone or guardian contact" | **A6** Registration accepts any free text, while profile edit enforces a PH mobile number (`normalizeContactInfo`). The same column ends up with two data shapes. A value over 191 characters gives a 500. The client should match profile: `type=tel inputMode=tel`, PH placeholder | Med |
| Password / confirm | `RegisterForm.tsx:247,270` | `POST /api/register` | `passwordField`: ≥8 characters, ≤72 bytes, common-password blocklist | `minLength=8`. No max | **A7** No client hint or limit for the 72-byte cap | Low |
| Grade, consent | `RegisterForm` | `POST /api/register` | enum / `literal(true)` | select / `required` | None | — |
| Login email / password | `/login` · `LoginForm.tsx:129,155` | NextAuth credentials (`src/lib/auth.ts`) | Presence check only. Exact-match lookup and `bcrypt.compare` | `type=email required`, `required` | **A8** No length cap before the lookup and bcrypt. Low because rate limiting exists | Low |
| Forgot-password email | `/forgot-password` · `ForgotPasswordForm.tsx:60` | `POST /api/auth/forgot-password` | `method` enum, `email().max(191)` | `type=email required` | None | — |
| Recovery code | `ForgotPasswordForm.tsx:61` | `POST /api/auth/recovery` | `regex(/^\d{8}$/)` + httpOnly cookie | `inputMode=numeric pattern=[0-9]{8} maxLength=8` | None | — |
| Reset password / confirm | `/reset-password` · `ResetPasswordForm.tsx:115,143` | `POST /api/auth/reset-password`, `…/validate` | token ≤256, `passwordField`, confirm match | `minLength=8 required` | Same as A7. `…/validate` reads `body.token` without a schema (only a hashed lookup, so harmless) | Low |
| Verify email + code | `/verify-email` · `VerifyEmailForm.tsx:53,65` | `POST /api/auth/verify-email` | `email()` + `regex(/^\d{6}$/)` | `type=email`; `inputMode=numeric pattern=[0-9]{6} maxLength=6` | None | — |
| Resend verification | `ResendVerificationButton` | `POST /api/auth/resend-verification` | `email()` | prop | None | — |

## Learner portal

| Field | Page / component | API route | Server rule | Client rule | Gap | Sev |
|---|---|---|---|---|---|---|
| Section | `/learner/profile/edit` · `ProfileEditForm.tsx:109` | `PATCH /api/learner/profile` | `trim().min(1).max(50)` | `maxLength=50 required` | None | — |
| Contact (PH mobile) | `ProfileEditForm.tsx:127` | `PATCH /api/learner/profile` | `trim().max(200)` + `normalizeContactInfo` | `type=tel inputMode=tel`. No `maxLength` or `pattern` | **L1** No client `maxLength`/`pattern` (for example `maxLength={16}` and `pattern="[0-9 +()-]*"`). The server normalises | Low |
| Recovery email + password | `RecoveryEmailSettings.tsx:71,74` | `PATCH /api/user/recovery-email` | `email()` (no max), `currentPassword` optional in the schema and enforced in `recoveryEmailUpdateData` | `type=email`, password. No `maxLength` | Same as A5 | Low |
| Recovery email code | `RecoveryEmailSettings.tsx:88` | `POST /api/user/recovery-email/verify` | `regex(/^\d{6}$/)` | `inputMode=numeric maxLength=6`, **no `pattern`** | **L2** Add `pattern="[0-9]{6}"` (the verify page already has it) | Low |
| **Profile picture** (all roles) | `ProfilePictureUpload.tsx:160` | UploadThing `profilePicture` (`src/app/api/uploadthing/core.ts`) | `image`, 2 MB, 1 file. Server re-encode (magic bytes, bomb check, **EXIF/GPS strip**) runs **only when** the filename is not `avatar-*.webp`, **and** the result is kept **only if** it is smaller; on any optimiser error the **original is kept** | `accept=png/jpeg/webp` + client canvas re-encode (strips EXIF) | **U1** The server's sanitising step can be skipped, either through the client-controlled filename (`avatar-x.webp`) or because a small file doesn't shrink. A non-image or SVG also fails the magic-byte check and is then **kept** by the catch. A direct upload can therefore store a photo **with GPS/EXIF intact**, and peers see it (`ClassCard` tutor avatars, `StudentRoster` learner avatars). That is a minor's location leak under RA 10173. Fix: always run `optimizeImageBuffer`, always replace the file with its output, reject on validation failure, and restrict the UploadThing type to png/jpeg/webp | **High** |
| Delete account | `AccountControls.tsx:52,55` | `DELETE /api/account` | Hand-checked: `confirm === "DELETE"`, `password` non-empty string. No Zod; `req.json()` without catch | password `required`, confirm `required` | **L3** No schema (malformed JSON gives a 500, see X4). Client confirm field has no `pattern="DELETE"` | Low |
| Match criteria + slots | `/learner/match` · `MatchCriteriaFields.tsx:188–214` | `POST /api/learner/match` | subject/topics checked against the catalog; date `iso.date` matching the day; `HH:MM`, start < end, ≤21 | `type=date/time required`, `data-after` | None | — |
| Topic request note (create) | `RequestTopicButton.tsx:102`, `TopicRequestManager.tsx:242` | `POST /api/learner/topic-requests` | `.max(500).trim()` | `maxLength=500` | **L4** `max` runs before `trim`. Cosmetic | Low |
| Topic request note (edit) | `TopicRequestManager.tsx:278` | `PATCH /api/learner/topic-requests/[id]` | same | **No `maxLength`** | **L5** The edit textarea is missing the `maxLength={500}` + `CharCount` that create has | Low |
| Topic request edit slots | `TopicRequestManager.tsx:318,322` | same | `HH:MM`, start < end | `type=time`, **not `required`** | **L6** Empty times are only caught by the server | Low |
| Report reasons + details | `ReportButton.tsx:152` | `POST /api/learner/reports` | enum array; details `trim().max(1000)`; ≥10 when OTHER | `required minLength=10 maxLength=1000` | None | — |
| Session-test answers | `SessionTestRunner` | `…/session-test-attempts/[id]/submit` | 1–50 `{questionId, optionId}` | radios | None | — |
| Certificate filters | `CertificateList.tsx:54–58` | `GET /api/certificates` | Zod: q ≤100, subject/code ≤191, `iso.date`, pageSize ≤100 | matching `maxLength`, date `min` | None | — |
| Search boxes | `ClassBrowser`, `TutorBrowser`, `GlobalSearch.tsx:172` | `GET /api/classes`, `/api/learner/tutors`, `/api/search` | `q.trim()`, no max; Prisma `contains` (parameterised) | no `maxLength` | X3 | Low |
| Chatbot message (all roles) | `ChatWidget.tsx:140` | `POST /api/chatbot` | `trim().min(1).max(500)` | `maxLength=500` | None | — |

## Tutor portal

| Field | Page / component | API route | Server rule | Client rule | Gap | Sev |
|---|---|---|---|---|---|---|
| **Meeting link** | `ClassScheduleFields.tsx:538`, `EditClassForm.tsx:280`, accept-request form | `POST /api/tutor/classes`, `PATCH …/[classId]`, `POST …/topic-requests/[id]/accept` | `trim().url()`. **Any scheme** (`javascript:`, `data:`, `ftp:` all pass). No max | `type=url`. No `pattern`, no `maxLength` | **T1** Learners see the link as an `<a href>` (`ClassDetailsView.tsx:163,166`). React 19 blocks `javascript:` hrefs, but `data:` and other schemes go through, and the stored value is unsafe for any non-React consumer. Restrict to `http:`/`https:` on the server and add `pattern="https?://.+"` on the client. No max, so a value over 191 characters gives a 500 | **High** |
| Subject / topics / grade | `ClassScheduleFields` (catalog pickers) | class create / edit / accept | `classTeachingError`: catalog, grade, certification | selects / checkboxes | None (fixed on develop) | — |
| Description | `ClassScheduleFields.tsx:382`, `EditClassForm.tsx:308` | same | `.max(500).trim()` | `maxLength=500` | Same as L4 | Low |
| Building / room | `ClassScheduleFields.tsx:502,511`, `EditClassForm.tsx:260,268` | same | `.max(100)` / `.max(50)`, then trim | **No `maxLength`** | **T2** Add `maxLength={100}` / `{50}` | Low |
| Max students | `ClassScheduleFields.tsx:525`, `EditClassForm.tsx:295` | same | int 1–10, ≥ enrolled | `type=number min max` | None | — |
| Session date / time | `ClassScheduleFields.tsx:442,454`, `SessionFormFields.tsx:29,32` | sessions POST/PATCH | `datetime()`, route rejects past dates | `type=date` + `type=time required`, no `min` on the date | **T3** No client `min` (today) on the date | Low |
| Class appeal reason | `ClassAppealCard.tsx:92` | `POST …/classes/[id]/appeal` | `trim().min(10).max(500)` | `required minLength=10 maxLength=500` | None | — |
| Session test title / instructions | `SessionTestBuilder.tsx:201,212` | `…/test` POST/PATCH | 3–120 / ≤2000 | `required minLength=3 maxLength=120` / `2000` | None | — |
| Custom question prompt / options / explanation | `QuestionFormModal.tsx:126,150,184` | `POST /api/tutor/questions`, `PATCH …/[questionId]` | prompt 5–1000, option 1–500, explanation ≤1000, exactly one correct | `required minLength=5 maxLength=1000`; 500; 1000 | **T4** `updateTutorQuestionSchema` has no custom messages, so users see Zod's raw English defaults | Low |
| Question-bank search | `SessionTestBuilder.tsx:727` | `GET /api/tutor/question-bank` | `q.trim()`, no max | none | X3 | Low |
| Assessment / certification topic | `OtherTopicAssessment`, `TopicCertificationList` | `/api/tutor/assessments`, `/topic-certifications`, `/question-requests` | `subjectExists` / `topicExists` | selects | None | — |
| Roster filters | `StudentRoster.tsx:84,107` | `GET /api/tutor/students` | `trim()`, no max | none | X3 | Low |
| Profile, password, recovery email, avatar, delete | shared profile components | same as learner | same as learner | same as learner | L1, L2, **U1**, L3 apply | — |

## Admin portal

| Field | Page / component | API route | Server rule | Client rule | Gap | Sev |
|---|---|---|---|---|---|---|
| **Create admin: first / last name** | `CreateAdminModal.tsx:188,198` | `POST /api/admin/admins` | `trim().min(1).max(50)` | `required`. **No `maxLength`** | **D1** No `maxLength={50}`. **X2:** `firstName` is interpolated unescaped into the invite email HTML (`admins/route.ts:235`) | Low / **Med** |
| Create admin: email | `CreateAdminModal.tsx:210` | same | `trim().email().toLowerCase()`. No max | `type=email required` | Same as A5 | Low |
| Create admin: contact | `CreateAdminModal.tsx:221` | same | `trim().max(100)`. **No `normalizeContactInfo`** | `type=text`, placeholder `0917-123-4567`, no `maxLength` | **D2** Free text, unlike student profiles. Add normalisation or a `tel` input + `maxLength={100}` | Low |
| Admin status reason | `AdminManagementTable.tsx:297` | `PATCH /api/admin/admins/[adminId]` | `trim().max(500)` | **No `maxLength`** | **D3** The only admin reason textarea still missing `maxLength={500}` | Low |
| User / class status reason | `UserManagementTable.tsx:339`, `ClassModerationTable.tsx:365` | users / classes PATCH | `trim().max(500)` | `maxLength=500` | None | — |
| Suspension days | `UserManagementTable.tsx:326`, `ClassModerationTable.tsx:352` | same | `int().positive().max(365)` | `type=number min=1 max=365`, **no `step=1`** | **D4** Decimals pass the client and then hit Zod's raw "expected int" message | Low |
| Registration / topic-request reasons | `RegistrationApprovalTable.tsx:281`, `TopicRequestModerationTable.tsx:294` | respective PATCH | `trim().max(500)` | `maxLength=500` | None | — |
| Avatar moderation reason | `UserAvatarModerationCard.tsx:199` | `POST /api/admin/users/[userId]/avatar-action` | action enum; reason ≤500, required for WARN | `maxLength=500` | None | — |
| Manual certification reason / evidence | `CertificationReviewTable.tsx:282,283` | `PATCH /api/admin/certifications/[id]` | `superRefine`: note ≥10 (≤500), evidence ≥10 (≤2000) | `required minLength=10`, 500 / 2000 | None | — |
| Report / appeal / certification notes | `PromptDialog` | respective PATCH | `trim().max(500)` | `maxLength=noteMax` (500) | None | — |
| Question review / revoke / bank approval / version reason | `QualificationReviewModal.tsx:55–67`, `AdministrativeBankApproval.tsx:28`, `QuestionFormModal.tsx:195` | `…/assessment-questions/[id]/review`, `approve-bank`, `…/versions` | inline Zod with matching min/max | matching `minLength`/`maxLength` | None | — |
| Bank question fields | `QuestionFormModal` | `POST/PATCH /api/admin/assessment-questions` | 5–1000 / 1–500 / ≤1000 | matching | None | — |
| Subject / topic name, slug | `SubjectTopicManager.tsx:366,380,434,530` | subjects / topics routes | name 2–191; slug `^[A-Z][A-Z0-9_]*$` 2–40 | `required minLength maxLength pattern` | None (fixed on develop) | — |
| Curriculum coverage note | `CurriculumCoverage.tsx:51` | subjects / topics PATCH | `trim().max(2000)` | `maxLength=2000` | None | — |
| Catalog migration | (admin action) | `POST /api/admin/certifications/migrate-catalog` | `operationId` regex, reason 20–1000, sha256 fingerprint, origin/host check | — | None | — |
| Assessment config numbers | `PlatformSettingsForm.tsx:314` | `PATCH /api/admin/assessment-configs` | `coerce.int` with bounds | `type=number min max` | Same as D4 (`step`) | Low |
| Recommend class: learner + note | `RecommendClassForm.tsx:144,181` | `POST …/classes/[id]/recommendations` | `learnerId` looked up; note ≤500 | `maxLength=500` | None | — |
| Table search boxes | `*Table.tsx`, `SearchInput.tsx:28` | `GET /api/admin/*` | `q.trim()`, no max; enums filtered; `pageSize ≤ 100` | none | X3 | Low |
| CSV export | `/admin/reports` · `ReportsView.tsx:99` | `GET /api/admin/reports` | — | — | X1 | Low |

## Cross-cutting gaps

| ID | Gap | Where | Sev |
|---|---|---|---|
| **X1** | `toCsv` does not guard against spreadsheet formula injection (a cell starting with `= + - @`, tab or CR). The current export has no user-controlled text, so this is defence in depth for future exports. Fix: prefix such cells with `'` inside `quote()`, plus a unit test | `src/lib/csv.ts:8` | Low |
| **X2** | The admin-invite email builds its HTML with a raw `${newAdmin.firstName}` (HTML injection into the invitee's mail client: links, fake text). Fix: reuse the `escape` helper from `src/lib/certificates/email.ts` (move it to `src/lib/mail.ts`). The `NEXTAUTH_URL \|\| "http://localhost:3000"` fallback on the same line means a misconfigured deployment sends a localhost link. Fix: fail loudly in production | `src/app/api/admin/admins/route.ts:226–235` | Med |
| **X3** | List and search query params (`q`, `section`, `topic`, …) have no length cap (except `/api/certificates`, which already caps `q` at 100). There is no injection risk because Prisma parameterises them, but a very long `q` still does a full `LIKE` scan. Fix: cap to 100 server-side, like certificates, and add `maxLength={100}` to `SearchInput`/`GlobalSearch` | `GET` list routes; `SearchInput.tsx:28` | Low |
| **X4** | Malformed JSON body: `await req.json()` throws, the generic catch runs, and the user gets **500** instead of 400 in most POST/PATCH/PUT routes. The newer routes (`auth/recovery`, `reset-password/validate`, `chatbot`, `notifications/read`) already use `.catch(() => null)`. Fix: a shared `readJson(req)` helper | most mutating routes | Low |
| **X5** | `POST /api/notifications/read` takes `ids` with no schema (`Array.isArray` only). Non-string items cause a Prisma error and a 500. There is no cross-user risk (the query is scoped to `userId`) | `src/app/api/notifications/read/route.ts:16` | Low |
| **X6** | Zod chain order: `.min()/.max()` before `.trim()` in `auth.ts` (names, section), `class.ts` (description, building, room) and `match.ts` (note). This is the root cause of A1/A4/L4 | `src/lib/validations/{auth,class,match}.ts` | Med (A1/A4) / Low |
| **X7** | Server strings with no `.max()` going into `VARCHAR(191)` give a 500 on long input: register email, section, contactInfo and recoveryEmail; profile recoveryEmail; admin email; class `meetingLink` | listed above | Low–Med |

## Fix candidates

Grouped so you can approve them by bucket:

1. **High — ✅ fixed (Part 91):**
   - **U1:** the avatar upload always runs server sanitisation and replaces the file, rejects anything that isn't PNG/JPEG/WebP, and never keeps the raw original.
   - **T1:** meetingLink is restricted to `http(s)` with a max of 191 on the server, plus a client `pattern`.
2. **Medium — ✅ fixed (Part 91):**
   - X6 + A1/A4: trim first, so whitespace-only names and section are rejected.
   - A6: registration contactInfo goes through `normalizeContactInfo` with `type=tel` on the client.
   - X7: add `.max()` to the register, recovery and admin email strings.
   - X2: escape the admin-invite email and drop the localhost fallback in production.
3. **Low (client parity) — open:**
   - Add `maxLength`, `pattern`, `step`, `required` and `min` attributes: A2, A5, A7, L1, L2, L3, L5, L6, T2, T3, D1, D2, D3, D4.
   - Add custom messages to `updateTutorQuestionSchema` (T4).
4. **Low (robustness) — open:** X1 (CSV guard + test), X3 (cap search `q`), X4 (shared JSON-body reader → 400), X5 (notifications ids schema).

Fix notes:
- In the upload callback, the previous avatar is now deleted only after the new one is saved.
- `ClassDetailsView` also refuses to link a stored non-http(s) meeting link (legacy rows).
- Audit probe BUG-005 now asserts the secure behaviour.
- The register section field already got `maxLength={50}` (part of A4). A2/A5 client `maxLength`s are still open.

None of these needs a **database schema change**. They are all validation, route or client changes. Each fix would come with route tests (400 cases) and `TOTEST.txt` lines for the UI limits and the avatar re-upload check.
