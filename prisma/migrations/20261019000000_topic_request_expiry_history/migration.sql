ALTER TABLE `topic_requests` ADD COLUMN `expiresAt` DATETIME(3) NULL, ADD COLUMN `lastSubmittedAt` DATETIME(3) NULL;
UPDATE `topic_requests` SET `lastSubmittedAt` = `createdAt`, `expiresAt` = DATE_ADD(`createdAt`, INTERVAL 3 DAY);
ALTER TABLE `topic_requests` MODIFY `expiresAt` DATETIME(3) NOT NULL, MODIFY `lastSubmittedAt` DATETIME(3) NOT NULL;
CREATE TABLE `topic_request_history` (
  `id` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `before` JSON NULL,
  `after` JSON NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `topic_request_history_requestId_createdAt_idx` (`requestId`, `createdAt`),
  CONSTRAINT `topic_request_history_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `topic_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `topic_request_history` (`id`, `requestId`, `actorId`, `eventType`, `createdAt`, `before`, `after`)
SELECT UUID(), `id`, NULL, 'IMPORTED_BASELINE', `createdAt`, NULL,
 JSON_OBJECT('id', `id`, 'subject', `subject`, 'gradeLevel', `gradeLevel`, 'note', `note`, 'status', `status`, 'fulfilledClassId', `fulfilledClassId`, 'directedTutorProfileId', `directedTutorProfileId`, 'createdAt', `createdAt`, 'lastSubmittedAt', `lastSubmittedAt`, 'expiresAt', `expiresAt`,
   'topics', COALESCE((SELECT JSON_ARRAYAGG(t.`topic`) FROM `topic_request_topics` t WHERE t.`requestId` = `topic_requests`.`id`), JSON_ARRAY()),
   'slots', COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('day', sl.`day`, 'startTime', sl.`startTime`, 'endTime', sl.`endTime`)) FROM `topic_request_slots` sl WHERE sl.`requestId` = `topic_requests`.`id`), JSON_ARRAY()))
FROM `topic_requests`;
