import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import { useAuth } from "../../context/AuthContext";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Settings,
  Camera,
  Edit3,
  LogOut,
  Crown,
  Star,
} from "lucide-react-native";

export default function Profile() {
  const navigation = useNavigation();
  const { user, updateProfile, logout, changePassword, deleteAccount } =
    useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      console.log("User data:", user);
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const refreshProfileData = async () => {
    // Refresh user profile data - this will be handled by AuthContext
    console.log("Refreshing profile data...");
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: refreshProfileData,
  });

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    // Handle YYYY-MM-DD format dates correctly
    let date: Date;
    if (dateString.includes('-') && !dateString.includes('T')) {
      // Date is in YYYY-MM-DD format, parse as local date
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Fallback for other date formats
      date = new Date(dateString);
    }
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      Alert.alert("Erro", "Nome e email são obrigatórios");
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile(profileData);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            await logout();
            // Navigation will be handled by AuthContext
          } catch (error) {
            Alert.alert("Erro", "Falha ao fazer logout");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleExportData = () => {
    Alert.alert("Exportar Dados", "Funcionalidade será implementada em breve");
  };

  const handleChangePassword = () => {
    Alert.prompt(
      "Alterar Senha",
      "Digite sua senha atual:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: (currentPassword?: string) => {
            if (!currentPassword) {
              Alert.alert("Erro", "Senha atual é obrigatória");
              return;
            }

            Alert.prompt(
              "Nova Senha",
              "Digite sua nova senha:",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Alterar",
                  onPress: async (newPassword?: string) => {
                    if (!newPassword || newPassword.length < 6) {
                      Alert.alert(
                        "Erro",
                        "Nova senha deve ter pelo menos 6 caracteres"
                      );
                      return;
                    }

                    try {
                      setIsLoading(true);
                      await changePassword(currentPassword, newPassword);
                      Alert.alert("Sucesso", "Senha alterada com sucesso!");
                    } catch (error) {
                      Alert.alert(
                        "Erro",
                        "Falha ao alterar senha. Verifique sua senha atual."
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ],
              "secure-text"
            );
          },
        },
      ],
      "secure-text"
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirmar Exclusão",
              "Digite sua senha para confirmar a exclusão da conta:",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir Conta",
                  style: "destructive",
                  onPress: async (password?: string) => {
                    if (!password) {
                      Alert.alert(
                        "Erro",
                        "Senha é obrigatória para excluir a conta"
                      );
                      return;
                    }

                    try {
                      setIsLoading(true);
                      await deleteAccount(password);
                      Alert.alert(
                        "Conta Excluída",
                        "Sua conta foi excluída com sucesso"
                      );
                      // Navigation will be handled by AuthContext
                    } catch (error) {
                      Alert.alert(
                        "Erro",
                        "Falha ao excluir conta. Verifique sua senha."
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ],
              "secure-text"
            );
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = () => {
    // @ts-ignore - navigation type issue
    navigation.navigate("SubscriptionPlans");
  };

  const handleUpdateProfile = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  if (!user) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#191E29]"
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large"  />
          <Text className="text-white mt-4">Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#191E29]"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView className="flex-1" refreshControl={refreshControl}>
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-bold">Perfil</Text>
          </View>

          {/* Profile Card */}
          <Card className="mb-6">
            <View className="p-6">
              <View className="items-center mb-4">
                <View className="relative mb-4">
                  <View className="w-20 h-20 bg-[#01C38D] rounded-full items-center justify-center">
                    <Text className="text-[#191E29] font-bold text-lg">
                      {getInitials(profileData.name)}
                    </Text>
                  </View>
                  <Pressable className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#31344d] rounded-full items-center justify-center">
                    <Camera size={14} color="white" />
                  </Pressable>
                </View>
                <Text className="text-white text-base font-bold text-center mb-1">
                  {profileData.name || user?.name || "Usuário"}
                </Text>
                <Text className="text-gray-400 text-center mb-1">{profileData.email}</Text>
                <Text className="text-xs text-gray-400 text-center">
                  Membro desde {formatDate(user.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isLoading}
                className="bg-[#31344d] border border-[#4B5563] px-4 py-2 rounded-lg flex-row items-center justify-center gap-2"
              >
                {isLoading ? (
                  <ActivityIndicator size="small"  />
                ) : (
                  <Edit3 size={16} color="white" />
                )}
                <Text className="text-gray-300 text-sm">
                  {isEditing ? "Salvar" : "Editar"}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Premium Subscription Card */}
          {user?.subscriptionTier !== "premium" && (
            <Card className="mb-6 border-2 border-[#01C38D] bg-gradient-to-r from-[#01C38D]/10 to-[#01C38D]/5">
              <View className="p-6">
                <View className="flex-row items-center gap-3 mb-4">
                  <Crown size={24} color="white" />
                  <Text className="text-white text-lg font-bold">Upgrade para Premium</Text>
                </View>
                <Text className="text-gray-300 mb-4">
                  Desbloqueie recursos exclusivos e tenha controle total das suas finanças
                </Text>
                <View className="gap-2 mb-4">
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color="white" />
                    <Text className="text-gray-300 text-sm">IA para categorização automática</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color="white" />
                    <Text className="text-gray-300 text-sm">Projeções financeiras avançadas</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color="white" />
                    <Text className="text-gray-300 text-sm">Relatórios detalhados</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color="white" />
                    <Text className="text-gray-300 text-sm">Backup automático na nuvem</Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleUpgradeToPremium}
                  className="bg-[#01C38D] py-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Crown size={20} color="white" />
                  <Text className="text-[#191E29] font-bold text-sm">
                    Assinar Premium - R$ 9,90/mês
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}

          {/* Premium Status Card */}
          {user?.subscriptionTier === "premium" && (
            <Card className="mb-6 bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 border border-[#FFD700]/30">
              <View className="p-6">
                <View className="flex-row items-center gap-3 mb-2">
                  <Crown size={24} color="white" />
                  <Text className="text-white text-lg font-bold">Premium Ativo</Text>
                </View>
                <Text className="text-gray-300 mb-2">
                  Você tem acesso a todos os recursos premium!
                </Text>
                {user?.subscriptionExpiresAt && (
                  <Text className="text-gray-400 text-sm">
                    Válido até: {new Date(user.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                  </Text>
                )}
              </View>
            </Card>
          )}

          {/* Profile Information */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <User size={20} color="white" />
                <Text className="text-white text-sm font-semibold">
                  Informações Pessoais
                </Text>
              </View>
              <View className="gap-4">
                <View>
                  <Text className="text-gray-400 text-sm mb-2">
                    Nome Completo
                  </Text>
                  <TextInput
                    value={profileData.name}
                    onChangeText={(text) => handleUpdateProfile("name", text)}
                    editable={isEditing}
                    className={`bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3 ${
                      !isEditing ? "opacity-50" : ""
                    }`}
                    placeholder="Digite seu nome completo"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View>
                  <Text className="text-gray-400 text-sm mb-2">Email</Text>
                  <TextInput
                    value={profileData.email}
                    onChangeText={(text) => handleUpdateProfile("email", text)}
                    editable={isEditing}
                    className={`bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3 ${
                      !isEditing ? "opacity-50" : ""
                    }`}
                    placeholder="Digite seu email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Settings */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Settings size={20} color="white" />
                <Text className="text-white text-sm font-semibold">
                  Configurações
                </Text>
              </View>
              <View className="gap-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Bell size={20} color="white" />
                    <View>
                      <Text className="font-medium text-white">
                        Notificações
                      </Text>
                      <Text className="text-sm text-gray-400">
                        Receber alertas e lembretes
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: "#31344d", true: "#01C38D" }}
                    thumbColor={notifications ? "#191E29" : "#9CA3AF"}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Shield size={20} color="white" />
                    <View>
                      <Text className="font-medium text-white">
                        Autenticação Biométrica
                      </Text>
                      <Text className="text-sm text-gray-400">
                        Usar digital ou Face ID
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={biometric}
                    onValueChange={setBiometric}
                    trackColor={{ false: "#31344d", true: "#01C38D" }}
                    thumbColor={biometric ? "#191E29" : "#9CA3AF"}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-5 h-5 bg-white rounded-full" />
                    <View>
                      <Text className="font-medium text-white">
                        Tema Escuro
                      </Text>
                      <Text className="text-sm text-gray-400">
                        Aparência do aplicativo
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: "#31344d", true: "#01C38D" }}
                    thumbColor={darkMode ? "#191E29" : "#9CA3AF"}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Account Actions */}
          <Card className="mb-6">
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
                Ações da Conta
              </Text>
              <View className="gap-3">
                <Pressable
                  onPress={handleExportData}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Download size={20} color="white" />
                  <Text className="text-gray-300 ml-3">Exportar Dados</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={isLoading}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Shield size={20} color="white" />
                  <Text className="text-gray-300 ml-3">Alterar Senha</Text>
                </Pressable>
                <Pressable
                  onPress={handleLogout}
                  disabled={isLoading}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <LogOut size={20} color="white" />
                  <Text className="text-gray-300 ml-3">Sair da Conta</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={isLoading}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Trash2 size={20} color="white" />
                  <Text className="text-red-400 ml-3">Excluir Conta</Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {/* App Info */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="items-center">
                <Text className="text-sm text-gray-400">Monity v1.0.0</Text>
                <Text className="text-sm text-gray-400">
                  © 2025 Monity. Todos os direitos reservados.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
