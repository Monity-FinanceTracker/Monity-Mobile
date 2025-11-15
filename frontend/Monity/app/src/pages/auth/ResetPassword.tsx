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
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import { Images } from "../../assets/images";
import { supabase } from "../../config/supabase";

interface ResetPasswordProps {
  token: string;
  onNavigateToLogin: () => void;
}

export default function ResetPassword({
  token,
  onNavigateToLogin,
}: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert("Erro", error.message || "Falha ao redefinir senha");
      } else {
        Alert.alert(
          "Sucesso",
          "Sua senha foi redefinida com sucesso!",
          [
            {
              text: "OK",
              onPress: onNavigateToLogin,
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
              Redefinir Senha
            </Text>
            <Text
              className="text-center"
              style={{
                fontSize: 14,
                color: COLORS.textPrimary,
                lineHeight: 20,
              }}
            >
              Digite sua nova senha abaixo.
            </Text>
          </View>

          {/* New Password Input */}
          <View className="mb-4">
            <View className="relative">
              <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                <Lock size={20} color={COLORS.textMuted} />
              </View>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border-2"
                style={{
                  backgroundColor: COLORS.inputBackground,
                  borderColor: COLORS.inputBorder,
                  color: COLORS.textPrimary,
                  paddingLeft: 50,
                  paddingRight: 50,
                }}
                placeholder="Nova Senha"
                placeholderTextColor={COLORS.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 justify-center"
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.textMuted} />
                ) : (
                  <Eye size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <View className="relative">
              <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                <Lock size={20} color={COLORS.textMuted} />
              </View>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border-2"
                style={{
                  backgroundColor: COLORS.inputBackground,
                  borderColor: COLORS.inputBorder,
                  color: COLORS.textPrimary,
                  paddingLeft: 50,
                  paddingRight: 50,
                }}
                placeholder="Confirmar Nova Senha"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 justify-center"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={COLORS.textMuted} />
                ) : (
                  <Eye size={20} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>
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
                Redefinir Senha
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
