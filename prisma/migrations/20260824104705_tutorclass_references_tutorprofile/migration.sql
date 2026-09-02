/*
  Warnings:

  - You are about to drop the column `tutorId` on the `tutor_classes` table. All the data in the column will be lost.
  - Added the required column `tutorProfileId` to the `tutor_classes` table, backfilled from the tutor's existing `tutor_profiles` row.

*/
-- DropForeignKey
ALTER TABLE `tutor_classes` DROP FOREIGN KEY `tutor_classes_tutorId_fkey`;

-- AlterTable: add the new column as nullable first so existing rows can be backfilled
ALTER TABLE `tutor_classes` ADD COLUMN `tutorProfileId` VARCHAR(191) NULL;

-- Backfill tutorProfileId from each class's tutor's existing tutor_profiles row
UPDATE `tutor_classes` tc
JOIN `tutor_profiles` tp ON tp.`userId` = tc.`tutorId`
SET tc.`tutorProfileId` = tp.`id`;

-- AlterTable: enforce NOT NULL now that all rows are backfilled
ALTER TABLE `tutor_classes` MODIFY `tutorProfileId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tutor_classes` DROP COLUMN `tutorId`;

-- AddForeignKey
ALTER TABLE `tutor_classes` ADD CONSTRAINT `tutor_classes_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
