-- AlterTable
ALTER TABLE `tutor_classes` ADD COLUMN `suspendedUntil` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `statusExpiresAt` DATETIME(3) NULL;
