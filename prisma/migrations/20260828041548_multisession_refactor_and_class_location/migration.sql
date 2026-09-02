/*
  Warnings:

  - You are about to drop the column `duration` on the `tutor_classes` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `tutor_classes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tutor_classes` DROP COLUMN `duration`,
    DROP COLUMN `scheduledAt`,
    ADD COLUMN `building` VARCHAR(191) NULL,
    ADD COLUMN `published` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `room` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `class_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `class_sessions_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
