/*
  Warnings:

  - You are about to drop the column `topic` on the `tutor_classes` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the `assessments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `assessments` DROP FOREIGN KEY `assessments_userId_fkey`;

-- DropForeignKey
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_userId_fkey`;

-- AlterTable
ALTER TABLE `tutor_classes` DROP COLUMN `topic`;

-- AlterTable
ALTER TABLE `tutor_profiles` DROP COLUMN `availability`;

-- DropTable
DROP TABLE `assessments`;

-- DropTable
DROP TABLE `sessions`;

-- CreateTable
CREATE TABLE `availabilities` (
    `id` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `day` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_topics` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `class_topics_classId_topic_key`(`classId`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `availabilities` ADD CONSTRAINT `availabilities_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_topics` ADD CONSTRAINT `class_topics_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
