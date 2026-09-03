# Notification System — Expansion & Unread Dot

## Context

Katuwang already has a working DB-backed notification system (added in commit `26cc175` "Topic Requests v2"):
`Notification` Prisma model, `notify()/notifyMany()` helpers, `GET /api/notifications`,
`POST /api/notifications/read`, a `NotificationList` component, `/tutor/notifications` and
`/learner/notifications` pages, and a numeric unread badge on the sidebar "Notifications" nav item
for tutor & learner.

Three gaps make it feel incomplete:

1. **No "new entry" indicator where users actually look.** The topbar bell icon in every portal is a
   dead button. The user wants a red **dot** on it when there is unread activity.
2. **Admin portal has no notification surface at all** — no nav item, no page, no unread count.
3. **Notifications only fire for topic-request events.** Registration approval, certification
   decisions, question-request outcomes, and class enrolment / lifecycle changes produce nothing.

This plan wires the bell into a dropdown panel with a live dot, brings Admin to parity, expands
event coverage across modules, and switches the notifications page from "mark everything read on
open" to per-notification read-on-click.

**No schema change.** `Notification.type` is a free-text `String` (valid values live in a `//`
comment). Every new type is additive — no migration, no `db push`, no DB confirmation needed.

## Decisions (confirmed with user)

- Scope: expand event coverage + bell dropdown + dot + admin parity.
- Dot: **topbar bell only** (not sidebar items, not mobile drawer).
- Keep the pre-existing **numeric sidebar badge** on the "Notifications" nav item on all three
  portals (admin gets it too). Dot and badge show the same count via different affordances.
- Unread clears **per-notification on click**; keep a "Mark all read" action; stop auto-marking
  everything read on page mount.
- **No polling.** Dot/badge refresh on navigation / `router.refresh()` — same model as today.
- `REGISTRATION_REJECTED` is **not delivered** (recipient is set `BANNED` in the same transaction
  and can never log in). Add a line to `docs/TODO.txt` for a future appeals/return path.
- Class cancelled/completed notifications **fan out to every enrolled learner**, de-duping learners
  already covered by the topic-request path.
- Tutor-facing enrolment messages **name the learner by `STU-xxxx`** anonymous ID.

## Changes

### 1. Shared notification metadata — new `src/components/notifications/notificationMeta.tsx`

Extract from `NotificationList.tsx` (so the bell and the list share them):
`NotificationRow` interface, `relativeTime(iso)`, `TYPE_ICON` map, `FALLBACK_ICON`.
Add icon entries for all new types (§3). Keep this file client-safe (no server imports).

### 2. `src/components/notifications/NotificationList.tsx`

- Import `NotificationRow`, `relativeTime`, `TYPE_ICON`, `FALLBACK_ICON` from `./notificationMeta`;
  delete the local copies.
- **Remove the auto-mark-all-read-on-mount** IIFE inside the mount `useEffect` (keep the `GET` fetch).
- Add `markOneRead(id)`: optimistic local `readAt` set → `POST /api/notifications/read {ids:[id]}`
  → `router.refresh()`.
- Replace the per-row `<Link>` with a single `<button type="button">` wrapping the existing row
  `content`; `onClick` → `markOneRead(n.id)` then `if (n.link) router.push(n.link)`. Rows without a
  link still mark read on click. Apply the hover style to all rows.
- Keep the "Mark all read" button + `markAllRead` handler unchanged.

### 3. `src/lib/notifications.ts` — widen `NotificationType`

Append: `REGISTRATION_APPROVED`, `REGISTRATION_REJECTED` (reserved, unwired),
`CERTIFICATION_CERTIFIED`, `CERTIFICATION_REJECTED`,
`QUESTION_REQUEST_RESOLVED`, `QUESTION_REQUEST_DISMISSED`,
`CLASS_ENROLLMENT_NEW`, `CLASS_ENROLLMENT_DROPPED`,
`CLASS_CANCELLED`, `CLASS_COMPLETED`.
Helper signatures unchanged. Refresh the `//` comment in `prisma/schema.prisma` (~L463) — comment only.

