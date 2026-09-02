/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `password`,
    ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TutorProfile` (
    `tutorId` VARCHAR(191) NOT NULL,
    `tutorCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`tutorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TuteeProfile` (
    `tuteeId` VARCHAR(191) NOT NULL,
    `tuteeCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`tuteeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TutorProfile` ADD CONSTRAINT `TutorProfile_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TuteeProfile` ADD CONSTRAINT `TuteeProfile_tuteeId_fkey` FOREIGN KEY (`tuteeId`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
