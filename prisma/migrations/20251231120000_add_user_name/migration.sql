-- Add name column to auth_users
ALTER TABLE `auth_users` ADD COLUMN `name` VARCHAR(50) NULL;

-- Backfill existing rows to preserve previous UI labels
UPDATE `auth_users`
SET `name` = CASE `role`
  WHEN 'admin' THEN '小崔'
  WHEN 'viewer' THEN '小鹿'
  ELSE `role`
END
WHERE `name` IS NULL;

-- Make name required
ALTER TABLE `auth_users` MODIFY `name` VARCHAR(50) NOT NULL;

