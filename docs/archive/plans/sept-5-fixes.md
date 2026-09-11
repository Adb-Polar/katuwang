# Plan — Sept 5 fixes (9-item bug/UX batch)

Status: **implemented** (see Changes.md Part 31). Not committed.

A single pass over nine reported issues from the Sept 5 review. No schema
change; one additive `NotificationType` string value.

| # | Area | Problem | Fix |
|---|------|---------|-----|
| 1 | `/learner/match` | Results just stack under the form | Panel swaps criteria form ↔ ranked results with a subtle fade (`.kt-swap`); toggles both ways. (Tried a 3D flip first — too distracting.) |
| 2 | `/register/learner` | No way to see the typed password | Eye/eye-off reveal toggle on both password fields (reuse `LoginForm` control) |
| 3 | `/learner/profile` | Plain page; contact info unvalidated free text | Two-column identity / editable redesign; `normalizeContactInfo` (PH-mobile format + normalise, handles pass through), enforced client + server |
| 4 | Global search (learner) | Tutors always shown as anon ID | When `showTutorRealNames` is on, match + display the real name (anon ID as subtitle) |
| 5 | `/tutor/assessments` | "Questions requested" badge reverts to a button after a tab switch until page reload | Lift the `requested` Set to `AssessmentsTabs`; `router.refresh()` after the request |
| 6 | `/admin/notifications` | Tutor question requests never produced a notification | New `QUESTION_REQUEST_NEW` type; `POST /api/tutor/question-requests` `notifyMany`s all active admins in a `$transaction` |
| 7 | `/tutor/profile` | Grade level + section not editable | Grade level `<select>` added; `updateProfileSchema.gradeLevel`; both profile routes persist it |
| 8 | `/admin/classes` | Action buttons mis-placed | `<td className="flex …">` → `<td>` wrapping a `flex flex-wrap` `<div>` |
| 9 | `/admin/topic-requests` | Same as 8 | Same fix |
| 10 | `/tutor/classes` add-session | Session row overflowed on mobile | Row wraps to two lines; Location row wraps too |
| 11 | `/tutor/classes` schedule modal | Form too big for a dialog | Moved to its own page `/tutor/classes/new` (`NewClassForm`); modal deleted. Controls enlarged via `ClassScheduleFields` `variant="page"`. The accept-a-request flow moved the same way → `/tutor/requests/[id]/accept` (`AcceptRequestForm`); `AcceptRequestModal` deleted. |

## Files touched

- `src/components/learner/MatchFinder.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/profile/ProfileView.tsx`, `ProfileEditForm.tsx`
- `src/lib/contactInfo.ts` (new), `src/lib/validations/profile.ts`
- `src/app/api/learner/profile/route.ts`, `src/app/api/tutor/profile/route.ts`
- `src/app/api/search/route.ts`
- `src/components/tutor/AssessmentsTabs.tsx`, `TopicCertificationList.tsx`
- `src/lib/notifications.ts`, `src/components/notifications/notificationMeta.tsx`
- `src/app/api/tutor/question-requests/route.ts`
- `src/components/admin/ClassModerationTable.tsx`, `TopicRequestModerationTable.tsx`
- `src/components/tutor/ClassScheduleFields.tsx` (responsive session/location rows)
- `src/components/tutor/ClassManagement.tsx` (modal removed), `src/components/tutor/NewClassForm.tsx` (new), `src/app/tutor/classes/new/page.tsx` (new)
- `src/components/tutor/TopicRequestBrowser.tsx` (modal → link), `src/components/tutor/AcceptRequestForm.tsx` (new), `src/app/tutor/requests/[id]/accept/page.tsx` (new); `src/components/tutor/AcceptRequestModal.tsx` **deleted**
- Tests: `src/lib/__tests__/contactInfo.test.ts` (new), `src/app/api/search/__tests__/route.test.ts`

## Divergence logged

Grade level is now self-service on the profile page — the old CLAUDE.md note
said it required an administrator. Recorded in `docs/reference/decisions.md`.
