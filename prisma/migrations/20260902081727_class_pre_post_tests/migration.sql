-- DropIndex
DROP INDEX `assessment_questions_subject_topic_active_idx` ON `assessment_questions`;

-- AlterTable
ALTER TABLE `assessment_questions` ADD COLUMN `origin` ENUM('BANK', 'TUTOR') NOT NULL DEFAULT 'BANK',
    ADD COLUMN `ownerTutorProfileId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `class_tests` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `kind` ENUM('PRE', 'POST') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `class_tests_classId_kind_key`(`classId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_test_questions` (
    `id` VARCHAR(191) NOT NULL,
    `classTestId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,

    UNIQUE INDEX `class_test_questions_classTestId_position_key`(`classTestId`, `position`),
    UNIQUE INDEX `class_test_questions_classTestId_questionId_key`(`classTestId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_test_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `classTestId` VARCHAR(191) NOT NULL,
    `learnerId` VARCHAR(191) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
    `totalQuestions` INTEGER NOT NULL,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `scorePercent` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `class_test_attempts_learnerId_idx`(`learnerId`),
    UNIQUE INDEX `class_test_attempts_classTestId_learnerId_key`(`classTestId`, `learnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_test_attempt_items` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `selectedOptionId` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NULL,

    UNIQUE INDEX `class_test_attempt_items_attemptId_position_key`(`attemptId`, `position`),
    UNIQUE INDEX `class_test_attempt_items_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `assessment_questions_origin_subject_topic_active_idx` ON `assessment_questions`(`origin`, `subject`, `topic`, `active`);

-- AddForeignKey
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_ownerTutorProfileId_fkey` FOREIGN KEY (`ownerTutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_tests` ADD CONSTRAINT `class_tests_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_questions` ADD CONSTRAINT `class_test_questions_classTestId_fkey` FOREIGN KEY (`classTestId`) REFERENCES `class_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_questions` ADD CONSTRAINT `class_test_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_attempts` ADD CONSTRAINT `class_test_attempts_classTestId_fkey` FOREIGN KEY (`classTestId`) REFERENCES `class_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_attempts` ADD CONSTRAINT `class_test_attempts_learnerId_fkey` FOREIGN KEY (`learnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_attempt_items` ADD CONSTRAINT `class_test_attempt_items_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `class_test_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_attempt_items` ADD CONSTRAINT `class_test_attempt_items_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_test_attempt_items` ADD CONSTRAINT `class_test_attempt_items_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `assessment_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
