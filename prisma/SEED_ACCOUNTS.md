# Seeded Dummy Accounts

Created by `pnpm exec tsx prisma/seed.ts` (see that file for the full class/enrollment data).
New dummy accounts use the password below. Existing administrator passwords are preserved during a reset:

```
password123
```

Use `pnpm seed` to populate the grouped demo fixtures. Use `pnpm seed:reset` for a clean test-data rebuild: learning records, tutor/learner accounts and the old catalog are removed, while admin accounts, their passwords, platform settings and ID counters are retained. The catalog is rebuilt with exactly 10 groups and 135 topics. Every group has a published demo class; Miscellaneous includes cooking and baking. Topic selections and class/request grade levels are validated against the approved catalog.

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

> Anonymous IDs are assigned sequentially by the shared `IdCounter` table, so exact numbers can shift if the seed script runs on a database that already has other users. Check the seed script's console output for the current values.

## Suggested login for testing class browsing

**juan.delacruz@katuwang.test** / `password123` — enrolled in a mix of an open (scheduled), a completed, and a cancelled class, and can browse several open/full classes from other tutors.

## Class states covered

- Open, scheduled classes with seats available
- A full class (`maxStudents` reached)
- Multi-seat classes with partial enrollment
- Completed classes (learner history)
- A cancelled class
