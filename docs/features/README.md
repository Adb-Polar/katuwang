# Katuwang — feature documentation

This documentation describes the implementation in this repository, reviewed on 29 October 2026. It organizes behavior by the roles actually defined in `prisma/schema.prisma`, rather than roles suggested by old plans or UI wording. Paths beginning `/api` are HTTP endpoints; other paths are browser routes. Bracketed identifiers are dynamic path segments.

## Reading order

1. [System overview and architecture](01-system-overview.md)
2. [Guest and applicant features](02-guest-and-applicant.md)
3. [Student Learner features](03-student-learner.md)
4. [Student Tutor features](04-student-tutor.md)
5. [Admin features](05-admin.md)
6. [Shared and system features](06-shared-and-system.md)
7. [Feature matrix](07-feature-matrix.md)
8. [Complete API and page inventory](08-route-reference.md)
9. [Implementation caveats and assumptions](09-caveats-and-assumptions.md)
10. [Source coverage inventory](10-source-coverage.md)

## Scope and conventions

The role chapters cover purpose, entry points, workflow, inputs/outputs, permissions, and edge cases. Shared behavior is specified once and linked from each role. The route reference records every implemented API method and browser page, including secondary and development routes. The coverage inventory accounts for tracked source, migrations, tests, configuration, assets, design references, and existing documents; generated dependencies are excluded.

**Evidence priority:** executable route/helper logic → validation/schema constraints → components/page behavior → comments and historical documentation. A visible label is not proof of an enforced backend rule. Known inconsistencies are recorded explicitly in the caveats chapter. This is static source analysis; it does not claim that live services, SMTP delivery, database migrations, or every workflow have been exercised.

**Role names:** `ADMIN`, `STUDENT_TUTOR`, and `STUDENT_LEARNER` are stored roles. “Guest/applicant” denotes unauthenticated access, not another database role. Developer/operator is an execution context, not a fourth authenticated role. `PENDING`, `DECLINED`, `SUSPENDED`, and `BANNED` are account states, not roles.

Source links are repository-relative and resolve when these files remain in `docs/features`.
