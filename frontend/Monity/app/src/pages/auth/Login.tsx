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
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import * as Font from "expo-font";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { Images } from "../../assets/images";

interface LoginProps {
  onNavigateToSignup: () => void;
}

export default function Login({
  onNavigateToSignup,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const { login, loginWithGoogle, isLoading: authLoading } = useAuth();

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

  // Garantir que o loading local seja sincronizado com o loading do AuthContext
  React.useEffect(() => {
    if (!authLoading && loading) {
      // Se o AuthContext terminou de carregar mas ainda estamos em loading local,
      // pode ser que houve um erro que não foi capturado
      // Não fazer nada aqui, o catch já deve ter tratado
    }
  }, [authLoading, loading]);

  const handleSubmit = async () => {
    if (!email) {
      setError("Por favor, insira seu email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido");
      return;
    }

    if (!password) {
      setError("Por favor, insira sua senha");
      return;
    }

    // Limpar erro anterior
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // O AuthContext já atualiza o usuário, então a navegação acontecerá automaticamente
      // Se chegou aqui, o login foi bem-sucedido
      setLoading(false);
      setError(""); // Limpar qualquer erro anterior em caso de sucesso
    } catch (err: any) {
      // Sempre mostrar mensagem de erro quando o login falhar
      setError("Email ou senha incorretos");
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
                    source={Images.BANNER_MONITY}
                    style={{
                      width: 200,
                      height: 60,
                    }}
                    resizeMode="contain"
                  />
                </View>
                {/* Texto com fonte Stratford */}
                <Text
                  style={{
                    fontFamily: fontLoaded ? "Stratford" : undefined,
                    color: COLORS.textGray,
                    fontSize: 23,
                    textAlign: "center",
                  }}
                >
                  Sua vida financeira com Monity
                </Text>
              </View>

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
              <View className="space-y-1 mb-4">
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                    <Mail size={20} color={COLORS.textMuted} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      // Limpar erro quando o usuário começar a digitar
                      if (error) {
                        setError("");
                      }
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`bg-card-bg border-2 ${
                      error
                        ? "border-error"
                        : emailFocused
                        ? "border-accent"
                        : "border-border-default"
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

              {/* Password Input */}
              <View className="space-y-1 mb-6">
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center z-10">
                    <Lock size={20} color={COLORS.textMuted} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      // Limpar erro quando o usuário começar a digitar
                      if (error) {
                        setError("");
                      }
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`bg-card-bg border-2 ${
                      error
                        ? "border-error"
                        : passwordFocused
                        ? "border-accent"
                        : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Senha"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    selectionColor={COLORS.accent}
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
              
              {/* Error Message abaixo dos inputs */}
              {error ? (
                <View className="mb-4 px-1">
                  <Text 
                    style={{ 
                      color: COLORS.error,
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Login Button */}
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
                    Entrar
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
