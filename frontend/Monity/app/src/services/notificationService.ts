import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1';
const AUTH_TOKEN_KEY = 'auth_token';
const DEVICE_ID_KEY = 'device_id';

/**
 * Service for handling Expo Push Notifications on mobile
 */
class NotificationService {
  /**
   * Request permission and register for push notifications
   * @param userId - The user's ID
   * @returns The Expo push token or null
   */
  static async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      // Check if device is physical
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token - permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const token = tokenData.data;

      console.log('Expo push token:', token);

      // Get or create device ID
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }

      // Save token to backend
      await this.saveTokenToBackend(userId, token, deviceId, Platform.OS as 'ios' | 'android');

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to backend
   */
  private static async saveTokenToBackend(
    userId: string,
    token: string,
    deviceId: string,
    platform: 'ios' | 'android'
  ): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          deviceId,
          platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register push token');
      }

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error saving token to backend:', error);
      throw error;
    }
  }

  /**
   * Unregister push token (called on logout)
   */
  static async unregisterPushToken(userId: string): Promise<void> {
    try {
      const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        console.log('No device ID found');
        return;
      }

      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) {
        console.log('No auth token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/unregister-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unregister push token');
      }

      console.log('Push token unregistered successfully');
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(navigation?: any): void {
    // Listener for notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listener for when a user taps on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);

      const data = response.notification.request.content.data;

      // Handle navigation based on notification data
      if (navigation && data?.screen) {
        const screen = data.screen;
        try {
          navigation.navigate(screen);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Set badge count (iOS)
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Get notification preferences from backend
   */
  static async getNotificationPreferences(): Promise<any> {
    try {
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get preferences');
      }

      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(preferences: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    in_app_enabled?: boolean;
    daily_reminder?: boolean;
    weekly_insights?: boolean;
    goal_reminders?: boolean;
  }): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }

      console.log('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

export default NotificationService;
