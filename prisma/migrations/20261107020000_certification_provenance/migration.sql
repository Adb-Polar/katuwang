ALTER TABLE `topic_certifications` ADD COLUMN `approvalMethod` ENUM('ASSESSMENT', 'MANUAL') NULL, ADD COLUMN `approvalEvidence` TEXT NULL, ADD COLUMN `qualifyingAttemptId` VARCHAR(191) NULL;
CREATE INDEX `topic_certifications_qualifyingAttemptId_idx` ON `topic_certifications`(`qualifyingAttemptId`);
ALTER TABLE `topic_certifications` ADD CONSTRAINT `topic_certifications_qualifyingAttemptId_fkey` FOREIGN KEY (`qualifyingAttemptId`) REFERENCES `assessment_attempts`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
