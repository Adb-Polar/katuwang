> Verification on the develop-based branch: 1,210 tests passed and 65 skipped across 155 test files (143 passed, 12 skipped). TypeScript and targeted ESLint passed. The standalone seed check is intentionally rejected for the documented catalogue mismatch; no database writes occurred.

> Develop rebase update: this branch now starts at develop `75488fb90e41bead2631b0c270f8862430545ea3`. Develop has 10 subjects and 135 topics (2,700 questions required). The 860 questions retain the original 43-topic taxonomy: 118 current topics are missing and 26 original topic keys do not match. No remapping or additional questions were invented. The seed check/apply correctly rejects this mismatch before writes. Earlier 751-test evidence below belongs to the original main-based version.

# Complete question bank audit

Research date: 2026-11-08 (Asia/Manila). Repository baseline: 309ba6687dbd211d6f523b1621275c24c9db2701.

860 original questions are written for all 43 seed topics in 7 existing subjects. Each topic has 6 easy, 10 medium and 4 hard items. All items pass structural validation. Academic approval remains pending for all 860; no production-approved label has been fabricated. Difficulty and cross-grade audience labels are provisional educator-review inputs.

No live database connection was supplied. Subject IDs, topic IDs, actual previous bank counts and any additional live topics remain unknown. The authoritative local catalogue is src/lib/subjectTopics.ts, used by the repository seed; live subjects/topics are admin-editable. The seeder rechecks the actual database catalogue transactionally and refuses missing/extra coverage. No subjects or topics are created, removed or renamed.

Previous counts below describe the 12 literal seed BANK questions only, excluding optional runtime-generated dummy questions. They are not asserted production counts.

