CREATE TABLE `seed_data_rebuilds` (
  `id` VARCHAR(191) NOT NULL,
  `revision` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `backup` LONGBLOB NOT NULL,
  `backupSha256` VARCHAR(191) NOT NULL,
  `summary` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
