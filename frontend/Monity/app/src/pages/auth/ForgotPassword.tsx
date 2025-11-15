import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import { Images } from "../../assets/images";
import { supabase } from "../../config/supabase";

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPassword({
  onNavigateToLogin,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, insira seu email");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'monity://auth/reset-password',
        }
      );

      if (error) {
        Alert.alert("Erro", error.message || "Falha ao enviar email de recuperação");
      } else {
        setEmailSent(true);
      }
    } catch (error: any) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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

            {/* Success Message */}
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
                    <KeyRound size={40} color={COLORS.accent} />
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
                Email Enviado!
              </Text>

              <Text
                className="text-center mb-2"
                style={{
                  fontSize: 16,
                  color: COLORS.textPrimary,
                  lineHeight: 24,
                }}
              >
                Enviamos um link de recuperação de senha para:
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
                  color: COLORS.textPrimary,
                  lineHeight: 20,
                }}
              >
                Clique no link no email para redefinir sua senha.
              </Text>
            </View>

            {/* Back to Login Button */}
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
                Voltar para Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

          {/* Header */}
          <View className="mb-8">
            <Text
              className="text-center mb-2"
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: COLORS.textPrimary,
              }}
            >
              Esqueceu sua senha?
            </Text>
            <Text
              className="text-center"
              style={{
                fontSize: 14,
                color: COLORS.textPrimary,
                lineHeight: 20,
              }}
            >
              Digite seu email e enviaremos um link para redefinir sua senha.
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border-2"
              style={{
                backgroundColor: COLORS.inputBackground,
                borderColor: COLORS.inputBorder,
                color: COLORS.textPrimary,
              }}
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl border-2 mb-4"
            style={{
              backgroundColor: COLORS.accent,
              borderColor: COLORS.accent,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#232323" />
            ) : (
              <Text
                className="font-semibold text-base text-center"
                style={{ color: "#232323" }}
              >
                Enviar Link de Recuperação
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={onNavigateToLogin}
            disabled={isLoading}
          >
            <Text
              className="text-center"
              style={{
                fontSize: 14,
                color: COLORS.accent,
              }}
            >
              Voltar para Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