|Subject|Topic|Literal seed count|Replacement|Easy|Medium|Hard|Academic review|Sources|
|---|---|---:|---:|---:|---:|---:|---|---|
|MATH|Whole Numbers & Operations|0|20|6|10|4|Pending|https://openstax.org/books/prealgebra-2e/pages/1-1-introduction-to-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-2-add-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-3-subtract-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-4-multiply-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-5-divide-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/2-1-use-the-language-of-algebra|
|MATH|Fractions & Decimals|0|20|6|10|4|Pending|https://openstax.org/books/prealgebra-2e/pages/4-2-multiply-and-divide-fractions; https://openstax.org/books/prealgebra-2e/pages/5-2-decimal-operations|
|MATH|Algebraic Expressions|6|20|6|10|4|Pending|https://openstax.org/books/prealgebra-2e/pages/2-2-evaluate-simplify-and-translate-expressions|
|MATH|Linear Equations & Inequalities|0|20|6|10|4|Pending|https://openstax.org/books/elementary-algebra-2e/pages/2-3-solve-equations-with-variables-and-constants-on-both-sides; https://openstax.org/books/elementary-algebra-2e/pages/2-7-solve-linear-inequalities|
|MATH|Geometry & Measurement|0|20|6|10|4|Pending|https://openstax.org/books/prealgebra-2e/pages/9-4-use-properties-of-rectangles-triangles-and-trapezoids; https://openstax.org/books/prealgebra-2e/pages/9-6-solve-geometry-applications-volume-and-surface-area|
|MATH|Statistics & Probability|0|20|6|10|4|Pending|https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data; https://openstax.org/books/introductory-statistics-2e/pages/3-1-terminology|
|MATH|Trigonometry|0|20|6|10|4|Pending|https://openstax.org/books/precalculus-2e/pages/5-4-right-triangle-trigonometry|
|MATH|Functions & Graphing|0|20|6|10|4|Pending|https://openstax.org/books/precalculus-2e/pages/1-1-functions-and-function-notation|
|ENGLISH|Grammar & Sentence Structure|6|20|6|10|4|Pending|https://owl.purdue.edu/owl/general_writing/grammar/subject_verb_agreement.html; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Reading Comprehension|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Vocabulary Building|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Essay & Paragraph Writing|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts|
|ENGLISH|Literature Analysis|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Public Speaking & Oral Communication|0|20|6|10|4|Pending|https://open.lib.umn.edu/commpractice/chapter/the-introduction/; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts|
|ENGLISH|Research Writing|0|20|6|10|4|Pending|https://owl.purdue.edu/owl/research_and_citation/conducting_research/evaluating_sources_of_information/general_guidelines.html; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|SCIENCE|Scientific Method & Inquiry|0|20|6|10|4|Pending|https://openstax.org/books/biology-2e/pages/1-1-the-science-of-biology|
|SCIENCE|Cell Biology & Genetics|0|20|6|10|4|Pending|https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells; https://openstax.org/books/biology-2e/pages/12-1-mendels-experiments-and-the-laws-of-probability; https://openstax.org/books/biology-2e/pages/11-1-the-process-of-meiosis|
|SCIENCE|Chemical Reactions & Matter|0|20|6|10|4|Pending|https://openstax.org/books/chemistry-2e/pages/2-1-early-ideas-in-atomic-theory; https://openstax.org/books/chemistry-2e/pages/2-3-atomic-structure-and-symbolism; https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations|
|SCIENCE|Force, Motion & Energy|0|20|6|10|4|Pending|https://openstax.org/books/physics/pages/4-3-newtons-second-law-of-motion; https://openstax.org/books/physics/pages/9-2-mechanical-energy-and-conservation-of-energy|
|SCIENCE|Ecosystems & the Environment|0|20|6|10|4|Pending|https://openstax.org/books/biology-2e/pages/46-1-ecology-of-ecosystems|
|SCIENCE|Earth & Space Science|0|20|6|10|4|Pending|https://www.usgs.gov/programs/earthquake-hazards/science-earthquakes; https://openstax.org/books/astronomy-2e/pages/4-2-the-seasons; https://www.usgs.gov/water-science-school/water-cycle; https://www.nps.gov/subjects/geology/rocks-and-minerals.htm|
|SCIENCE|Human Body Systems|0|20|6|10|4|Pending|https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body; https://openstax.org/books/anatomy-and-physiology-2e/pages/1-5-homeostasis; https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance|
|FILIPINO|Balarila (Gramatika)|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagbasa at Pag-unawa|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Panitikang Pilipino|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagsulat ng Sanaysay|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagsasalin|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Retorika at Pampublikong Pagsasalita|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts; https://open.lib.umn.edu/commpractice/chapter/the-introduction/|
|ARALING_PANLIPUNAN|Kasaysayan ng Pilipinas|0|20|6|10|4|Pending|https://history.house.gov/Exhibitions-and-Publications/APA/Historical-essays/Exclusion-and-Empire/The-Philippines/; https://pvao.gov.ph/wp-content/uploads/2018/02/Philippine-History.pdf|
|ARALING_PANLIPUNAN|Heograpiya|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/ARALING-PANLIPUNAN-GRADES-4-7.pdf|
|ARALING_PANLIPUNAN|Ekonomiks|0|20|6|10|4|Pending|https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services|
|ARALING_PANLIPUNAN|Sibika at Pamahalaan|0|20|6|10|4|Pending|https://www.officialgazette.gov.ph/constitutions/1987-constitution/|
|ARALING_PANLIPUNAN|Kultura at Lipunan|0|20|6|10|4|Pending|https://openstax.org/books/introduction-sociology-3e/pages/3-1-what-is-culture|
|ARALING_PANLIPUNAN|Kasalukuyang Pangyayari (Current Events)|0|20|6|10|4|Pending|https://unstats.un.org/sdgs/report/2026/; https://public.wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025|
|TLE|Computer Basics & ICT|0|20|6|10|4|Pending|https://openstax.org/books/workplace-software-skills/pages/1-2-computer-hardware-and-networks; https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
|TLE|Home Economics|0|20|6|10|4|Pending|https://www.who.int/publications/i/item/9789241594639; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
|TLE|Agri-Fishery Arts|0|20|6|10|4|Pending|https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf; https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6709e/x6709e02.htm|
|TLE|Industrial Arts|0|20|6|10|4|Pending|https://www.osha.gov/hand-power-tools; https://www.osha.gov/sites/default/files/publications/OSHA3080.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
|TLE|Entrepreneurship|0|20|6|10|4|Pending|https://openstax.org/books/entrepreneurship/pages/11-3-conducting-a-feasibility-analysis; https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services|
|MAPEH|Music Theory & Appreciation|0|20|6|10|4|Pending|https://viva.pressbooks.pub/openmusictheory/chapter/notation-of-notes-clefs-and-ledger-lines/; https://viva.pressbooks.pub/openmusictheory/chapter/notating-rhythm/; https://viva.pressbooks.pub/openmusictheory/chapter/texture/; https://viva.pressbooks.pub/openmusictheory/chapter/other-aspects-of-notation/|
|MAPEH|Visual Arts|0|20|6|10|4|Pending|https://www.getty.edu/education/teachers/building_lessons/elements_art.pdf|
|MAPEH|Physical Education & Sports|0|20|6|10|4|Pending|https://www.who.int/news-room/fact-sheets/detail/physical-activity|
|MAPEH|Health Education|0|20|6|10|4|Pending|https://www.who.int/news-room/fact-sheets/detail/healthy-diet; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food; https://www.who.int/news-room/fact-sheets/detail/physical-activity; https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance|

