ALTER TABLE `assessment_questions` ADD COLUMN `lockedAt` DATETIME(3) NULL, ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1, ADD COLUMN `previousVersionId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `assessment_questions_previousVersionId_version_key` ON `assessment_questions`(`previousVersionId`, `version`);
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_previousVersionId_fkey` FOREIGN KEY (`previousVersionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
UPDATE `assessment_questions` q SET q.`lockedAt` = CURRENT_TIMESTAMP(3)
WHERE EXISTS (SELECT 1 FROM `assessment_attempt_items` a WHERE a.`questionId` = q.`id`)
 OR EXISTS (SELECT 1 FROM `session_test_attempt_items` a WHERE a.`questionId` = q.`id`)
 OR EXISTS (SELECT 1 FROM `session_test_questions` l JOIN `session_tests` t ON t.`id` = l.`sessionTestId` WHERE l.`questionId` = q.`id` AND (t.`status` <> 'DRAFT' OR t.`publishedAt` IS NOT NULL));
