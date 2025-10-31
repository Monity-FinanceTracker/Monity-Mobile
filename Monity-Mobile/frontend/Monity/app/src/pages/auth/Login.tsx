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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

interface LoginProps {
  onNavigateToSignup: () => void;
}

export default function Login({ onNavigateToSignup }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
    } catch (err: any) {
      const errorMessage = err.message || "Invalid credentials";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            {/* Logo Section */}
            <View className="mb-12 items-center">
              <Text className="text-5xl font-bold text-accent mb-2">
                Monity
              </Text>
              <Text className="text-text-gray text-lg">Welcome back!</Text>
            </View>

            {/* Login Form */}
            <View className="space-y-6">
              {/* Error Message */}
              {error && (
                <View className="p-4 bg-error-light border border-error/30 rounded-lg">
                  <Text className="text-error text-center text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Email Input */}
              <View className="space-y-1">
                <Text className="text-text-gray font-medium text-xs mb-1">
                  Email address
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
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
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    selectionColor={COLORS.accent}
                    style={{
                      paddingLeft: 15,
                      fontSize: 16,
                      color: COLORS.textPrimary,
                    }}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-text-gray font-medium text-xs mb-1">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
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
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    selectionColor={COLORS.accent}
                    style={{
                      paddingLeft: 15,
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

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl mt-5 border-2"
                style={{
                  backgroundColor: loading ? COLORS.textMuted : COLORS.accent,
                  borderColor: loading ? COLORS.border : COLORS.accent,
                }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    <Text className="text-text-primary font-semibold text-base ml-2">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="font-semibold text-base text-center"
                    style={{ color: '#232323' }}
                  >
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign up link */}
            <View className="mt-8">
              <View className="flex-row items-center justify-center">
                <Text className="text-text-muted text-sm">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={onNavigateToSignup} className="ml-2">
                  <Text className="text-accent font-semibold text-sm">
                    Sign up
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
