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
      setError("Password is too weak. Please use a stronger password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signup(email, password, name);
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
    <SafeAreaView className="flex-1 bg-[#191E29]">
      <StatusBar barStyle="light-content" backgroundColor="#191E29" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            {/* Logo Section */}
            <View className="mb-8 items-center">
              <Text className="text-4xl font-bold text-[#01C38D] mb-2">
                Monity
              </Text>
              <Text className="text-gray-300 text-lg">Create your account</Text>
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
                <Text className="text-gray-300 font-medium text-sm">
                  Full name
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <User size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-[#23263a] border-2 ${
                      focusedField === "name"
                        ? "border-[#01C38D]"
                        : "border-[#31344d]"
                    } rounded-xl px-4 py-3`}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    style={{
                      paddingLeft: 48,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  {name && name.length >= 2 && (
                    <View className="absolute inset-y-0 right-0 pr-4 justify-center">
                      <CheckCircle size={20} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-gray-300 font-medium text-sm">
                  Email address
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Mail size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-[#23263a] border-2 ${
                      focusedField === "email"
                        ? "border-[#01C38D]"
                        : "border-[#31344d]"
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
                  {email && isValidEmail(email) && (
                    <View className="absolute inset-y-0 right-0 pr-4 justify-center">
                      <CheckCircle size={20} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>

              {/* Password Input */}
              <View className="space-y-1 mt-2">
                <Text className="text-gray-300 font-medium text-sm">
                  Password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Lock size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-[#23263a] border-2 ${
                      focusedField === "password"
                        ? "border-[#01C38D]"
                        : "border-[#31344d]"
                    } rounded-xl px-4 py-3`}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
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

                {/* Password Strength Indicator */}
                {password && (
                  <View className="mt-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-gray-400">
                        Password strength
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.strength}
                      </Text>
                    </View>
                    <View className="bg-gray-700 rounded-full h-1">
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
                <Text className="text-gray-300 font-medium text-sm">
                  Confirm password
                </Text>
                <View className="relative">
                  <View className="absolute inset-y-0 left-0 pl-4 justify-center">
                    <Lock size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                    className={`bg-[#23263a] border-2 ${
                      focusedField === "confirmPassword"
                        ? "border-[#01C38D]"
                        : confirmPassword && !passwordsMatch
                          ? "border-red-400"
                          : "border-[#31344d]"
                    } rounded-xl px-4 py-3`}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    style={{
                      paddingLeft: 48,
                      paddingRight: 48,
                      fontSize: 16,
                      color: "#ffffff",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 justify-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {confirmPassword && (
                  <View className="mt-2">
                    {passwordsMatch ? (
                      <View className="flex-row items-center">
                        <CheckCircle size={16} color="#10B981" />
                        <Text className="text-green-600 ml-2 text-sm">
                          Passwords match
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <XCircle size={16} color="#EF4444" />
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
                className={`w-full py-3.5 rounded-xl mt-6 ${
                  loading || !passwordsMatch || passwordStrength.score < 2
                    ? "bg-gray-400"
                    : "bg-[#01C38D]"
                }`}
                style={{
                  backgroundColor:
                    loading || !passwordsMatch || passwordStrength.score < 2
                      ? "#9CA3AF"
                      : "#01C38D",
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
