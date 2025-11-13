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
} from "react-native";
// TODO: Descomentar quando for fazer build (não funciona no Expo Go)
// import FastImage from 'react-native-fast-image';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";
import { Images } from "../../assets/images";

interface SignupProps {
  onNavigateToLogin: () => void;
  onNavigateToEmailConfirmation: (email: string) => void;
}

export default function Signup({ onNavigateToLogin, onNavigateToEmailConfirmation }: SignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const { signup } = useAuth();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (name.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres");
      return;
    }

    // Normalize email before validation
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!isValidEmail(normalizedEmail)) {
      setError("Por favor, insira um endereço de email válido");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (getPasswordStrength(password).score < 2) {
      setError("A senha é muito fraca. Por favor, use uma senha mais forte.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use normalized email for signup
      const result = await signup(normalizedEmail, password, name.trim());
      // Navigate to email confirmation page
      if (result && result.email) {
        onNavigateToEmailConfirmation(result.email);
      }
    } catch (err: any) {
      // Show user-friendly error messages
      let errorMessage = err.message || "Falha ao criar conta";
      
      // Translate common error messages
      if (errorMessage.includes("already registered") || 
          errorMessage.includes("já está cadastrado") ||
          errorMessage.includes("already exists")) {
        errorMessage = "Este email já está cadastrado. Por favor, faça login ou use outro email.";
      } else if (errorMessage.includes("invalid") && errorMessage.includes("email")) {
        errorMessage = "Este email é inválido ou já está cadastrado. Por favor, verifique e tente novamente.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    let feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else feedback.push("Mix of uppercase and lowercase");

    if (/\d/.test(password)) score++;
    else feedback.push("At least one number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push("At least one special character");

    const strength = ["Very Weak", "Weak", "Fair", "Good", "Strong"][score];
    const color = ["#EF4444", "#F87171", "#FBBF24", "#60A5FA", "#10B981"][
      score
    ];

    return { score, strength, color, feedback };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            {/* Logo Section */}
            <View className="mb-6 items-center">
              <View className="flex-row items-center justify-center mb-2">
                {/* TODO: Trocar para FastImage quando for fazer build (não funciona no Expo Go) */}
                <Image
                  source={Images.BANNER_MONITY}
                  style={{
                    width: 200,
                    height: 60,
                  }}
                  resizeMode="contain"
                />
                {/* <FastImage
                  source={Images.BANNER_MONITY}
                  style={{
                    width: 200,
                    height: 60,
                  }}
                  resizeMode={FastImage.resizeMode.contain}
                /> */}
              </View>
              <Text className="text-text-gray text-lg">Create your account</Text>
            </View>

            {/* Signup Form */}
            <View className="space-y-5">
              {/* Error Message */}
              {error && (
                <View className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Text className="text-red-400 text-center text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Name Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-text-gray font-medium text-xs mb-1">
                  Full name
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <User size={20}  />
                  </View>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-card-bg border-2 ${
                      focusedField === "name"
                        ? "border-accent"
                        : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    style={{
                      paddingLeft: 15,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  {name && name.length >= 2 && (
                    <View className="absolute inset-y-0 right-0 pr-4 justify-center">
                      <CheckCircle size={20}  />
                    </View>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-text-gray font-medium text-xs mb-1">
                  Email address
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Mail size={20}  />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-card-bg border-2 ${
                      focusedField === "email"
                        ? "border-accent"
                        : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={{
                      paddingLeft: 15,
                      fontSize: 16,
                      color: "#ffffff",
                      // Soft white glow effect for borders
                    }}
                  />
                  {email && isValidEmail(email) && (
                    <View className="absolute inset-y-0 right-0 pr-4 justify-center">
                      <CheckCircle size={20}  />
                    </View>
                  )}
                </View>
              </View>

              {/* Password Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-text-gray font-medium text-xs mb-1">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Lock size={20}  />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-card-bg border-2 ${
                      focusedField === "password"
                        ? "border-accent"
                        : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    style={{
                      paddingLeft: 15,
                      paddingRight: 15,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 justify-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={COLORS.textMuted}  />
                    ) : (
                      <Eye size={20} color={COLORS.textMuted}  />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {password && (
                  <View className="mt-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-text-gray">
                        Password strength
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: passwordStrength.color }}
                      >

                        {passwordStrength.strength}
                      </Text>
                    </View>
                    <View className="bg-card-bg rounded-full h-1">
                      <View
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width:
                            passwordStrength.score === 0
                              ? "20%"
                              : passwordStrength.score === 1
                                ? "40%"
                                : passwordStrength.score === 2
                                  ? "60%"
                                  : passwordStrength.score === 3
                                    ? "80%"
                                    : "100%",
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-gray-300 font-medium text-xs mb-1">
                  Confirm password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Lock size={20}  />
                  </View>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-card-bg border-2 ${
                      focusedField === "confirmPassword"
                        ? "border-accent"
                        : confirmPassword && !passwordsMatch
                          ? "border-red-400"
                          : "border-border-default"
                    } rounded-xl px-4 py-3`}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    style={{
                      paddingLeft: 15,
                      paddingRight: 15,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 justify-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={COLORS.textMuted}  />
                    ) : (
                      <Eye size={20} color={COLORS.textMuted}  />
                    )}
                  </TouchableOpacity>
                </View>

                {confirmPassword && (
                  <View className="mt-2">
                    {passwordsMatch ? (
                      <View className="flex-row items-center">
                        <CheckCircle size={16}  />
                        <Text className="text-green-600 ml-2 text-sm">
                          Passwords match
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <XCircle size={16}  />
                        <Text className="text-red-600 ml-2 text-sm">
                          Passwords don't match
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={
                  loading || !passwordsMatch || passwordStrength.score < 2
                }
                className={`w-full py-3.5 rounded-xl mt-6 border-2 ${
                  loading || !passwordsMatch || passwordStrength.score < 2
                    ? "bg-gray-400"
                    : "bg-accent"
                }`}
                style={{
                  backgroundColor:
                    loading || !passwordsMatch || passwordStrength.score < 2
                      ? COLORS.textMuted
                      : COLORS.accent,
                  borderColor:
                    loading || !passwordsMatch || passwordStrength.score < 2
                      ? COLORS.border
                      : COLORS.accent,
                }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base text-center">
                    Create account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Login link */}
            <View className="mt-8">
              <View className="flex-row items-center justify-center">
                <Text className="text-gray-400 text-sm">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={onNavigateToLogin} className="ml-2">
                  <Text className="text-[#01C38D] font-semibold text-sm">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
