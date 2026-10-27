-- Sources and scope: docs/reference/subject-grade-mapping.md.
-- Backfill only unassigned built-in subjects; preserve admin-specific mappings.
-- Subjects are JHS learning areas. SHS courses need separately named entries.
UPDATE `subjects`
SET `gradeLevels` = JSON_ARRAY('GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10')
WHERE `slug` IN ('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH')
  AND (`gradeLevels` IS NULL OR JSON_TYPE(`gradeLevels`) = 'NULL' OR JSON_LENGTH(`gradeLevels`) = 0);
