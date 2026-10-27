ALTER TABLE `subjects` ADD COLUMN `gradeLevels` JSON NULL;
ALTER TABLE `topics` ADD COLUMN `gradeLevels` JSON NULL;
ALTER TABLE `topic_request_slots` ADD COLUMN `date` VARCHAR(191) NULL;
