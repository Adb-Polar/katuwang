# Implementation Plans

Per `CLAUDE.md`, every plan lives here as `docs/plans/{plan-name}.md`.

## Active

| Plan | Scope | Status |
|---|---|---|
| [assessments.md](./assessments.md) | Merged assessments plan: admin question bank + auto-graded topic quizzes, per-topic config → one global config, and learner per-session pre/post-tests (`SessionTest` per `ClassSession`) | **Mostly shipped** — Changes.md Parts 29–33. Question bank, global config, and per-session pre/post tests all implemented and `db push`ed; the `pre-test-post-test` section is retained as history (also in `../archive/plans/`). Not committed. |
| [deployment.md](./deployment.md) | Free-tier deployment: Oracle Cloud (always-free ARM VM) **or** Render, TiDB Cloud Serverless for MySQL, `.tech` / `.me` domain via the GitHub Student Pack | **Planning** — Changes.md Part 34. Hosting options + setup, DB bootstrap via `prisma migrate deploy`, env-var reference, pre-deploy code changes, `main → production` branching, verification checklist. Not executed. |
| [fixes.md](./fixes.md) | Status audit of the ~55-item `../archive/plans/fixes.txt` backlog (Sept 5–6 review + Additions + Redesign wishlist) and a 6-phase implementation sequence | **In progress** — Changes.md Part 36+. Sept 5/6 items reconciled as shipped (Parts 29–35); remaining work grouped Phase 1 (bugs/guardrails) → Phase 6 (appeal-notify schema change, needs DB confirmation). One commit per phase. |
| [notification-system-expansion.md](./notification-system-expansion.md) | Broaden the DB-backed notification system beyond topic requests | See the plan for current status. |
| [subject-topic-management.md](./subject-topic-management.md) | Admin-managed subject/topic catalog | See the plan for current status. |
| [dev-data-factory.md](./dev-data-factory.md) | Dev-only data generation for local testing | See the plan for current status. |

## Archived (completed / superseded)

Moved to [`../archive/plans/`](../archive/plans/):

| Plan | Why archived |
|---|---|
| `ui-redesign-tailwind-port.md` | **Done** — direction-E card system ported app-wide, phases 1–6 landed 2026-09-01. |
| `todo-cleanup-sprint.md` (+ `.totest.txt`) | **Done** — chunks 1–13 + "Aug 30" batch A–E shipped; four migrations applied. |
| `topic-requests-v2.md` | **Done** — Topic Requests lifecycle overhaul shipped 2026-09-03. |
| `help-and-faq-pages.md` | **Done** — Changes.md Part 26, role-scoped in-app Help Center. |
| `pre-test-post-test-plan.md` | **Done** — Changes.md Part 29; also folded into [`assessments.md`](./assessments.md). |
| `sept-5-fixes.md`, `fixes.txt`, `admin-portal-fixes.txt`, `leaner-portal-fixes.txt` | One-off / raw backlog fragments now tracked through [`fixes.md`](./fixes.md). |

## Related reference docs (not plans)

- [`../reference/erd.md`](../reference/erd.md) — auto-generated Prisma ERD for the current schema
- [`../roles/`](../roles/) — per-role feature + API reference (`LEARNER`, `TUTOR`, `ADMIN`)
- [`../reference/auth-implementation.md`](../reference/auth-implementation.md) — registration & login build guide (schema examples predate later migrations; architecture still current)
- [`../reference/theme.md`](../reference/theme.md) — DaisyUI OKLCH theme tokens
