import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

/**
 * Service for managing Expo Push Notifications
 * Handles token registration, notification sending, and delivery tracking
 */
class ExpoPushService {
  private expo: Expo;
  private supabase: SupabaseClient;
  private batchSize: number;

  constructor(supabase: SupabaseClient) {
    this.expo = new Expo();
    this.supabase = supabase;
    this.batchSize = parseInt(process.env.NOTIFICATION_BATCH_SIZE || '100');
  }

  /**
   * Register a new push token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    deviceId: string,
    platform: 'ios' | 'android'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate the token format
      if (!Expo.isExpoPushToken(token)) {
        return { success: false, error: 'Invalid Expo push token format' };
      }

      // Check if token already exists for this user
      const { data: existingToken } = await this.supabase
        .from('expo_push_tokens')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();

      if (existingToken) {
        // Update existing token
        const { error } = await this.supabase
          .from('expo_push_tokens')
          .update({
            token,
            platform,
            is_active: true,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingToken.id);

        if (error) throw error;
      } else {
        // Insert new token
        const { error } = await this.supabase
          .from('expo_push_tokens')
          .insert({
            user_id: userId,
            token,
            device_id: deviceId,
            platform,
            is_active: true
          });

        if (error) throw error;
      }

      logger.info(`Push token registered for user ${userId} on ${platform}`);
      return { success: true };
    } catch (error: any) {
      logger.error('Error registering push token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unregister push token for a user device
   */
  async unregisterToken(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('expo_push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      if (error) throw error;

      logger.info(`Push token unregistered for user ${userId}, device ${deviceId}`);
      return true;
    } catch (error) {
      logger.error('Error unregistering push token:', error);
      return false;
    }
  }

  /**
   * Get all active push tokens for a user
   */
  async getUserPushTokens(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('expo_push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const tokens = data?.map(row => row.token) || [];

      // Filter out invalid tokens
      return tokens.filter(token => Expo.isExpoPushToken(token));
    } catch (error) {
      logger.error(`Error fetching push tokens for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: any;
      sound?: string;
      priority?: 'default' | 'normal' | 'high';
      badge?: number;
    },
    notificationType: string
  ): Promise<{ success: boolean; ticketCount: number }> {
    try {
      const tokens = await this.getUserPushTokens(userId);

      if (tokens.length === 0) {
        logger.warn(`No active push tokens found for user ${userId}`);
        await this.logNotificationHistory(
          userId,
          notificationType,
          payload.title,
          payload.body,
          'failed',
          'No active push tokens'
        );
        return { success: false, ticketCount: 0 };
      }

      const messages: ExpoPushMessage[] = tokens.map(token => ({
        to: token,
        sound: payload.sound || 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        priority: payload.priority || 'high',
        badge: payload.badge
      }));

      const tickets = await this.sendMessages(messages);

      // Log notification history
      await this.logNotificationHistory(
        userId,
        notificationType,
        payload.title,
        payload.body,
        'sent'
      );

      logger.info(`Sent notification to user ${userId}, ${tickets.length} tickets`);
      return { success: true, ticketCount: tickets.length };
    } catch (error: any) {
      logger.error(`Error sending notification to user ${userId}:`, error);
      await this.logNotificationHistory(
        userId,
        notificationType,
        payload.title,
        payload.body,
        'failed',
        error.message
      );
      return { success: false, ticketCount: 0 };
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      data?: any;
      sound?: string;
      priority?: 'default' | 'normal' | 'high';
    },
    notificationType: string
  ): Promise<{ sentCount: number; failedCount: number }> {
    let sentCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload, notificationType);
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    logger.info(`Batch send complete: ${sentCount} sent, ${failedCount} failed`);
    return { sentCount, failedCount };
  }

  /**
   * Send messages in chunks using Expo SDK
   */
  private async sendMessages(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // Check for errors in tickets
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          if (ticket.status === 'error') {
            logger.error('Push notification error:', {
              message: ticket.message,
              details: ticket.details
            });

            // Deactivate token if it's invalid
            if (ticket.details?.error === 'DeviceNotRegistered') {
              const token = chunk[i].to as string;
              await this.deactivateInvalidToken(token);
            }
          }
        }
      } catch (error) {
        logger.error('Error sending push notification chunk:', error);
      }
    }

    return tickets;
  }

  /**
   * Deactivate an invalid token
   */
  async deactivateInvalidToken(token: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('expo_push_tokens')
        .update({ is_active: false })
        .eq('token', token);

      if (error) throw error;

      logger.info(`Deactivated invalid push token: ${token}`);
    } catch (error) {
      logger.error('Error deactivating token:', error);
    }
  }

  /**
   * Log notification to history table
   */
  private async logNotificationHistory(
    userId: string,
    notificationType: string,
    title: string,
    body: string,
    status: 'sent' | 'failed' | 'delivered',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notification_history')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          title,
          body,
          status,
          error_message: errorMessage
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging notification history:', error);
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error(`Error fetching notification history for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    delivered: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('notification_history')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        sent: data?.filter(n => n.status === 'sent').length || 0,
        failed: data?.filter(n => n.status === 'failed').length || 0,
        delivered: data?.filter(n => n.status === 'delivered').length || 0
      };

      return stats;
    } catch (error) {
      logger.error(`Error fetching notification stats for user ${userId}:`, error);
      return { total: 0, sent: 0, failed: 0, delivered: 0 };
    }
  }
}

export default ExpoPushService;
