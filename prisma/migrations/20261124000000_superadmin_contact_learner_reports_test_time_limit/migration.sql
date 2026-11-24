-- AlterTable
ALTER TABLE `reports` ADD COLUMN `reportedLearnerId` VARCHAR(191) NULL,
    MODIFY `targetType` ENUM('TUTOR', 'CLASS', 'LEARNER') NOT NULL;

-- AlterTable
ALTER TABLE `session_tests` ADD COLUMN `timeLimitMinutes` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `adminNote` TEXT NULL,
    `resolvedById` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `reports_reportedLearnerId_idx` ON `reports`(`reportedLearnerId`);

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reportedLearnerId_fkey` FOREIGN KEY (`reportedLearnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

