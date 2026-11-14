# Demo Accounts and Curriculum Data

These accounts describe the previous demo seed. The current `prisma/seed.ts`
imports only the researched curriculum catalog: **47 subjects, 292 topics, and
408 grade associations**. It does not create or reset these accounts, classes,
certifications, or question banks. Existing records remain intact unless the separate, explicit connected-data rebuild is run.

The current connected-data rebuild and recovery procedure is documented in
[CURRICULUM_SEED_REBUILD.md](../docs/CURRICULUM_SEED_REBUILD.md). It recreates
414 demo classes and tests and 408 grade-matched requests from the new catalog,
while preserving existing account logins and approved bank questions. The
old subject/topic assignments below are historical and are replaced by the
current catalog during that rebuild.

```sh
pnpm seed             # import the curriculum catalog
pnpm seed:curriculum  # preview the import without writing
```

The previous demo seed used `password123` for newly created test accounts.
The historical accounts below may exist in older development databases; the
current seed does not create them or change their passwords.

## Super Admin

| Anonymous ID | Email                    | Name        | Role        |
| ------------ | ------------------------ | ----------- | ----------- |
| ADM-0001     | superadmin@katuwang.test | Super Admin | SUPER_ADMIN |

## Tutors

| Anonymous ID | Email                         | Name            | Grade / Section | Topic certifications (✓ verified)                                                        |
| ------------ | ------------------------------ | ---------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| TUT-0002     | maria.santos@katuwang.test     | Maria Santos     | Grade 10 / Rizal | MATH: Algebraic Expressions & Factoring ✓, Fractions, Decimals & Rational Numbers (pending)                             |
| TUT-0003     | jose.reyes@katuwang.test       | Jose Reyes       | Grade 11 / Bonifacio | ENGLISH: Paragraph & Essay Writing ✓, Grammar & Sentence Structure (pending)           |
| TUT-0004     | ana.cruz@katuwang.test         | Ana Cruz         | Grade 12 / Mabini | FILIPINO: Panitikang Pilipino ✓, Pagsulat ng Sanaysay (pending); ARALING_PANLIPUNAN: Philippine History ✓ |
| TUT-0005     | paolo.garcia@katuwang.test     | Paolo Garcia     | Grade 9 / Aguinaldo | SCIENCE: Chemical Reactions & Stoichiometry ✓                                                 |
| TUT-0006     | liza.fernandez@katuwang.test   | Liza Fernandez   | Grade 11 / Luna   | MAPEH: Physical Education & Sports (pending)                                             |

## Learners

| Anonymous ID | Email                            | Name              | Grade / Section    |
| ------------ | --------------------------------- | ------------------ | -------------------- |
| STU-0003     | juan.delacruz@katuwang.test       | Juan Dela Cruz     | Grade 10 / Rizal     |
| STU-0004     | carla.mendoza@katuwang.test       | Carla Mendoza      | Grade 9 / Bonifacio  |
| STU-0005     | miguel.torres@katuwang.test       | Miguel Torres      | Grade 11 / Mabini    |
| STU-0006     | angela.ramos@katuwang.test        | Angela Ramos       | Grade 12 / Aguinaldo |
| STU-0007     | kevin.bautista@katuwang.test      | Kevin Bautista     | Grade 8 / Luna       |
| STU-0008     | sofia.villanueva@katuwang.test    | Sofia Villanueva   | Grade 10 / Rizal     |

> Anonymous IDs are assigned sequentially by the shared `IdCounter` table, so exact numbers can shift if the seed script runs on a database that already has other users. Inspect the existing development database for its current values.

## Suggested login for testing class browsing

**juan.delacruz@katuwang.test** / `password123` — enrolled in a mix of an open (scheduled), a completed, and a cancelled class, and can browse several open/full classes from other tutors.

## Class states covered

- Open, scheduled classes with seats available
- A full class (`maxStudents` reached)
- Multi-seat classes with partial enrollment
- Completed classes (learner history)
- A cancelled class
