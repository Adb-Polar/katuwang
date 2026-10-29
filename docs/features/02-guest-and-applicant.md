# Guest and applicant features

## Role summary

A Guest is unauthenticated. Guests can learn about Katuwang and enter account workflows, but cannot browse live tutoring data through the protected learner APIs. Applicants are still Guests until sign-in succeeds. The public registration API provisions only Tutor or Learner accounts; Admin provisioning is outside public registration.

## G01 — Landing experience and privacy information

- **Description:** Introduces peer tutoring, anonymous profiles, matching, sessions and progress using illustrative components.
- **Trigger/entry point:** `/`, landing navigation, registration links, `/privacy-policy`.
- **Underlying logic/business rules:** The landing page assembles `src/components/landing/*` and sample data; sample match/profile/progress views are demonstrations, not live enrollments or quiz attempts. Privacy page explains collected identity, consent and visibility.
- **Inputs/outputs:** Navigation and any demonstration controls produce UI state or route changes; no business data writes.
- **Permissions/edge cases:** Public access. Policy text describing rights/retention does not create a self-service deletion endpoint.
- **Evidence:** [page.tsx](../../src/app/page.tsx), [landing components](../../src/components/landing), [privacy policy](../../src/app/privacy-policy/page.tsx).

## G02 — Select role and register

- **Description:** Creates a learner or tutor account with an anonymous identifier.
- **Trigger/entry point:** `/register` → `/register/learner` or `/register/tutor`; submit form → `POST /api/register`.
- **Underlying logic/business rules:** (1) Apply registration IP rate limit. (2) Reject when `registrationOpen=false`. (3) Validate discriminated `type` payload and read approval/verification flags. (4) Reject existing email. (5) Hash password at bcrypt cost 12 and generate anonymous ID. (6) Create User and, for a tutor, TutorProfile. Set `PENDING` when approval is required; otherwise use ACTIVE default. (7) If verification is required, create a hashed, expiring token and attempt SMTP delivery. (8) Return flags so the form routes to check-email, approval guidance, or login.
- **Inputs:** `type: LEARNER|TUTOR`, first/last names (1–50 characters), normalized lowercase valid email, password, grade enum GRADE_7–GRADE_12, nonempty section, optional contact information, optional recovery email in the schema, and `consentGiven:true`.
- **Outputs/side effects:** HTTP 201 `{message,anonymousId,pendingApproval,requiresVerification}`; account/profile/token rows and optional email. Verification takes precedence in the success message. The route currently does **not persist recoveryEmail** from registration.
- **Permissions/edge cases:** No Admin type. 400 for validation/consent failure; 403 closed registration; 409 duplicate email; 429 rate limit. Password is at least 8 characters, at most 72 UTF-8 bytes, and outside a common-password blocklist. Email delivery failure does not roll back registration; resend is the recovery path. Registration contact input is less strictly validated than profile edits.
- **Evidence:** [register handler](../../src/app/api/register/route.ts), [registration core](../../src/lib/registration.ts), [registration schema](../../src/lib/validations/auth.ts), [RegisterForm](../../src/components/auth/RegisterForm.tsx).

## G03 — Sign in and route to the portal

- **Description:** Authenticates credentials and opens the correct role dashboard.
- **Trigger/entry point:** `/login`; NextAuth credentials flow under `/api/auth/[...nextauth]`; successful UI navigation to `/dashboard`.
- **Underlying logic/business rules:** Validate credentials; throttle by IP+email; verify password; lift elapsed account suspension; block suspended/banned users; enforce verification setting; block pending or declined accounts. On success, session callbacks expose role/anonymous ID and `/dashboard` redirects to `/admin`, `/tutor`, or `/learner`.
- **Inputs/outputs:** Email and password → JWT-backed session and role portal, or inline error/dedicated account-state page.
- **Permissions/edge cases:** Incorrect email/password share one error. Missing fields are rejected. `ACCOUNT_UNVERIFIED` routes to `/account-unverified?email=...`, pending to `/pending-approval`, declined to `/account-declined` with optional reason. Wrong-role portal access reaches `/unauthorized`. JWT expiration and refresh behavior are described in the architecture chapter.
- **Evidence:** [auth.ts](../../src/lib/auth.ts), [LoginForm](../../src/components/auth/LoginForm.tsx), [dashboard](../../src/app/dashboard/page.tsx).

## G04 — Verify email and resend a link

- **Description:** Confirms control of the login email address independently of admin approval.
- **Trigger/entry point:** `/verify-email?token=...`, `/verify-email/check-email`, `/account-unverified`; `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`.
- **Underlying logic/business rules:** Verify hashes supplied token, requires unused/unexpired record, updates `User.emailVerifiedAt` and token `usedAt` transactionally. Resend finds the normalized login email, ignores verified/banned/nonexistent accounts, invalidates earlier unused tokens, issues a fresh 24-hour token and attempts mail.
- **Inputs/outputs:** Verify `{token}` → success message or 400 invalid/expired. Resend `{email}` → neutral 200 message that does not confirm account existence or verification status; optional token/mail side effects.
- **Permissions/edge cases:** Public but throttled. Resend: 5/IP and 3/email per 15 minutes; verification: 10/IP per 15 minutes. Old or used links fail. Verification does not approve a pending registration. Mail errors remain server-side while the neutral response is retained.
- **Evidence:** [verification handlers](../../src/app/api/auth/verify-email/route.ts), [resend handler](../../src/app/api/auth/resend-verification/route.ts), [token helpers](../../src/lib/emailVerification.ts).

## G05 — Request and complete password recovery

- **Description:** Replaces a forgotten password using a token emailed to a primary or saved recovery email.
- **Trigger/entry point:** `/forgot-password` → `POST /api/auth/forgot-password`; emailed `/reset-password?token=...` → `POST /api/auth/reset-password`.
- **Underlying logic/business rules:** Normalize/validate email; throttle; find first matching primary or recovery email; issue only for non-BANNED account. Invalidate old unused reset tokens, create SHA-256 hash of random 32-byte token with 30-minute expiry, and send to the submitted matching address. Reset validates token and password, checks hash/expiry/unused state, then updates bcrypt hash and consumes token in a transaction.
- **Inputs/outputs:** Request `{email}` → neutral 200 message regardless of match; reset `{token,password}` → success message and UI redirect to login. Database token/password changes and optional SMTP email.
- **Permissions/edge cases:** Request limit 5/IP and 3/email per 15 minutes; reset limit 10/IP per 15 minutes. Invalid/used/expired token → 400. Recovery does not reactivate moderated accounts or bypass approval. Existing JWT sessions are not explicitly revoked. A shared recovery email is not unique; the implementation uses `findFirst`.
- **Evidence:** [forgot-password](../../src/app/api/auth/forgot-password/route.ts), [reset-password](../../src/app/api/auth/reset-password/route.ts), [password rules](../../src/lib/validations/password.ts).

## G06 — Account-state and access guidance

- **Description:** Explains unverified, pending, declined or unauthorized access and offers next navigation.
- **Trigger/entry point:** `/pending-approval`, `/account-unverified`, `/account-declined`, `/unauthorized`, verification check-email page.
- **Underlying logic/business rules:** Public informational pages read safe route parameters and render next steps; authoritative account state remains in authentication/database checks.
- **Inputs/outputs:** Optional email/reason query parameters → display, resend controls or login/dashboard links; no status modification.
- **Permissions/edge cases:** A query-string decline reason is presentation input, not proof of an actual administrative decision. These pages do not grant a session.
