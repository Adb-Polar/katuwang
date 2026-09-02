# Tutor Class Creation + Learner Enrollment

## Context

`prisma/schema.prisma` already models everything needed for tutor-created classes: `TutorClass` (subject, topic, schedule, duration, `maxStudents` — 1 for 1‑on‑1, higher for group) and `ClassEnrollment` (unique per class+learner). The tutor-side implementation is **already fully built** — Zod schema, GET/POST/PATCH/DELETE API routes, and a complete `ClassManagement` client component with a schedule form, conflict detection, and a class-details/roster modal — but it was never mounted into `src/app/tutor/page.tsx`, so it's dead code today. There is **no learner-facing equivalent at all**: `src/app/learner/page.tsx` is a static placeholder with a non-functional "Request Session" button.

This plan (1) wires the existing tutor feature in, and (2) builds the learner browse/enroll/unenroll flow from scratch, following the exact conventions already established by the tutor-side code (auth pattern, error shapes, daisyUI styling, fetch/state conventions) and by this session's Vitest test setup.

Confirmed scope with the user:
- Unenroll is in scope (learners can back out of a class they joined).
- Browse list is a simple full list, sorted by date — no subject filter in this pass.

## Part 1 — Wire the existing tutor-side feature

**`src/app/tutor/page.tsx`** (modify)
- Compute `const certifiedSubjects = appliedSubjects.filter((s) => s.certified).map((s) => s.subject);` right after the existing `appliedSubjects` fetch.
- Replace the static "Tutoring Matches" section (the "Matches are locked..." alert placeholder) with `<ClassManagement certifiedSubjects={certifiedSubjects} />`, imported from `@/components/tutor/ClassManagement`. No other changes — the component is complete and self-contained.

## Part 2 — Learner-side: API, component, page

### `src/app/api/classes/route.ts` (new) — GET

Mirrors `src/app/api/tutor/classes/route.ts`'s GET, same auth idiom, role check swapped to `STUDENT_LEARNER`:

```ts
const session = await getServerSession(authOptions);
if (!session || session.user.role !== "STUDENT_LEARNER") {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

const classes = await prisma.tutorClass.findMany({
  where: {
    OR: [
      { status: "SCHEDULED", scheduledAt: { gt: new Date() } },
      { enrollments: { some: { learnerId: session.user.id } } },
    ],
  },
  include: {
    tutor: { select: { id: true, anonymousId: true } },
    _count: { select: { enrollments: true } },
    enrollments: { where: { learnerId: session.user.id }, select: { id: true } },
  },
  orderBy: { scheduledAt: "asc" },
});
return NextResponse.json(classes);
```

Why the `OR`: the "Browse" tab needs future SCHEDULED classes; the "Enrolled" tab needs every class the learner has ever joined, including ones now COMPLETED/CANCELLED (their history) — a single query serves both, split client-side.

- `tutor: { select: { id, anonymousId } }` only (no name) — matches the anonymization already promised in the learner dashboard copy ("Surfacing only anonymized data to protect your identity").
- `_count.enrollments` gives seats-filled without pulling every roster row.
- `enrollments: { where: { learnerId: ... } }` is a 0-or-1-length array the client uses as `isEnrolled`.
- No pagination, no subject filter — matches confirmed scope and the tutor GET's own unpaginated style.
- 500 fallback on unexpected errors, same `console.error` + generic message pattern as every other route.

### `src/app/api/classes/[classId]/enroll/route.ts` (new) — POST + DELETE

No Zod validation file needed — both endpoints take no request body, only `classId` from the URL param; there's no shape to parse, only DB-backed business rules (existence, status, capacity, duplicate).

**POST (enroll)** — checks in order, matching the tutor POST route's "existence → business rules → capacity/conflict" ordering:
1. 401 if no session / wrong role.
2. 404 if class doesn't exist.
3. 400 `"This class is no longer accepting enrollments."` if `status !== "SCHEDULED"`.
4. 400 `"Cannot enroll in a class that has already started."` if `scheduledAt` is in the past.
5. 409 `"This class is already full."` if `_count.enrollments >= maxStudents`.
6. 409 `"You are already enrolled in this class."` if a `ClassEnrollment` for `(classId, learnerId)` already exists (checked explicitly — not left to the DB unique-constraint error — so the message stays friendly).
7. Otherwise `prisma.classEnrollment.create({ data: { classId, learnerId: session.user.id } })`, return 201.

**DELETE (unenroll)**:
1. 401 if no session / wrong role.
2. 404 if class doesn't exist.
3. 404 `"You are not enrolled in this class."` if no matching enrollment.
4. 400 `"Cannot unenroll from a class that is already completed or cancelled."` if `status !== "SCHEDULED"` (enrollment history is preserved once a class has run or been cancelled — mirrors the tutor side never deleting classes that have enrollments).
5. Otherwise `prisma.classEnrollment.delete({ where: { id: existing.id } })`, return 200.
   - No "already started" time check on unenroll (unlike enroll) — a learner can drop anytime before the class is marked COMPLETED/CANCELLED.

Both handlers use the Prisma compound-unique lookup `where: { classId_learnerId: { classId, learnerId: session.user.id } }` (the auto-generated key name for `@@unique([classId, learnerId])`).

### `src/components/learner/ClassBrowser.tsx` (new client component)

Self-fetching (`GET /api/classes` on mount), mirrors `ClassManagement.tsx` conventions exactly: same `"use client"` + local `useState` shape, same card grid (`grid sm:grid-cols-2 gap-4`), same badge/alert/modal/loading-spinner markup, `lucide-react` icons.

