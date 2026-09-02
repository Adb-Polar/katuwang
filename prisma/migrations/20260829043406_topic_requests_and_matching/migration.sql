-- AlterTable
ALTER TABLE `tutor_classes` ADD COLUMN `gradeLevel` ENUM('GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12') NULL;

-- CreateTable
CREATE TABLE `topic_requests` (
    `id` VARCHAR(191) NOT NULL,
    `learnerId` VARCHAR(191) NOT NULL,
    `subject` ENUM('MATH', 'ENGLISH', 'SCIENCE', 'FILIPINO', 'ARALING_PANLIPUNAN', 'TLE', 'MAPEH') NOT NULL,
    `gradeLevel` ENUM('GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12') NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('OPEN', 'FULFILLED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `fulfilledClassId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `topic_requests_status_subject_idx`(`status`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic_request_topics` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `topic_request_topics_requestId_topic_key`(`requestId`, `topic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic_request_slots` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `day` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `topic_requests` ADD CONSTRAINT `topic_requests_learnerId_fkey` FOREIGN KEY (`learnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_requests` ADD CONSTRAINT `topic_requests_fulfilledClassId_fkey` FOREIGN KEY (`fulfilledClassId`) REFERENCES `tutor_classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_request_topics` ADD CONSTRAINT `topic_request_topics_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `topic_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic_request_slots` ADD CONSTRAINT `topic_request_slots_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `topic_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
