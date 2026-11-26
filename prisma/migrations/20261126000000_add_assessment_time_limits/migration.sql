-- Optional time limits for session pre/post-tests and tutor certification quizzes.
-- NULL means untimed, so existing tests and attempts keep their behaviour.
ALTER TABLE `session_tests` ADD COLUMN `timeLimitMinutes` INTEGER NULL;
ALTER TABLE `session_test_attempts` ADD COLUMN `timeLimitMinutes` INTEGER NULL;
ALTER TABLE `assessment_attempts` ADD COLUMN `timeLimitMinutes` INTEGER NULL;
