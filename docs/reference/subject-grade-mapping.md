# DepEd subject-to-grade mapping

Reviewed 2026-10-27. Scope: the seven built-in subject slugs in Katuwang, whose supported grade choices are 7–12.

| App subject | Default grades | Curriculum interpretation |
| --- | --- | --- |
| Mathematics (`MATH`) | 7, 8, 9, 10 | Junior-high mathematics learning area |
| English (`ENGLISH`) | 7, 8, 9, 10 | Junior-high English learning area |
| Science (`SCIENCE`) | 7, 8, 9, 10 | Junior-high science learning area |
| Filipino (`FILIPINO`) | 7, 8, 9, 10 | Junior-high Filipino learning area |
| Araling Panlipunan (`ARALING_PANLIPUNAN`) | 7, 8, 9, 10 | Junior-high social studies learning area |
| Technology and Livelihood Education (`TLE`) | 7, 8, 9, 10 | Junior-high TLE; exploratory/specialization differences belong in topic mapping |
| MAPEH (`MAPEH`) | 7, 8, 9, 10 | Existing app umbrella for Music/Arts and Physical Education/Health |

These broad learning areas occur in every junior-high grade. Assigning them accurately does not shorten the seven-subject list within Grades 7–10. The grade restrictions separate this JHS catalog from SHS. Per-grade topic competencies remain a separate task: a subject assignment does not establish that each existing broad topic belongs in every grade.

## Primary sources

- [DepEd MATATAG curriculum guide index](https://www.deped.gov.ph/matatagcurriculumk147/) — current curriculum guide publication entry point. The linked guide collection covers Mathematics, English, Science, Filipino, AP, EPP/TLE, and MAPEH components; phase-one downloads are not themselves a complete implementation calendar.
- DepEd Learning Portal grade-specific learning-area catalogs: [Grade 7](https://lrmds.deped.gov.ph/grade/7), [Grade 8](https://lrmds.deped.gov.ph/grade/8), [Grade 9](https://lrmds.deped.gov.ph/grade/9), [Grade 10](https://lrmds.deped.gov.ph/grade/10). These independently list the existing learning areas and MAPEH component areas in all four grades. The portal also contains legacy K–12 resources; it is used for subject-level coverage, not to assert the current quarter-by-quarter sequence.
- [DepEd Mathematics curriculum guide record](https://lrmds.deped.gov.ph/detail/5455) — Grades 1–10; app intersection is 7–10.
- [DepEd Science curriculum guide record](https://lrmds.deped.gov.ph/detail/5459) — Grades 3–10; app intersection is 7–10.
- [DepEd MATATAG EPP/TLE Grades 4–10 guide](https://www.deped.gov.ph/wp-content/uploads/MATATAG-EPP_TLE-CG-2023-Grades-4-10-1.pdf) and [Filipino guide](https://www.deped.gov.ph/wp-content/uploads/MATATAG-FILIPINO-CG-Grades-4-at-7-.pdf) — search-indexed supporting documents; direct PDF fetching was blocked during research.
- [DepEd Strengthened SHS program](https://www.deped.gov.ph/strengthened-shs-program/) and [DM 012, s. 2026](https://www.deped.gov.ph/wp-content/uploads/DM_s2026_012r.pdf) — official search-indexed program/implementation references. SHS uses differently named courses, such as General Mathematics and Effective Communication; direct fetching was blocked during research.
- [DepEd Caraga's 2026 SHS teacher-training memorandum](https://caraga.deped.gov.ph/wp-content/uploads/2026/05/RM-NO.-0508-S.-2026-STRENGTHENED-SENIOR-HIGH-SCHOOL-TRAINING-FOR-TEACHERS.pdf) — corroborates the SHS course-name distinction.

## Implementation and boundaries

- `src/lib/subjectGradeDefaults.ts` owns defaults shared by both seed scripts and client/server static fallbacks.
- Migration `20261027010000_deped_subject_grade_defaults` fills null/JSON-null/empty assignments on those seven built-in slugs only. Existing non-empty admin assignments are preserved. Custom subjects are not guessed from their names.
- Seeds give newly created built-in subjects explicit grades; reseeding preserves assignments on existing rows.
- Existing topics obey their parent subject's grades. Topic rows and existing classes/certifications are not reassigned by this subject-only change.
- These seven JHS entries do not appear for Grades 11–12. Proper SHS subjects need separate catalog entries and school/cohort-specific grade allocation; no blanket SHS equivalence is inferred.
- Admins can edit defaults for their school. Subject slugs and names stay stable, preserving existing references.
