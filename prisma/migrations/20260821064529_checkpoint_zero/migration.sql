/*
  Warnings:

  - You are about to drop the `TuteeProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TutorProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `TuteeProfile` DROP FOREIGN KEY `TuteeProfile_tuteeId_fkey`;

-- DropForeignKey
ALTER TABLE `TutorProfile` DROP FOREIGN KEY `TutorProfile_tutorId_fkey`;

-- DropTable
DROP TABLE `TuteeProfile`;

-- DropTable
DROP TABLE `TutorProfile`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `anonymousId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'TEACHER_MODERATOR', 'STUDENT_TUTOR', 'STUDENT_LEARNER') NOT NULL,
    `gradeLevel` ENUM('GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12') NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `contactInfo` VARCHAR(191) NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_anonymousId_key`(`anonymousId`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tutor_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'CERTIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `availability` JSON NOT NULL,

    UNIQUE INDEX `tutor_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_applications` (
    `id` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `certified` BOOLEAN NOT NULL DEFAULT false,
    `attemptedAt` DATETIME(3) NULL,
    `certifiedAt` DATETIME(3) NULL,

    UNIQUE INDEX `subject_applications_tutorProfileId_subject_key`(`tutorProfileId`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `id_counters` (
    `role` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tutor_classes` (
    `id` VARCHAR(191) NOT NULL,
    `tutorId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `maxStudents` INTEGER NOT NULL DEFAULT 1,
    `meetingLink` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `learnerId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `class_enrollments_classId_learnerId_key`(`classId`, `learnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutor_profiles` ADD CONSTRAINT `tutor_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_applications` ADD CONSTRAINT `subject_applications_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutor_classes` ADD CONSTRAINT `tutor_classes_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_learnerId_fkey` FOREIGN KEY (`learnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