### 4. `GET /api/notifications` — optional `?take` param

`src/app/api/notifications/route.ts`: change to `GET(req: Request)`, parse `?take`, clamp to
`1..MAX_NOTIFICATIONS` (default & cap stay 50). `unreadCount` (`count()`) unaffected.
Bell fetches `?take=8`; `NotificationList` keeps the default. `POST /api/notifications/read` needs
**no change** (per-id `{ids:[...]}` already supported).

### 5. Trigger sites (each wired inside the route's existing `$transaction`; add `import { notify }` / `notifyMany`)

| Route file | Event → type | Recipient | Link |
|---|---|---|---|
| `src/app/api/admin/registrations/[userId]/route.ts` PATCH | approve → `REGISTRATION_APPROVED` (decline → **nothing**) | `userId` param | `/dashboard` |
| `src/app/api/admin/certifications/[certificationId]/route.ts` PATCH | both branches → `CERTIFICATION_CERTIFIED` / `CERTIFICATION_REJECTED` (append note if present) | `certification.tutorProfile.userId` | `/tutor/assessments` |
| `src/app/api/admin/question-requests/[requestId]/route.ts` PATCH | `RESOLVED` → `QUESTION_REQUEST_RESOLVED`, else `QUESTION_REQUEST_DISMISSED` | `existing.tutorProfile.userId` | `/tutor/assessments` |
| `src/app/api/classes/[classId]/enroll/route.ts` POST / DELETE | `CLASS_ENROLLMENT_NEW` / `CLASS_ENROLLMENT_DROPPED`, message names `session.user.anonymousId` | class `tutorProfile.userId` | `/tutor/classes/{classId}` |
| `src/app/api/tutor/classes/[classId]/route.ts` PATCH | `COMPLETED` → `CLASS_COMPLETED`, `CANCELLED` → `CLASS_CANCELLED`; `notifyMany` fan-out to all enrolled learners **minus** `linkedRequests` learnerIds | enrolled learners | `/learner/my-classes` |
| `src/app/api/admin/classes/[classId]/route.ts` PATCH | `BANNED` → `CLASS_CANCELLED`; same de-duped fan-out | enrolled learners | `/learner/my-classes` |

Details for the two class routes: after the existing `for (const r of linkedRequests)` loop, build
`const linkedIds = new Set(linkedRequests.map(r => r.learnerId))`, load
`tx.classEnrollment.findMany({ where: { classId }, select: { learnerId: true } })`, filter out
`linkedIds`, `notifyMany(tx, targets, ...)` (no-ops on empty).

For `certifications` and `question-requests`: widen the pre-transaction `findUnique` `select` to
include `subject`, `topic`, and `tutorProfile: { select: { userId: true } }`.

For `classes/[classId]/enroll`: **neither POST nor DELETE uses `$transaction` today** — wrap the
existing paired writes (`classEnrollment.create/delete` + `topicRequest.updateMany`) **plus** the new
`notify` in `prisma.$transaction`. Keep capacity/eligibility checks outside. Widen the class
`findUnique` to include `code`, `subject`, `status`, `tutorProfile: { select: { userId: true } }`.

### 6. `NotificationBell` — new `src/components/notifications/NotificationBell.tsx` (`"use client"`)

Props: `{ unreadCount: number; notificationsHref: string }`.
- Renders the bell `<button className="kt-icon-btn">` with a red dot span when `unreadCount > 0`:
  `absolute right-1 top-1 h-2 w-2 rounded-full bg-error ring-2 ring-base-100` (`aria-hidden`).
- Click toggles a dropdown panel (`absolute right-0 top-full mt-2 w-80` card, `z-30`, scrollable).
- On open: `fetch("/api/notifications?take=8")` → list rows (icon, message, `relativeTime`, unread
  tint/dot). Spinner on first load; empty state.
- Row click: optimistic `readAt` set → `POST /api/notifications/read {ids:[id]}` → `router.refresh()`
  → close panel → `if (link) router.push(link)`.
