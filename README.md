# Katuwang

**Katuwang** (Tagalog for *"helper"* / *"partner"*) is a free, web-based peer
tutoring management platform built for **Taysan Resettlement Integrated
School (TRIS)** in Legazpi City, Albay 
school serving Grades 7–12. It connects student tutors with student learners
so peer academic support can be organized and moderated instead of ad hoc,
under a strict double-blind anonymity model (RA 10173 compliance).

This is an undergraduate capstone project (Bicol University, BS Information
Technology).

For domain/business context — what the platform is, the three user roles,
the privacy mandate, and the six core modules — start at
[`docs/reference/project-overview.md`](docs/reference/project-overview.md).
Browse plans, reports, and testing checklists in the
[documentation index](docs/README.md).
Engineering conventions, stack details, and project structure live in
[`CLAUDE.md`](CLAUDE.md).

## Tech Stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS 4 + DaisyUI 5,
NextAuth.js 4, Prisma 7 on MariaDB/MySQL, Zod 4, Vitest 4. Package manager:
**pnpm**. Full table in [`CLAUDE.md`](CLAUDE.md#-technology-stack).

## Getting Started

```bash
pnpm install

# create .env with:
#   DATABASE_URL=
#   NEXTAUTH_URL=
#   NEXTAUTH_SECRET=
#   EMAIL_PROVIDER=brevo # brevo, resend, or smtp
#   BREVO_API_KEY=       # Brevo API key, not SMTP key
#   BREVO_FROM_EMAIL=    # sender verified in Brevo
#   BREVO_FROM_NAME=     # optional; defaults to Katuwang
#   RESEND_API_KEY=      # optional alternative HTTPS provider
#   RESEND_FROM=         # verified Resend sender; falls back to MAIL_FROM
#   # optional SMTP — unset means reset links are logged to the server
#   # console instead of emailed (fine for local dev):
#   SMTP_HOST=
#   SMTP_PORT=            # default 587
#   SMTP_USER=
#   SMTP_PASS=
#   SMTP_SECURE=          # "true" for port 465
#   MAIL_FROM=            # e.g. "Katuwang <no-reply@example.com>"

npx prisma generate
npx prisma db push        # sync schema with your local database

pnpm dev                  # http://localhost:3000
```

### Email

Password-reset and verification emails support Brevo and Resend over HTTPS,
which works on Render's free tier. Set `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`,
and `BREVO_FROM_EMAIL` (an address verified in Brevo). `BREVO_FROM_NAME` defaults
to `Katuwang`. Use an API key, not an SMTP key. Account activation or sender
approval may also be required by Brevo before sending to recipients.

The selected provider never silently falls back to another provider after an
error or when credentials are missing. Without `EMAIL_PROVIDER`, the app chooses
Brevo when its key is present, then Resend, then SMTP. Local SMTP remains
available via `EMAIL_PROVIDER=smtp` and `SMTP_*` / `MAIL_FROM`; when unconfigured,
it logs that email would have been sent.

For `katuwang-dev-test`, configure the Brevo variables in Render, save and deploy,
then request a password reset for an existing account you control. Check Brevo's
transactional logs for delivery; `[mail] Brevo accepted email` in Render confirms
API acceptance, not inbox delivery. The public reset response stays neutral even
when sending fails.

Zero-cost relays that work without owning a domain:

- **Brevo** — verify a single sender address, Use its HTTPS API
  with the variables above; sending limits depend on your account plan.
- **Gmail / Google Workspace** — `smtp.gmail.com:587` with an
  [App Password](https://support.google.com/accounts/answer/185833) (needs 2FA).
- **Mailpit** (local only) — `docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`,
  then `SMTP_HOST=localhost SMTP_PORT=1025`, and read the mail at
  `http://localhost:8025`.

Other common commands:

```bash
pnpm exec tsc --noEmit    # typecheck
pnpm lint                 # lint (Next.js 16 flat config)
pnpm test                 # run tests once (Vitest)
pnpm test:watch           # tests in watch mode
pnpm build && pnpm start  # production build
npx prisma studio         # DB GUI
pnpm exec tsx prisma/seed.ts  # seed the database
```

## Project Docs

| Where | What |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Engineering conventions, tech stack, project structure, RBAC/API/DB patterns |
| [`docs/reference/project-overview.md`](docs/reference/project-overview.md) | Domain/business context — start here for "what is this and why" |
| [`docs/reference/decisions.md`](docs/reference/decisions.md) | Where the app deliberately diverges from the original thesis spec |
| [`docs/reference/feature-checklist.md`](docs/reference/feature-checklist.md) | Thesis-spec vs. actual build status, module by module |
| [`docs/roles/`](docs/roles/) | Per-role feature + API reference (Learner, Tutor, Admin) |
| [`docs/plans/`](docs/plans/) | Implementation plans, active and historical |
| [`docs/README.md`](docs/README.md) | Full docs index |

## Status

Five of six core modules are built and working (User Management, Session
Management, Tutor Matching, tutor-side Assessment/Certification, Analytics
Dashboard). The Chatbot Assistant module and a learner-facing pre-/post-test
assessment are not yet implemented — see
[`docs/reference/feature-checklist.md`](docs/reference/feature-checklist.md) for the full
breakdown.

### Signup email verification

Set `REQUIRE_SIGNUP_EMAIL_VERIFICATION=true` to send a verification link through
the configured mailer on every public signup. New accounts must verify before
signing in; expired links can be resent from the verification screen. Existing
accounts without a verification token retain access unless the separate global
`requireEmailVerification` admin setting requires verification for all users.
