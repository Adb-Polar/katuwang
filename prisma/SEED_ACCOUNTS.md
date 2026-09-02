# Seeded Dummy Accounts

Created by `pnpm exec tsx prisma/seed.ts` (see that file for the full class/enrollment data).
All accounts share one password:

```
password123
```

Re-running the seed script is safe — it reuses these accounts by email and only resets the dummy classes/enrollments.

## Admin

| Anonymous ID | Email                  | Name           |
| ------------ | ----------------------- | -------------- |
| ADM-0001     | admin@katuwang.test     | Katuwang Admin |

## Tutors

| Anonymous ID | Email                         | Name            | Grade / Section | Topic certifications (✓ verified)                                                        |
| ------------ | ------------------------------ | ---------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| TUT-0002     | maria.santos@katuwang.test     | Maria Santos     | Grade 10 / Rizal | MATH: Algebraic Expressions ✓, Fractions & Decimals (pending)                             |
| TUT-0003     | jose.reyes@katuwang.test       | Jose Reyes       | Grade 11 / Bonifacio | ENGLISH: Essay & Paragraph Writing ✓, Grammar & Sentence Structure (pending)           |
| TUT-0004     | ana.cruz@katuwang.test         | Ana Cruz         | Grade 12 / Mabini | FILIPINO: Panitikang Pilipino ✓, Pagsulat ng Sanaysay (pending); ARALING_PANLIPUNAN: Kasaysayan ng Pilipinas ✓ |
| TUT-0005     | paolo.garcia@katuwang.test     | Paolo Garcia     | Grade 9 / Aguinaldo | SCIENCE: Chemical Reactions & Matter ✓                                                 |
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
