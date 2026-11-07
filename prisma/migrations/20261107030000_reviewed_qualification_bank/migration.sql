ALTER TABLE `assessment_questions` ADD COLUMN `reviewStatus` ENUM('UNREVIEWED','DEMO','APPROVED') NOT NULL DEFAULT 'UNREVIEWED', ADD COLUMN `qualificationReviewedAt` DATETIME(3) NULL, ADD COLUMN `qualificationReviewerId` VARCHAR(191) NULL, ADD COLUMN `qualificationCompetency` TEXT NULL, ADD COLUMN `qualificationEvidence` TEXT NULL, ADD COLUMN `qualificationReviewerCredentials` TEXT NULL;
CREATE INDEX `assessment_questions_qualificationReviewerId_idx` ON `assessment_questions`(`qualificationReviewerId`);
CREATE INDEX `assessment_questions_qualification_pool_idx` ON `assessment_questions`(`subject`,`topic`,`active`,`origin`,`reviewStatus`);
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_qualificationReviewerId_fkey` FOREIGN KEY (`qualificationReviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `assessment_attempts` ADD COLUMN `certificationEligible` BOOLEAN NOT NULL DEFAULT false;
UPDATE `assessment_questions` SET `reviewStatus` = 'DEMO' WHERE `origin` = 'BANK' AND (`explanation` = 'Placeholder practice question generated for the demo question bank.' OR `prompt` LIKE '%(practice item %');
