import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock, Check } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

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

  const refreshLoginData = async () => {
    // Clear form data on refresh
    setEmail("");
    setPassword("");
    setError("");
    console.log("Refreshing login data...");
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: refreshLoginData,
  });

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
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-[#191E29] via-[#1a1f2e] to-[#23263a]">
      <StatusBar barStyle="light-content" backgroundColor="#191E29" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          refreshControl={refreshControl}
        >
          {/* Animated Background Elements */}
          <View className="absolute inset-0 overflow-hidden pointer-events-none">
            <View className="absolute -top-40 -right-40 w-80 h-80 bg-[#01C38D]/5 rounded-full blur-3xl animate-pulse" />
            <View className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#01C38D]/3 rounded-full blur-3xl animate-pulse" />
            <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#01C38D]/2 rounded-full blur-3xl animate-pulse" />
          </View>

          {/* Content */}
          <View className="relative z-10 flex-1 justify-center px-4">
            <View className="w-full max-w-md mx-auto">
              {/* Monity Logo with Animation */}
              <View className="mb-8 items-center">
                <View className="relative">
                  <Text className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#01C38D] to-[#01C38D]/70 text-transparent">
                    Monity
                  </Text>
                  <View className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-[#01C38D] to-transparent rounded-full" />
                </View>
                <Text className="text-gray-400 mt-4 text-lg font-medium">
                  Your Personal Finance Manager
                </Text>
              </View>

              {/* Login Card with Enhanced Design */}
              <View className="bg-gradient-to-br from-[#23263a]/90 to-[#31344d]/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#31344d]/50">
                <View className="items-center mb-8">
                  <Text className="text-3xl font-bold text-white mb-2">
                    Welcome Back
                  </Text>
                  <View className="w-12 h-1 bg-gradient-to-r from-[#01C38D] to-[#01C38D]/50 rounded-full" />
                </View>

                {/* Error Message with Better Styling */}
                {error && (
                  <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <View className="flex-row items-center justify-center">
                      <Text className="text-red-400 text-center">{error}</Text>
                    </View>
                  </View>
                )}

                <View className="space-y-6">
                  {/* Enhanced Email Input */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Email
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <Mail size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        className={`bg-[#191E29]/80 border-2 ${
                          emailFocused ? "border-[#01C38D]" : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-4 py-3 text-base`}
                        placeholder="your@email.com"
                        placeholderTextColor="#6B7280"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                      {email && isValidEmail(email) && (
                        <View className="absolute inset-y-0 right-0 pr-3 justify-center">
                          <Check size={20} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Enhanced Password Input */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Password
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <Lock size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        className={`bg-[#191E29]/80 border-2 ${
                          passwordFocused
                            ? "border-[#01C38D]"
                            : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-12 py-3 text-base`}
                        placeholder="••••••••"
                        placeholderTextColor="#6B7280"
                        secureTextEntry={!showPassword}
                        autoComplete="current-password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 justify-center"
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#9CA3AF" />
                        ) : (
                          <Eye size={20} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Enhanced Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 py-3.5 rounded-xl ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    <View className="flex-row items-center justify-center">
                      {loading ? (
                        <>
                          <ActivityIndicator
                            size="small"
                            color="white"
                            className="mr-3"
                          />
                          <Text className="text-white font-semibold text-base">
                            Logging in...
                          </Text>
                        </>
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          Login
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Enhanced Sign Up Link */}
                <View className="mt-8">
                  <View className="relative">
                    <View className="absolute inset-0 justify-center">
                      <View className="w-full h-px bg-[#31344d]" />
                    </View>
                    <View className="relative justify-center">
                      <View className="px-4 bg-gradient-to-br from-[#23263a]/90 to-[#31344d]/90">
                        <Text className="text-gray-400 text-sm">
                          Don't have an account?
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onNavigateToSignup}
                    className="items-center justify-center mt-4"
                  >
                    <Text className="text-[#01C38D] font-semibold text-base">
                      Sign up
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
