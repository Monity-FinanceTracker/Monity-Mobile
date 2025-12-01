import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import { COLORS } from "../../constants/colors";
import { ArrowLeft, Bell, BellOff, Check, Globe } from "lucide-react-native";
import NotificationService from "../../services/notificationService";

export default function NotificationSettings() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    push_enabled: true,
    email_enabled: true,
    in_app_enabled: true,
    daily_reminder: true,
    weekly_insights: true,
    goal_reminders: true,
    preferred_language: 'pt-BR' as 'pt-BR' | 'en-US',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await NotificationService.getNotificationPreferences();
      setPreferences({
        push_enabled: prefs.push_enabled ?? true,
        email_enabled: prefs.email_enabled ?? true,
        in_app_enabled: prefs.in_app_enabled ?? true,
        daily_reminder: prefs.daily_reminder ?? true,
        weekly_insights: prefs.weekly_insights ?? true,
        goal_reminders: prefs.goal_reminders ?? true,
        preferred_language: prefs.preferred_language ?? 'pt-BR',
      });
    } catch (error: any) {
      console.error("Failed to load preferences:", error);
      Alert.alert("Error", "Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: string, value: boolean | string) => {
    try {
      setIsSaving(true);
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      await NotificationService.updateNotificationPreferences({
        [key]: value,
      });
    } catch (error: any) {
      console.error("Failed to update preference:", error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert("Error", "Failed to update notification preference");
    } finally {
      setIsSaving(false);
    }
  };

  const SettingRow = ({
    title,
    description,
    value,
    onValueChange,
    disabled = false,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-700">
      <View className="flex-1 mr-4">
        <Text className="text-white text-base font-medium mb-1">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isSaving}
        trackColor={{ false: "#4B5563", true: colors.accent }}
        thumbColor={value ? "#FFFFFF" : "#9CA3AF"}
        ios_backgroundColor="#4B5563"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text className="text-white mt-4">Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center"
        >
          <ArrowLeft color={colors.white} size={24} />
          <Text className="text-white text-lg ml-2">Notifications</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Master Switches */}
          <Card className="mb-4">
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <Bell color={colors.accent} size={24} />
                <Text className="text-white text-lg font-bold ml-2">
                  Notification Channels
                </Text>
              </View>

              <SettingRow
                title="Push Notifications"
                description="Receive notifications on your device"
                value={preferences.push_enabled}
                onValueChange={(value) => updatePreference("push_enabled", value)}
              />

              <SettingRow
                title="Email Notifications"
                description="Receive notifications via email"
                value={preferences.email_enabled}
                onValueChange={(value) => updatePreference("email_enabled", value)}
              />

              <SettingRow
                title="In-App Notifications"
                description="Show notifications within the app"
                value={preferences.in_app_enabled}
                onValueChange={(value) => updatePreference("in_app_enabled", value)}
              />
            </View>
          </Card>

          {/* Notification Types */}
          <Card className="mb-4">
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <Bell color={colors.accent} size={24} />
                <Text className="text-white text-lg font-bold ml-2">
                  Notification Types
                </Text>
              </View>

              <SettingRow
                title="Daily Reminders"
                description="Get daily reminders to track your expenses (9 AM)"
                value={preferences.daily_reminder}
                onValueChange={(value) => updatePreference("daily_reminder", value)}
                disabled={!preferences.push_enabled}
              />

              <SettingRow
                title="Weekly Insights"
                description="Receive weekly financial insights every Monday (10 AM)"
                value={preferences.weekly_insights}
                onValueChange={(value) => updatePreference("weekly_insights", value)}
                disabled={!preferences.push_enabled}
              />

              <SettingRow
                title="Goal Reminders"
                description="Get updates on your savings goals every Friday (5 PM)"
                value={preferences.goal_reminders}
                onValueChange={(value) => updatePreference("goal_reminders", value)}
                disabled={!preferences.push_enabled}
              />
            </View>
          </Card>

          {/* Language Preference */}
          <Card className="mb-4">
            <View className="p-4">
              <View className="flex-row items-center mb-4">
                <Globe color={colors.accent} size={24} />
                <Text className="text-white text-lg font-bold ml-2">
                  Language / Idioma
                </Text>
              </View>

              <Text className="text-gray-400 text-sm mb-3">
                Select your preferred language for notifications
              </Text>

              <Pressable
                onPress={() => updatePreference("preferred_language", "pt-BR")}
                disabled={isSaving}
                className="flex-row items-center justify-between py-3 border-b border-gray-700"
              >
                <View className="flex-row items-center">
                  <Text className="text-white text-base ml-2">Português (Brasil)</Text>
                </View>
                {preferences.preferred_language === 'pt-BR' && (
                  <Check color={colors.accent} size={20} />
                )}
              </Pressable>

              <Pressable
                onPress={() => updatePreference("preferred_language", "en-US")}
                disabled={isSaving}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center">
                  <Text className="text-white text-base ml-2">English (United States)</Text>
                </View>
                {preferences.preferred_language === 'en-US' && (
                  <Check color={colors.accent} size={20} />
                )}
              </Pressable>
            </View>
          </Card>

          {/* Info Card */}
          <Card className="mb-4" style={{ backgroundColor: colors.secondaryBg }}>
            <View className="p-4">
              <View className="flex-row items-start">
                <BellOff color={colors.textSecondary} size={20} className="mt-1" />
                <View className="flex-1 ml-3">
                  <Text className="text-gray-400 text-sm leading-5">
                    Note: Push notifications require permission. If disabled, you can enable
                    them in your device settings. Notification times are in UTC.
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Saving Indicator */}
      {isSaving && (
        <View className="absolute bottom-4 right-4 bg-gray-800 px-4 py-2 rounded-full flex-row items-center">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text className="text-white ml-2">Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
