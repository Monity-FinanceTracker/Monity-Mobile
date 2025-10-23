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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

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
    console.log("🔐 Login form submitted with:", { email, password: "***" });
    
    if (!email || !password) {
      console.log("❌ Missing email or password");
      setError("Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      console.log("❌ Invalid email format");
      setError("Please enter a valid email address");
      return;
    }

    console.log("✅ Form validation passed, starting login...");
    setLoading(true);
    setError("");

    try {
      console.log("📡 Calling login function...");
      Alert.alert("Debug", "Iniciando login...");
      await login(email, password);
      console.log("✅ Login completed successfully");
      Alert.alert("Sucesso", "Login realizado com sucesso!");
    } catch (err: any) {
      console.error("❌ Login failed with error:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
      const errorMessage = err.message || "Invalid credentials";
      setError(errorMessage);
      Alert.alert("Erro", `Login falhou: ${errorMessage}`);
    } finally {
      console.log("🏁 Login process finished");
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#191E29]">
      <StatusBar barStyle="light-content" backgroundColor="#191E29" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            {/* Logo Section */}
            <View className="mb-12 items-center">
              <Text className="text-3xl font-bold text-[#01C38D] mb-2">
                Monity
              </Text>
              <Text className="text-gray-300 text-base">Welcome back</Text>
            </View>

            {/* Login Form */}
            <View className="space-y-6">
              {/* Error Message */}
              {error && (
                <View className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Text className="text-red-400 text-center text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Email Input */}
              <View className="space-y-1">
                <Text className="text-gray-300 font-medium text-xs">
                  Email address
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Mail size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`bg-[#23263a] border-2 ${
                      emailFocused ? "border-[#01C38D]" : "border-[#31344d]"
                    } rounded-xl px-4 py-3`}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={{
                      paddingLeft: 48,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-gray-300 font-medium text-xs">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Lock size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`bg-[#23263a] border-2 ${
                      passwordFocused ? "border-[#01C38D]" : "border-[#31344d]"
                    } rounded-xl px-4 py-3`}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    style={{
                      paddingLeft: 48,
                      paddingRight: 48,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 justify-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl mt-5 ${
                  loading ? "bg-gray-400" : "bg-[#01C38D]"
                }`}
                style={{ backgroundColor: loading ? "#9CA3AF" : "#01C38D" }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base text-center">
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign up link */}
            <View className="mt-8">
              <View className="flex-row items-center justify-center">
                <Text className="text-gray-400 text-sm">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={onNavigateToSignup} className="ml-2">
                  <Text className="text-[#01C38D] font-semibold text-sm">
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