## Research and verification

Exact-name discovery searches were performed for all topics. Questions were authored from retrieved institutional, government and open educational content, not copied examination banks. questions.json includes 64 source records, access dates, item learning objectives, difficulty, cognitive labels and source IDs. research.json records topic objectives and URLs. research-evidence.json records original research-use notes and hashes of retrieved source bytes. Full third-party articles are retained only as research scratch files, not redistributed in this question-bank package.

Current-events items use the UN Sustainable Development Goals Report 2026 and WMO State of the Global Climate 2025, published in 2026. The research cutoff is 2026-11-08. Recheck date-sensitive content before later use. Older DepEd guides inform broad subject scope; no unverified current MATATAG competency-code mapping is claimed. Filipino translation is explicitly within the retrieved Filipino guide; no failed NCCA fetch is represented as read evidence.

Automated checks found no exact duplicates, no flagged near duplicates, no duplicate options, no missing source records and no structural errors. Each item has four options and one correct key. Each topic balances correct positions A/B/C/D at 5/5/5/5 with varied order. Heuristics do not establish semantic uniqueness, academic accuracy, fair difficulty, copyright originality or distractor quality. Human review remains necessary.

## Tests

- All 751 tests passed across 102 files, including full-bank integrity, replacement behavior, validator, grading, assessment-picker and existing application tests.
- 126 independently recomputed numeric answers passed, plus algebraic identity and Mendelian probability checks.
- TypeScript and ESLint passed for the new tooling.
- Standalone seed --check passed without a database: 860 questions, 43 topics, structural validity true.
- Academic approval false is an intentional truthful result, not a failed structural check.
- No live database seed, browser assessment or live historical-result check was performed. Existing application engines were not changed.

## Seeding behavior

The user authorized discarding all dummy bank data, without backup or archival requirements. After genuine academic approval, --apply invokes one Serializable Prisma transaction. It validates actual catalogue coverage before writes, deletes dependent dummy certification and learner attempts, removes old BANK links, resets affected session tests to DRAFT, deletes BANK questions/options, inserts the complete new bank and checks post-write counts. Tutor-authored questions, subject/topic IDs, users and authentication are unchanged. Existing certification badges are not rewritten. Do not run the unrelated old demo seed to populate this bank.

If any write or verification fails, the transaction aborts. No archive or backup is required by this task. After a successful disposable-data replacement there is no archived old-bank rollback; re-seeding an approved dataset is the recovery approach. No database changes have been made in this session.

## Files and commands

Canonical data: prisma/question-bank/questions.json. Academic reading export: prisma/question-bank/review.md. Standalone seeder: prisma/seed-question-bank.ts. Validation: scripts/question-bank/validate.ts. Direct replacement: scripts/question-bank/replace.ts. Local tests and numeric audit are in scripts/question-bank/. package.json adds seed:questions and seed:questions:check. No Prisma schema migration is needed.

Run pnpm seed:questions:check to validate locally. After academic reviews are recorded in questions.json, configure DATABASE_URL securely and run pnpm seed:questions --apply. --apply does not ask for another deletion confirmation; the user has authorized it.

All 860 written items require academic review, but no seed topic is left unwritten. Additional live topics, if present, must receive 20 items before the complete-bank seeder can commit.
