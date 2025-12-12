-- Add Push Notification Support
-- Creates tables for expo push tokens, notification history, and updates user preferences

-- ============================================================================
-- 1. Create expo_push_tokens table to store user device push tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user_id ON expo_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_token ON expo_push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_active ON expo_push_tokens(is_active) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE expo_push_tokens IS 'Stores Expo push notification tokens for user devices';
COMMENT ON COLUMN expo_push_tokens.token IS 'Expo push token (ExponentPushToken[...])';
COMMENT ON COLUMN expo_push_tokens.device_id IS 'Unique device identifier';
COMMENT ON COLUMN expo_push_tokens.is_active IS 'Whether the token is currently active/valid';

-- ============================================================================
-- 2. Create notification_history table to track sent notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT CHECK (status IN ('sent', 'failed', 'delivered')) DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);

-- Add comment
COMMENT ON TABLE notification_history IS 'Tracks all push notifications sent to users';
COMMENT ON COLUMN notification_history.notification_type IS 'Type: daily_reminder, weekly_insight, goal_reminder, reengagement, etc.';
COMMENT ON COLUMN notification_history.status IS 'Delivery status: sent, failed, delivered';

-- ============================================================================
-- 3. Update user_notification_preferences table with granular controls
-- ============================================================================
ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS daily_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_insights BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS goal_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_time TIME DEFAULT '09:00:00';

-- Add comments
COMMENT ON COLUMN user_notification_preferences.daily_reminder IS 'Enable daily engagement reminders (9 AM)';
COMMENT ON COLUMN user_notification_preferences.weekly_insights IS 'Enable weekly financial insights (Monday 10 AM)';
COMMENT ON COLUMN user_notification_preferences.goal_reminders IS 'Enable savings goal progress reminders (Friday 5 PM)';
COMMENT ON COLUMN user_notification_preferences.preferred_time IS 'User preferred time for notifications (currently unused, for future)';

-- ============================================================================
-- 4. Create helper function to get inactive users for re-engagement
-- ============================================================================
CREATE OR REPLACE FUNCTION get_inactive_users_for_reengagement(days_inactive INTEGER)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  subscription_tier TEXT,
  push_enabled BOOLEAN,
  last_notification_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.subscription_tier,
    unp.push_enabled,
    COUNT(nh.id) as last_notification_count
  FROM profiles p
  INNER JOIN user_notification_preferences unp ON p.id = unp.user_id
  LEFT JOIN notification_history nh ON p.id = nh.user_id
    AND nh.notification_type = 'reengagement'
    AND nh.sent_at > NOW() - INTERVAL '21 days'
  WHERE unp.push_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t."userId" = p.id
    AND t."createdAt" > NOW() - (days_inactive || ' days')::INTERVAL
  )
  GROUP BY p.id, p.name, p.email, p.subscription_tier, unp.push_enabled
  HAVING COUNT(nh.id) < 3;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_inactive_users_for_reengagement IS 'Returns users inactive for X days who have received < 3 reengagement notifications in last 21 days';

-- ============================================================================
-- 5. Create function to clean up old notification history (optional maintenance)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_notification_history(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notification_history
  WHERE sent_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notification_history IS 'Deletes notification history older than specified days (default 90)';
