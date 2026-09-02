# Implementation Plans

Per `CLAUDE.md`, every plan lives here as `docs/plans/{plan-name}.md`.

| Plan | Scope | Status |
|---|---|---|
| [ui-redesign-tailwind-port.md](./ui-redesign-tailwind-port.md) | Port the `design/` direction-E card system into the live Next.js + Tailwind 4 + DaisyUI app, system-wide (markup/CSS only) | **Done** — phases 1–6 landed 2026-09-01; `tsc` / `lint` / `build` pass. Non-blocking follow-ups listed in the plan (auth-form DaisyUI-4 classes, `font-serif` sweep, deep forms + charts not individually restyled). Not committed. |
| [todo-cleanup-sprint.md](./todo-cleanup-sprint.md) | Reorganizes `../TODO.txt` (~47 UI/UX + feature gaps) into 13 PR-sized chunks. 1–9 UI-only; 10–13 each need a Prisma migration | **Done** — chunks 1–13 implemented; migrations `topic_certification_rejected` (REJECTED state), `..._ch9_11` (drop `Availability`, class `code`), `password_recovery`, `registration_approval` applied. Follow-up "Aug 30" batch (chunks A–E) also done. ~313 tests green. Manual checklist: [todo-cleanup-sprint.totest.txt](./todo-cleanup-sprint.totest.txt). |
| [topic-requests-v2.md](./topic-requests-v2.md) | Topic Requests lifecycle overhaul: public vs directed requests, tutor accept-to-class, DB-backed notification system, admin moderation | **Not started** — needs a Prisma migration (`topic_requests_directed_and_notifications`) and explicit DB-change confirmation before starting. |

## Related reference docs (not plans)

- [`../erd.md`](../erd.md) — auto-generated Prisma ERD for the current schema
- [`../roles/`](../roles/) — per-role feature + API reference (`LEARNER`, `TUTOR`, `ADMIN`)
- [`../reference/auth-implementation.md`](../reference/auth-implementation.md) — registration & login build guide (schema examples predate later migrations; architecture still current)
- [`../reference/theme.md`](../reference/theme.md) — DaisyUI OKLCH theme tokens
