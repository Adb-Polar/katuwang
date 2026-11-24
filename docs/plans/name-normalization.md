# Name Normalization & Zalgo Rejection — Plan

## Problem

Personal names were stored exactly as typed:

- Lazy casing (`alejandro D Beato`) shows up as-is in every admin list, report and export.
- `PERSON_NAME` (Part 91) allowed any number of combining marks anywhere, so "Zalgo"
  text (letters with stacked marks) passed — e.g. the banned `STU-0337` account.

## Approach

Fix the data at write time rather than per screen (a CSS `capitalize` would leave
reports, emails and search showing the raw value).

1. `src/lib/personName.ts`
   - `normalizePersonName(raw)` — NFC-normalize, curly → straight apostrophe, trim,
     collapse whitespace. Title-case **only** when the whole name is one case (all
     lower or all upper). Mixed-case input is kept, so `McDonald` / `dela Cruz` survive.
   - `isValidPersonName(name)` — passes `PERSON_NAME` and has no combining mark left
     after NFC (a mark that does not compose is decoration, not an accent).
2. `src/lib/validations/textRules.ts` — `PERSON_NAME` allows at most one combining mark
   per letter. The browser `pattern` therefore still accepts a decomposed `ñ` but blocks
   stacked marks before submit.
3. `src/lib/validations/personNameField.ts` — `personNameField(label, maxLength)`:
   normalize → required → max length → character check. Used by `firstName`,
   `lastName`, `adviserTeacherName` (register) and `firstName` / `lastName` (create admin).
4. `autoCapitalize="words"` on the name inputs in `RegisterForm` and `CreateAdminModal`.

Client and server differ in one narrow case: a name with exactly one non-composing mark
per letter (strikethrough-style text) passes the browser `pattern` and is rejected by
the server with the normal field message.

## Out of scope

- **Backfill of existing rows.** A DB modification, so it needs explicit confirmation.
  Until then, old lowercase / Zalgo names stay as stored.

## Status

Steps 1–4 shipped — Changes.md Part 95. Backfill not done.
