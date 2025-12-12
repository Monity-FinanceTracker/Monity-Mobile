-- Create user_notification_preferences table
-- This table stores user-specific notification preferences

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  daily_reminder BOOLEAN DEFAULT true,
  weekly_insights BOOLEAN DEFAULT true,
  goal_reminders BOOLEAN DEFAULT true,
  preferred_time TIME DEFAULT '09:00:00',
  preferred_language TEXT DEFAULT 'pt-BR' CHECK (preferred_language IN ('pt-BR', 'en-US')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Add comments
COMMENT ON TABLE user_notification_preferences IS 'User-specific notification preferences and settings';
COMMENT ON COLUMN user_notification_preferences.email_enabled IS 'Enable email notifications';
COMMENT ON COLUMN user_notification_preferences.push_enabled IS 'Enable push notifications';
COMMENT ON COLUMN user_notification_preferences.in_app_enabled IS 'Enable in-app notifications';
COMMENT ON COLUMN user_notification_preferences.daily_reminder IS 'Enable daily engagement reminders (9 AM)';
COMMENT ON COLUMN user_notification_preferences.weekly_insights IS 'Enable weekly financial insights (Monday 10 AM)';
COMMENT ON COLUMN user_notification_preferences.goal_reminders IS 'Enable savings goal progress reminders (Friday 5 PM)';
COMMENT ON COLUMN user_notification_preferences.preferred_time IS 'User preferred time for notifications';
COMMENT ON COLUMN user_notification_preferences.preferred_language IS 'User preferred language for notifications (pt-BR, en-US)';

