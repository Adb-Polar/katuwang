-- CreateTable
CREATE TABLE `assessment_questions` (
    `id` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assessment_questions_subject_topic_active_idx`(`subject`, `topic`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_options` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL,

    UNIQUE INDEX `assessment_options_questionId_position_key`(`questionId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic_assessment_configs` (
    `id` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `questionCount` INTEGER NOT NULL DEFAULT 5,
    `passPercent` INTEGER NOT NULL DEFAULT 80,
    `minBankSize` INTEGER NOT NULL DEFAULT 5,
    `updatedById` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `topic_assessment_configs_subject_topic_key`(`subject`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `attemptNo` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'PASSED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    `questionCount` INTEGER NOT NULL,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `scorePercent` INTEGER NOT NULL DEFAULT 0,
    `passPercent` INTEGER NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `assessment_attempts_tutorProfileId_subject_topic_idx`(`tutorProfileId`, `subject`, `topic`),
    INDEX `assessment_attempts_status_idx`(`status`),
    UNIQUE INDEX `assessment_attempts_tutorProfileId_subject_topic_attemptNo_key`(`tutorProfileId`, `subject`, `topic`, `attemptNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_attempt_items` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `selectedOptionId` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NULL,

    UNIQUE INDEX `assessment_attempt_items_attemptId_position_key`(`attemptId`, `position`),
    UNIQUE INDEX `assessment_attempt_items_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_requests` (
    `id` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `resolvedById` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolutionNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `question_requests_status_subject_idx`(`status`, `subject`),
    UNIQUE INDEX `question_requests_tutorProfileId_subject_topic_key`(`tutorProfileId`, `subject`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_options` ADD CONSTRAINT `assessment_options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_assessment_configs` ADD CONSTRAINT `topic_assessment_configs_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempt_items` ADD CONSTRAINT `assessment_attempt_items_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `assessment_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempt_items` ADD CONSTRAINT `assessment_attempt_items_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempt_items` ADD CONSTRAINT `assessment_attempt_items_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `assessment_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_requests` ADD CONSTRAINT `question_requests_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_requests` ADD CONSTRAINT `question_requests_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