- Header "Mark all read" (when `unreadCount > 0`) → `POST .../read {}` → `router.refresh()`.
- Footer "View all" → `<Link href={notificationsHref}>` (closes panel).
- Closes on outside `mousedown` (ref check), `Escape`, and route change (mirror the
  adjust-state-during-render pattern already in `PortalLayout`).
- a11y: `aria-haspopup="menu"`, `aria-expanded`, `aria-label` includes the unread count; panel
  `role="menu"`, rows are `role="menuitem"` `<button>`s.
- Imports icons/format from `./notificationMeta`.

### 7. `src/components/layout/PortalLayout.tsx`

- Add props `unreadCount?: number` (default 0) and `notificationsHref?: string` (default `/dashboard`).
- Replace the dead `<button aria-label="Notifications">` in the topbar with
  `<NotificationBell unreadCount={unreadCount} notificationsHref={notificationsHref} />`.
- Keep the existing `NavItem.badge` rendering as-is (numeric sidebar badge stays).

### 8. `src/app/globals.css`

Add `position: relative;` to the `.kt-icon-btn` rule so the dot anchors to the bell button.

### 9. Layout wiring

- `src/app/tutor/layout.tsx`, `src/app/learner/layout.tsx`: already compute `unreadCount`; just pass
  `unreadCount={unreadCount}` and `notificationsHref="/tutor/notifications"` (resp. `/learner/...`)
  into `<PortalLayout>`. Keep `badge: unreadCount` on their Notifications `NavItem`.
- `src/app/admin/layout.tsx`: add `import { prisma }` and `Bell`; inside the async component compute
  `unreadCount = await prisma.notification.count({ where: { userId: session.user.id, readAt: null } })`;
  build `navItems = [...ADMIN_NAV_ITEMS, { label: "Notifications", href: "/admin/notifications",
  icon: <Bell className="w-4 h-4" />, group: "Review", badge: unreadCount }]`; pass `unreadCount` +
  `notificationsHref="/admin/notifications"` into `<PortalLayout>`.
- New file `src/app/admin/notifications/page.tsx` — mirror `tutor/notifications/page.tsx`
  (`PageHeader` eyebrow "Admin Portal" + `<NotificationList />`).

### 10. Tests (`*.test.ts`, Vitest, `vi.hoisted` + mocked `next-auth` / `@/lib/prisma`)

Update these existing route test files — add `notification: { create, createMany }` to the
`$transaction` tx mock, widen `findUnique` mock return shapes, add assertions:

- `src/app/api/notifications/__tests__/route.test.ts` — `GET` now takes `req`; add `?take=8` →
  `findMany` called with `take: 8`; `?take=999` clamps to 50.
- `src/app/api/admin/registrations/[userId]/__tests__/route.test.ts` — approve → `notification.create`
  with `type: "REGISTRATION_APPROVED"`, `userId` = param; decline → not called.
- `src/app/api/admin/certifications/[certificationId]/__tests__/route.test.ts` — certified / rejected
  → `notification.create` with the matching type and `userId` from `tutorProfile.userId`.
- `src/app/api/admin/question-requests/[requestId]/__tests__/route.test.ts` — resolved vs dismissed
  → matching type.
- `src/app/api/classes/[classId]/enroll/__tests__/route.test.ts` — add `$transaction` to the prisma
  mock; session mock gains `anonymousId`; enrol → `CLASS_ENROLLMENT_NEW`, unenrol →
  `CLASS_ENROLLMENT_DROPPED`, `userId` = class tutor.
- `src/app/api/tutor/classes/[classId]/__tests__/route.test.ts` and
  `src/app/api/admin/classes/[classId]/__tests__/route.test.ts` — add `classEnrollment.findMany` +
  `notification.createMany` to the tx mock; assert `createMany` with `CLASS_COMPLETED` /
  `CLASS_CANCELLED` for non-request-linked learners and that request-linked learners are excluded.

