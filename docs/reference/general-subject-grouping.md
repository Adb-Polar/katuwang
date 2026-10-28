# General subject grouping

Approved by the user on 28 October 2026: 10 general subjects, 135 selectable topics.

The canonical definitions are in `src/lib/approvedSubjectCatalog.json`. They drive dropdown fallbacks, subject names, grade availability, seeds, the migration, and startup verification. `curriculumData.json` and the detailed `prisma/data/curriculum` dataset remain historical evidence, not competing active catalogs.

The migration archives superseded subjects and topics using `active=false`; it does not delete or rewrite classes, sessions, requests, questions, certifications or assessment attempts. Their original topic scope remains intact. Archived records are still readable through their existing relationships, and admins can inspect inactive catalog rows. New selections use the approved catalog. A narrow legacy certification is not automatically upgraded to a broader merged topic.

Grade lists on grouped topics are app availability settings. The source notes explicitly distinguish broad app grouping from exact DepEd competencies. Legacy translation and foundational arithmetic retain their qualifications.

The three catalog seed entrypoints use the same canonical catalog and cannot recreate the old separate Cookery, Baking, TVL or TLE dropdown subjects. Cooking, baking and other practical skills now sit under Miscellaneous.
