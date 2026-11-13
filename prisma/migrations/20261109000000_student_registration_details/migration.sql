-- Nullable for existing users and pending applications. Required for new student signups by the shared registration schema.
ALTER TABLE `users`
    ADD COLUMN `studentIdNumber` VARCHAR(191) NULL,
    ADD COLUMN `adviserTeacherName` VARCHAR(191) NULL;
