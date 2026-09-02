# Chunk 10 — Rejected assessment state

Part of `docs/plan/todo-cleanup-sprint.md`. **Schema change — needs DB-change confirmation before `prisma migrate`.**

## TODO items
- Tutor: "show if the assessment is rejected"
- Admin certifications: "Rejected" tab (deferred from Chunk 8)

## Problem today
`PATCH /api/admin/certifications/[certificationId]` with `status: "REJECTED"` **deletes** the row.
The tutor gets no feedback and there is no record. `TopicCertificationStatus` only has
`PENDING` and `CERTIFIED`.

## Schema change (3NF-safe, additive)

```prisma
enum TopicCertificationStatus {
  PENDING
  CERTIFIED
  REJECTED        // NEW
}

model TopicCertification {
  ...
  status      TopicCertificationStatus @default(PENDING)
  requestedAt DateTime                 @default(now())
  certifiedAt DateTime?
  reviewNote  String?  @db.Text        // NEW — admin's rejection reason (optional)
  reviewedAt  DateTime?                // NEW — when it was certified or rejected
  ...
}
```

- Adding an enum value + two nullable columns: no data migration, no backfill needed.
- `reviewedAt` supersedes nothing; `certifiedAt` stays for backward compat and is still set on approve.

Migration: `npx prisma migrate dev --name topic_certification_rejected` then `npx prisma generate`.

## Code changes (after migration)

1. **`src/app/api/admin/certifications/[certificationId]/route.ts`**
   - `REJECTED` branch: `update` to `status: REJECTED`, set `reviewedAt: new Date()` and
     `reviewNote` from the (optional) body field — no longer `delete`.
   - `CERTIFIED` branch: also set `reviewedAt: new Date()`.
   - Keep the audit-log writes.

2. **`src/lib/validations/admin.ts`** — `reviewCertificationSchema`: add optional
   `reviewNote: z.string().max(500).trim().optional()`.

3. **`src/app/api/admin/certifications/route.ts`** — already filters by `status`; `REJECTED`
   is now a valid value (it's in the enum), so listing "Rejected" needs no route change.
   Add `certified` sort to also order rejected by `reviewedAt`.

4. **`src/components/admin/CertificationReviewTable.tsx`**
   - Add the third tab **Rejected** (`status=REJECTED`).
   - Reject flow: optional reason prompt in the ConfirmDialog (reuse a small textarea), send
     `reviewNote`.
   - Rejected tab: hide Approve/Reject actions, show `reviewedAt` + `reviewNote`.

5. **Tutor side — render the Rejected state**
   - `src/components/tutor/TopicCertificationList.tsx`: `status === "REJECTED"` → error-tone
     `StatusBadge` "Rejected" + show `reviewNote`, and a **"Request again"** button that
     re-POSTs `/api/tutor/topic-certifications` (server flips it back to `PENDING`).
   - `src/components/tutor/AssessmentHistory.tsx` + `CertificationDetail` type: add
     `"REJECTED"` to the status union, render the rejected row (reason + reviewed date).
   - `src/app/tutor/assessments/page.tsx`: pass `reviewNote` / `reviewedAt` through in
     `certificationDetails` and `initialCertifications`.

6. **`src/app/api/tutor/topic-certifications/route.ts`** POST — if an existing row for the
   (tutorProfile, subject, topic) is `REJECTED`, update it back to `PENDING`
   (clear `reviewNote`/`reviewedAt`) instead of erroring on the unique constraint.

## Tests
- `certifications/[certificationId]` PATCH: `REJECTED` now updates (not deletes), sets
  `reviewedAt`, persists `reviewNote`; audit-log row still written.
- `topic-certifications` POST: re-request on a `REJECTED` row → back to `PENDING`.
- `certifications` GET: `status=REJECTED` returns rejected rows.

## Verification
Admin rejects with a reason → tutor sees "Rejected" + reason on the assessments page and in
history → admin Rejected tab lists it → tutor clicks "Request again" → back to Pending.
