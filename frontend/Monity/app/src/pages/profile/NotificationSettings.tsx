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
      Alert.alert("Erro", "Falha ao carregar preferências de notificação");
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
      Alert.alert("Erro", "Falha ao atualizar preferência de notificação");
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
          <Text className="text-white mt-4">Carregando configurações...</Text>
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
          <Text className="text-white text-lg ml-2">Notificações</Text>
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
                  Canais de Notificação
                </Text>
              </View>

              <SettingRow
                title="Notificações Push"
                description="Receber notificações no seu dispositivo"
                value={preferences.push_enabled}
                onValueChange={(value) => updatePreference("push_enabled", value)}
              />

              <SettingRow
                title="Notificações por Email"
                description="Receber notificações por email"
                value={preferences.email_enabled}
                onValueChange={(value) => updatePreference("email_enabled", value)}
              />

              <SettingRow
                title="Notificações no App"
                description="Mostrar notificações dentro do aplicativo"
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
                  Tipos de Notificação
                </Text>
              </View>

              <SettingRow
                title="Lembretes Diários"
                description="Receber lembretes diários para acompanhar suas despesas (9h)"
                value={preferences.daily_reminder}
                onValueChange={(value) => updatePreference("daily_reminder", value)}
                disabled={!preferences.push_enabled}
              />

              <SettingRow
                title="Insights Semanais"
                description="Receber insights financeiros semanais toda segunda-feira (10h)"
                value={preferences.weekly_insights}
                onValueChange={(value) => updatePreference("weekly_insights", value)}
                disabled={!preferences.push_enabled}
              />

              <SettingRow
                title="Lembretes de Metas"
                description="Receber atualizações sobre suas metas de economia toda sexta-feira (17h)"
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
                  Idioma
                </Text>
              </View>

              <Text className="text-gray-400 text-sm mb-3">
                Selecione seu idioma preferido para notificações
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
                    Nota: Notificações push requerem permissão. Se desabilitadas, você pode habilitá-las
                    nas configurações do seu dispositivo. Os horários das notificações estão em UTC.
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
          <Text className="text-white ml-2">Salvando...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
