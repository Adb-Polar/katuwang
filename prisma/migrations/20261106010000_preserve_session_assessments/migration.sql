ALTER TABLE `session_tests` DROP FOREIGN KEY `session_tests_sessionId_fkey`;
ALTER TABLE `session_tests` ADD CONSTRAINT `session_tests_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
