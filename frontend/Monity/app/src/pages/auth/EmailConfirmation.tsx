import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import { Images } from "../../assets/images";

interface EmailConfirmationProps {
  email: string;
  onNavigateToLogin: () => void;
}

export default function EmailConfirmation({
  email,
  onNavigateToLogin,
}: EmailConfirmationProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View className="flex-1 justify-center px-6">
        <View className="w-full max-w-sm mx-auto">
          {/* Logo Section */}
          <View className="mb-8 items-center">
            <View className="flex-row items-center justify-center mb-6">
              <Image
                source={Images.BANNER_MONITY}
                style={{
                  width: 200,
                  height: 60,
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Confirmation Message */}
          <View className="items-center mb-8">
            <View className="mb-6">
              <View className="items-center justify-center mb-4">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: COLORS.accent + "20",
                  }}
                >
                  <Mail size={40} color={COLORS.accent} />
                </View>
              </View>
            </View>

            <Text
              className="text-center mb-4"
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: COLORS.textPrimary,
              }}
            >
              Verifique seu email
            </Text>

            <Text
              className="text-center mb-2"
              style={{
                fontSize: 16,
                color: COLORS.textGray,
                lineHeight: 24,
              }}
            >
              Enviamos um email de confirmação para:
            </Text>

            <Text
              className="text-center mb-6 font-semibold"
              style={{
                fontSize: 16,
                color: COLORS.accent,
              }}
            >
              {email}
            </Text>

            <Text
              className="text-center"
              style={{
                fontSize: 14,
                color: COLORS.textMuted,
                lineHeight: 20,
              }}
            >
              Clique no link de confirmação no email para ativar sua conta.
              Após confirmar, você poderá fazer login.
            </Text>
          </View>

          {/* Button to go to Login */}
          <TouchableOpacity
            onPress={onNavigateToLogin}
            className="w-full py-3.5 rounded-xl border-2"
            style={{
              backgroundColor: COLORS.accent,
              borderColor: COLORS.accent,
            }}
          >
            <Text
              className="font-semibold text-base text-center"
              style={{ color: "#232323" }}
            >
              Ir para Login
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View className="mt-6">
            <Text
              className="text-center text-xs"
              style={{
                color: COLORS.textMuted,
                lineHeight: 18,
              }}
            >
              Não recebeu o email? Verifique sua caixa de spam ou tente criar
              uma conta novamente.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
