-- DropForeignKey
ALTER TABLE `topic_assessment_configs` DROP FOREIGN KEY `topic_assessment_configs_updatedById_fkey`;

-- DropIndex
DROP INDEX `assessment_questions_subject_topic_active_idx` ON `assessment_questions`;

-- AlterTable
ALTER TABLE `assessment_attempts` MODIFY `subject` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `assessment_questions` ADD COLUMN `origin` ENUM('BANK', 'TUTOR') NOT NULL DEFAULT 'BANK',
    ADD COLUMN `ownerTutorProfileId` VARCHAR(191) NULL,
    MODIFY `subject` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `question_requests` MODIFY `subject` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `topic_certifications` MODIFY `subject` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `topic_requests` MODIFY `subject` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tutor_classes` MODIFY `subject` VARCHAR(191) NOT NULL;

ALTER TABLE `users` MODIFY `status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING', 'DECLINED') NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE `topic_assessment_configs`;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjects_slug_key`(`slug`),
    UNIQUE INDEX `subjects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `topics_subjectId_active_idx`(`subjectId`, `active`),
    UNIQUE INDEX `topics_subjectId_name_key`(`subjectId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chatbot_misses` (
    `id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `role` ENUM('ADMIN', 'STUDENT_TUTOR', 'STUDENT_LEARNER') NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chatbot_misses_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_appeals` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `tutorProfileId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewNote` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_appeals_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `class_appeals_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('TUTOR', 'CLASS') NOT NULL,
    `reportedTutorProfileId` VARCHAR(191) NULL,
    `classId` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `resolutionNote` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reports_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `reports_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_violations` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `type` ENUM('HARASSMENT_OR_BULLYING', 'ANONYMITY_BREACH', 'SOLICITING_PAYMENT', 'DISCRIMINATION', 'UNPROFESSIONAL_CONDUCT', 'NO_SHOW_OR_ABSENCE', 'MISLEADING_ACADEMIC_INFO', 'MISLEADING_CLASS_INFO', 'OFF_TOPIC_SESSIONS', 'SPAM_OR_DUPLICATE', 'SCHEDULE_ABUSE', 'INAPPROPRIATE_CONTENT', 'OTHER') NOT NULL,

    UNIQUE INDEX `report_violations_reportId_type_key`(`reportId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_tests` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `session_tests_sessionId_key`(`sessionId`),
    INDEX `session_tests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_test_questions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionTestId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,

    UNIQUE INDEX `session_test_questions_sessionTestId_position_key`(`sessionTestId`, `position`),
    UNIQUE INDEX `session_test_questions_sessionTestId_questionId_key`(`sessionTestId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_test_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `sessionTestId` VARCHAR(191) NOT NULL,
    `learnerId` VARCHAR(191) NOT NULL,
    `kind` ENUM('PRE', 'POST') NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
    `totalQuestions` INTEGER NOT NULL,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `scorePercent` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `session_test_attempts_learnerId_kind_idx`(`learnerId`, `kind`),
    INDEX `session_test_attempts_sessionTestId_kind_status_idx`(`sessionTestId`, `kind`, `status`),
    UNIQUE INDEX `session_test_attempts_sessionTestId_learnerId_kind_key`(`sessionTestId`, `learnerId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_test_attempt_items` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `selectedOptionId` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NULL,

    UNIQUE INDEX `session_test_attempt_items_attemptId_position_key`(`attemptId`, `position`),
    UNIQUE INDEX `session_test_attempt_items_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `assessment_questions_subject_topic_active_origin_idx` ON `assessment_questions`(`subject`, `topic`, `active`, `origin`);

-- CreateIndex
CREATE INDEX `assessment_questions_ownerTutorProfileId_idx` ON `assessment_questions`(`ownerTutorProfileId`);

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_questions` ADD CONSTRAINT `assessment_questions_ownerTutorProfileId_fkey` FOREIGN KEY (`ownerTutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chatbot_misses` ADD CONSTRAINT `chatbot_misses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_appeals` ADD CONSTRAINT `class_appeals_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_appeals` ADD CONSTRAINT `class_appeals_tutorProfileId_fkey` FOREIGN KEY (`tutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_appeals` ADD CONSTRAINT `class_appeals_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reportedTutorProfileId_fkey` FOREIGN KEY (`reportedTutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `tutor_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_violations` ADD CONSTRAINT `report_violations_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_tests` ADD CONSTRAINT `session_tests_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_questions` ADD CONSTRAINT `session_test_questions_sessionTestId_fkey` FOREIGN KEY (`sessionTestId`) REFERENCES `session_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_questions` ADD CONSTRAINT `session_test_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_attempts` ADD CONSTRAINT `session_test_attempts_sessionTestId_fkey` FOREIGN KEY (`sessionTestId`) REFERENCES `session_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_attempts` ADD CONSTRAINT `session_test_attempts_learnerId_fkey` FOREIGN KEY (`learnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_attempt_items` ADD CONSTRAINT `session_test_attempt_items_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `session_test_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_attempt_items` ADD CONSTRAINT `session_test_attempt_items_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `assessment_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_test_attempt_items` ADD CONSTRAINT `session_test_attempt_items_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `assessment_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
