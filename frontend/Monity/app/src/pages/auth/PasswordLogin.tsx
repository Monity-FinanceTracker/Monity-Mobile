import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

interface PasswordLoginProps {
  email: string;
  onNavigateBack: () => void;
}

export default function PasswordLogin({
  email,
  onNavigateBack,
}: PasswordLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!password) {
      setError("Por favor, insira sua senha");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // O AuthContext já atualiza o usuário, então a navegação acontecerá automaticamente
    } catch (err: any) {
      const errorMessage = err.message || "Senha incorreta";
      setError(errorMessage);
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8">
            <View className="w-full max-w-sm mx-auto">
              {/* Logo Section */}
              <View className="mb-8 items-center">
                <View className="flex-row items-center justify-center mb-6">
                  <Image
                    source={require("../../../../assets/images/BANNER_MONITY.png")}
                    style={{
                      width: 200,
                      height: 60,
                    }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View className="p-4 bg-error-light border border-error/30 rounded-lg mb-4">
                  <Text className="text-error text-center text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Password Input */}
              <View className="space-y-1 mb-6">
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                    <Lock size={20} color={COLORS.textMuted} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`bg-card-bg border-2 ${
                      passwordFocused ? "border-accent" : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Senha"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    selectionColor={COLORS.accent}
                    autoFocus
                    onSubmitEditing={handleSubmit}
                    style={{
                      paddingLeft: 50,
                      paddingRight: 50,
                      fontSize: 16,
                      color: COLORS.textPrimary,
                    }}
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

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl border-2"
                style={{
                  backgroundColor: loading ? COLORS.textMuted : COLORS.accent,
                  borderColor: loading ? COLORS.border : COLORS.accent,
                  marginBottom: 16,
                }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    <Text className="text-text-primary font-semibold text-base ml-2">
                      Entrando...
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="font-semibold text-base text-center"
                    style={{ color: "#232323" }}
                  >
                    Continuar
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back link */}
              <View className="mt-4">
                <TouchableOpacity onPress={onNavigateBack}>
                  <Text className="text-accent font-semibold text-sm text-center">
                    Voltar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

