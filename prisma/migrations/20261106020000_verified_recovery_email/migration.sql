ALTER TABLE `users` ADD COLUMN `recoveryEmailVerifiedAt` DATETIME(3) NULL;
CREATE TABLE `recovery_email_tokens` (
 `id` VARCHAR(191) NOT NULL,
 `userId` VARCHAR(191) NOT NULL,
 `email` VARCHAR(191) NOT NULL,
 `tokenHash` VARCHAR(191) NOT NULL,
 `expiresAt` DATETIME(3) NOT NULL,
 `usedAt` DATETIME(3) NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE INDEX `recovery_email_tokens_tokenHash_key` (`tokenHash`),
 INDEX `recovery_email_tokens_userId_idx` (`userId`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `recovery_email_tokens` ADD CONSTRAINT `recovery_email_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
