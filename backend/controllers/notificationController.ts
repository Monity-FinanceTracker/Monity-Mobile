import { Request, Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import ExpoPushService from '../services/expoPushService';
import { logger } from '../utils/logger';

/**
 * Controller for handling push notification endpoints
 */
export default class NotificationController {
  private supabase: SupabaseClient;
  private expoPushService: ExpoPushService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.expoPushService = new ExpoPushService(supabase);
  }

  /**
   * POST /api/v1/notifications/register-token
   * Register a new push token for a user
   */
  registerToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        logger.error('registerToken: No user ID found in request', {
          hasUser: !!(req as any).user,
          userKeys: (req as any).user ? Object.keys((req as any).user) : []
        });
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { token, deviceId, platform } = req.body;

      logger.info('registerToken: Received request', {
        userId,
        hasToken: !!token,
        hasDeviceId: !!deviceId,
        platform,
        tokenLength: token?.length
      });

      if (!token || !deviceId || !platform) {
        logger.warn('registerToken: Missing required fields', {
          hasToken: !!token,
          hasDeviceId: !!deviceId,
          hasPlatform: !!platform
        });
        res.status(400).json({
          error: 'Missing required fields: token, deviceId, platform'
        });
        return;
      }

      if (platform !== 'ios' && platform !== 'android') {
        logger.warn('registerToken: Invalid platform', { platform });
        res.status(400).json({
          error: 'Platform must be either "ios" or "android"'
        });
        return;
      }

      const result = await this.expoPushService.registerToken(
        userId,
        token,
        deviceId,
        platform
      );

      if (result.success) {
        logger.info('registerToken: Success', { userId, deviceId, platform });
        res.status(200).json({
          message: 'Push token registered successfully',
          success: true
        });
      } else {
        logger.error('registerToken: Failed in service', {
          userId,
          error: result.error
        });
        res.status(400).json({
          error: result.error || 'Failed to register push token',
          success: false
        });
      }
    } catch (error: any) {
      logger.error('Error in registerToken:', {
        error: error.message,
        stack: error.stack,
        userId: (req as any).user?.id
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /api/v1/notifications/unregister-token
   * Unregister a push token for a user
   */
  unregisterToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { deviceId } = req.body;

      if (!deviceId) {
        res.status(400).json({ error: 'Missing required field: deviceId' });
        return;
      }

      const success = await this.expoPushService.unregisterToken(userId, deviceId);

      if (success) {
        res.status(200).json({
          message: 'Push token unregistered successfully',
          success: true
        });
      } else {
        res.status(400).json({
          error: 'Failed to unregister push token',
          success: false
        });
      }
    } catch (error: any) {
      logger.error('Error in unregisterToken:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * GET /api/v1/notifications/preferences
   * Get user notification preferences
   */
  getPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If table doesn't exist or no preferences found, return defaults
      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === '42P01') {
          logger.warn('user_notification_preferences table does not exist. Please run migration.');
          // Return default preferences
          res.status(200).json({
            preferences: {
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
              daily_reminder: true,
              weekly_insights: true,
              goal_reminders: true,
              preferred_language: 'pt-BR',
              preferred_time: '09:00:00'
            }
          });
          return;
        }
        
        // If it's a "no rows" error, return defaults
        if (error.code === 'PGRST116') {
          res.status(200).json({
            preferences: {
              email_enabled: true,
              push_enabled: true,
              in_app_enabled: true,
              daily_reminder: true,
              weekly_insights: true,
              goal_reminders: true,
              preferred_language: 'pt-BR',
              preferred_time: '09:00:00'
            }
          });
          return;
        }
        
        logger.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
        return;
      }

      res.status(200).json({
        preferences: data || {
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          daily_reminder: true,
          weekly_insights: true,
          goal_reminders: true,
          preferred_language: 'pt-BR',
          preferred_time: '09:00:00'
        }
      });
    } catch (error: any) {
      logger.error('Error in getPreferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * PUT /api/v1/notifications/preferences
   * Update user notification preferences
   */
  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        email_enabled,
        push_enabled,
        in_app_enabled,
        daily_reminder,
        weekly_insights,
        goal_reminders,
        preferred_time,
        preferred_language
      } = req.body;

      const updates: any = {};
      if (typeof email_enabled === 'boolean') updates.email_enabled = email_enabled;
      if (typeof push_enabled === 'boolean') updates.push_enabled = push_enabled;
      if (typeof in_app_enabled === 'boolean') updates.in_app_enabled = in_app_enabled;
      if (typeof daily_reminder === 'boolean') updates.daily_reminder = daily_reminder;
      if (typeof weekly_insights === 'boolean') updates.weekly_insights = weekly_insights;
      if (typeof goal_reminders === 'boolean') updates.goal_reminders = goal_reminders;
      if (preferred_time) updates.preferred_time = preferred_time;
      if (preferred_language && (preferred_language === 'pt-BR' || preferred_language === 'en-US')) {
        updates.preferred_language = preferred_language;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No valid preferences provided' });
        return;
      }

      // Check if preferences exist
      const { data: existing, error: checkError } = await this.supabase
        .from('user_notification_preferences')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      // Handle table doesn't exist error
      if (checkError && checkError.code === '42P01') {
        logger.warn('user_notification_preferences table does not exist. Please run migration.');
        res.status(503).json({ 
          error: 'Notification preferences table not available. Please contact support.',
          requiresMigration: true
        });
        return;
      }

      if (existing) {
        // Update existing preferences
        const { error } = await this.supabase
          .from('user_notification_preferences')
          .update(updates)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new preferences
        const { error } = await this.supabase
          .from('user_notification_preferences')
          .insert({ user_id: userId, ...updates });

        if (error) throw error;
      }

      res.status(200).json({
        message: 'Preferences updated successfully',
        success: true
      });
    } catch (error: any) {
      logger.error('Error in updatePreferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * GET /api/v1/notifications/history
   * Get user notification history with pagination
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await this.expoPushService.getNotificationHistory(
        userId,
        limit,
        offset
      );

      res.status(200).json({
        history,
        count: history.length,
        limit,
        offset
      });
    } catch (error: any) {
      logger.error('Error in getHistory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * GET /api/v1/notifications/stats
   * Get notification statistics for the user
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await this.expoPushService.getNotificationStats(userId);

      res.status(200).json({ stats });
    } catch (error: any) {
      logger.error('Error in getStats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * POST /api/v1/notifications/test
   * Send a test notification (development/testing only)
   */
  sendTest = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only allow in non-production environments
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Test notifications not allowed in production' });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title, body, data } = req.body;

      const result = await this.expoPushService.sendToUser(
        userId,
        {
          title: title || 'Test Notification',
          body: body || 'This is a test notification from Monity',
          data: data || { type: 'test' },
          sound: 'default',
          priority: 'high'
        },
        'test'
      );

      if (result.success) {
        res.status(200).json({
          message: 'Test notification sent',
          ticketCount: result.ticketCount,
          success: true
        });
      } else {
        res.status(400).json({
          error: 'Failed to send test notification',
          success: false
        });
      }
    } catch (error: any) {
      logger.error('Error in sendTest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
