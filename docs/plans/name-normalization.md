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
     lower or all upper). Mixed-case input keeps its inner casing (`McDonald`,
     `Maria dela Cruz`) and only gets its first letter capitalized
     (`alejandro D Beato` → `Alejandro D Beato`).
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

## Backfill of existing rows

`pnpm names:cleanup` (`scripts/cleanup-user-names.ts`) rewrites stored `firstName`,
`lastName` and `adviserTeacherName` to the same rules.

- **Dry run by default.** Prints every `STU-/TUT-` id with the before → after value and
  writes nothing. `--apply` saves the changes in one transaction.
- Zalgo names are repaired by dropping the decorative marks (`repairPersonName`), so
  `A͇̽ngelica` becomes `Angelica`.
- A name that is still invalid after that (digits, symbols) is listed as
  "NEEDS MANUAL REVIEW" and left unchanged.
- Planning logic is the pure `planNameCleanup()` in `src/lib/nameCleanup.ts`.

Running it with `--apply` is a DB modification and needs explicit confirmation.

## Status

Steps 1–4 shipped — Changes.md Part 95. Cleanup script written — Part 96; not yet run
against any database.
