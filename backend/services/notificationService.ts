import { logger } from "../utils/logger";
import ExpoPushService from "./expoPushService";

interface NotificationDependencies {
  emailClient?: any;
  expoPushService?: ExpoPushService;
}

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
}

interface NotificationMessage {
  subject: string;
  body: string;
}

interface NotificationData {
  name?: string;
  message?: string;
  goalName?: string;
  amount?: string;
  [key: string]: any;
}

export default class NotificationService {
  private supabase: any;
  private emailClient: any;
  private expoPushService: ExpoPushService;

  constructor(supabase: any, dependencies: NotificationDependencies = {}) {
    this.supabase = supabase;
    // In a real app, you would inject actual clients
    this.emailClient = dependencies.emailClient || console;
    this.expoPushService = dependencies.expoPushService || new ExpoPushService(supabase);
  }

  /**
   * Send a notification through multiple channels based on user preferences.
   * @param userId - The ID of the user.
   * @param type - The type of notification (e.g., 'financial_alert').
   * @param data - The data for the notification template.
   * @returns Promise<void>
   */
  async send(
    userId: string,
    type: string,
    data: NotificationData
  ): Promise<void> {
    try {
      const { data: preferences, error } = await this.supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (!preferences) {
        logger.warn(`No notification preferences found for user ${userId}`);
        return;
      }

      const message = this.renderTemplate(type, data);

      if (preferences.email_enabled) {
        await this.sendEmail(userId, message.subject, message.body);
      }
      if (preferences.push_enabled) {
        await this.sendPush(userId, message.subject, message.body);
      }
      if (preferences.in_app_enabled) {
        await this.sendInApp(userId, type, message);
      }

      logger.info(`Notification of type ${type} sent to user ${userId}`);
    } catch (error: any) {
      logger.error(`Failed to send notification to user ${userId}`, {
        error: error.message,
        type,
      });
      throw error;
    }
  }

  /**
   * Send an email notification.
   * @param userId - The user's ID to get their email address.
   * @param subject - The email subject.
   * @param body - The email body (can be HTML).
   */
  async sendEmail(
    userId: string,
    subject: string,
    body: string
  ): Promise<void> {
    // In a real implementation, you'd fetch the user's email
    // const { data: user, error } = await this.supabase.from('users').select('email').eq('id', userId).single();
    // if (error || !user) throw new Error('User not found for email');
    // await this.emailClient.send({ to: user.email, subject, html: body });
    this.emailClient.log(`Email sent to user ${userId}: ${subject}`);
  }

  /**
   * Send a push notification.
   * @param userId - The user's ID to get their device tokens.
   * @param title - The push notification title.
   * @param body - The push notification body.
   * @param data - Optional data payload for the notification.
   */
  async sendPush(userId: string, title: string, body: string, data?: any): Promise<void> {
    try {
      await this.expoPushService.sendToUser(
        userId,
        {
          title,
          body,
          data,
          sound: 'default',
          priority: 'high'
        },
        'general'
      );
    } catch (error: any) {
      logger.error(`Failed to send push notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create an in-app notification in the database.
   * @param userId - The user's ID.
   * @param type - The notification type.
   * @param message - The notification message content.
   */
  async sendInApp(
    userId: string,
    type: string,
    message: NotificationMessage
  ): Promise<void> {
    const { error } = await this.supabase.from("notifications").insert({
      user_id: userId,
      type: type,
      title: message.subject,
      message: message.body,
      is_read: false,
    });
    if (error) throw error;
  }

  /**
   * Renders a notification message from a template.
   * @param type - The template type.
   * @param data - The data to populate the template.
   * @returns NotificationMessage
   */
  renderTemplate(type: string, data: NotificationData): NotificationMessage {
    // This would typically use a more sophisticated templating engine
    switch (type) {
      case "welcome":
        return {
          subject: "Welcome to Monity!",
          body: `Hi ${data.name}, welcome to your new financial journey!`,
        };
      case "financial_alert":
        return {
          subject: "Financial Alert",
          body: data.message || "You have a financial alert.",
        };
      case "goal_achieved":
        return {
          subject: `Congratulations! You've reached your goal: ${data.goalName}`,
          body: `You've successfully saved ${data.amount} for your goal!`,
        };
      default:
        return {
          subject: "Notification",
          body: "You have a new notification.",
        };
    }
  }
}
