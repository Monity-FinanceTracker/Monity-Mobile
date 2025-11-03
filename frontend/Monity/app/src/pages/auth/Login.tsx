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
import { Mail } from "lucide-react-native";
import * as Font from "expo-font";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import { COLORS } from "../../constants/colors";

interface LoginProps {
  onNavigateToSignup: () => void;
  onNavigateToPassword: (email: string) => void;
}

export default function Login({
  onNavigateToSignup,
  onNavigateToPassword,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const { login, loginWithGoogle, loginWithApple } = useAuth();

  React.useEffect(() => {
    const loadFont = async () => {
      try {
        await Font.loadAsync({
          EmonaRegular: require("../../../../assets/fonts/EmonaRegular.ttf"),
        });
        setFontLoaded(true);
      } catch (error) {
        console.warn("Error loading Emona font:", error);
        setFontLoaded(true); // Continuar mesmo se falhar
      }
    };
    loadFont();
  }, []);

  const handleSubmit = async () => {
    if (!email) {
      setError("Por favor, insira seu email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Verificar se o email existe
      const response = await apiService.checkEmailExists(email);

      if (response.success && response.data?.exists) {
        // Email existe, navegar para página de senha
        onNavigateToPassword(email);
      } else if (response.errorCode === "NOT_FOUND") {
        // Endpoint não encontrado - servidor pode não ter sido atualizado
        // Navegar direto para tela de senha para permitir tentativa de login
        // Se o email não existir, o login falhará e mostrará erro na tela de senha
        console.warn("check-email endpoint not available, navigating directly to password screen");
        onNavigateToPassword(email);
      } else {
        // Email não existe, navegar para signup
        onNavigateToSignup();
      }
    } catch (err: any) {
      console.error("Erro ao verificar email:", err);
      // Em caso de erro na verificação, assumir que o email pode existir
      // e navegar para tela de senha (melhor UX do que bloquear o usuário)
      console.warn("Error checking email, navigating directly to password screen");
      onNavigateToPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setSocialLoading("google");
      await loginWithGoogle();
      // O AuthContext já atualiza o usuário, então a navegação acontecerá automaticamente
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao fazer login com Google";
      setError(errorMessage);
      console.error("Erro no login com Google:", err);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setError("");
      setSocialLoading("apple");
      await loginWithApple();
      // O AuthContext já atualiza o usuário, então a navegação acontecerá automaticamente
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao fazer login com Apple";
      setError(errorMessage);
      console.error("Erro no login com Apple:", err);
    } finally {
      setSocialLoading(null);
    }
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
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
                <View className="flex-row items-center justify-center mb-4">
                  <Image
                    source={require("../../../../assets/images/BANNER_MONITY.png")}
                    style={{
                      width: 200,
                      height: 60,
                    }}
                    resizeMode="contain"
                  />
                </View>
                {/* Texto com fonte Emona Regular */}
                <Text
                  style={{
                    fontFamily: fontLoaded ? "EmonaRegular" : undefined,
                    color: COLORS.textGray,
                    fontSize: 23,
                    textAlign: "center",
                  }}
                >
                  Sua vida financeira com Monity
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="p-4 bg-error-light border border-error/30 rounded-lg mb-4">
                  <Text className="text-error text-center text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Social Login Buttons */}
              <View className="space-y-3 mb-6">
                {/* Google Button */}
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={socialLoading !== null || loading}
                  className="w-full py-4 rounded-xl border-2 flex-row items-center justify-center"
                  style={{
                    backgroundColor: COLORS.cardBg,
                    borderColor: COLORS.border,
                    opacity: socialLoading === "google" || loading ? 0.6 : 1,
                  }}
                >
                  {socialLoading === "google" ? (
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                  ) : (
                    <Text
                      className="font-semibold text-base"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Continue com Google
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Apple Button (iOS only) */}
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    onPress={handleAppleSignIn}
                    disabled={socialLoading !== null || loading}
                    className="w-full py-4 rounded-xl border-2 flex-row items-center justify-center mt-2"
                    style={{
                      backgroundColor: COLORS.cardBg,
                      borderColor: COLORS.border,
                      opacity: socialLoading === "apple" || loading ? 0.6 : 1,
                    }}
                  >
                    {socialLoading === "apple" ? (
                      <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    ) : (
                      <Text
                        className="font-semibold text-base"
                        style={{ color: COLORS.textPrimary }}
                      >
                        Continue com Apple
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Divider with "or" */}
              <View className="flex-row items-center mb-6">
                <View
                  className="flex-1"
                  style={{ height: 1, backgroundColor: COLORS.border }}
                />
                <Text
                  className="px-4"
                  style={{ color: COLORS.textMuted, fontSize: 14 }}
                >
                  OR
                </Text>
                <View
                  className="flex-1"
                  style={{ height: 1, backgroundColor: COLORS.border }}
                />
              </View>

              {/* Email Input */}
              <View className="space-y-1 mb-6">
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                    <Mail size={20} color={COLORS.textMuted} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`bg-card-bg border-2 ${
                      emailFocused ? "border-accent" : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Email pessoal"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    selectionColor={COLORS.accent}
                    style={{
                      paddingLeft: 50,
                      fontSize: 16,
                      color: COLORS.textPrimary,
                    }}
                  />
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
                      Continuando...
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

              {/* Terms and Privacy Text */}
              <Text
                className="text-center text-xs px-4"
                style={{ color: COLORS.textMuted, lineHeight: 18 }}
              >
                Ao continuar, você concorda com os{" "}
                <Text style={{ textDecorationLine: "underline" }}>
                  direitos e termos de privacidade
                </Text>
              </Text>

              {/* Sign up link */}
              <View className="mt-8">
                <View className="flex-row items-center justify-center">
                  <Text className="text-text-muted text-sm">
                    Não tem uma conta?
                  </Text>
                  <TouchableOpacity onPress={onNavigateToSignup} className="ml-2">
                    <Text className="text-accent font-semibold text-sm">
                      Cadastre-se
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
