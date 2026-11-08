-- Reuse recoveryEmailVerifiedAt from 20261106020000_verified_recovery_email.
CREATE TABLE `recovery_challenges` (
 `id` VARCHAR(191) NOT NULL,
 `userId` VARCHAR(191) NOT NULL,
 `tokenHash` VARCHAR(191) NOT NULL,
 `purpose` VARCHAR(191) NOT NULL,
 `email` VARCHAR(191) NOT NULL,
 `codeHash` VARCHAR(191) NULL,
 `attempts` INTEGER NOT NULL DEFAULT 0,
 `verifiedAt` DATETIME(3) NULL,
 `usedAt` DATETIME(3) NULL,
 `expiresAt` DATETIME(3) NOT NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE INDEX `recovery_challenges_tokenHash_key` (`tokenHash`),
 INDEX `recovery_challenges_userId_idx` (`userId`),
 PRIMARY KEY (`id`),
 CONSTRAINT `recovery_challenges_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
