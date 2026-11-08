# Current question bank audit

Baseline: develop `75488fb90e41bead2631b0c270f8862430545ea3`. Research cutoff: 2026-11-08 UTC. The repository's approvedSubjectCatalog.json defines 10 subjects and 135 topics: 135 × 20 = **2,700 questions**.

Every current topic has 6 easy, 10 medium and 4 hard questions, four distinct choices and one correct key per item. All 2,700 pass automated structural validation. There are no missing topics, unmatched topic keys, exact duplicate prompts or flagged within-topic near duplicates. Correct positions A/B/C/D occur five times each per topic in varied order.

All 2,700 await genuine human academic approval. Automated checks cannot establish academic accuracy, curriculum suitability, fair difficulty, semantic uniqueness or distractor quality. Grade scopes are the actual catalogue scopes, often spanning several grades; an educator must assess their suitability before use. No topic is represented as academically approved or production ready.

## Inventory and provenance

No database connection was available. Live IDs, prior live counts and any admin-added topics are unknown. The exact current catalogue and grade levels are recorded in inventory.csv; research.json records topic objectives and URLs. No subject/topic was added, deleted or renamed. The seeder rechecks the live active catalogue before writing and rejects additional or differently named active topics without complete coverage.

820 previously researched replacement questions were assigned to equivalent current catalogue topics. These are original replacement items from this work, not reuse of the application's dummy bank. current-authored/topic-reassignments.json records those mappings. 1,880 additional original items cover the other 94 topics; their authoring notes are in current-authored/. questions.json is the canonical, fully edited seeder input.

Exact-name discovery searches covered all 135 topics. Retrieved educational, government, university, museum, public-domain literary and open textbook sources informed authoring; proprietary examination banks were not copied. All 152 cited source records have URLs, access dates and original research-use evidence. research-evidence.json contains retrieval hashes and original notes, not redistributed third-party articles. Sources that failed retrieval are not represented as read sources. Specific musical instrument facts were additionally checked against NEA, Smithsonian and Met materials. Literary plots were checked against retrieved public-domain texts.

Older DepEd guides and available strengthened-SHS/MATATAG materials inform broad scope. No unverified current competency-code equivalence is claimed. Pay examples use stated classroom rates, not unverified current payroll law. Current-event questions use retrieved UN 2026 SDG and WMO 2025 climate reports; recheck date-sensitive content before later use. Every topic has documented sources; source sufficiency and item-to-source interpretation still require academic judgment.

## Validation evidence

- Standalone seed --check passes without a database: 10 subjects, 135 topics, 2,700 questions, zero review flags; productionApproved false.
- Full application test suite: 1,213 passed, 65 skipped; 144 test files passed, 12 skipped.
- 278 independently recomputed numerical checks passed across the original and expanded items, plus algebra identities and Mendelian checks. These checks do not certify explanations or academic suitability.
- TypeScript and targeted ESLint passed. Source-record digests match; validation.json records the exact bank digest and every topic distribution.
- Existing grading, selection and application tests passed. No live database replacement, live/browser assessment, historical-result QA or deployment was performed.

## Seeding and review

Use `pnpm seed:questions:check`. For release, obtain actual academic reviews and record each item's genuine reviewer, date and review checks, then set verificationStatus to academically-approved. Run the check again and configure DATABASE_URL securely. `pnpm seed:questions --apply` remains blocked while reviews are pending. No production approval has been fabricated.

The application also has its own qualification-review controls. Inserted questions retain the schema's UNREVIEWED default and cannot certify tutors until genuine application review evidence is recorded. File approval does not bypass those controls.

After content approval, the standalone seeder uses one Serializable transaction. It validates live active catalogue coverage and settings, supports SUPER_ADMIN/ADMIN authors, removes dependent dummy attempts and test links, resets affected tests to DRAFT, clears version references to disposable BANK records, deletes all BANK versions/options and inserts the replacement bank. It checks totals and options before commit. It preserves users, catalogue IDs and tutor-authored question content. Version links to deleted BANK predecessors are necessarily cleared. No Prisma schema migration or assessment-engine change is needed.

