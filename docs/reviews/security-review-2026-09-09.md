# Security Review — Katuwang codebase

> **Status:** all six findings addressed in **Changes.md Part 57** (2026-09-10) —
> rate limiting, `/api/dev` ADMIN gate, generic login error + dummy compare,
> security headers + `next.config` fix, JWT role/status re-sync, password
> max-72-bytes + common-password blocklist. Nonce-based CSP and `/api/**`
> status enforcement remain as noted follow-ups.

- **Date:** 2026-09-09
- **Scope:** local repo, `cleanup` branch
- **Method:** static analysis only — no code executed, no live target contacted
- **Reviewer:** Claude Code (`/01-recon-osint` invoked; redirected to a source audit since the ask was "check the security of this codebase")

---

## Executive summary

The codebase is in good shape on the fundamentals: all DB access goes through
parameterized Prisma (zero raw SQL), no `dangerouslySetInnerHTML`, bcrypt cost 12,
RBAC checks are applied consistently in every API route, and object-ownership
checks return 404-not-403 to avoid ID confirmation. The double-blind anonymity
mandate (RA 10173) is enforced by gating real-name exposure behind an admin
setting.

The gaps are concentrated in **abuse resistance** (no rate limiting anywhere) and
a **dev-only endpoint that is dangerous if deployed outside production**. No
critical remote-code or injection issues were found.

---

## Findings

### 1. No rate limiting on any endpoint — MEDIUM/HIGH

A search for rate-limit / throttle / 429 across `src/` returns nothing.
Consequences:

- **`/api/auth/[...nextauth]` (login)** — unlimited password guessing /
  credential stuffing against a K-12 user base likely to have weak passwords.
- **`/api/auth/forgot-password`** — email-bombing any address, and unbounded
  `passwordResetToken` row creation.
- **`/api/register`** — automated bulk account creation.
- **`/api/chatbot`, `/api/search`** — cheap DB-load amplification per
  authenticated user.

**Fix:** add an IP + identifier limiter (e.g. `@upstash/ratelimit`, or a small
in-memory / DB token bucket in `src/proxy.ts` or a shared helper) on the auth and
public routes at minimum.

---

### 2. `/api/dev` has no authentication — MEDIUM (deployment-dependent)

`src/app/api/dev/route.ts` is guarded **only** by
`process.env.NODE_ENV === "production"`. On any staging / preview / `next start`
deploy where `NODE_ENV` is not exactly `"production"`:

- `GET /api/dev` returns **first name, last name and email of every user**
  (tutors + learners) — a direct breach of the anonymity design.
- `POST /api/dev` with `{"action":"createUsers","role":"ADMIN"}` creates a working
  **ADMIN account** (`consentGiven: true`, known password `password123`) with no
  auth at all.

**Fix:** also require an `ADMIN` session, or gate behind an explicit
`ENABLE_DEV_ROUTES` env flag that is unset everywhere but local dev, and never
register the route in the production build.

---

### 3. User enumeration in `authorize()` — LOW/MEDIUM

`src/lib/auth.ts:23-33` throws distinct messages:
`"No account found with that email."` vs `"Incorrect password."`, and skips
`bcrypt.compare` entirely when the user is absent (timing side-channel). An
attacker can enumerate valid accounts. The forgot-password route, by contrast, is
correctly neutral — mirror that here: one generic
`"Invalid email or password."` and run a dummy `bcrypt.compare` against a fixed
hash on the no-user path.

---

### 4. No security headers / malformed `next.config` — LOW/MEDIUM

`next.config.ts` sets no `headers()` — missing `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options` / `frame-ancestors` (clickjacking),
`X-Content-Type-Options`, `Referrer-Policy`.

The file is also structurally broken: it assigns
`module.exports = { allowedDevOrigins: [...] }` **and** `export default nextConfig`.
Next uses the default export, so `allowedDevOrigins` is silently dropped.

**Fix:** consolidate into the single `nextConfig` object and add an
`async headers()` block.

---

### 5. JWT sessions are not revocable — LOW

Session strategy is JWT with `maxAge: 8h` (`src/lib/auth.ts:107-110`). The `jwt`
callback only populates on sign-in and the `session` callback never re-reads the
DB, so an admin who **suspends or bans** a user (a real feature here) does not cut
off that user's existing session for up to 8 hours.

**Fix:** a lightweight per-request status check (middleware hitting a cached
`user.status`) or a shorter `maxAge`.

---

### 6. Weak password policy — LOW

`src/lib/validations/auth.ts`: `password: z.string().min(8)` — no complexity, no
breach-list check, and **no max length** (bcrypt truncates silently at 72 bytes).

**Fix:** add `.max(72)` and consider a minimal common-password blocklist.

---

## Confirmed-good (no action needed)

- **Password reset:** 256-bit random token, SHA-256 stored, single-use, 30-min
  TTL, prior tokens invalidated, neutral response even on mail failure
  (`passwordReset.ts`, `forgot-password/route.ts`).
- **No SQL injection surface** — every query is Prisma query-builder;
  `search/route.ts` uses `contains` filters, not raw strings.
- **API RBAC is consistent:** all 31 admin route files check `role === "ADMIN"`;
  IDOR-sensitive routes verify `learnerId` / `tutorProfileId` ownership before
  acting, returning 404 rather than 403.
- **Registration cannot escalate role** — `type` is a Zod discriminated union
  (`LEARNER` | `TUTOR` only), mapped server-side in `registerAccount()`.
- **Secrets:** `.env*` is gitignored; no secrets committed.
- **No XSS sinks:** no `dangerouslySetInnerHTML` anywhere in `src/`.
- **Chatbot** is intent/keyword-based, not an LLM — no prompt-injection surface.

---

## Recommended next steps

1. Add rate limiting (Finding 1) — highest ROI.
2. Lock down or remove `/api/dev` before any non-local deploy (Finding 2).
3. Add `headers()` and fix `next.config` (Finding 4).
4. Neutralize the login error messages (Finding 3).
