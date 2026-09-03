-- AlterTable
ALTER TABLE `topic_requests` ADD COLUMN `directedTutorProfileId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('OPEN', 'ACCEPTED', 'ENROLLED', 'FULFILLED', 'CANCELLED') NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `topic_requests_directedTutorProfileId_status_idx` ON `topic_requests`(`directedTutorProfileId`, `status`);

-- AddForeignKey
ALTER TABLE `topic_requests` ADD CONSTRAINT `topic_requests_directedTutorProfileId_fkey` FOREIGN KEY (`directedTutorProfileId`) REFERENCES `tutor_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
