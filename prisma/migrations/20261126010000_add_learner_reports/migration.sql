-- Tutors can report a learner: new report target, the reported learner, and learner-conduct reasons.
-- New enum values are appended, so existing rows are untouched.
-- AlterTable
ALTER TABLE `report_violations` MODIFY `type` ENUM('HARASSMENT_OR_BULLYING', 'ANONYMITY_BREACH', 'SOLICITING_PAYMENT', 'DISCRIMINATION', 'UNPROFESSIONAL_CONDUCT', 'NO_SHOW_OR_ABSENCE', 'MISLEADING_ACADEMIC_INFO', 'MISLEADING_CLASS_INFO', 'OFF_TOPIC_SESSIONS', 'SPAM_OR_DUPLICATE', 'SCHEDULE_ABUSE', 'INAPPROPRIATE_CONTENT', 'OTHER', 'DISRUPTIVE_BEHAVIOR', 'REPEATED_ABSENCE', 'ACADEMIC_DISHONESTY') NOT NULL;

-- AlterTable
ALTER TABLE `reports` ADD COLUMN `reportedLearnerId` VARCHAR(191) NULL,
    MODIFY `targetType` ENUM('TUTOR', 'CLASS', 'LEARNER') NOT NULL;

-- CreateIndex
CREATE INDEX `reports_reportedLearnerId_idx` ON `reports`(`reportedLearnerId`);

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reportedLearnerId_fkey` FOREIGN KEY (`reportedLearnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

