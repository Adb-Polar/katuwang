# Tutor profile unslop

## Context

The shared `ProfileView` was restyled on 2026-11-17. This pass finishes the tutor profile: the tutor-only parts of
`/tutor/profile` and the edit page `/tutor/profile/edit`, which still had the old small-text, mismatched-card look.

## Audit

| Tell | Evidence | Severity |
|---|---|---|
| Privacy copy promises more than the code keeps | "Learners see you only as TUT-…" while `showTutorRealNames` can show the real name | Critical (bug) |
| 12px UI on main actions | `btn-sm text-xs` photo buttons, `text-xs` photo note, `text-2xs` upload overlay, `text-xs` field labels | High |
| Mismatched sibling cards | "Profile Photo" 14px bold h3, untitled form card, "Change password" 14px card-title | High |
| Broken overlay colour | `bg-base-900/60` is not a theme colour, white text on nothing | High |
| Hints that repeat the label | "Your current grade level.", "Your current class section." | Medium |
| Decorative figures | 3xl serif "9 topics in 7 subjects" next to the certified-topics heading | Medium |
| Kicker differs from the profile page | "Tutor Portal" vs "Iyong account" | Medium |

Keep: the profile page structure, field labels the tests pin (`data-form-field`), the contact-number validation,
the change-password flow and its sign-out.

## Changes

1. Tutor page reads `showTutorRealNames`; `ProfileView` gets `learnersSeeRealName` and words the ID line and the
   details note to match. Test in `components/profile/__tests__/ProfileView.test.tsx`.
2. Certified topics: count as a plain note, "Add a topic" button to Assessments.
3. `ProfileEditView`: three sections with serif titles and one note each (Photo, Your details, Password).
4. `ProfilePictureUpload`, `ProfileEditForm`, `ChangePasswordForm`: full-size controls, `FormField size="md"`,
   overlay colour fix, no redundant hints. Ripples to `/learner/profile/edit` and `/admin/settings`.

## Verification

tsc, lint, tests; browser as the demo tutor at 1280px and 375px. DB-writing flows (setting toggle, photo upload)
listed in TOTEST.
