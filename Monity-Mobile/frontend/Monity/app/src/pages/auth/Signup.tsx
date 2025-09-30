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
import { Eye, EyeOff, Mail, Lock, Check, User, X } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

interface SignupProps {
  onNavigateToLogin: () => void;
}

export default function Signup({ onNavigateToLogin }: SignupProps) {
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

  const refreshSignupData = async () => {
    // Clear form data on refresh
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    console.log("Refreshing signup data...");
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: refreshSignupData,
  });

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (name.length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (getPasswordStrength(password).score < 2) {
      setError("Password is too weak");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signup(name, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
            <View className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#01C38D]/2 rounded-full blur-3xl animate-pulse" />
          </View>

          {/* Content */}
          <View className="relative z-10 flex-1 justify-center px-4">
            <View className="w-full max-w-md mx-auto">
              {/* Monity Logo with Animation */}
              <View className="mb-6 items-center">
                <View className="relative">
                  <Text className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#01C38D] to-[#01C38D]/70 text-transparent">
                    Monity
                  </Text>
                  <View className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#01C38D] to-transparent rounded-full" />
                </View>
                <Text className="text-gray-400 mt-3 text-base font-medium">
                  Create your account
                </Text>
              </View>

              {/* Signup Card with Enhanced Design */}
              <View className="bg-gradient-to-br from-[#23263a]/90 to-[#31344d]/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-[#31344d]/50">
                <View className="items-center mb-6">
                  <Text className="text-2xl font-bold text-white mb-2">
                    Create Account
                  </Text>
                  <View className="w-12 h-1 bg-gradient-to-r from-[#01C38D] to-[#01C38D]/50 rounded-full" />
                </View>

                {/* Error Message with Better Styling */}
                {error && (
                  <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <View className="flex-row items-center justify-center">
                      <Text className="text-red-400 text-center text-sm">
                        {error}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="space-y-4">
                  {/* Enhanced Name Input */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Name
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <User size={16} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField("")}
                        className={`bg-[#191E29]/80 border-2 ${
                          focusedField === "name"
                            ? "border-[#01C38D]"
                            : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-4 py-2.5 text-base`}
                        placeholder="Your full name"
                        placeholderTextColor="#6B7280"
                        autoCapitalize="words"
                      />
                      {name && name.length >= 2 && (
                        <View className="absolute inset-y-0 right-0 pr-3 justify-center">
                          <Check size={16} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Enhanced Email Input */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Email
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <Mail size={16} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField("")}
                        className={`bg-[#191E29]/80 border-2 ${
                          focusedField === "email"
                            ? "border-[#01C38D]"
                            : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-4 py-2.5 text-base`}
                        placeholder="your@email.com"
                        placeholderTextColor="#6B7280"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                      {email && isValidEmail(email) && (
                        <View className="absolute inset-y-0 right-0 pr-3 justify-center">
                          <Check size={16} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Enhanced Password Input with Strength Indicator */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Password
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <Lock size={16} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField("")}
                        className={`bg-[#191E29]/80 border-2 ${
                          focusedField === "password"
                            ? "border-[#01C38D]"
                            : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-12 py-2.5 text-base`}
                        placeholder="••••••••"
                        placeholderTextColor="#6B7280"
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 justify-center"
                      >
                        {showPassword ? (
                          <EyeOff size={16} color="#9CA3AF" />
                        ) : (
                          <Eye size={16} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Password Strength Indicator */}
                    {password && (
                      <View className="mt-2 space-y-2">
                        <View className="flex-row items-center space-x-2">
                          <View className="flex-1 bg-gray-700 rounded-full h-1.5">
                            <View
                              className={`h-full rounded-full transition-all duration-300`}
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
                          <Text
                            className="text-xs font-medium"
                            style={{ color: passwordStrength.color }}
                          >
                            {passwordStrength.strength}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Enhanced Confirm Password Input */}
                  <View className="space-y-2">
                    <Text className="text-gray-300 font-medium text-sm">
                      Confirm Password
                    </Text>
                    <View className="relative">
                      <View className="absolute inset-y-0 left-0 pl-3 justify-center">
                        <Check size={16} color="#9CA3AF" />
                      </View>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField("")}
                        className={`bg-[#191E29]/80 border-2 ${
                          focusedField === "confirmPassword"
                            ? "border-[#01C38D]"
                            : confirmPassword && !passwordsMatch
                              ? "border-red-400"
                              : "border-[#31344d]"
                        } text-white rounded-xl pl-10 pr-12 py-2.5 text-base`}
                        placeholder="••••••••"
                        placeholderTextColor="#6B7280"
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="new-password"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 justify-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} color="#9CA3AF" />
                        ) : (
                          <Eye size={16} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {confirmPassword && (
                      <View className="text-xs">
                        {passwordsMatch ? (
                          <View className="flex-row items-center">
                            <Check size={12} color="#10B981" />
                            <Text className="text-green-400 ml-1">
                              Passwords match
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <X size={12} color="#EF4444" />
                            <Text className="text-red-400 ml-1">
                              Passwords don't match
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Enhanced Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={
                      loading || !passwordsMatch || passwordStrength.score < 2
                    }
                    className={`w-full bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 py-3 rounded-xl mt-6 ${
                      loading || !passwordsMatch || passwordStrength.score < 2
                        ? "opacity-50"
                        : ""
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
                            Creating account...
                          </Text>
                        </>
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          Sign up
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Enhanced Login Link */}
                <View className="mt-6">
                  <View className="relative">
                    <View className="absolute inset-0 justify-center">
                      <View className="w-full h-px bg-[#31344d]" />
                    </View>
                    <View className="relative justify-center">
                      <View className="px-4 bg-gradient-to-br from-[#23263a]/90 to-[#31344d]/90">
                        <Text className="text-gray-400 text-sm">
                          Already have an account?
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onNavigateToLogin}
                    className="items-center justify-center mt-3"
                  >
                    <Text className="text-[#01C38D] font-semibold text-base">
                      Login
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
