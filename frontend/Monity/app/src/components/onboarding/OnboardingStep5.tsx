import React from "react";
import { View, Text, Pressable } from "react-native";
import { COLORS } from "../../constants/colors";
import { Bell, Mail } from "lucide-react-native";
import Card from "../molecules/Card";

interface OnboardingStep5Props {
  formData: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  setFormData: (data: any) => void;
  onNext: () => void;
}

export default function OnboardingStep5({
  formData,
  setFormData,
  onNext,
}: OnboardingStep5Props) {
  const colors = COLORS;

  return (
    <View className="px-6 pt-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent/20 rounded-full items-center justify-center mb-4">
          <Bell size={40} color={colors.accent} />
        </View>
        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
          Notificações
        </Text>
        <Text className="text-text-secondary text-center">
          Escolha como deseja ser notificado
        </Text>
      </View>

      <View className="gap-4">
        <Card className="p-4">
          <Pressable
            onPress={() =>
              setFormData({
                ...formData,
                emailNotifications: !formData.emailNotifications,
              })
            }
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-accent/20 rounded-full items-center justify-center">
                <Mail size={24} color={colors.accent} />
              </View>
              <View>
                <Text className="text-text-primary text-lg font-semibold">
                  Notificações por Email
                </Text>
                <Text className="text-text-secondary text-sm">
                  Receba atualizações importantes por email
                </Text>
              </View>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                formData.emailNotifications ? "bg-accent" : "bg-card-bg"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                  formData.emailNotifications ? "ml-6" : "ml-0.5"
                }`}
              />
            </View>
          </Pressable>
        </Card>

        <Card className="p-4">
          <Pressable
            onPress={() =>
              setFormData({
                ...formData,
                pushNotifications: !formData.pushNotifications,
              })
            }
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-accent/20 rounded-full items-center justify-center">
                <Bell size={24} color={colors.accent} />
              </View>
              <View>
                <Text className="text-text-primary text-lg font-semibold">
                  Notificações Push
                </Text>
                <Text className="text-text-secondary text-sm">
                  Receba alertas no seu dispositivo
                </Text>
              </View>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                formData.pushNotifications ? "bg-accent" : "bg-card-bg"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                  formData.pushNotifications ? "ml-6" : "ml-0.5"
                }`}
              />
            </View>
          </Pressable>
        </Card>
      </View>
    </View>
  );
}
