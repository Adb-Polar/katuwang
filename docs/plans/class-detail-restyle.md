# Class detail pages — landing-theme restyle (2026-11-17)

Scope: the shared class detail view used by all three portals —
`/learner/classes/[classId]`, `/tutor/classes/[classId]`, `/admin/classes/[id]` — via
`components/classes/ClassDetailsView.tsx`.

## Audit (before)
- No `h1` on any of the three pages; the class was named by a dark uppercase subject pill and tiny topic chips.
- Body text 10.5–12px throughout; uppercase spaced eyebrows (code, "TUTOR", "LOCATION", "MEETING LINK").
- One card per single fact ("Class Info" = only the tutor; "At a Glance" = only the seat count + progress bar),
  and the seat count landed at the bottom on phones.
- Cards inside cards: boxed session rows, dashed test rows, progress band + chart inside another card.
- Primary action (Enroll / Manage) above the title; `btn-xs text-2xs` test buttons; icons on every fact;
  "Open"/"Scheduled" badges that say nothing; opacity text colours.
- Bug: `?from=my-classes` linked back to My classes but was labelled "Back to Classes".

## Design
- Serif `PageHeader`: kicker "Subject · Grade N" and the topic as the `h1`; with several topics the subject
  is the `h1`, the kicker is the grade and the topics are listed underneath.
- One muted line: class code (serif), tutor ID (serif ube link) or tutor ID + name (admin), and a status
  badge only when the class isn't simply open. Certified topics as one green line.
- A three-fact `<dl>`: Next/Last session, Where, Seats (learner, open classes) or Enrolled.
- Actions after the facts. Then single-column sections (admin keeps a right column for its tools).
- Sessions as a calendar rail (`SessionsList variant="calendar"`): weekday, serif day number, month;
  status only when not scheduled; tutor session controls under each row.

## Not changed
- `BackLink` keeps its ghost style (text raised to 14px); `StatusBadge`, `AnonymousIdBadge`, `SessionActions`
  and `RecommendClassForm` are unchanged.
