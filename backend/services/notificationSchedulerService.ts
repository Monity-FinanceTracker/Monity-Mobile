import cron from 'node-cron';
import { SupabaseClient } from '@supabase/supabase-js';
import ExpoPushService from './expoPushService';
import FinancialHealthService from './financialHealthService';
import { logger } from '../utils/logger';
import {
  getDailyReminderMessage,
  formatWeeklyInsight,
  formatGoalReminder,
  getReengagementMessage,
} from './notificationTranslations';

/**
 * Service for scheduling push notifications
 * Handles 4 types of scheduled notifications:
 * 1. Daily Reminders (9 AM UTC)
 * 2. Weekly Insights (Monday 10 AM UTC)
 * 3. Goal Reminders (Friday 5 PM UTC)
 * 4. Re-engagement (Daily 6 PM UTC for inactive users)
 */
class NotificationSchedulerService {
  private supabase: SupabaseClient;
  private expoPushService: ExpoPushService;
  private financialHealthService: FinancialHealthService;
  private messageIndex: number;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.expoPushService = new ExpoPushService(supabase);
    this.financialHealthService = new FinancialHealthService(supabase);
    this.messageIndex = 0;
  }

  /**
   * Initialize all cron jobs
   */
  initialize(): void {
    try {
      this.scheduleDailyReminders();
      this.scheduleWeeklyInsights();
      this.scheduleGoalReminders();
      this.scheduleReengagement();

      logger.info('✅ All notification cron jobs initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification scheduler:', error);
      throw error;
    }
  }

  /**
   * Schedule daily reminders at 9 AM UTC
   * Cron: 0 9 * * * (Every day at 9:00 AM)
   */
  private scheduleDailyReminders(): void {
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running daily reminder job...');

      try {
        const users = await this.getActiveUsersForDailyReminders();
        logger.info(`Found ${users.length} users for daily reminders`);

        let sentCount = 0;
        for (const user of users) {
          const language = user.preferred_language || 'pt-BR';
          const message = getDailyReminderMessage(language, this.messageIndex);

          const result = await this.expoPushService.sendToUser(
            user.id,
            {
              title: "Monity",
              body: message,
              data: { type: 'daily_reminder', screen: 'Dashboard' },
              sound: 'default',
              priority: 'normal'
            },
            'daily_reminder'
          );

          if (result.success) {
            sentCount++;
          }
        }

        // Increment message index for rotation (5 messages)
        this.messageIndex = (this.messageIndex + 1) % 5;

        logger.info(`Daily reminders sent: ${sentCount}/${users.length}`);
      } catch (error) {
        logger.error('Error in daily reminder job:', error);
      }
    });

    logger.info('Daily reminders scheduled for 9 AM UTC');
  }

  /**
   * Schedule weekly insights at Monday 10 AM UTC
   * Cron: 0 10 * * 1 (Every Monday at 10:00 AM)
   */
  private scheduleWeeklyInsights(): void {
    cron.schedule('0 10 * * 1', async () => {
      logger.info('Running weekly insights job...');

      try {
        const users = await this.getActiveUsersForWeeklyInsights();
        logger.info(`Found ${users.length} users for weekly insights`);

        let sentCount = 0;
        for (const user of users) {
          const language = user.preferred_language || 'pt-BR';
          const insight = await this.generateWeeklyInsight(user.id, language);

          if (insight) {
            const title = language === 'en-US'
              ? '📊 Your Weekly Financial Summary'
              : '📊 Seu Resumo Financeiro Semanal';

            const result = await this.expoPushService.sendToUser(
              user.id,
              {
                title,
                body: insight,
                data: { type: 'weekly_insight', screen: 'Analytics' },
                sound: 'default',
                priority: 'high'
              },
              'weekly_insight'
            );

            if (result.success) {
              sentCount++;
            }
          }
        }

        logger.info(`Weekly insights sent: ${sentCount}/${users.length}`);
      } catch (error) {
        logger.error('Error in weekly insights job:', error);
      }
    });

    logger.info('Weekly insights scheduled for Monday 10 AM UTC');
  }

  /**
   * Schedule goal reminders at Friday 5 PM UTC
   * Cron: 0 17 * * 5 (Every Friday at 5:00 PM)
   */
  private scheduleGoalReminders(): void {
    cron.schedule('0 17 * * 5', async () => {
      logger.info('Running goal reminders job...');

      try {
        const users = await this.getUsersWithActiveGoals();
        logger.info(`Found ${users.length} users with active goals`);

        let sentCount = 0;
        for (const user of users) {
          const language = user.preferred_language || 'pt-BR';
          const goalMessage = await this.generateGoalReminderMessage(user.id, language);

          if (goalMessage) {
            const result = await this.expoPushService.sendToUser(
              user.id,
              {
                title: goalMessage.title,
                body: goalMessage.body,
                data: { type: 'goal_reminder', screen: 'Savings' },
                sound: 'default',
                priority: 'normal'
              },
              'goal_reminder'
            );

            if (result.success) {
              sentCount++;
            }
          }
        }

        logger.info(`Goal reminders sent: ${sentCount}/${users.length}`);
      } catch (error) {
        logger.error('Error in goal reminders job:', error);
      }
    });

    logger.info('Goal reminders scheduled for Friday 5 PM UTC');
  }

  /**
   * Schedule re-engagement notifications at 6 PM UTC daily
   * Cron: 0 18 * * * (Every day at 6:00 PM)
   */
  private scheduleReengagement(): void {
    cron.schedule('0 18 * * *', async () => {
      logger.info('Running re-engagement job...');

      try {
        const inactiveUsers = await this.getInactiveUsers(7);
        logger.info(`Found ${inactiveUsers.length} inactive users for re-engagement`);

        let sentCount = 0;
        for (const user of inactiveUsers) {
          const language = user.preferred_language || 'pt-BR';
          const message = getReengagementMessage(language);

          const result = await this.expoPushService.sendToUser(
            user.id,
            {
              title: message.title,
              body: message.body,
              data: { type: 'reengagement', screen: 'Dashboard' },
              sound: 'default',
              priority: 'normal'
            },
            'reengagement'
          );

          if (result.success) {
            sentCount++;
          }
        }

        logger.info(`Re-engagement notifications sent: ${sentCount}/${inactiveUsers.length}`);
      } catch (error) {
        logger.error('Error in re-engagement job:', error);
      }
    });

    logger.info('Re-engagement notifications scheduled for 6 PM UTC daily');
  }

  /**
   * Get active users who have daily reminders enabled
   */
  private async getActiveUsersForDailyReminders(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('user_id, preferred_language')
        .eq('push_enabled', true)
        .eq('daily_reminder', true);

      if (error) throw error;

      return data?.map(row => ({ id: row.user_id, preferred_language: row.preferred_language })) || [];
    } catch (error) {
      logger.error('Error fetching users for daily reminders:', error);
      return [];
    }
  }

  /**
   * Get active users who have weekly insights enabled
   */
  private async getActiveUsersForWeeklyInsights(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('user_id, preferred_language')
        .eq('push_enabled', true)
        .eq('weekly_insights', true);

      if (error) throw error;

      return data?.map(row => ({ id: row.user_id, preferred_language: row.preferred_language })) || [];
    } catch (error) {
      logger.error('Error fetching users for weekly insights:', error);
      return [];
    }
  }

  /**
   * Get users with active savings goals and goal reminders enabled
   */
  private async getUsersWithActiveGoals(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('savings_goals')
        .select('user_id')
        .eq('current_amount', '<', this.supabase.sql`target_amount`);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(data?.map(row => row.user_id))] as string[];

      // Filter by those who have goal reminders enabled
      const { data: prefsData, error: prefsError } = await this.supabase
        .from('user_notification_preferences')
        .select('user_id, preferred_language')
        .eq('push_enabled', true)
        .eq('goal_reminders', true)
        .in('user_id', userIds);

      if (prefsError) throw prefsError;

      return prefsData?.map(row => ({ id: row.user_id, preferred_language: row.preferred_language })) || [];
    } catch (error) {
      logger.error('Error fetching users with active goals:', error);
      return [];
    }
  }

  /**
   * Get inactive users (no transactions in X days) with < 3 recent reengagement attempts
   */
  private async getInactiveUsers(daysInactive: number): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_inactive_users_for_reengagement', { days_inactive: daysInactive });

      if (error) throw error;

      return data?.map((row: any) => ({ id: row.id, preferred_language: row.preferred_language })) || [];
    } catch (error) {
      logger.error('Error fetching inactive users:', error);
      return [];
    }
  }

  /**
   * Generate weekly financial insight message
   */
  private async generateWeeklyInsight(userId: string, language: string): Promise<string | null> {
    try {
      // Get transactions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('amount, typeId, category')
        .eq('userId', userId)
        .gte('date', sevenDaysAgo.toISOString());

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return language === 'en-US'
          ? "No activity last week. Time to start tracking your expenses! 📝"
          : "Nenhuma atividade na semana passada. Hora de começar a rastrear suas despesas! 📝";
      }

      const totalSpent = transactions
        .filter((t: any) => t.typeId === 1)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalIncome = transactions
        .filter((t: any) => t.typeId === 2)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Get financial health score
      const healthData = await this.financialHealthService.getFinancialHealthScore(userId);

      // Generate message using translation service
      return formatWeeklyInsight(language, totalSpent, totalIncome, healthData.score);
    } catch (error) {
      logger.error(`Error generating weekly insight for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Generate goal reminder message based on progress
   */
  private async generateGoalReminderMessage(userId: string, language: string): Promise<{ title: string; body: string } | null> {
    try {
      const { data: goals, error } = await this.supabase
        .from('savings_goals')
        .select('goal_name, current_amount, target_amount, target_date')
        .eq('user_id', userId)
        .lt('current_amount', this.supabase.sql`target_amount`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!goals || goals.length === 0) return null;

      const goal = goals[0];
      const progress = (goal.current_amount / goal.target_amount) * 100;
      const goalName = goal.goal_name;

      const daysLeft = goal.target_date
        ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      // Generate message using translation service
      return formatGoalReminder(language, goalName, progress, daysLeft);
    } catch (error) {
      logger.error(`Error generating goal reminder for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get next daily reminder message (rotating)
   */
  private getNextDailyReminderMessage(): string {
    const message = this.dailyReminderMessages[this.messageIndex];
    this.messageIndex = (this.messageIndex + 1) % this.dailyReminderMessages.length;
    return message;
  }
}

// Export singleton instance
export default NotificationSchedulerService;
