# Password recovery

The existing NextAuth credentials, Prisma User/PasswordResetToken models, bcrypt
password rules, and configured email provider remain the authentication infrastructure.

## Flow and endpoints

- `POST /api/auth/forgot-password` accepts `{ email, method?: "primary" | "recovery" }`, normalized as the primary
  registered email. Every valid address receives the same message and an opaque
  HttpOnly, SameSite=Strict challenge cookie. Next.js `after` performs lookup and
  SMTP delivery after responding, so public timing does not depend on account
  existence or mail success. Eligible accounts receive an eight-digit code only at the selected address
  (primary by default). The code screen offers an explicit backup-email button,
  shown identically for every account; backup delivery requires an existing
  verified recovery address and never falls back to primary. No account-specific options or
  addresses are exposed at this point.
- `POST /api/auth/recovery` with `{ action: "verify", code }` checks the cookie
  and code, then returns masked `primary` and nullable `recovery` options. Codes
  expire in 15 minutes and have a persistent five-attempt maximum. Their hashes
  incorporate the random cookie secret, which is not stored in the database.
- The same endpoint with `{ action: "send", method: "primary" | "recovery" }`
  requires verified ownership. It reads the address from the database, rechecks
  it inside the transaction, consumes the challenge, retires earlier reset
  tokens, and issues a 15-minute reset token. SMTP runs after responding. The
  response contains only the generic confirmation message.
- `POST /api/auth/reset-password/validate` accepts `{ token }` to validate the
  emailed link before showing the new-password form. It returns no credential.
- `POST /api/auth/reset-password` retains `{ token, password }`. It applies the
  shared password rules, hashes with bcrypt cost 12, conditionally consumes the
  unexpired token, changes the password, increments `sessionVersion` to revoke existing sessions, and invalidates all other reset tokens
  and recovery challenges in one transaction. Per-account row locks serialize
  issuance and redemption, including concurrent requests with different tokens.
  No login session is created. The form redirects to `/login?reset=true`.
- Existing `/api/user/recovery-email` and `/api/user/recovery-email/verify`
  endpoints and the existing profile recovery settings remain responsible for
  enrollment. They retain active-account authorization, current-password checks
  when changing an address, and verification before recovery use. Verification
  also invalidates pending ownership challenges from the previous address.


New reset links carry the raw token in a URL fragment, keeping it out of server
request URLs and referrers. The client removes it from browser history, holds it
only in memory, and sends it in POST bodies. Existing query-string links are
accepted and removed from history as well. Refreshing after removal requires
opening the emailed link again. No reset token is returned by an API or written
to local/session storage. Mail errors are logged without transport objects,
which may contain message bodies.

## Schema and rollout

Migration `20261108000000_verified_recovery_email` adds the `recovery_challenges` table and reuses
`User.recoveryEmailVerifiedAt` from the existing migration. It reuses the
existing recovery address and hashed reset-token table. Existing verification status is preserved; unverified addresses must be confirmed from profile settings before recovery delivery
is enabled. Existing users can continue resetting via primary email. Existing profile endpoints retain their current-password checks and clear verification when an address changes.

Apply the migration before running the updated server:

```sh
pnpm exec prisma migrate deploy
pnpm exec prisma generate --generator client
```

The migration is additive and does not overwrite existing user data. The existing mail provider must
be configured (Brevo, Resend, or SMTP);
`NEXTAUTH_URL` supplies the trusted link origin. Existing development behavior
without a configured mail provider is a no-op; codes/tokens are never printed.

The existing limiter remains per-process (the application's single-instance
assumption). Public lookup is limited per IP and normalized email; requests have
an enforced 60-second resend cooldown per destination and a three-per-15-minute address limit.
Verification, delivery, and reset validation/redemption also have IP limits;
code attempts additionally persist in the database. Resending a reset link
requires a fresh ownership code. A horizontally scaled deployment requires a
shared rate-limit store.

## Validation

Backend tests mock Prisma and SMTP. They cover primary-only, verified and
unverified recovery accounts, identical public responses, deferred lookup,
masked choices, incorrect/expired/reused proofs, persistent attempt limits,
arbitrary destination rejection, address-change checks, both delivery choices,
15-minute hashed tokens, atomic claims, password rules, invalid/expired/reused
reset tokens, enrollment, and rate limits/cooldown. Browser checks against the
running Next.js app mock API responses to exercise the responsive flow, both
choices, resend cooldown, fragment removal, invalid links and login success.
Live database migration and real email delivery are deployment checks, not part
of the mocked tests.
