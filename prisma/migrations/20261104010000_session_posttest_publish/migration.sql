ALTER TABLE `session_tests` ADD COLUMN `posttestOpenedAt` DATETIME(3) NULL;

-- Preserve post-test access for sessions completed before this change.
UPDATE `session_tests` AS t
JOIN `class_sessions` AS s ON s.id = t.sessionId
SET t.`posttestOpenedAt` = COALESCE(t.`pretestClosedAt`, s.`updatedAt`)
WHERE s.status = 'COMPLETED' AND t.status IN ('PUBLISHED', 'CLOSED');
