# Curriculum source verification

Checked 11 November 2026 (Philippine date). 47 subjects; 292 subject/topic records; 408 topic/grade associations. No DepEd endorsement is claimed.

## Verification method and limits

All six requested LRMDS pages returned HTTP 200 with curriculum categories and resource links after retrying with a browser user agent; the initial default-agent requests returned 403. The guide listings and nine subject-specific guide metadata records were inspected. The portal disables full guide View/Download for anonymous access. Consequently **verified-index** means an official grade-specific curriculum-domain label was read, not that the full PDF competency table was verified. SHS core and academic track pages were also inspected; one General Mathematics resource listing returned HTTP 500. No resource title was converted into a topic.

The official [Strengthened SHS page](https://www.deped.gov.ph/strengthened-shs-program/) was inspected and 36 linked subject PDFs were downloaded. **verified-guide** means a content heading was located inside the PDF, with an absolute PDF page number recorded. Guides explicitly marked Grade 11, Grade 12, or Grade 11/12 determine grades. For newer guides without a cover grade, the page’s “New Grade 12 Curriculum Guides” section supplies the Grade 12 association. These are course-availability associations, not an assertion that every school offers each elective. PDF page numbers include cover/blank pages. Receipt hashes and topic/page evidence are in [source-verification-2026-11-11.json](prisma/data/curriculum/source-verification-2026-11-11.json).

## Curriculum versions and gaps

- **Grades 7–10:** LRMDS legacy K to 12 content-domain taxonomy. Exact editions are absent on the index; inspected guide records were published in 2014 or 2017. Current revised K–10/MATATAG is a separate curriculum. The accessible [official MATATAG page](https://www.deped.gov.ph/matatagcurriculumk147/) confirms separate guides, but those guides were not fully extracted here. Do not treat legacy index entries as a current-school-year syllabus.
- **TLE Grades 7–8:** no import from generic “Home Economics” links with inconsistent parent labels. Grades 9–10 include only the explicitly named specialization categories; detailed skill competencies remain incomplete. Masonry/technical-drafting parent anomalies are excluded.
- **SHS:** six Strengthened core subjects and 30 selected electives. Current Academic and Technical Professional structures are retained, including clusters; no old ABM/HUMSS/STEM/TVL strand is assigned to a new course by inference. The legacy Grade 11/12 pages list core, applied, Academic (ABM, HUMSS, STEM, GAS), Arts and Design, Sports, TVL, and Unique tracks; their full topic catalogs remain unextracted. They are not covered by the Strengthened records.
- **SHS elective gaps:** additional science sequences (e.g. Biology 2/4, Chemistry 2/4, Physics 2/4), Earth and Space Science sequences, arts apprenticeships, language electives, sports electives, field exposures, and most Tech-Pro specializations remain outside this subset. Within included courses, the selected headings are a domain/unit selection vocabulary, not an exhaustive competency inventory. No missing subject is represented by a guessed topic.
- **Calendar/rollout:** the official SHS page publishes semestral guides and three-term BOWs and links Grade 11 full-implementation and Grade 12 pilot notices. The downloaded guide version is recorded per association. Three-term BOWs, school/cohort applicability, and legacy Grade 12 mappings need separate validation. No automatic school-year eligibility is inferred.

## Grade page access

| Grade | Official page | Result |
| --- | --- | --- |
| 7 | https://lrmds.deped.gov.ph/grade/7 | HTTP 200; curriculum resources present |
| 8 | https://lrmds.deped.gov.ph/grade/8 | HTTP 200; curriculum resources present |
| 9 | https://lrmds.deped.gov.ph/grade/9 | HTTP 200; curriculum resources present |
| 10 | https://lrmds.deped.gov.ph/grade/10 | HTTP 200; curriculum resources present |
| 11 | https://lrmds.deped.gov.ph/grade/11 | HTTP 200; curriculum resources present |
| 12 | https://lrmds.deped.gov.ph/grade/12 | HTTP 200; curriculum resources present |

## Per-grade subject verification

Each topic’s exact source URL, curriculum version, grade evidence URL, track/strand/cluster, and PDF page where applicable are also stored in its `curriculum.associations` JSON. Existing `Subject`/`Topic` IDs, active flags, and `gradeLevels` arrays are reused; no competing topic table or destructive schema change is required. Description/limitations live in `curriculum.note`.

| Grade | Subject | Version / track | Verification | Official reference | Gap |
| --- | --- | --- | --- | --- | --- |
| 7 | Araling Panlipunan | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5447 | Full guide text / current revised curriculum not verified |
| 8 | Araling Panlipunan | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5447 | Full guide text / current revised curriculum not verified |
| 9 | Araling Panlipunan | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5447 | Full guide text / current revised curriculum not verified |
| 10 | Araling Panlipunan | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5447 | Full guide text / current revised curriculum not verified |
| 7 | Arts | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5448 | Full guide text / current revised curriculum not verified |
| 8 | Arts | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5448 | Full guide text / current revised curriculum not verified |
| 9 | Arts | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5448 | Full guide text / current revised curriculum not verified |
| 10 | Arts | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5448 | Full guide text / current revised curriculum not verified |
| 7 | Edukasyon sa Pagpapakatao | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5451 | Full guide text / current revised curriculum not verified |
| 8 | Edukasyon sa Pagpapakatao | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5451 | Full guide text / current revised curriculum not verified |
| 9 | Edukasyon sa Pagpapakatao | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5451 | Full guide text / current revised curriculum not verified |
| 10 | Edukasyon sa Pagpapakatao | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5451 | Full guide text / current revised curriculum not verified |
| 7 | English | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5449 | Full guide text / current revised curriculum not verified |
| 8 | English | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5449 | Full guide text / current revised curriculum not verified |
| 9 | English | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5449 | Full guide text / current revised curriculum not verified |
| 10 | English | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5449 | Full guide text / current revised curriculum not verified |
| 7 | Filipino | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10 | Full guide text / current revised curriculum not verified |
| 8 | Filipino | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10 | Full guide text / current revised curriculum not verified |
| 9 | Filipino | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10 | Full guide text / current revised curriculum not verified |
| 10 | Filipino | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9 | Full guide text / current revised curriculum not verified |
| 7 | Health | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5453 | Full guide text / current revised curriculum not verified |
| 8 | Health | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5453 | Full guide text / current revised curriculum not verified |
| 9 | Health | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5453 | Full guide text / current revised curriculum not verified |
| 10 | Health | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5453 | Full guide text / current revised curriculum not verified |
| 7 | Mathematics | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5455 | Full guide text / current revised curriculum not verified |
| 8 | Mathematics | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5455 | Full guide text / current revised curriculum not verified |
| 9 | Mathematics | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5455 | Full guide text / current revised curriculum not verified |
| 10 | Mathematics | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5455 | Full guide text / current revised curriculum not verified |
| 7 | Music | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5457 | Full guide text / current revised curriculum not verified |
| 8 | Music | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5457 | Full guide text / current revised curriculum not verified |
| 9 | Music | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5457 | Full guide text / current revised curriculum not verified |
| 10 | Music | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5457 | Full guide text / current revised curriculum not verified |
| 7 | Physical Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5458 | Full guide text / current revised curriculum not verified |
| 8 | Physical Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5458 | Full guide text / current revised curriculum not verified |
| 9 | Physical Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5458 | Full guide text / current revised curriculum not verified |
| 10 | Physical Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5458 | Full guide text / current revised curriculum not verified |
| 7 | Science | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5459 | Full guide text / current revised curriculum not verified |
| 8 | Science | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5459 | Full guide text / current revised curriculum not verified |
| 9 | Science | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/detail/5459 | Full guide text / current revised curriculum not verified |
| 10 | Science | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/7; https://lrmds.deped.gov.ph/grade/8; https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/detail/5459 | Full guide text / current revised curriculum not verified |
| 9 | Technology and Livelihood Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/9; https://lrmds.deped.gov.ph/grade/10 | Full guide text / current revised curriculum not verified |
| 10 | Technology and Livelihood Education | LRMDS legacy K to 12; exact edition unspecified; JHS | verified-index | https://lrmds.deped.gov.ph/grade/10; https://lrmds.deped.gov.ph/grade/9 | Full guide text / current revised curriculum not verified |
| 11 | Effective Communication | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Effective-Communication-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | General Mathematics | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/GENERAL-MATHEMATICS-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | General Science | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/GENERAL-SCIENCE-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Life and Career Skills | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Mabisang Komunikasyon | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Pag-aaral ng Kasaysayan at Lipunang Pilipino | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Core (all tracks) | verified-guide | https://www.deped.gov.ph/wp-content/uploads/PAG-AARAL-NG-KASAYSAYAN-AT-LIPUNANG-PILIPINO-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Creative Production and Presentation | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/CREATIVE-PRODUCTION-AND-PRESENTATION.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Advanced Mathematics | Strengthened SHS — single-term CG; updated 2026-05-29; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/1-Updated-as-of-05.29.26_Advanced-Mathematics.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Basic Calculus | Strengthened SHS — single-term CG; updated 2026-05-29; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Biology 3 | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/BIOLOGY-3.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Chemistry 3 | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Database Management | Strengthened SHS — single-term CG; updated 2026-05-29; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/5-Updated-as-of-05.29.26_Database-Management.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Fundamentals of Data Analytics | Strengthened SHS — single-term CG; updated 2026-05-29; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Physics 3 | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/PHYSICS-3.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Pre-Calculus | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Research 1 | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Field Experience | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | Selected content headings; other competencies not exhaustively extracted |
| 12 | Research 2 | Strengthened SHS — single-term CG; publication/revision date unspecified; Academic; Field Experience | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | Selected content headings; other competencies not exhaustively extracted |
| 11 | Citizenship and Civic Engagement | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Citizenship and Civic Engagement | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Contemporary Literature 1 | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Contemporary Literature 1 | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Introduction to Philosophy | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Philosophy-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Philippine Governance (Philippine Politics and Governance) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Philippine Governance (Philippine Politics and Governance) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Arts, Social Sciences, and Humanities | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Business 1 (Basic Accounting) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Business-1-Basic-Accounting-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Business 2 (Business Finance and Income Taxation) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Business 2 (Business Finance and Income Taxation) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Business 3 (Business Economics) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Business 3 (Business Economics) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Contemporary Marketing | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Contemporary Marketing | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Entrepreneurship | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/strengthened-shs-program/; https://www.deped.gov.ph/wp-content/uploads/Entrepreneurship-1.pdf | Selected content headings; other competencies not exhaustively extracted |
| 11 | Introduction to Organization and Management | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Business and Entrepreneurship | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Organization-and-Management-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Biology 1 | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Biology-1-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Chemistry 1 | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Chemistry-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Physics 1 | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Science, Technology, Engineering, and Mathematics | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Physics-1-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Physical Education 1 (Fitness and Recreation) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Sports, Health, and Wellness | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Physical Education 1 (Fitness and Recreation) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Sports, Health, and Wellness | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Physical Education 2 (Sports and Dance) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Sports, Health, and Wellness | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Physical Education 2 (Sports and Dance) | Strengthened SHS — semestral CG; publication/revision date unspecified; Academic; Sports, Health, and Wellness | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Agricultural Crops Production | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Agricultural Crops Production | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Bakery Operations | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Bakery Operations | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Kitchen Operations | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Kitchen Operations | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 11 | Computer Systems Servicing | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |
| 12 | Computer Systems Servicing | Strengthened SHS — annual four-quarter CG; publication/revision date unspecified; Technical Professional | verified-guide | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf;  | Selected content headings; other competencies not exhaustively extracted |

## Topic-level source references

| Grade | Subject | Topic | Source | PDF page |
| --- | --- | --- | --- | --- |
| 7 | Araling Panlipunan | Kolonyalismo at Imperyalismo sa Timog at Kanlurang Asya | https://lrmds.deped.gov.ph/list/kto12/subject/1261 | Index label |
| 7 | Araling Panlipunan | Paghubog ng Sinaunang Kabihasnan sa Asya | https://lrmds.deped.gov.ph/list/kto12/subject/1259 | Index label |
| 7 | Araling Panlipunan | Katangiang Pisikal ng Asya | https://lrmds.deped.gov.ph/list/kto12/subject/1258 | Index label |
| 8 | Araling Panlipunan | Ang Unang Digmaang Pandaigdig | https://lrmds.deped.gov.ph/list/kto12/subject/1265 | Index label |
| 8 | Araling Panlipunan | Ang Pagsisimula ng mga Kabihasnan sa Daigdig | https://lrmds.deped.gov.ph/list/kto12/subject/1263 | Index label |
| 8 | Araling Panlipunan | Paglakas ng Europa | https://lrmds.deped.gov.ph/list/kto12/subject/1264 | Index label |
| 8 | Araling Panlipunan | Heograpiya ng Daigdig | https://lrmds.deped.gov.ph/list/kto12/subject/1262 | Index label |
| 9 | Araling Panlipunan | Paikot na Daloy ng Ekonomiya | https://lrmds.deped.gov.ph/list/kto12/subject/1268 | Index label |
| 9 | Araling Panlipunan | Kahulugan ng Ekonomiks | https://lrmds.deped.gov.ph/list/kto12/subject/1266 | Index label |
| 9 | Araling Panlipunan | Konsepto at Palatandaan ng Pambansang Kaunlaran | https://lrmds.deped.gov.ph/list/kto12/subject/1269 | Index label |
| 9 | Araling Panlipunan | Demand | https://lrmds.deped.gov.ph/list/kto12/subject/1267 | Index label |
| 10 | Araling Panlipunan | Mga Isyung Politikal at Pangkapayapaan | https://lrmds.deped.gov.ph/list/kto12/subject/1271 | Index label |
| 10 | Araling Panlipunan | Mga Isyu sa Karapatang Pantao at Gender | https://lrmds.deped.gov.ph/list/kto12/subject/1272 | Index label |
| 10 | Araling Panlipunan | Kahalagahan ng Pagaaral ng mga Kontemporaryong Isyu | https://lrmds.deped.gov.ph/list/kto12/subject/1270 | Index label |
| 10 | Araling Panlipunan | Mga Isyung PangEdukasyon at Pansibiko at Pagkamamamayan Civics and Citizenship | https://lrmds.deped.gov.ph/list/kto12/subject/1273 | Index label |
| 7 | Arts | Arts and Crafts of Mindanao | https://lrmds.deped.gov.ph/list/kto12/subject/699 | Index label |
| 7 | Arts | Arts and Crafts of Luzon Highlands and Lowlands | https://lrmds.deped.gov.ph/list/kto12/subject/692 | Index label |
| 7 | Arts | Festivals and Theatrical Forms | https://lrmds.deped.gov.ph/list/kto12/subject/701 | Index label |
| 7 | Arts | Arts and Crafts of MIMAROPA Mindoro Marinduque Romblon and Palawan and the Visayas | https://lrmds.deped.gov.ph/list/kto12/subject/694 | Index label |
| 8 | Arts | Festivals and Theatrical Forms of Asia | https://lrmds.deped.gov.ph/list/kto12/subject/723 | Index label |
| 8 | Arts | Arts of East Asia | https://lrmds.deped.gov.ph/list/kto12/subject/712 | Index label |
| 8 | Arts | Arts of South West And Central Asia | https://lrmds.deped.gov.ph/list/kto12/subject/722 | Index label |
| 8 | Arts | Arts of Southeast Asia | https://lrmds.deped.gov.ph/list/kto12/subject/711 | Index label |
| 9 | Arts | Western Classical Plays and Operas | https://lrmds.deped.gov.ph/list/kto12/subject/745 | Index label |
| 9 | Arts | Arts of the Renaissance and Baroque Period | https://lrmds.deped.gov.ph/list/kto12/subject/731 | Index label |
| 9 | Arts | Arts of the Neoclassic and Romantic Period | https://lrmds.deped.gov.ph/list/kto12/subject/735 | Index label |
| 9 | Arts | Western and Classical Art Traditions | https://lrmds.deped.gov.ph/list/kto12/subject/730 | Index label |
| 10 | Arts | Modern Art | https://lrmds.deped.gov.ph/list/kto12/subject/749 | Index label |
| 10 | Arts | Original Performance with the Use of Media | https://lrmds.deped.gov.ph/list/kto12/subject/755 | Index label |
| 10 | Arts | Technologybased Art | https://lrmds.deped.gov.ph/list/kto12/subject/751 | Index label |
| 10 | Arts | Mediabased Arts and Design in the Philippines | https://lrmds.deped.gov.ph/list/kto12/subject/754 | Index label |
| 7 | Edukasyon sa Pagpapakatao | Ang Pagtatakda ng Mithiin at Pagpapasiya | https://lrmds.deped.gov.ph/list/kto12/subject/883 | Index label |
| 7 | Edukasyon sa Pagpapakatao | Ang Pagkatao ng Tao | https://lrmds.deped.gov.ph/list/kto12/subject/880 | Index label |
| 7 | Edukasyon sa Pagpapakatao | Ang Pagpapahalaga at Birtud | https://lrmds.deped.gov.ph/list/kto12/subject/882 | Index label |
| 7 | Edukasyon sa Pagpapakatao | Pagkilala at Pamamahala sa mga Pagbabago sa Sarili | https://lrmds.deped.gov.ph/list/kto12/subject/874 | Index label |
| 8 | Edukasyon sa Pagpapakatao | Ang Pakikipagkapwa | https://lrmds.deped.gov.ph/list/kto12/subject/886 | Index label |
| 8 | Edukasyon sa Pagpapakatao | Mga Pagpapahalaga at Birtud sa Pakikipagkapwa | https://lrmds.deped.gov.ph/list/kto12/subject/887 | Index label |
| 8 | Edukasyon sa Pagpapakatao | Ang Pamilya Bilang Ugat ng Pakikipagkapwa | https://lrmds.deped.gov.ph/list/kto12/subject/885 | Index label |
| 8 | Edukasyon sa Pagpapakatao | Mga Isyu sa Pakikipagkapwa | https://lrmds.deped.gov.ph/list/kto12/subject/888 | Index label |
| 9 | Edukasyon sa Pagpapakatao | Mapanagutang Pagpaplano ng Kursong Akademiko o TeknikalBokasyonal Negosyo o Hanapbuhay | https://lrmds.deped.gov.ph/list/kto12/subject/909 | Index label |
| 9 | Edukasyon sa Pagpapakatao | Ang Tungkulin ng Tao sa Lipunan | https://lrmds.deped.gov.ph/list/kto12/subject/905 | Index label |
| 9 | Edukasyon sa Pagpapakatao | Mga Kaugnay na Pagpapahalaga sa Paggawa | https://lrmds.deped.gov.ph/list/kto12/subject/908 | Index label |
| 9 | Edukasyon sa Pagpapakatao | Ang Papel ng Lipunan sa Tao | https://lrmds.deped.gov.ph/list/kto12/subject/903 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Ang Moral na Pagkatao | https://lrmds.deped.gov.ph/list/kto12/subject/910 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Pagmamahal sa Bayan | https://lrmds.deped.gov.ph/list/kto12/subject/1714 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Ang Aking Posisyon sa mga Isyung Moral | https://lrmds.deped.gov.ph/list/kto12/subject/915 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Ang Makataong Kilos | https://lrmds.deped.gov.ph/list/kto12/subject/912 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Pangangalaga sa Kalikasan | https://lrmds.deped.gov.ph/list/kto12/subject/1715 | Index label |
| 10 | Edukasyon sa Pagpapakatao | Mga Pangunahing Birtud at Pagpapahalagang Moral | https://lrmds.deped.gov.ph/list/kto12/subject/914 | Index label |
| 7 | English | Philippine Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1007 | Index label |
| 7 | English | Grammar Awareness | https://lrmds.deped.gov.ph/list/kto12/subject/1352 | Index label |
| 8 | English | Grammar Awareness | https://lrmds.deped.gov.ph/list/kto12/subject/1360 | Index label |
| 9 | English | Grammar Awareness | https://lrmds.deped.gov.ph/list/kto12/subject/1368 | Index label |
| 10 | English | Grammar Awareness | https://lrmds.deped.gov.ph/list/kto12/subject/1376 | Index label |
| 7 | English | Writing and Composition | https://lrmds.deped.gov.ph/list/kto12/subject/1350 | Index label |
| 8 | English | Writing and Composition | https://lrmds.deped.gov.ph/list/kto12/subject/1358 | Index label |
| 9 | English | Writing and Composition | https://lrmds.deped.gov.ph/list/kto12/subject/1366 | Index label |
| 10 | English | Writing and Composition | https://lrmds.deped.gov.ph/list/kto12/subject/1374 | Index label |
| 7 | English | Vocabulary Development | https://lrmds.deped.gov.ph/list/kto12/subject/1348 | Index label |
| 8 | English | Vocabulary Development | https://lrmds.deped.gov.ph/list/kto12/subject/1356 | Index label |
| 9 | English | Vocabulary Development | https://lrmds.deped.gov.ph/list/kto12/subject/1364 | Index label |
| 10 | English | Vocabulary Development | https://lrmds.deped.gov.ph/list/kto12/subject/1372 | Index label |
| 7 | English | Listening Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1346 | Index label |
| 8 | English | Listening Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1354 | Index label |
| 9 | English | Listening Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1362 | Index label |
| 10 | English | Listening Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1370 | Index label |
| 7 | English | Oral Language and Fluency | https://lrmds.deped.gov.ph/list/kto12/subject/1351 | Index label |
| 8 | English | Oral Language and Fluency | https://lrmds.deped.gov.ph/list/kto12/subject/1359 | Index label |
| 9 | English | Oral Language and Fluency | https://lrmds.deped.gov.ph/list/kto12/subject/1367 | Index label |
| 10 | English | Oral Language and Fluency | https://lrmds.deped.gov.ph/list/kto12/subject/1375 | Index label |
| 7 | English | Viewing Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1347 | Index label |
| 8 | English | Viewing Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1355 | Index label |
| 9 | English | Viewing Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1363 | Index label |
| 10 | English | Viewing Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1371 | Index label |
| 7 | English | Reading Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1345 | Index label |
| 8 | English | Reading Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1353 | Index label |
| 9 | English | Reading Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1361 | Index label |
| 10 | English | Reading Comprehension | https://lrmds.deped.gov.ph/list/kto12/subject/1369 | Index label |
| 8 | English | Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1357 | Index label |
| 9 | English | Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1365 | Index label |
| 10 | English | Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1373 | Index label |
| 8 | English | Afro-Asian Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1008 | Index label |
| 9 | English | British-American Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1009 | Index label |
| 10 | English | World Literature | https://lrmds.deped.gov.ph/list/kto12/subject/1010 | Index label |
| 7 | Filipino | Pag-unawa sa Napakinggan | https://lrmds.deped.gov.ph/list/kto12/subject/1399 | Index label |
| 8 | Filipino | Pag-unawa sa Napakinggan | https://lrmds.deped.gov.ph/list/kto12/subject/1407 | Index label |
| 9 | Filipino | Pag-unawa sa Napakinggan | https://lrmds.deped.gov.ph/list/kto12/subject/1415 | Index label |
| 10 | Filipino | Pag-unawa sa Napakinggan | https://lrmds.deped.gov.ph/list/kto12/subject/1423 | Index label |
| 7 | Filipino | Ibong Adarna: Isang Obra Maestra | https://lrmds.deped.gov.ph/list/kto12/subject/1091 | Index label |
| 7 | Filipino | Panitikang Bisaya: Repleksiyon ng Kabisayaan | https://lrmds.deped.gov.ph/list/kto12/subject/1089 | Index label |
| 7 | Filipino | Estratehiya sa Pag-aaral | https://lrmds.deped.gov.ph/list/kto12/subject/1406 | Index label |
| 8 | Filipino | Estratehiya sa Pag-aaral | https://lrmds.deped.gov.ph/list/kto12/subject/1414 | Index label |
| 9 | Filipino | Estratehiya sa Pag-aaral | https://lrmds.deped.gov.ph/list/kto12/subject/1422 | Index label |
| 10 | Filipino | Estratehiya sa Pag-aaral | https://lrmds.deped.gov.ph/list/kto12/subject/1430 | Index label |
| 7 | Filipino | Pagsulat | https://lrmds.deped.gov.ph/list/kto12/subject/1404 | Index label |
| 8 | Filipino | Pagsulat | https://lrmds.deped.gov.ph/list/kto12/subject/1412 | Index label |
| 9 | Filipino | Pagsulat | https://lrmds.deped.gov.ph/list/kto12/subject/1420 | Index label |
| 10 | Filipino | Pagsulat | https://lrmds.deped.gov.ph/list/kto12/subject/1428 | Index label |
| 7 | Filipino | Panonood | https://lrmds.deped.gov.ph/list/kto12/subject/1402 | Index label |
| 8 | Filipino | Panonood | https://lrmds.deped.gov.ph/list/kto12/subject/1410 | Index label |
| 10 | Filipino | Panonood | https://lrmds.deped.gov.ph/list/kto12/subject/1426 | Index label |
| 7 | Filipino | Pag-unawa sa Binasa | https://lrmds.deped.gov.ph/list/kto12/subject/1400 | Index label |
| 8 | Filipino | Pag-unawa sa Binasa | https://lrmds.deped.gov.ph/list/kto12/subject/1408 | Index label |
| 9 | Filipino | Pag-unawa sa Binasa | https://lrmds.deped.gov.ph/list/kto12/subject/1416 | Index label |
| 10 | Filipino | Pag-unawa sa Binasa | https://lrmds.deped.gov.ph/list/kto12/subject/1424 | Index label |
| 7 | Filipino | Panitikang Luzon: Larawan ng Pagkakakilanlan | https://lrmds.deped.gov.ph/list/kto12/subject/1090 | Index label |
| 7 | Filipino | Mga Akdang Pampanitikan: Salamin ng Mindanao | https://lrmds.deped.gov.ph/list/kto12/subject/1088 | Index label |
| 7 | Filipino | Wika at Gramatika | https://lrmds.deped.gov.ph/list/kto12/subject/1405 | Index label |
| 8 | Filipino | Wika at Gramatika | https://lrmds.deped.gov.ph/list/kto12/subject/1413 | Index label |
| 9 | Filipino | Wika at Gramatika | https://lrmds.deped.gov.ph/list/kto12/subject/1421 | Index label |
| 10 | Filipino | Wika at Gramatika | https://lrmds.deped.gov.ph/list/kto12/subject/1429 | Index label |
| 7 | Filipino | Pagsasalita | https://lrmds.deped.gov.ph/list/kto12/subject/1403 | Index label |
| 8 | Filipino | Pagsasalita | https://lrmds.deped.gov.ph/list/kto12/subject/1411 | Index label |
| 9 | Filipino | Pagsasalita | https://lrmds.deped.gov.ph/list/kto12/subject/1419 | Index label |
| 10 | Filipino | Pagsasalita | https://lrmds.deped.gov.ph/list/kto12/subject/1427 | Index label |
| 7 | Filipino | Paglinang ng Talasalitaan | https://lrmds.deped.gov.ph/list/kto12/subject/1401 | Index label |
| 8 | Filipino | Paglinang ng Talasalitaan | https://lrmds.deped.gov.ph/list/kto12/subject/1409 | Index label |
| 9 | Filipino | Paglinang ng Talasalitaan | https://lrmds.deped.gov.ph/list/kto12/subject/1417 | Index label |
| 10 | Filipino | Paglinang ng Talasalitaan | https://lrmds.deped.gov.ph/list/kto12/subject/1425 | Index label |
| 8 | Filipino | Kontemporaryong Panitikan Tungo sa Kultura at Panitikang Popular | https://lrmds.deped.gov.ph/list/kto12/subject/1094 | Index label |
| 8 | Filipino | Salamin ng Kahapon...Bakasin Natin Ngayon | https://lrmds.deped.gov.ph/list/kto12/subject/1092 | Index label |
| 8 | Filipino | Florante at Laura: Isang Obra Maestrang Pampanitikan ng Pilipinas | https://lrmds.deped.gov.ph/list/kto12/subject/1095 | Index label |
| 8 | Filipino | Sandigan ng Lahi... Ikarangal Natin | https://lrmds.deped.gov.ph/list/kto12/subject/1093 | Index label |
| 9 | Filipino | Mga Akdang Pampanitikan ng Kanlurang Asya | https://lrmds.deped.gov.ph/list/kto12/subject/1098 | Index label |
| 9 | Filipino | Noli Me Tangere sa Puso ng mga Asyano | https://lrmds.deped.gov.ph/list/kto12/subject/1099 | Index label |
| 9 | Filipino | Mga Akdang Pampanitikan ng Silangang Asya | https://lrmds.deped.gov.ph/list/kto12/subject/1097 | Index label |
| 10 | Filipino | El Filibusterismo sa Nagbabagong Daigdig | https://lrmds.deped.gov.ph/list/kto12/subject/1103 | Index label |
| 10 | Filipino | Panitikan ng mga Bansa sa Kanluran | https://lrmds.deped.gov.ph/list/kto12/subject/1101 | Index label |
| 10 | Filipino | Panitikan ng Africa at Persia | https://lrmds.deped.gov.ph/list/kto12/subject/1102 | Index label |
| 10 | Filipino | Panitikang Mediterranean | https://lrmds.deped.gov.ph/list/kto12/subject/1100 | Index label |
| 7 | Health | Injury Prevention, Safety and First Aid | https://lrmds.deped.gov.ph/list/kto12/subject/1288 | Index label |
| 7 | Health | Nutrition | https://lrmds.deped.gov.ph/list/kto12/subject/1286 | Index label |
| 7 | Health | Prevention and Control of Diseases and Disorders (Non-communicable Diseases) | https://lrmds.deped.gov.ph/list/kto12/subject/1712 | Index label |
| 8 | Health | Prevention and Control of Diseases and Disorders (Non-communicable Diseases) | https://lrmds.deped.gov.ph/list/kto12/subject/1292 | Index label |
| 7 | Health | Personal Health | https://lrmds.deped.gov.ph/list/kto12/subject/1287 | Index label |
| 7 | Health | Growth and Development | https://lrmds.deped.gov.ph/list/kto12/subject/1285 | Index label |
| 8 | Health | Prevention of Substance Use and Abuse (Gateway Drugs: Cigarette and Alcohol) | https://lrmds.deped.gov.ph/list/kto12/subject/1456 | Index label |
| 9 | Health | Prevention of Substance Use and Abuse (Gateway Drugs: Cigarette and Alcohol) | https://lrmds.deped.gov.ph/list/kto12/subject/1296 | Index label |
| 8 | Health | Prevention and Control of Diseases and Disorders Communicable | https://lrmds.deped.gov.ph/list/kto12/subject/1291 | Index label |
| 8 | Health | Family Health I | https://lrmds.deped.gov.ph/list/kto12/subject/1289 | Index label |
| 8 | Health | Family Health II | https://lrmds.deped.gov.ph/list/kto12/subject/1290 | Index label |
| 9 | Health | Injury Prevention Safety and First Aid Unintentional | https://lrmds.deped.gov.ph/list/kto12/subject/1294 | Index label |
| 9 | Health | Injury Prevention, Safety and First Aid (Intentional) | https://lrmds.deped.gov.ph/list/kto12/subject/1457 | Index label |
| 9 | Health | Prevention of Substance Use and Abuse Drug Scenario | https://lrmds.deped.gov.ph/list/kto12/subject/1295 | Index label |
| 9 | Health | Community and Environmental Health | https://lrmds.deped.gov.ph/list/kto12/subject/1293 | Index label |
| 10 | Health | Health Trends Issues and Concerns Global Level | https://lrmds.deped.gov.ph/list/kto12/subject/1299 | Index label |
| 10 | Health | Consumer Health | https://lrmds.deped.gov.ph/list/kto12/subject/1297 | Index label |
| 10 | Health | Planning for a Health Career | https://lrmds.deped.gov.ph/list/kto12/subject/1300 | Index label |
| 10 | Health | Health Trends Issues and Concerns National Level | https://lrmds.deped.gov.ph/list/kto12/subject/1298 | Index label |
| 7 | Mathematics | Statistics and Probability | https://lrmds.deped.gov.ph/list/kto12/subject/247 | Index label |
| 8 | Mathematics | Statistics and Probability | https://lrmds.deped.gov.ph/list/kto12/subject/252 | Index label |
| 10 | Mathematics | Statistics and Probability | https://lrmds.deped.gov.ph/list/kto12/subject/757 | Index label |
| 7 | Mathematics | Geometry | https://lrmds.deped.gov.ph/list/kto12/subject/245 | Index label |
| 8 | Mathematics | Geometry | https://lrmds.deped.gov.ph/list/kto12/subject/251 | Index label |
| 9 | Mathematics | Geometry | https://lrmds.deped.gov.ph/list/kto12/subject/750 | Index label |
| 10 | Mathematics | Geometry | https://lrmds.deped.gov.ph/list/kto12/subject/756 | Index label |
| 7 | Mathematics | Patterns and Algebra | https://lrmds.deped.gov.ph/list/kto12/subject/248 | Index label |
| 8 | Mathematics | Patterns and Algebra | https://lrmds.deped.gov.ph/list/kto12/subject/249 | Index label |
| 9 | Mathematics | Patterns and Algebra | https://lrmds.deped.gov.ph/list/kto12/subject/747 | Index label |
| 10 | Mathematics | Patterns and Algebra | https://lrmds.deped.gov.ph/list/kto12/subject/753 | Index label |
| 7 | Mathematics | Measurement | https://lrmds.deped.gov.ph/list/kto12/subject/246 | Index label |
| 7 | Mathematics | Numbers and Number Sense | https://lrmds.deped.gov.ph/list/kto12/subject/244 | Index label |
| 7 | Music | Music of Mindanao | https://lrmds.deped.gov.ph/list/kto12/subject/526 | Index label |
| 7 | Music | Music of Luzon Lowlands | https://lrmds.deped.gov.ph/list/kto12/subject/521 | Index label |
| 7 | Music | Philippine Festivals | https://lrmds.deped.gov.ph/list/kto12/subject/528 | Index label |
| 7 | Music | Music of Cordillera Mindoro Palawan and the Visayas | https://lrmds.deped.gov.ph/list/kto12/subject/524 | Index label |
| 8 | Music | Music of South Asia and the Middle East | https://lrmds.deped.gov.ph/list/kto12/subject/543 | Index label |
| 8 | Music | Music of Southeast Asia | https://lrmds.deped.gov.ph/list/kto12/subject/531 | Index label |
| 8 | Music | Traditional Asian Theater Music | https://lrmds.deped.gov.ph/list/kto12/subject/546 | Index label |
| 8 | Music | Music of East Asia | https://lrmds.deped.gov.ph/list/kto12/subject/532 | Index label |
| 9 | Music | Music of Medieval 7001400 | https://lrmds.deped.gov.ph/list/kto12/subject/549 | Index label |
| 9 | Music | Instrumental Music of the Romantic Period 18201900 | https://lrmds.deped.gov.ph/list/kto12/subject/553 | Index label |
| 9 | Music | Renaissance Period 14001600 | https://lrmds.deped.gov.ph/list/kto12/subject/550 | Index label |
| 9 | Music | Vocal Music of the Romantic Period | https://lrmds.deped.gov.ph/list/kto12/subject/554 | Index label |
| 9 | Music | Music of the Classical Period 17501820 | https://lrmds.deped.gov.ph/list/kto12/subject/552 | Index label |
| 10 | Music | Contemporary Philippine Music | https://lrmds.deped.gov.ph/list/kto12/subject/1314 | Index label |
| 10 | Music | 20th and 21st Century Multimedia Forms | https://lrmds.deped.gov.ph/list/kto12/subject/1315 | Index label |
| 10 | Music | AfroLatin and Popular Music | https://lrmds.deped.gov.ph/list/kto12/subject/1313 | Index label |
| 7 | Physical Education | Folk, Indigenous, Ethnic, Traditional and Festival Dance | https://lrmds.deped.gov.ph/list/kto12/subject/1317 | Index label |
| 7 | Physical Education | Dual Sports | https://lrmds.deped.gov.ph/list/kto12/subject/1316 | Index label |
| 7 | Physical Education | Individual Sports Dual Sports and Combative Sports | https://lrmds.deped.gov.ph/list/kto12/subject/803 | Index label |
| 8 | Physical Education | Folk Dances with Asian Influence | https://lrmds.deped.gov.ph/list/kto12/subject/809 | Index label |
| 8 | Physical Education | Team Sports | https://lrmds.deped.gov.ph/list/kto12/subject/489 | Index label |
| 9 | Physical Education | Active Recreation | https://lrmds.deped.gov.ph/list/kto12/subject/1321 | Index label |
| 10 | Physical Education | Active Recreation | https://lrmds.deped.gov.ph/list/kto12/subject/811 | Index label |
| 9 | Physical Education | Social and Ballroom Dances | https://lrmds.deped.gov.ph/list/kto12/subject/1320 | Index label |
| 9 | Physical Education | Lifestyle and Weight Management | https://lrmds.deped.gov.ph/list/kto12/subject/884 | Index label |
| 10 | Physical Education | Other Dance Forms | https://lrmds.deped.gov.ph/list/kto12/subject/814 | Index label |
| 7 | Science | Earth and Space | https://lrmds.deped.gov.ph/list/kto12/subject/627 | Index label |
| 8 | Science | Earth and Space | https://lrmds.deped.gov.ph/list/kto12/subject/1334 | Index label |
| 9 | Science | Earth and Space | https://lrmds.deped.gov.ph/list/kto12/subject/1339 | Index label |
| 10 | Science | Earth and Space | https://lrmds.deped.gov.ph/list/kto12/subject/1341 | Index label |
| 7 | Science | Living Things and Their Environment | https://lrmds.deped.gov.ph/list/kto12/subject/621 | Index label |
| 8 | Science | Living Things and Their Environment | https://lrmds.deped.gov.ph/list/kto12/subject/1336 | Index label |
| 9 | Science | Living Things and Their Environment | https://lrmds.deped.gov.ph/list/kto12/subject/1337 | Index label |
| 10 | Science | Living Things and Their Environment | https://lrmds.deped.gov.ph/list/kto12/subject/1343 | Index label |
| 7 | Science | Force Motion and Energy | https://lrmds.deped.gov.ph/list/kto12/subject/622 | Index label |
| 8 | Science | Force Motion and Energy | https://lrmds.deped.gov.ph/list/kto12/subject/1333 | Index label |
| 9 | Science | Force Motion and Energy | https://lrmds.deped.gov.ph/list/kto12/subject/1340 | Index label |
| 10 | Science | Force Motion and Energy | https://lrmds.deped.gov.ph/list/kto12/subject/1342 | Index label |
| 7 | Science | Matter | https://lrmds.deped.gov.ph/list/kto12/subject/422 | Index label |
| 8 | Science | Matter | https://lrmds.deped.gov.ph/list/kto12/subject/1335 | Index label |
| 9 | Science | Matter | https://lrmds.deped.gov.ph/list/kto12/subject/1338 | Index label |
| 10 | Science | Matter | https://lrmds.deped.gov.ph/list/kto12/subject/1344 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Horticulture | https://lrmds.deped.gov.ph/list/kto12/subject/922 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Bread and Pastry Production | https://lrmds.deped.gov.ph/list/kto12/subject/1506 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Bread and Pastry Production | https://lrmds.deped.gov.ph/list/kto12/subject/1507 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Animal Production | https://lrmds.deped.gov.ph/list/kto12/subject/906 | Index label |
| 10 | Technology and Livelihood Education | AgriFishery Arts Animal Production | https://lrmds.deped.gov.ph/list/kto12/subject/907 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Organic Agriculture | https://lrmds.deped.gov.ph/list/kto12/subject/1483 | Index label |
| 10 | Technology and Livelihood Education | AgriFishery Arts Organic Agriculture | https://lrmds.deped.gov.ph/list/kto12/subject/1484 | Index label |
| 9 | Technology and Livelihood Education | Industrial Arts Electrical | https://lrmds.deped.gov.ph/list/kto12/subject/1390 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Handicraft | https://lrmds.deped.gov.ph/list/kto12/subject/1383 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Dressmaking | https://lrmds.deped.gov.ph/list/kto12/subject/1381 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Dressmaking | https://lrmds.deped.gov.ph/list/kto12/subject/1516 | Index label |
| 9 | Technology and Livelihood Education | Information and Communications Technology Animation | https://lrmds.deped.gov.ph/list/kto12/subject/1563 | Index label |
| 10 | Technology and Livelihood Education | Information and Communications Technology Animation | https://lrmds.deped.gov.ph/list/kto12/subject/1564 | Index label |
| 9 | Technology and Livelihood Education | Information and Communications Technology Technical Drafting | https://lrmds.deped.gov.ph/list/kto12/subject/942 | Index label |
| 10 | Technology and Livelihood Education | Information and Communications Technology Technical Drafting | https://lrmds.deped.gov.ph/list/kto12/subject/943 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Wellness Massage | https://lrmds.deped.gov.ph/list/kto12/subject/1546 | Index label |
| 9 | Technology and Livelihood Education | Information and communications Technology Computer hardware Servicing | https://lrmds.deped.gov.ph/list/kto12/subject/932 | Index label |
| 10 | Technology and Livelihood Education | Information and communications Technology Computer hardware Servicing | https://lrmds.deped.gov.ph/list/kto12/subject/933 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Hairdressing | https://lrmds.deped.gov.ph/list/kto12/subject/1523 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Aquaculture | https://lrmds.deped.gov.ph/list/kto12/subject/916 | Index label |
| 10 | Technology and Livelihood Education | AgriFishery Arts Aquaculture | https://lrmds.deped.gov.ph/list/kto12/subject/917 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Slaughtering Operations HogSwinePig | https://lrmds.deped.gov.ph/list/kto12/subject/1495 | Index label |
| 9 | Technology and Livelihood Education | AgriFishery Arts Agricultural Crop Production | https://lrmds.deped.gov.ph/list/kto12/subject/899 | Index label |
| 10 | Technology and Livelihood Education | AgriFishery Arts Agricultural Crop Production | https://lrmds.deped.gov.ph/list/kto12/subject/901 | Index label |
| 9 | Technology and Livelihood Education | Industrial Arts Shielded Metal Arc Welding | https://lrmds.deped.gov.ph/list/kto12/subject/1392 | Index label |
| 9 | Technology and Livelihood Education | Industrial Arts Electronics | https://lrmds.deped.gov.ph/list/kto12/subject/1387 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Front Office | https://lrmds.deped.gov.ph/list/kto12/subject/1382 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Cookery | https://lrmds.deped.gov.ph/list/kto12/subject/1380 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Cookery | https://lrmds.deped.gov.ph/list/kto12/subject/1513 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Beauty Care Nail Care Services | https://lrmds.deped.gov.ph/list/kto12/subject/997 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Tailoring | https://lrmds.deped.gov.ph/list/kto12/subject/1547 | Index label |
| 9 | Technology and Livelihood Education | Information and Communications Technology Contact Center Services | https://lrmds.deped.gov.ph/list/kto12/subject/937 | Index label |
| 10 | Technology and Livelihood Education | Information and Communications Technology Contact Center Services | https://lrmds.deped.gov.ph/list/kto12/subject/934 | Index label |
| 9 | Technology and Livelihood Education | Home Economics Housekeeping | https://lrmds.deped.gov.ph/list/kto12/subject/1542 | Index label |
| 10 | Technology and Livelihood Education | AgriFishery arts Food Fish Processing | https://lrmds.deped.gov.ph/list/kto12/subject/921 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Handicraft Needlecraft | https://lrmds.deped.gov.ph/list/kto12/subject/1535 | Index label |
| 10 | Technology and Livelihood Education | Industrial Arts Automotive Servicing | https://lrmds.deped.gov.ph/list/kto12/subject/1449 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Household Services | https://lrmds.deped.gov.ph/list/kto12/subject/929 | Index label |
| 10 | Technology and Livelihood Education | Home Economics Front Office Services | https://lrmds.deped.gov.ph/list/kto12/subject/1521 | Index label |
| 10 | Technology and Livelihood Education | Agri-Fishery Arts - Pest Management | https://lrmds.deped.gov.ph/list/kto12/subject/1488 | Index label |
| 10 | Technology and Livelihood Education | Information and Communications Technology Illustration | https://lrmds.deped.gov.ph/list/kto12/subject/938 | Index label |
| 11 | Effective Communication | Effective Communication in Personal and Interpersonal Contexts | https://www.deped.gov.ph/wp-content/uploads/Effective-Communication-1.pdf | 3 |
| 11 | Effective Communication | Effective Communication in Social and Cultural Contexts | https://www.deped.gov.ph/wp-content/uploads/Effective-Communication-1.pdf | 4 |
| 11 | Effective Communication | Effective Communication in Academic and Training Contexts | https://www.deped.gov.ph/wp-content/uploads/Effective-Communication-1.pdf | 6 |
| 11 | Effective Communication | Effective Communication in Professional and Work Contexts | https://www.deped.gov.ph/wp-content/uploads/Effective-Communication-1.pdf | 8 |
| 11 | General Mathematics | Numbers and Algebra | https://www.deped.gov.ph/wp-content/uploads/GENERAL-MATHEMATICS-1.pdf | 2 |
| 11 | General Mathematics | Measurement and Geometry | https://www.deped.gov.ph/wp-content/uploads/GENERAL-MATHEMATICS-1.pdf | 4 |
| 11 | General Mathematics | Data and Probability | https://www.deped.gov.ph/wp-content/uploads/GENERAL-MATHEMATICS-1.pdf | 5 |
| 11 | General Science | Physics | https://www.deped.gov.ph/wp-content/uploads/GENERAL-SCIENCE-1.pdf | 2 |
| 11 | General Science | Chemistry | https://www.deped.gov.ph/wp-content/uploads/GENERAL-SCIENCE-1.pdf | 2 |
| 11 | General Science | Biology | https://www.deped.gov.ph/wp-content/uploads/GENERAL-SCIENCE-1.pdf | 2 |
| 11 | General Science | Earth and Space Science | https://www.deped.gov.ph/wp-content/uploads/GENERAL-SCIENCE-1.pdf | 2 |
| 11 | Life and Career Skills | Life Skills toward Personal Development | https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf | 2 |
| 11 | Life and Career Skills | Life Skills toward Social Competence | https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf | 3 |
| 11 | Life and Career Skills | Life Skills toward Career Competence | https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf | 4 |
| 11 | Life and Career Skills | Life Skills toward Career Readiness | https://www.deped.gov.ph/wp-content/uploads/LIFE-AND-CAREER-SKILLS-1.pdf | 6 |
| 11 | Mabisang Komunikasyon | Mabisang Komunikasyon sa Kontekstong Personal at Interpersonal | https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf | 3 |
| 11 | Mabisang Komunikasyon | Mabisang Komunikasyon sa Kontekstong Sosyal at Kultural | https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf | 5 |
| 11 | Mabisang Komunikasyon | Mabisang Komunikasyon sa Kontekstong Akademiko at Pampagsasanay | https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf | 7 |
| 11 | Mabisang Komunikasyon | Mabisang Komunikasyon sa Kontekstong Propesyonal at Pantrabaho | https://www.deped.gov.ph/wp-content/uploads/MABISANG-KOMUNIKASYON-1.pdf | 9 |
| 11 | Pag-aaral ng Kasaysayan at Lipunang Pilipino | Kamalayang Pangkasaysayan | https://www.deped.gov.ph/wp-content/uploads/PAG-AARAL-NG-KASAYSAYAN-AT-LIPUNANG-PILIPINO-1.pdf | 2 |
| 11 | Pag-aaral ng Kasaysayan at Lipunang Pilipino | Kamalayang Pilipino | https://www.deped.gov.ph/wp-content/uploads/PAG-AARAL-NG-KASAYSAYAN-AT-LIPUNANG-PILIPINO-1.pdf | 4 |
| 11 | Pag-aaral ng Kasaysayan at Lipunang Pilipino | Kamalayang Panlikas-kayang Pag-unlad | https://www.deped.gov.ph/wp-content/uploads/PAG-AARAL-NG-KASAYSAYAN-AT-LIPUNANG-PILIPINO-1.pdf | 6 |
| 11 | Pag-aaral ng Kasaysayan at Lipunang Pilipino | Kamalayan sa Pagkamamamayang Pilipino at Global | https://www.deped.gov.ph/wp-content/uploads/PAG-AARAL-NG-KASAYSAYAN-AT-LIPUNANG-PILIPINO-1.pdf | 7 |
| 12 | Creative Production and Presentation | Concept and Proposal Development | https://www.deped.gov.ph/wp-content/uploads/CREATIVE-PRODUCTION-AND-PRESENTATION.pdf | 3 |
| 12 | Creative Production and Presentation | Creative Execution and Iteration | https://www.deped.gov.ph/wp-content/uploads/CREATIVE-PRODUCTION-AND-PRESENTATION.pdf | 4 |
| 12 | Creative Production and Presentation | Public Presentation and Audience Engagement | https://www.deped.gov.ph/wp-content/uploads/CREATIVE-PRODUCTION-AND-PRESENTATION.pdf | 4 |
| 12 | Advanced Mathematics | Basic Mathematical Modeling | https://www.deped.gov.ph/wp-content/uploads/1-Updated-as-of-05.29.26_Advanced-Mathematics.pdf | 3 |
| 12 | Advanced Mathematics | Angles and Their Measures | https://www.deped.gov.ph/wp-content/uploads/1-Updated-as-of-05.29.26_Advanced-Mathematics.pdf | 3 |
| 12 | Advanced Mathematics | Trigonometric Functions | https://www.deped.gov.ph/wp-content/uploads/1-Updated-as-of-05.29.26_Advanced-Mathematics.pdf | 2 |
| 12 | Advanced Mathematics | Trigonometric Identities | https://www.deped.gov.ph/wp-content/uploads/1-Updated-as-of-05.29.26_Advanced-Mathematics.pdf | 4 |
| 12 | Basic Calculus | Limits and Continuity | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 2 |
| 12 | Basic Calculus | Derivatives and Tangents | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 2 |
| 12 | Basic Calculus | Rules of Differentiation | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 2 |
| 12 | Basic Calculus | Applications of Derivatives | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 2 |
| 12 | Basic Calculus | Antiderivatives (Indefinite Integrals) | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 3 |
| 12 | Basic Calculus | Definite Integrals and Area | https://www.deped.gov.ph/wp-content/uploads/2-Updated-as-of-05.29.26_Basic-Calculus.pdf | 4 |
| 12 | Biology 3 | Molecular Genetics and Inheritance | https://www.deped.gov.ph/wp-content/uploads/BIOLOGY-3.pdf | 2 |
| 12 | Biology 3 | Evolution and Biotechnology | https://www.deped.gov.ph/wp-content/uploads/BIOLOGY-3.pdf | 4 |
| 12 | Chemistry 3 | Strength and Concentration of Acids and Bases | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 3 |
| 12 | Chemistry 3 | Acid-Base Titrations | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 3 |
| 12 | Chemistry 3 | Buffer Systems | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 2 |
| 12 | Chemistry 3 | Chemical Equilibrium | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 2 |
| 12 | Chemistry 3 | Separation of Mixtures | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 5 |
| 12 | Chemistry 3 | Instrumental Analysis (Colorimetry) | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 5 |
| 12 | Chemistry 3 | Redox Reactions | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 2 |
| 12 | Chemistry 3 | Galvanic Cells | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 5 |
| 12 | Chemistry 3 | Electrochemical Potentials | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 5 |
| 12 | Chemistry 3 | Electrolysis | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 2 |
| 12 | Chemistry 3 | Applications of Electrochemistry | https://www.deped.gov.ph/wp-content/uploads/CHEMISTRY-3.pdf | 6 |
| 12 | Database Management | Introduction to Databases | https://www.deped.gov.ph/wp-content/uploads/5-Updated-as-of-05.29.26_Database-Management.pdf | 2 |
| 12 | Database Management | Introduction to SQL | https://www.deped.gov.ph/wp-content/uploads/5-Updated-as-of-05.29.26_Database-Management.pdf | 2 |
| 12 | Database Management | SQL Commands | https://www.deped.gov.ph/wp-content/uploads/5-Updated-as-of-05.29.26_Database-Management.pdf | 2 |
| 12 | Fundamentals of Data Analytics | Data Privacy and Ethics | https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | 2 |
| 12 | Fundamentals of Data Analytics | Data Sources and Collection Methods | https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | 3 |
| 12 | Fundamentals of Data Analytics | Data Processing | https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | 3 |
| 12 | Fundamentals of Data Analytics | Data Storytelling | https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | 5 |
| 12 | Fundamentals of Data Analytics | Data Analytics Project | https://www.deped.gov.ph/wp-content/uploads/6-Updated-as-of-05.29.26_Fundamentals-of-Data-Analytics.pdf | 5 |
| 12 | Physics 3 | Electrostatics | https://www.deped.gov.ph/wp-content/uploads/PHYSICS-3.pdf | 2 |
| 12 | Physics 3 | Current Electricity | https://www.deped.gov.ph/wp-content/uploads/PHYSICS-3.pdf | 3 |
| 12 | Physics 3 | Magnetism | https://www.deped.gov.ph/wp-content/uploads/PHYSICS-3.pdf | 2 |
| 12 | Physics 3 | Electromagnetism | https://www.deped.gov.ph/wp-content/uploads/PHYSICS-3.pdf | 2 |
| 12 | Pre-Calculus | Lines and Circles | https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | 2 |
| 12 | Pre-Calculus | Graph Transformations | https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | 2 |
| 12 | Pre-Calculus | Polynomial Functions | https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | 3 |
| 12 | Pre-Calculus | Rational Functions | https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | 3 |
| 12 | Pre-Calculus | Exponential and Logarithmic Functions | https://www.deped.gov.ph/wp-content/uploads/Pre-Calculus.pdf | 4 |
| 12 | Research 1 | Foundations of Research | https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | 2 |
| 12 | Research 1 | Research Ethics | https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | 3 |
| 12 | Research 1 | Review of Literature for Identifying Research Problems | https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | 3 |
| 12 | Research 1 | Research Design and Methodology | https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | 3 |
| 12 | Research 1 | Research Proposal Development | https://www.deped.gov.ph/wp-content/uploads/Research-1.pdf | 4 |
| 12 | Research 2 | Instrument Development and Validation | https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | 2 |
| 12 | Research 2 | Data Collection | https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | 2 |
| 12 | Research 2 | Data Analysis and Interpretation | https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | 3 |
| 12 | Research 2 | Writing the Research Report | https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | 3 |
| 12 | Research 2 | Research Presentation and Defense | https://www.deped.gov.ph/wp-content/uploads/Research-2.pdf | 3 |
| 11 | Citizenship and Civic Engagement | Citizenship in Practice | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf | 2 |
| 12 | Citizenship and Civic Engagement | Citizenship in Practice | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf | 2 |
| 11 | Citizenship and Civic Engagement | Civic Engagement and Community Involvement | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf | 5 |
| 12 | Citizenship and Civic Engagement | Civic Engagement and Community Involvement | https://www.deped.gov.ph/wp-content/uploads/Citizenship-and-Civic-Engagement-1.pdf | 5 |
| 11 | Contemporary Literature 1 | Literature as Mirror: Textual Reflections | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf | 3 |
| 12 | Contemporary Literature 1 | Literature as Mirror: Textual Reflections | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf | 3 |
| 11 | Contemporary Literature 1 | Literature as Window: Textual Perspectives | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf | 4 |
| 12 | Contemporary Literature 1 | Literature as Window: Textual Perspectives | https://www.deped.gov.ph/wp-content/uploads/Contemporary-Literature-1-1.pdf | 4 |
| 11 | Introduction to Philosophy | Introduction to Philosophy | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Philosophy-1.pdf | 2 |
| 11 | Introduction to Philosophy | Philosophy of the Human Person | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Philosophy-1.pdf | 3 |
| 11 | Philippine Governance (Philippine Politics and Governance) | Philippine Politics and Governance | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf | 2 |
| 12 | Philippine Governance (Philippine Politics and Governance) | Philippine Politics and Governance | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf | 2 |
| 11 | Philippine Governance (Philippine Politics and Governance) | The Structure of Philippine Government | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf | 4 |
| 12 | Philippine Governance (Philippine Politics and Governance) | The Structure of Philippine Government | https://www.deped.gov.ph/wp-content/uploads/Philippine-Governance-Philippine-Politics-and-Governance-1.pdf | 4 |
| 11 | Business 1 (Basic Accounting) | Introduction to Accounting for Service Business | https://www.deped.gov.ph/wp-content/uploads/Business-1-Basic-Accounting-1.pdf | 2 |
| 11 | Business 1 (Basic Accounting) | Accounting Cycle for a Merchandising Business using the Perpetual and Periodic Methods | https://www.deped.gov.ph/wp-content/uploads/Business-1-Basic-Accounting-1.pdf | 4 |
| 11 | Business 2 (Business Finance and Income Taxation) | Financial Management, Investment, and Money in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf | 2 |
| 12 | Business 2 (Business Finance and Income Taxation) | Financial Management, Investment, and Money in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf | 2 |
| 11 | Business 2 (Business Finance and Income Taxation) | Principles and Purpose of Income Taxation | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf | 4 |
| 12 | Business 2 (Business Finance and Income Taxation) | Principles and Purpose of Income Taxation | https://www.deped.gov.ph/wp-content/uploads/Business-2-Business-Finance-and-Income-Taxation-1.pdf | 4 |
| 11 | Business 3 (Business Economics) | Economics in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf | 2 |
| 12 | Business 3 (Business Economics) | Economics in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf | 2 |
| 11 | Business 3 (Business Economics) | Socio-Economic Issues in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf | 4 |
| 12 | Business 3 (Business Economics) | Socio-Economic Issues in the Business Environment | https://www.deped.gov.ph/wp-content/uploads/Business-3-Business-Economics-1.pdf | 4 |
| 11 | Contemporary Marketing | The Fundamentals of Marketing | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf | 2 |
| 12 | Contemporary Marketing | The Fundamentals of Marketing | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf | 2 |
| 11 | Contemporary Marketing | Marketing Mix, Analytics and Planning Process | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf | 3 |
| 12 | Contemporary Marketing | Marketing Mix, Analytics and Planning Process | https://www.deped.gov.ph/wp-content/uploads/Contemprary-Marketing-1.pdf | 3 |
| 12 | Entrepreneurship | Nature of Entrepreneurship and Business Planning | https://www.deped.gov.ph/wp-content/uploads/Entrepreneurship-1.pdf | 2 |
| 12 | Entrepreneurship | Business Simulation and Evaluation | https://www.deped.gov.ph/wp-content/uploads/Entrepreneurship-1.pdf | 3 |
| 11 | Introduction to Organization and Management | The Nature, Concept, and Function of Management | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Organization-and-Management-1.pdf | 2 |
| 11 | Introduction to Organization and Management | The Nature of Controlling, Concepts and Social Responsibilities of Small and Medium Enterprises (SMEs) | https://www.deped.gov.ph/wp-content/uploads/Introduction-to-Organization-and-Management-1.pdf | 4 |
| 11 | Biology 1 | Cell Biology | https://www.deped.gov.ph/wp-content/uploads/Biology-1-1.pdf | 2 |
| 11 | Biology 1 | Cell Metabolism | https://www.deped.gov.ph/wp-content/uploads/Biology-1-1.pdf | 4 |
| 11 | Chemistry 1 | Scientific measurement | https://www.deped.gov.ph/wp-content/uploads/Chemistry-1.pdf | 2 |
| 11 | Chemistry 1 | Electronic Structure of Atoms | https://www.deped.gov.ph/wp-content/uploads/Chemistry-1.pdf | 2 |
| 11 | Chemistry 1 | Chemical Bonds | https://www.deped.gov.ph/wp-content/uploads/Chemistry-1.pdf | 2 |
| 11 | Physics 1 | Measurements and Translational Kinematics | https://www.deped.gov.ph/wp-content/uploads/Physics-1-1.pdf | 2 |
| 11 | Physics 1 | Dynamics | https://www.deped.gov.ph/wp-content/uploads/Physics-1-1.pdf | 2 |
| 11 | Physical Education 1 (Fitness and Recreation) | Fitness | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf | 2 |
| 12 | Physical Education 1 (Fitness and Recreation) | Fitness | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf | 2 |
| 11 | Physical Education 1 (Fitness and Recreation) | Recreation | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf | 2 |
| 12 | Physical Education 1 (Fitness and Recreation) | Recreation | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-1-Fitness-and-Recreation-1.pdf | 2 |
| 11 | Physical Education 2 (Sports and Dance) | Sports | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf | 2 |
| 12 | Physical Education 2 (Sports and Dance) | Sports | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf | 2 |
| 11 | Physical Education 2 (Sports and Dance) | Dance | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf | 2 |
| 12 | Physical Education 2 (Sports and Dance) | Dance | https://www.deped.gov.ph/wp-content/uploads/Physical-Education-2-Sports-and-Dance-1.pdf | 2 |
| 11 | Agricultural Crops Production | Overview of Agricultural Crops Production | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 2 |
| 12 | Agricultural Crops Production | Overview of Agricultural Crops Production | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 2 |
| 11 | Agricultural Crops Production | Safety Standards in Agricultural Crops Production | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 3 |
| 12 | Agricultural Crops Production | Safety Standards in Agricultural Crops Production | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 3 |
| 11 | Agricultural Crops Production | Farm Tools, Implements, and Equipment | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 3 |
| 12 | Agricultural Crops Production | Farm Tools, Implements, and Equipment | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 3 |
| 11 | Agricultural Crops Production | Kinds of Planting Materials | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 4 |
| 12 | Agricultural Crops Production | Kinds of Planting Materials | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 4 |
| 11 | Agricultural Crops Production | Crop Requirements | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 5 |
| 12 | Agricultural Crops Production | Crop Requirements | https://www.deped.gov.ph/wp-content/uploads/Agricultural-Crops-Production-1.pdf | 5 |
| 11 | Bakery Operations | Overview of Baking Industry | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 2 |
| 12 | Bakery Operations | Overview of Baking Industry | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 2 |
| 11 | Bakery Operations | Baking Tools & Equipment | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 12 | Bakery Operations | Baking Tools & Equipment | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 11 | Bakery Operations | Baking Techniques | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 12 | Bakery Operations | Baking Techniques | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 11 | Bakery Operations | Bread Products | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 12 | Bakery Operations | Bread Products | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 3 |
| 11 | Bakery Operations | Food Safety & Sanitation | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 4 |
| 12 | Bakery Operations | Food Safety & Sanitation | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 4 |
| 11 | Bakery Operations | Packaging and Marketing Bakery Products | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 4 |
| 12 | Bakery Operations | Packaging and Marketing Bakery Products | https://www.deped.gov.ph/wp-content/uploads/Bakery-Operations-1.pdf | 4 |
| 11 | Kitchen Operations | Kitchen Math | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 3 |
| 12 | Kitchen Operations | Kitchen Math | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 3 |
| 11 | Kitchen Operations | Stocks, Soup, and Sauces | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 4 |
| 12 | Kitchen Operations | Stocks, Soup, and Sauces | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 4 |
| 11 | Kitchen Operations | Appetizers | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 5 |
| 12 | Kitchen Operations | Appetizers | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 5 |
| 11 | Kitchen Operations | Salads and Salad Dressings | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 6 |
| 12 | Kitchen Operations | Salads and Salad Dressings | https://www.deped.gov.ph/wp-content/uploads/Kitchen-Operations-1.pdf | 6 |
| 11 | Computer Systems Servicing | Fundamental Concepts in Computer Systems Servicing | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 2 |
| 12 | Computer Systems Servicing | Fundamental Concepts in Computer Systems Servicing | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 2 |
| 11 | Computer Systems Servicing | Computer System Elements | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 3 |
| 12 | Computer Systems Servicing | Computer System Elements | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 3 |
| 11 | Computer Systems Servicing | Computer Network Concepts | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 4 |
| 12 | Computer Systems Servicing | Computer Network Concepts | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 4 |
| 11 | Computer Systems Servicing | Setting Up Computer Network | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 5 |
| 12 | Computer Systems Servicing | Setting Up Computer Network | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 5 |
| 11 | Computer Systems Servicing | Server Management | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 5 |
| 12 | Computer Systems Servicing | Server Management | https://www.deped.gov.ph/wp-content/uploads/Computer-Systems-Servicing-1.pdf | 5 |

## Editorial normalization and exclusions

HTML entities/whitespace were decoded. The Grade 10 “Art” area is grouped with “Arts”; subject identity is retained without merging Music, PE, or Health. Filipino “---” presentation prefixes were removed. Mathematics capitalization and the comma/no-comma PE dance duplicate were normalized. Identical labels differing only in capitalization or punctuation were deduplicated within a learning area while retaining their original source links. Repeated labels in one subject/grade produce one association while their source links are retained (including the duplicated Grade 7 AP colonialism label). Distinct grade associations are kept. Curriculum Guide, hyphen-only placeholders, and generic misplaced Home Economics/Industrial Arts labels are excluded. The full excluded-entry list is in the verification receipt.

## Safe import and existing data

The configured cloud database could not supply a connection (MariaDB pool error 45028; direct TCP probe returned ECONNREFUSED); no live records were modified. Live counts, exact matches, name collisions, and unmatched rows must be reviewed from the dry-run on the actual target. The schema shows subjects stored as slugs and topics as names on classes, class topics, requests, request topics, certifications, assessment questions/attempts, and question requests. Learners keep their grade on User and tutors use topic certifications; registration/profile do not currently collect separate subject preferences.

Import only reuses exact (subject slug, topic name) identities. The official JHS Araling Panlipunan and Edukasyon sa Pagpapakatao learning areas use new JHS-prefixed slugs so older broad Social Studies and Values/Personal Development categories retain their original identities and labels. No broad label is assumed equivalent to a narrower official domain. Unmatched catalog rows are deactivated and retained, and their historical string references are left intact. Import never deletes users, classes, requests, questions, certifications, or IDs. Certifications on retired broad labels are not silently transferred to a new official topic. Import preserves administrator disables on all existing matched subjects and topics, including the first import. Backup the catalog before applying; rollback restores that catalog snapshot without changing history. A duplicate unique subject name under another slug aborts the transaction rather than remapping data. Restart application instances after a CLI import to clear in-process catalog caches.

Commands (from the repository; choose the target DATABASE_URL through the existing environment mechanism):

```sh
node scripts/build-curriculum-docs.mjs
pnpm exec tsx prisma/seedCurriculum.ts          # read-only plan and historical counts
pnpm exec tsx prisma/seedCurriculum.ts --apply  # catalog-only transactional import
```

The standard prisma/seed.ts, package seed command, and Prisma seed now import only the researched catalog. The previous demo fixture generator has been replaced and obsolete demo/reset aliases have been removed. The dev-test startup hook uses the new catalog revision without resetting user data. Historical broad-label data and the older competency dataset are not active dropdown seed sources.
