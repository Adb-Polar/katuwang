-- Password changes increment this value to revoke older JWT sessions.
ALTER TABLE `users` ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;
