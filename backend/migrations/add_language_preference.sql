-- Add language preference to user_notification_preferences
-- Supports pt-BR (Portuguese - Brazil) and en-US (English - United States)

ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'pt-BR';

-- Add comment
COMMENT ON COLUMN user_notification_preferences.preferred_language IS 'User preferred language for notifications (pt-BR, en-US)';

-- Update existing users to pt-BR (default language)
UPDATE user_notification_preferences
SET preferred_language = 'pt-BR'
WHERE preferred_language IS NULL;
