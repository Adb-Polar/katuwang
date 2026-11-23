# Request Queue (backend load shedding)

Status: **Shipped** — Changes.md Part 94. Not committed.

## Why

A burst of requests must wait its turn instead of taking the server down. The
app is one Node process (Render free / Oracle VM, see `deployment.md`), so the
real crash risks are:

1. **bcryptjs on the main thread** — every sign-in / registration / password
   change costs ~0.3 s of CPU (far more on a shared CPU). A burst freezes the
   event loop for every other request.
2. **Report generation** — PDF/CSV builds are CPU plus several large queries.
3. **List/search endpoints** — the highest-volume reads; unchecked they can
   hold every DB pool connection.

## Approaches considered

| Approach | Verdict |
|---|---|
| **In-app bounded queue** (semaphore + FIFO wait line + timeout) | **Chosen.** No new infrastructure, works on both hosts, covers sign-in (which is not a route we own — it runs inside NextAuth). |
| nginx `limit_conn` / `limit_req` | Good, but only available on the Oracle VM, not Render. Can be added later in front. |
| Redis + BullMQ job queue | Needs Redis and turns every endpoint into submit-then-poll. Overkill for one instance. |
| Wrap all 107 routes | Rejected: Next has no shared entry point for route handlers (`proxy.ts` returns before the handler runs), and ordinary routes are already back-pressured by the MariaDB pool (10 connections, 10 s acquire timeout). |

## Design

`src/lib/requestQueue.ts` — `BoundedQueue`: at most `concurrency` tasks run,
up to `maxQueued` wait in FIFO order, a waiter is rejected after `timeoutMs`.
Overflow and timeouts throw `QueueOverloadedError`, returned to the client as
**`503` + `Retry-After`** with the standard `{ error }` body. The bound is the
point — an unbounded queue only moves the memory blow-up.

| Lane | Concurrency | Wait line | Wait timeout | Used by |
|---|---|---|---|---|
| `password` | 2 | 40 | 15 s | every bcrypt hash/compare via `src/lib/password.ts` (sign-in, register, reset/change password, recovery email, account delete, admin invite) |
| `report` | 2 | 10 | 20 s | `GET /api/{learner,tutor,admin}/report` |
| `read` | 8 | 100 | 10 s | `GET /api/search`, `GET /api/classes`, `GET /api/learner/tutors`, `POST /api/chatbot` |

- `runQueued(lane, task)` queues one operation; `withQueue(lane, handler)`
  queues a whole route handler; `busyResponse(error)` converts a rejection
  thrown deeper in the stack inside a route's `catch`.
- Sign-in: a full lane surfaces as the NextAuth error "The server is busy
  right now. Please try again in a moment."
- Tuning: `QUEUE_<LANE>_CONCURRENCY`, `QUEUE_<LANE>_MAX_QUEUED`,
  `QUEUE_<LANE>_TIMEOUT_MS`; `QUEUE_DISABLED=1` bypasses all lanes.
- Observability: `GET /api/health` includes `queues` (running / queued /
  rejected per lane).

## Limits

- Per-process, like `rateLimit.ts`. With several instances each has its own
  lanes; move to Redis only if the app is ever horizontally scaled.
- Routes outside the three lanes rely on the DB pool for back-pressure; a pool
  acquire timeout there is still a `500`.
- The per-user/IP rate limiter still runs first; the queue caps total work.

## Verification

- `src/lib/__tests__/requestQueue.test.ts`, `password.test.ts`.
- Burst simulation, 100 simultaneous password checks: 41 served, 59 shed with
  a retry hint, event-loop lag stayed under 200 ms.
