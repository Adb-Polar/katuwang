-- Chunk 13 — User registration approval queue

-- AlterTable: add PENDING to AccountStatus
ALTER TABLE `users` MODIFY `status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING') NOT NULL DEFAULT 'ACTIVE';
