# Role-based Help & FAQs pages

Status: **done** (Changes.md Part 26) — not committed.

## Goal

Give every portal an in-app Help Center: quick links, task walkthroughs, and a
searchable FAQ, scoped to the viewer's role. Learners, tutors, and admins each
see only their own material.

## Design

- **Content** lives in one data module, `src/lib/help/helpContent.ts`:
  `HELP_CONTENT: Record<"LEARNER" | "TUTOR" | "ADMIN", HelpEntry>` where
  `HelpEntry = { intro, quickLinks[], guides[], faqs[] }`. Single source of
  truth — update it when a flow changes.
- **Render** with one shared client component `HelpCenter.tsx` that takes a
  `role`, reads the entry, groups FAQs by category, and provides a client-side
  search filter. FAQs are DaisyUI `collapse collapse-arrow` accordions.
- **Pages** `src/app/{learner,tutor,admin}/help/page.tsx` are lean server
  components (`PageHeader` + `<HelpCenter role=… />`). Role isolation is
  already enforced by each portal `layout.tsx`.
- **Entry points**: a "Help & FAQs" sidebar nav item per portal, plus the
  previously-inert topbar `?` button, now a `<Link>` driven by a new
  `helpHref` prop on `PortalLayout`.

## Not doing

- No DB, API, or schema changes — content is static in the repo.
- Distinct from the Chatbot Assistant's FAQ KB (`src/lib/chatbot/faq.ts`),
  which stays as-is. This is the browsable, full-page version.

## Follow-ups

- Grow FAQ content from real support questions / TRIS stakeholder input
  (same note as the chatbot FAQ KB in `docs/feature-checklist.md` §5).
