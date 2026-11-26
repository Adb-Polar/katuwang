-- Messages to the administrators from the public contact form.
-- CreateTable
CREATE TABLE `contact_messages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `category` ENUM('ACCOUNT_ACCESS', 'SUSPENSION_OR_BAN', 'REGISTRATION', 'OTHER') NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('OPEN', 'HANDLED') NOT NULL DEFAULT 'OPEN',
    `handledById` VARCHAR(191) NULL,
    `handledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `contact_messages_handledById_idx`(`handledById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_handledById_fkey` FOREIGN KEY (`handledById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