`NotificationBell.tsx` and `NotificationList.tsx` changes have **no test harness** (repo has zero
`.tsx` tests, no testing-library) → covered by `docs/TOTEST.txt` instead.

Reference to reuse: `notify` / `notifyMany` (`src/lib/notifications.ts`), existing trigger-test
patterns in `src/app/api/tutor/classes/[classId]/__tests__/route.test.ts`.

### 11. Docs (per `CLAUDE.md` rules — no commits)

- Copy this plan to `docs/plans/notification-system-expansion.md`.
- `Changes.md` — new `## Part N` entry + Changes Overview row. Note: no schema change, not committed.
- `docs/TODO.txt` — add: "REGISTRATION_REJECTED — deliver a rejection/appeal message via a path a
  BANNED applicant can actually reach (blocked-login screen or email)."
- `docs/TOTEST.txt` — add `[ ]` lines: bell opens/closes (click, outside-click, Escape, navigation)
  in all three portals; dot appears when unread > 0 and clears after read; dropdown row with link →
  marks read + navigates, without link → marks read only; notifications page no longer bulk-marks on
  open, per-row read works, "Mark all read" works, sidebar badge + bell dot both update; admin
  `/admin/notifications` page + sidebar item under "Review"; end-to-end per new event (registration
  approve, cert certified/rejected, question-request resolved/dismissed, class enrol/unenrol, class
  cancel/complete fan-out with no duplicate for request-linked learners, admin class ban).
- `docs/feature-checklist.md` — update the Notifications row (event coverage, bell dropdown + dot,
  admin parity).
- `docs/reference/decisions.md` — short note: session reminders and assessment-unlocked
  notifications are out of scope (need cron/fan-out infra the repo doesn't have);
  `REGISTRATION_REJECTED` is not delivered (BANNED recipient).
- `docs/roles/{LEARNER,TUTOR,ADMIN}.md` — list the new notification types each role can receive.

## Step order

1. `notificationMeta.tsx` (extract + new icons)
2. `NotificationList.tsx` (import shared, drop auto-mark-all, per-row read)
3. `src/lib/notifications.ts` union + schema comment
4. `GET /api/notifications` `?take`
5. Trigger sites 5a–5f (independent, any order)
6. `NotificationBell.tsx`
7. `globals.css` `.kt-icon-btn { position: relative }`
8. `PortalLayout.tsx` props + render bell
9. tutor + learner layouts pass props
10. admin layout (count + nav item + props) + `admin/notifications/page.tsx`
11. Tests — update the 7 files; run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`
12. Docs

## Verification

- `pnpm exec tsc --noEmit` clean; `pnpm lint` clean; `pnpm test` green (current 394 + new cases).
- `pnpm dev`, then for each portal (learner / tutor / admin):
  - Topbar bell shows a red dot when there are unread notifications; clicking opens the dropdown;
    Escape / outside-click / navigating closes it.
  - Click a dropdown row → it marks read (dot count drops), panel closes, navigates if it has a link.
  - "Mark all read" in the panel clears the dot; "View all" opens the notifications page.
  - Notifications page: opening it does **not** clear everything; clicking one row clears just it;
    sidebar numeric badge and bell dot both update without a manual reload.
  - `/admin/notifications` renders and "Notifications" appears in the admin sidebar under "Review".
- Event smoke tests (seeded data + two browser sessions):
  - Admin approves a pending registration → applicant sees `REGISTRATION_APPROVED` after login.
  - Admin certifies / rejects a topic certification → tutor notified, link lands on `/tutor/assessments`.
  - Admin resolves / dismisses a question request → tutor notified.
  - Learner enrols in a class → that class's tutor sees `CLASS_ENROLLMENT_NEW` with the learner's
    `STU-xxxx`; unenrol → `CLASS_ENROLLMENT_DROPPED`.
  - Tutor completes / cancels a class → every enrolled learner is notified once; a learner who
    enrolled via a topic request gets only the existing `TOPIC_REQUEST_*` notification, not a duplicate.
  - Admin bans a class → enrolled learners see `CLASS_CANCELLED`.