The user authorized discarding dummy bank data and its dependent dummy assessment records without preservation. No backup or second deletion confirmation is required by this task. On failure, the transaction rolls back. After successful deletion, there is no archived dummy-bank recovery; an approved dataset can be re-seeded. Existing certification badges are not rewritten. Database application and live workflow checks remain outstanding.

## Topic audit

Prior live counts and IDs are unknown throughout. All rows pass automated validation and await academic review. Full grade scopes and URLs are also available in inventory.csv.

|Subject|Topic|Previous live count|New|Easy|Medium|Hard|Sources|
|---|---|---|---:|---:|---:|---:|---|
|MATH|Whole Numbers & Operations|Unknown|20|6|10|4|https://openstax.org/books/prealgebra-2e/pages/1-1-introduction-to-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-2-add-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-3-subtract-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-4-multiply-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/1-5-divide-whole-numbers; https://openstax.org/books/prealgebra-2e/pages/2-1-use-the-language-of-algebra|
|MATH|Fractions, Decimals & Rational Numbers|Unknown|20|6|10|4|https://openstax.org/books/prealgebra-2e/pages/4-2-multiply-and-divide-fractions; https://openstax.org/books/prealgebra-2e/pages/5-2-decimal-operations|
|MATH|Percentages|Unknown|20|6|10|4|https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent|
|MATH|Algebraic Expressions & Factoring|Unknown|20|6|10|4|https://openstax.org/books/prealgebra-2e/pages/2-2-evaluate-simplify-and-translate-expressions|
|MATH|Linear Equations & Inequalities|Unknown|20|6|10|4|https://openstax.org/books/elementary-algebra-2e/pages/2-3-solve-equations-with-variables-and-constants-on-both-sides; https://openstax.org/books/elementary-algebra-2e/pages/2-7-solve-linear-inequalities|
|MATH|Systems of Equations|Unknown|20|6|10|4|https://openstax.org/books/elementary-algebra-2e/pages/5-1-solve-systems-of-equations-by-graphing|
|MATH|Quadratic Equations|Unknown|20|6|10|4|https://openstax.org/books/intermediate-algebra-2e/pages/9-3-solve-quadratic-equations-using-the-quadratic-formula|
|MATH|Relations & Functions|Unknown|20|6|10|4|https://openstax.org/books/precalculus-2e/pages/1-1-functions-and-function-notation|
|MATH|Exponential & Logarithmic Functions|Unknown|20|6|10|4|https://openstax.org/books/precalculus-2e/pages/4-1-exponential-functions; https://openstax.org/books/precalculus-2e/pages/4-3-logarithmic-functions|
|MATH|Sequences, Series & Polynomials|Unknown|20|6|10|4|https://openstax.org/books/precalculus-2e/pages/11-2-arithmetic-sequences; https://openstax.org/books/precalculus-2e/pages/3-3-power-functions-and-polynomial-functions|
|MATH|Geometry & Measurement|Unknown|20|6|10|4|https://openstax.org/books/prealgebra-2e/pages/9-4-use-properties-of-rectangles-triangles-and-trapezoids; https://openstax.org/books/prealgebra-2e/pages/9-6-solve-geometry-applications-volume-and-surface-area|
|MATH|Coordinate Geometry & Conic Sections|Unknown|20|6|10|4|https://openstax.org/books/precalculus-2e/pages/10-1-the-ellipse|
|MATH|Trigonometry|Unknown|20|6|10|4|https://openstax.org/books/precalculus-2e/pages/5-4-right-triangle-trigonometry|
|MATH|Statistics & Probability|Unknown|20|6|10|4|https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data; https://openstax.org/books/introductory-statistics-2e/pages/3-1-terminology|
|MATH|Logic & Truth Tables|Unknown|20|6|10|4|https://openstax.org/books/contemporary-mathematics/pages/2-4-truth-tables-for-the-conditional-and-biconditional|
|MATH|Limits & Derivatives|Unknown|20|6|10|4|https://openstax.org/books/calculus-volume-1/pages/2-2-the-limit-of-a-function; https://openstax.org/books/calculus-volume-1/pages/3-3-differentiation-rules|
|MATH|Integration|Unknown|20|6|10|4|https://openstax.org/books/calculus-volume-1/pages/5-4-integration-formulas-and-the-net-change-theorem|
|SCIENCE|Scientific Method & Inquiry|Unknown|20|6|10|4|https://openstax.org/books/biology-2e/pages/1-1-the-science-of-biology|
|SCIENCE|Cells & Microscopy|Unknown|20|6|10|4|https://openstax.org/books/biology-2e/pages/4-1-studying-cells|
|SCIENCE|Genetics & Heredity|Unknown|20|6|10|4|https://openstax.org/books/biology-2e/pages/17-1-biotechnology; https://openstax.org/books/biology-2e/pages/12-1-mendels-experiments-and-the-laws-of-probability; https://openstax.org/books/biology-2e/pages/11-1-the-process-of-meiosis; https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells|
|SCIENCE|Human Body Systems & Homeostasis|Unknown|20|6|10|4|https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body; https://openstax.org/books/anatomy-and-physiology-2e/pages/1-5-homeostasis; https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance|
|SCIENCE|Evolution & Biotechnology|Unknown|20|6|10|4|https://openstax.org/books/biology-2e/pages/18-1-understanding-evolution; https://openstax.org/books/biology-2e/pages/17-1-biotechnology|
|SCIENCE|Ecosystems & Biodiversity|Unknown|20|6|10|4|https://openstax.org/books/biology-2e/pages/46-1-ecology-of-ecosystems|
|SCIENCE|Matter & Atomic Structure|Unknown|20|6|10|4|https://openstax.org/books/chemistry-2e/pages/7-1-ionic-bonding; https://openstax.org/books/chemistry-2e/pages/2-3-atomic-structure-and-symbolism; https://openstax.org/books/chemistry-2e/pages/2-1-early-ideas-in-atomic-theory|
|SCIENCE|Chemical Bonding|Unknown|20|6|10|4|https://openstax.org/books/chemistry-2e/pages/7-1-ionic-bonding; https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding|
|SCIENCE|Chemical Reactions & Stoichiometry|Unknown|20|6|10|4|https://openstax.org/books/chemistry-2e/pages/7-1-ionic-bonding; https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations|
|SCIENCE|Force, Motion & Energy|Unknown|20|6|10|4|https://openstax.org/books/physics/pages/4-3-newtons-second-law-of-motion; https://openstax.org/books/physics/pages/9-2-mechanical-energy-and-conservation-of-energy|
|SCIENCE|Electricity & Magnetism|Unknown|20|6|10|4|https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits; https://openstax.org/books/college-physics-2e/pages/22-1-magnets|
|SCIENCE|Waves, Light & Optics|Unknown|20|6|10|4|https://openstax.org/books/college-physics-2e/pages/16-9-waves; https://openstax.org/books/college-physics-2e/pages/25-2-the-law-of-reflection|
|SCIENCE|Earth Systems & Geological Processes|Unknown|20|6|10|4|https://www.nps.gov/subjects/geology/plate-tectonics.htm|
|SCIENCE|Plate Tectonics|Unknown|20|6|10|4|https://www.nps.gov/subjects/geology/plate-tectonics.htm|
|SCIENCE|Earth & Space Science|Unknown|20|6|10|4|https://www.usgs.gov/programs/earthquake-hazards/science-earthquakes; https://openstax.org/books/astronomy-2e/pages/4-2-the-seasons; https://www.usgs.gov/water-science-school/water-cycle; https://www.nps.gov/subjects/geology/rocks-and-minerals.htm|
|ENGLISH|Grammar & Sentence Structure|Unknown|20|6|10|4|https://owl.purdue.edu/owl/general_writing/grammar/subject_verb_agreement.html; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Vocabulary|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Reading Comprehension|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Paragraph & Essay Writing|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts|
|ENGLISH|Critical Reading|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/basic_business_letters/index.html; https://owl.purdue.edu/owl/research_and_citation/conducting_research/evaluating_sources_of_information/general_guidelines.html; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Informational & Expository Texts|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Philippine Literature|Unknown|20|6|10|4|https://www.gutenberg.org/cache/epub/6737/pg6737-images.html; https://www.gutenberg.org/cache/epub/15845/pg15845-images.html; https://www.gutenberg.org/cache/epub/16157/pg16157-images.html|
|ENGLISH|Afro-Asian Literature|Unknown|20|6|10|4|https://www.gutenberg.org/ebooks/7164|
|ENGLISH|Anglo-American Literature|Unknown|20|6|10|4|https://www.gutenberg.org/ebooks/1524; https://www.gutenberg.org/ebooks/2148|
|ENGLISH|World & Contemporary Literature|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|ENGLISH|Argumentative Writing|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts|
|ENGLISH|Oral Communication|Unknown|20|6|10|4|https://open.lib.umn.edu/commpractice/chapter/the-introduction/; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts|
|ENGLISH|Speech Writing & Public Speaking|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf|
|ENGLISH|Academic & Professional Writing|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/basic_business_letters/index.html|
|ENGLISH|Professional Correspondence|Unknown|20|6|10|4|https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/basic_business_letters/index.html|
|ENGLISH|Creative Writing|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/MALIKHAING-PAGSULAT-1.pdf|
|FILIPINO|Balarila|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagbasa at Pag-unawa|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagsulat ng Sanaysay|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Panitikang Pilipino|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Panitikang Asyano at Pandaigdig|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/3-G7-Filipino.pdf; https://www.gutenberg.org/ebooks/7164; https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Karunungang-Bayan|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/3-G7-Filipino.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Ibong Adarna|Unknown|20|6|10|4|https://www.gutenberg.org/cache/epub/16157/pg16157-images.html|
|FILIPINO|Florante at Laura|Unknown|20|6|10|4|https://www.gutenberg.org/cache/epub/15845/pg15845-images.html|
|FILIPINO|Noli Me Tangere|Unknown|20|6|10|4|https://www.gutenberg.org/cache/epub/6737/pg6737-images.html|
|FILIPINO|El Filibusterismo|Unknown|20|6|10|4|https://www.gutenberg.org/cache/epub/10676/pg10676-images.html|
|FILIPINO|Mitolohiya|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/3-G7-Filipino.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Pagsasalin|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|FILIPINO|Retorika at Talumpati|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf; https://openstax.org/books/writing-guide/pages/9-1-breaking-the-whole-into-its-parts; https://open.lib.umn.edu/commpractice/chapter/the-introduction/|
|FILIPINO|Konseptong Pangwika|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf|
|FILIPINO|Komunikasyon at Kulturang Pilipino|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf|
|FILIPINO|Sulating Akademiko|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/Filipino-CG.pdf|
|ARALING_PANLIPUNAN|Philippine History|Unknown|20|6|10|4|https://history.house.gov/Exhibitions-and-Publications/APA/Historical-essays/Exclusion-and-Empire/The-Philippines/; https://pvao.gov.ph/wp-content/uploads/2018/02/Philippine-History.pdf|
|ARALING_PANLIPUNAN|Southeast Asian History|Unknown|20|6|10|4|https://www.britannica.com/place/Southeast-Asia; https://www.britannica.com/topic/ASEAN|
|ARALING_PANLIPUNAN|World History & Civilizations|Unknown|20|6|10|4|https://openstax.org/books/world-history-volume-1/pages/3-1-early-civilizations|
|ARALING_PANLIPUNAN|Geography|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/ARALING-PANLIPUNAN-GRADES-4-7.pdf|
|ARALING_PANLIPUNAN|Economics & the National Economy|Unknown|20|6|10|4|https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services|
|ARALING_PANLIPUNAN|Government & Citizenship|Unknown|20|6|10|4|https://www.officialgazette.gov.ph/constitutions/1987-constitution/|
|ARALING_PANLIPUNAN|Philippine Politics & Governance|Unknown|20|6|10|4|https://openstax.org/books/world-history-volume-1/pages/3-1-early-civilizations; https://www.officialgazette.gov.ph/constitutions/1987-constitution/|
|ARALING_PANLIPUNAN|Culture & Society|Unknown|20|6|10|4|https://openstax.org/books/introduction-sociology-3e/pages/3-1-what-is-culture|
|ARALING_PANLIPUNAN|Social Institutions & Stratification|Unknown|20|6|10|4|https://openstax.org/books/introduction-sociology-3e/pages/9-1-what-is-social-stratification|
|ARALING_PANLIPUNAN|Social Sciences & Social Theories|Unknown|20|6|10|4|https://openstax.org/books/introduction-sociology-3e/pages/1-3-theoretical-perspectives-in-sociology; https://openstax.org/books/psychology-2e/pages/1-1-what-is-psychology|
|ARALING_PANLIPUNAN|Sikolohiyang Pilipino|Unknown|20|6|10|4|https://www.pssp.org.ph/wp-content/uploads/2014/11/Conference-2010.pdf|
|ARALING_PANLIPUNAN|Contemporary Issues|Unknown|20|6|10|4|https://unstats.un.org/sdgs/report/2026/; https://public.wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025|
|VALUES_EDUCATION|Isip, Kilos-Loob & Human Dignity|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf|
|VALUES_EDUCATION|Family & Relationships|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf; https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf|
|VALUES_EDUCATION|Pakikipagkapwa|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf; https://www.pssp.org.ph/wp-content/uploads/2014/11/Conference-2010.pdf|
|VALUES_EDUCATION|Society & the Common Good|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf|
|VALUES_EDUCATION|Moral Decision-Making|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf; https://openstax.org/books/introduction-philosophy/pages/9-1-requirements-of-a-normative-moral-theory|
|VALUES_EDUCATION|Personal Development & Self-Awareness|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf; https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development|
|VALUES_EDUCATION|Adolescent Development|Unknown|20|6|10|4|https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development; https://www.who.int/news-room/fact-sheets/detail/adolescent-health|
|VALUES_EDUCATION|Philosophy|Unknown|20|6|10|4|https://openstax.org/books/introduction-philosophy/pages/1-1-what-is-philosophy; https://openstax.org/books/introduction-philosophy/pages/9-1-requirements-of-a-normative-moral-theory|
|VALUES_EDUCATION|Human Freedom & Responsibility|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/9-G7-Values-Education.pdf; https://openstax.org/books/introduction-philosophy/pages/1-1-what-is-philosophy|
|MAPEH|Music Theory & Appreciation|Unknown|20|6|10|4|https://viva.pressbooks.pub/openmusictheory/chapter/notation-of-notes-clefs-and-ledger-lines/; https://viva.pressbooks.pub/openmusictheory/chapter/notating-rhythm/; https://viva.pressbooks.pub/openmusictheory/chapter/texture/; https://viva.pressbooks.pub/openmusictheory/chapter/other-aspects-of-notation/|
|MAPEH|Philippine & Southeast Asian Music|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/4-G7-MAPEH.pdf; https://www.arts.gov/honors/heritage/danongan-kalanduyan; https://asia.si.edu/research/essays/hynson/; https://asia.si.edu/explore-art-culture/audio/javanese-gamelan-music/; https://music.si.edu/node/1502; https://www.metmuseum.org/perspectives/meet-musical-instruments-galleries-families; https://viva.pressbooks.pub/openmusictheory/chapter/notation-of-notes-clefs-and-ledger-lines/; https://viva.pressbooks.pub/openmusictheory/chapter/notating-rhythm/|
|MAPEH|East Asian Arts|Unknown|20|6|10|4|https://www.metmuseum.org/essays/chinese-calligraphy; https://www.metmuseum.org/essays/woodblock-prints-in-the-ukiyo-e-style|
|MAPEH|Western Classical Arts|Unknown|20|6|10|4|https://www.metmuseum.org/essays/greek-art-in-the-archaic-period|
|MAPEH|Contemporary Philippine Arts|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/4-G7-MAPEH.pdf|
|MAPEH|Visual & Media Arts|Unknown|20|6|10|4|https://www.getty.edu/education/teachers/building_lessons/elements_art.pdf|
|MAPEH|Physical Education & Sports|Unknown|20|6|10|4|https://www.who.int/news-room/fact-sheets/detail/physical-activity|
|MAPEH|Fitness & Active Recreation|Unknown|20|6|10|4|https://www.who.int/news-room/fact-sheets/detail/physical-activity|
|MAPEH|Sports Officiating|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Sports-Officiating.pdf|
|MAPEH|Adolescent Health|Unknown|20|6|10|4|https://www.who.int/news-room/fact-sheets/detail/adolescent-health|
|MAPEH|Health Education|Unknown|20|6|10|4|https://www.who.int/news-room/fact-sheets/detail/healthy-diet; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food; https://www.who.int/news-room/fact-sheets/detail/physical-activity; https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance|
|MAPEH|Lifestyle & Wellness|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf; https://www.who.int/news-room/fact-sheets/detail/healthy-diet|
|BUSINESS_ENTREPRENEURSHIP|Entrepreneurship|Unknown|20|6|10|4|https://openstax.org/books/entrepreneurship/pages/11-3-conducting-a-feasibility-analysis; https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services|
|BUSINESS_ENTREPRENEURSHIP|Business Planning|Unknown|20|6|10|4|https://openstax.org/books/entrepreneurship/pages/11-4-the-business-plan|
|BUSINESS_ENTREPRENEURSHIP|Marketing & the Marketing Mix|Unknown|20|6|10|4|https://openstax.org/books/principles-marketing/pages/1-2-the-marketing-mix-and-the-4ps-of-marketing|
|BUSINESS_ENTREPRENEURSHIP|Fundamentals of Accountancy|Unknown|20|6|10|4|https://openstax.org/books/principles-financial-accounting/pages/3-1-describe-principles-assumptions-and-concepts-of-accounting-and-their-relationship-to-financial-statements; https://openstax.org/books/principles-financial-accounting/pages/3-2-define-and-describe-the-expanded-accounting-equation-and-its-relationship-to-analyzing-transactions|
|BUSINESS_ENTREPRENEURSHIP|Accounting for Service & Merchandising|Unknown|20|6|10|4|https://openstax.org/books/principles-financial-accounting/pages/6-1-compare-and-contrast-merchandising-versus-service-activities-and-transactions|
|BUSINESS_ENTREPRENEURSHIP|Business Mathematics|Unknown|20|6|10|4|https://openstax.org/books/principles-finance/pages/7-4-applications-of-tvm-in-finance|
|BUSINESS_ENTREPRENEURSHIP|Markup, Markdown & Payroll|Unknown|20|6|10|4|https://openstax.org/books/principles-finance/pages/7-4-applications-of-tvm-in-finance|
|BUSINESS_ENTREPRENEURSHIP|Business Finance|Unknown|20|6|10|4|https://openstax.org/books/principles-finance/pages/1-1-what-is-finance; https://openstax.org/books/principles-finance/pages/7-4-applications-of-tvm-in-finance|
|BUSINESS_ENTREPRENEURSHIP|Financial Statements|Unknown|20|6|10|4|https://openstax.org/books/principles-financial-accounting/pages/2-1-describe-the-income-statement-statement-of-owners-equity-balance-sheet-and-statement-of-cash-flows-and-how-they-interrelate|
|BUSINESS_ENTREPRENEURSHIP|Capital Budgeting|Unknown|20|6|10|4|https://openstax.org/books/principles-finance/pages/16-2-net-present-value-npv-method|
|BUSINESS_ENTREPRENEURSHIP|Simple & Compound Interest|Unknown|20|6|10|4|https://openstax.org/books/principles-finance/pages/7-4-applications-of-tvm-in-finance|
|RESEARCH_DIGITAL_LITERACY|Research Writing|Unknown|20|6|10|4|https://owl.purdue.edu/owl/research_and_citation/conducting_research/evaluating_sources_of_information/general_guidelines.html; https://www.deped.gov.ph/wp-content/uploads/2019/01/English-CG.pdf|
|RESEARCH_DIGITAL_LITERACY|Qualitative Research|Unknown|20|6|10|4|https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Quantitative Research|Unknown|20|6|10|4|https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Research Design & Data Collection|Unknown|20|6|10|4|https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods; https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling|
|RESEARCH_DIGITAL_LITERACY|Research Statistics|Unknown|20|6|10|4|https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling; https://openstax.org/books/introductory-statistics-2e/pages/9-1-null-and-alternative-hypotheses|
|RESEARCH_DIGITAL_LITERACY|Literature Reviews|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Research Defense & Presentation|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf; https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Inquiries, Investigations & Immersion|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/SHS-Applied_Inquiries-Investigations-and-Immersions-CG.pdf|
|RESEARCH_DIGITAL_LITERACY|Media & Information Literacy|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Fact-Checking & Digital Ethics|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf|
|RESEARCH_DIGITAL_LITERACY|Empowerment Technologies|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/2-1-software-basics; https://openstax.org/books/workplace-software-skills/pages/1-2-computer-hardware-and-networks; https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax|
|RESEARCH_DIGITAL_LITERACY|Online Productivity|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/2-1-software-basics; https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology|
|RESEARCH_DIGITAL_LITERACY|Web Design & Technology for Social Change|Unknown|20|6|10|4|https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax; https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology|
|MISCELLANEOUS|Cooking & Food Preparation|Unknown|20|6|10|4|https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food|
|MISCELLANEOUS|Baking & Pastry|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/Bread-and-Pastry-NC-II-CG.pdf; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food|
|MISCELLANEOUS|Food & Beverage Service|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/Food-and-Beverage-Services.pdf; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food|
|MISCELLANEOUS|Home Economics|Unknown|20|6|10|4|https://www.who.int/publications/i/item/9789241594639; https://www.who.int/activities/promoting-safe-food-handling/five-key-to-safer-food; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
|MISCELLANEOUS|Agriculture & Crop Production|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/G7-TLE_-AFA-_-FCS-_-IA.pdf|
|MISCELLANEOUS|Agri-Fishery Skills|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf; https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6709e/x6709e02.htm|
|MISCELLANEOUS|Computer Basics & ICT|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/1-2-computer-hardware-and-networks; https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
|MISCELLANEOUS|Computer Assembly & Operating Systems|Unknown|20|6|10|4|https://openstax.org/books/workplace-software-skills/pages/1-2-computer-hardware-and-networks; https://www.deped.gov.ph/wp-content/uploads/27-G9-_-G10-TLE_-ICT-Computer-Systems-Servicing.pdf|
|MISCELLANEOUS|Computer Systems Servicing|Unknown|20|6|10|4|https://www.deped.gov.ph/wp-content/uploads/27-G9-_-G10-TLE_-ICT-Computer-Systems-Servicing.pdf; https://openstax.org/books/workplace-software-skills/pages/1-4-safety-security-privacy-and-the-ethical-use-of-technology|
|MISCELLANEOUS|Networking, Cabling & IP Addressing|Unknown|20|6|10|4|https://www.rfc-editor.org/rfc/rfc1918.html; https://www.rfc-editor.org/rfc/rfc4632.html; https://openstax.org/books/workplace-software-skills/pages/1-2-computer-hardware-and-networks|
|MISCELLANEOUS|Server Administration|Unknown|20|6|10|4|https://csrc.nist.gov/pubs/sp/800/123/final; https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final|
|MISCELLANEOUS|Electrical Installation & Maintenance|Unknown|20|6|10|4|https://www.osha.gov/electrical|
|MISCELLANEOUS|Welding|Unknown|20|6|10|4|https://www.osha.gov/welding-cutting-brazing|
|MISCELLANEOUS|Industrial Arts|Unknown|20|6|10|4|https://www.osha.gov/hand-power-tools; https://www.osha.gov/sites/default/files/publications/OSHA3080.pdf; https://www.deped.gov.ph/wp-content/uploads/2019/01/EPP-CG.pdf|