- Two tabs via the same `tabs tabs-lifted` pattern as `ClassManagement`'s Active/History: **"Browse"** and **"My Classes"**.
- `browsableClasses = classes.filter(c => c.status === "SCHEDULED" && new Date(c.scheduledAt) > now && c.enrollments.length === 0)` — shows *all* upcoming classes the learner hasn't joined, **including full ones** (consistent with `ClassManagement`'s existing convention of showing a `badge-warning "FULL"` rather than hiding full classes). The Enroll button/action is disabled with a "Full" state when `_count.enrollments >= maxStudents`.
- `myClasses = classes.filter(c => c.enrollments.length > 0)` — the learner's full enrollment history (any status), ordered by `scheduledAt`.
- Details modal (`modal modal-open` / `modal-box max-w-lg`, same info-grid layout as `ClassManagement`'s): date/time, duration, meeting link (shown whenever present, no gating on enrollment state), tutor's `anonymousId`, description. Footer action is **Enroll** (Browse tab, disabled while full or `actionLoading`) or **Unenroll** (My Classes tab, only shown/enabled while `status === "SCHEDULED"`, with a `confirm()` guard matching `ClassManagement.handleUpdateStatus`'s pattern).
- `handleEnroll`/`handleUnenroll`: `fetch` → `res.json()` → `if (!res.ok) throw new Error(data.error)` → success banner + `fetchClasses()` refresh, same try/catch/finally/`alert(err.message)` shape as `ClassManagement.handleUpdateStatus`/`handleDeleteClass`.

### `src/app/learner/page.tsx` (modify)

- Import and mount `<ClassBrowser />` (from `@/components/learner/ClassBrowser` — no barrel `index.ts` exists in `src/components/`, matching how `ClassManagement` is imported directly in Part 1) in place of both the "Request a Tutoring Session" card and the "Upcoming Sessions" placeholder card — its two tabs already cover both jobs those stubs were standing in for.
- No new server-side Prisma query needed for this — `ClassBrowser` self-fetches client-side, keeping the page a thin server shell (same division of labor as `tutor/page.tsx` + `ClassManagement`).
- Leave the sidebar "Account Info" card untouched.

## Edge cases carried over from the tutor side for consistency

- **Capacity**: enforced from both directions — tutor's PATCH blocks shrinking `maxStudents` below current enrollment count; learner's POST enroll blocks joining once `_count.enrollments >= maxStudents`.
- **Past-date guard**: tutor's POST blocks creating classes in the past; learner's POST enroll blocks joining a class whose start time has already passed.
- **No cross-class overlap check for learners** — out of scope; only the tutor's own schedule is conflict-checked (unchanged, pre-existing behavior).

## Tests (Vitest, mirroring `src/app/api/register/__tests__/route.test.ts`'s structural conventions)

`src/app/api/register/__tests__/route.test.ts` mocks `@/lib/prisma` via `vi.hoisted` but does **not** mock `getServerSession` (register is a public route) — no existing test in the repo mocks `next-auth`'s `getServerSession`, so these are the first to need it. Use this explicit pattern, keeping everything else from the register test (explicit `vitest` imports, `vi.hoisted`, `beforeEach(() => vi.clearAllMocks())`, route import placed after all `vi.mock()` calls, a `makeRequest()` helper building a `NextRequest`):

```ts
const { getServerSessionMock, ...prismaMocks } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  // ...prisma method mocks specific to the route under test
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { /* ...only the methods the route actually uses... */ },
}));
```

- `src/app/api/classes/__tests__/route.test.ts` — mock `@/lib/prisma` (`tutorClass.findMany`) and `getServerSession` per the pattern above. Cases: 401 unauthenticated/wrong-role, 200 with the `OR` where-clause shape asserted, 500 on Prisma throw.
- `src/app/api/classes/[classId]/enroll/__tests__/route.test.ts` — mock `prisma.tutorClass.findUnique`, `prisma.classEnrollment.findUnique/create/delete`, and `getServerSession` per the pattern above. POST cases: 401, 404 not found, 400 not scheduled, 400 already started, 409 full, 409 duplicate, 201 success. DELETE cases: 401, 404 not found, 404 not enrolled, 400 not scheduled, 200 success (assert `delete` called with `{ where: { id: existing.id } }`).

Match the generic 500 fallback wording used by the sibling `tutor/classes` routes exactly: `"An unexpected error occurred."` (not CLAUDE.md's "...Please try again." variant), so the new routes stay consistent with the ones they mirror.

## Verification

1. `pnpm test` — new tests plus the existing 24 pass.
2. `pnpm exec tsc --noEmit` — no type errors.
3. Manual: `pnpm dev`, log in as a certified tutor → confirm "Schedule Class" flow works on `/tutor` (create, view roster, cancel/complete/delete). Log in as a learner → confirm `/learner` shows upcoming classes, enroll works (seat count updates, class moves to "My Classes"), unenroll works, and a full class shows disabled/"Full" state correctly.

## Files touched

- `src/app/tutor/page.tsx` (modify)
- `src/app/learner/page.tsx` (modify)
- `src/app/api/classes/route.ts` (new)
- `src/app/api/classes/[classId]/enroll/route.ts` (new)
- `src/components/learner/ClassBrowser.tsx` (new)
- `src/app/api/classes/__tests__/route.test.ts` (new)
- `src/app/api/classes/[classId]/enroll/__tests__/route.test.ts` (new)

Resume this session with:
claude --resume 95f6a7d6-08a6-4e6b-aaab-243f9b13bc37
