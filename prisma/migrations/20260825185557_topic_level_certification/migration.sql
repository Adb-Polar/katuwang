-- DropForeignKey
ALTER TABLE `subject_applications` DROP FOREIGN KEY `subject_applications_tutorProfileId_fkey`;

-- AlterTable
ALTER TABLE `tutor_profiles` DROP COLUMN `status`;

-- DropTable
DROP TABLE `subject_applications`;

-- CreateTable
CREATE TABLE `topic_certifications` (
    `id` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CERTIFIED') NOT NULL DEFAULT 'PENDING',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `certifiedAt` DATETIME(3) NULL,

    UNIQUE INDEX `topic_certifications_tutorProfileId_subject_topic_key`(`tutorProfileId`, `subject`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `topic_certifications` ADD CONSTRAINT `topic_certifications_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

