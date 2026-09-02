-- Chunk 9: remove the hand-maintained tutor availability feature (now auto-derived
-- from class sessions). Chunk 10: rejected assessment state. Chunk 11: class codes.

-- DropForeignKey
ALTER TABLE `availabilities` DROP FOREIGN KEY `availabilities_tutorProfileId_fkey`;

-- DropTable
DROP TABLE `availabilities`;

-- AlterTable: TopicCertification — add REJECTED status + review feedback columns
ALTER TABLE `topic_certifications`
    MODIFY `status` ENUM('PENDING', 'CERTIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewNote` TEXT NULL;

-- AlterTable: TutorClass — add the human-friendly `code` (add nullable, backfill, enforce)
ALTER TABLE `tutor_classes` ADD COLUMN `code` VARCHAR(191) NULL;

SET @row := 0;
UPDATE `tutor_classes`
SET `code` = CONCAT('C-', LPAD((@row := @row + 1), 4, '0'))
ORDER BY `createdAt` ASC, `id` ASC;

ALTER TABLE `tutor_classes` MODIFY `code` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tutor_classes_code_key` ON `tutor_classes`(`code`);

-- Keep the "CLASS" id counter ahead of every backfilled code
INSERT INTO `id_counters` (`role`, `count`)
SELECT 'CLASS', COUNT(*) FROM `tutor_classes`
ON DUPLICATE KEY UPDATE `count` = (SELECT COUNT(*) FROM (SELECT `id` FROM `tutor_classes`) AS `t`);
