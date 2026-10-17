-- AlterTable
ALTER TABLE `users` ADD COLUMN `image` TEXT NULL,
    ADD COLUMN `imageKey` VARCHAR(191) NULL,
    ADD COLUMN `profilePictureLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profilePictureUpdatedAt` DATETIME(3) NULL;
