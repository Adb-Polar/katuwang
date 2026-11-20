# Load Balancer Plan — Oracle VM + nginx

## Context
Katuwang runs today as one `next start` process (per `docs/plans/deployment.md`, Oracle VM option §3). The goal is to run **N app instances behind nginx** for availability (zero-downtime restarts, crash isolation) and capacity. Exploration found that the app is mostly ready for this: it uses JWT sessions so it doesn't need sticky sessions, it writes nothing to the filesystem, and it has no cron jobs or websockets. A few things block it:
- `src/lib/rateLimit.ts:18` keeps rate-limit counts in an in-memory `Map`, so the effective limit becomes N × the configured limit.
- `clientIp()` (`rateLimit.ts:78`) trusts the client-supplied `x-forwarded-for` header, which a client can spoof.
- There is no health-check route.
- The Prisma pool is unbounded per instance (`src/lib/prisma.ts`), so N instances could exhaust TiDB connections.
- Email links fall back to `req.nextUrl.origin`, which would be the internal upstream address unless `NEXTAUTH_URL` is set.
- The subject cache (`src/lib/subjects.ts:20`) only invalidates on one instance. A 60s TTL is acceptable; just document it.

Decisions: nginx upstream on a single Oracle VM; the shared rate-limit store is a DB table (no Redis).

## Architecture
```
Internet ─TLS─► nginx :443 (certbot)
                 ├─ upstream katuwang { least_conn; 127.0.0.1:3001; 127.0.0.1:3002; keepalive 32; }
                 │     max_fails=3 fail_timeout=10s, proxy_next_upstream error timeout http_502 http_503 (idempotent only)
                 └─ /_next/static/* → cached (immutable, 1y)
pm2 cluster/fork ×2 (`node .next/standalone/server.js`, PORT=3001/3002)
        └─► TiDB/MariaDB (shared; holds RateLimitBucket)
```
- Start with 2 instances on the free-tier Ampere VM. You can add more ports later.
- Rolling deploy: build, run `prisma migrate deploy` once, then `pm2 reload` restarts one instance at a time. nginx routes around the instance that is down.

## Implementation steps

### 1. Shared rate limiter (DB-backed) — needs DB-change confirmation
- `prisma/schema.prisma`: add `model RateLimitBucket { key String @id @db.VarChar(191); count Int; resetAt DateTime @db.DateTime(3); @@index([resetAt]) }`. This meets 3NF: the key alone determines every column.
- Migration: `npx prisma migrate dev --name rate_limit_bucket`.
- Rewrite `rateLimit()` as `async` with one atomic statement through `prisma.$executeRaw`:
  `INSERT … VALUES (key,1,now+window) ON DUPLICATE KEY UPDATE count = IF(resetAt <= NOW(3), 1, count+1), resetAt = IF(resetAt <= NOW(3), VALUES(resetAt), resetAt)`, then read the row back to compute `ok` and `retryAfter`.
- Replace the in-memory `sweep()` with a probabilistic cleanup: on about 1% of calls, run `deleteMany({ where: { resetAt: { lt: now } } })`.
- **Fail open:** on a DB error, log it and return `{ ok: true }` so auth isn't blocked by the limiter.
- Keep the `rateLimitEnabled()`, `tooManyRequests()` and `RateLimitResult` signatures unchanged.
- Update the 7 call sites to `await rateLimit(...)`: `api/auth/{forgot-password,reset-password,resend-verification,verify-email}`, `api/register`, `api/search`, `api/chatbot`.

### 2. Trusted client IP
- In `clientIp()`, prefer `x-real-ip`, which nginx sets to `$remote_addr`. Use the **last** `x-forwarded-for` hop only as a fallback.
- nginx sets `proxy_set_header X-Real-IP $remote_addr;` and `X-Forwarded-For $remote_addr` (overwrite, don't append), so clients can't spoof the IP.

### 3. Health check
- New `src/app/api/health/route.ts`: a public `GET` that runs `prisma.$queryRaw\`SELECT 1\`` and returns `200 {status:"ok"}`, or `503 {status:"db_unavailable"}`. Add `export const dynamic = "force-dynamic"`.
- `src/proxy.ts`: make sure `/api/health` is not behind auth.

### 4. Build & runtime config
- `next.config.ts`: `output: "standalone"` (already listed in deployment.md §6).
- `src/lib/prisma.ts`: pass a pool limit from env, e.g. `connectionLimit: Number(process.env.DB_POOL_SIZE ?? 5)`. Budget: instances × pool must stay below the TiDB connection limit.
- Make `NEXTAUTH_URL` **required** in production. Keep the fallback in dev only. Reuse one helper in the 3 email-link routes (`forgot-password`, `resend-verification`, `register`) instead of duplicating the logic.
- `NEXTAUTH_SECRET` must be identical on all instances (document it).

### 5. Infra files (new, committed under `deploy/`)
- `deploy/nginx/katuwang.conf`: upstream, TLS, gzip, static caching, proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-Proto`), `client_max_body_size 1m`, 60s timeouts, `proxy_next_upstream` limited to GET/HEAD (`non_idempotent` off).
- `deploy/ecosystem.config.cjs`: pm2 config with 2 apps (ports 3001/3002), `max_memory_restart`, `wait_ready`/`listen_timeout` for graceful reload.
- `deploy/deploy.sh`: `pnpm install --frozen-lockfile && pnpm build && npx prisma migrate deploy && pm2 reload ecosystem.config.cjs`.
- Optional: a cron curl to `/api/health` for uptime alerts.

### 6. Docs (per CLAUDE.md)
- `docs/plans/load-balancer.md`: this plan, plus a link from `docs/plans/README.md`. Also update `docs/plans/deployment.md` §3 and §5 (new env vars `DB_POOL_SIZE`; `NEXTAUTH_URL` now required) and §6.
- `Changes.md`: add an entry. `docs/reference/decisions.md`: record the horizontal-scaling decision and the DB-backed limiter. `docs/backlog/TOTEST.txt`: add verification items (below).
- Fix the stale comment at the top of `rateLimit.ts`.

## Tests
- `src/lib/__tests__/rateLimit.test.ts`: mock `prisma.$executeRaw`/`findUnique`. Cover: first hit ok, over limit returns 429 with retryAfter, window reset, fail-open on DB error, and `clientIp` preferring `x-real-ip` and using the last XFF hop.
- `src/app/api/health/__tests__/route.test.ts`: 200 when the DB is ok, 503 on a DB throw.
- Existing route tests: update mocks for the async `rateLimit`. Run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.

## Verification (TOTEST.txt)
- [ ] Locally: run 2 instances on 3001/3002 with nginx in Docker in front. Hammer `/api/auth/forgot-password`; the 429 should trigger at the configured limit **total**, not per instance.
- [ ] Log in, then kill one instance mid-session. The session survives (JWT) and requests go to the other instance.
- [ ] `pm2 reload` during a load test (`ab`/`autocannon`) produces no 5xx.
- [ ] A spoofed `X-Forwarded-For` header does not change the rate-limit key.
- [ ] The password-reset email link uses the public `NEXTAUTH_URL` host, not 127.0.0.1.
- [ ] `/api/health` returns 503 when the DB is unreachable, and nginx marks the instance down.
- [ ] An admin subject edit appears on the other instance within 60s (accepted staleness).
