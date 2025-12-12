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
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import { useAuth } from "../../context/AuthContext";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { COLORS } from "../../constants/colors";
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
  X,
} from "lucide-react-native";

export default function Profile() {
  const navigation = useNavigation();
  const { user, updateProfile, logout, changePassword, deleteAccount } =
    useAuth();
  const colors = COLORS;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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
    setShowChangePasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowChangePasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSubmitPasswordChange = async () => {
    if (!passwordData.currentPassword) {
      Alert.alert("Erro", "Senha atual é obrigatória");
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      Alert.alert(
        "Erro",
        "Nova senha deve ter pelo menos 6 caracteres"
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
      handleClosePasswordModal();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Falha ao alterar senha. Verifique sua senha atual."
      );
    } finally {
      setIsLoading(false);
    }
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
            setShowDeleteAccountModal(true);
          },
        },
      ]
    );
  };

  const handleCloseDeleteAccountModal = () => {
    setShowDeleteAccountModal(false);
    setDeleteAccountPassword("");
  };

  const handleSubmitDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      Alert.alert("Erro", "Senha é obrigatória para excluir a conta");
      return;
    }

    try {
      setIsLoading(true);
      await deleteAccount(deleteAccountPassword);
      Alert.alert("Conta Excluída", "Sua conta foi excluída com sucesso");
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Falha ao excluir conta. Verifique sua senha."
      );
    } finally {
      setIsLoading(false);
      handleCloseDeleteAccountModal();
    }
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
        className="flex-1 bg-background"
        edges={["top", "bottom", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large"  />
          <Text style={{ color: colors.textPrimary, marginTop: 16 }}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView style={{ flex: 1 }} refreshControl={refreshControl}>
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Perfil</Text>
          </View>

          {/* Profile Card */}
          <Card className="mb-6">
            <View className="p-6">
              <View className="items-center mb-4">
                <View className="relative mb-4">
                  <View className="w-20 h-20 bg-accent rounded-full items-center justify-center">
                    <Text className="text-[#191E29] font-bold text-lg">
                      {getInitials(profileData.name)}
                    </Text>
                  </View>
                  <Pressable className="absolute -bottom-1 -right-1 w-8 h-8 bg-card-bg rounded-full items-center justify-center">
                    <Camera size={14} color={colors.textPrimary} />
                  </Pressable>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
                  {profileData.name || user?.name || "Usuário"}
                </Text>
                <Text style={{ color: colors.textPrimary, textAlign: 'center', marginBottom: 4 }}>{profileData.email}</Text>
              </View>
            </View>
          </Card>

          {/* Premium Subscription Card */}
          {user?.subscriptionTier !== "premium" && (
            <Card className="mb-6 border-2 border-accent bg-gradient-to-r from-[#01C38D]/10 to-[#01C38D]/5">
              <View className="p-6">
                <View className="flex-row items-center gap-3 mb-4">
                  <Crown size={24} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Upgrade para Premium</Text>
                </View>
                <Text style={{ color: colors.textPrimary, marginBottom: 16 }}>
                  Desbloqueie recursos exclusivos e tenha controle total das suas finanças
                </Text>
                <View className="gap-2 mb-4">
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>IA para categorização automática</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>Projeções financeiras avançadas</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>Relatórios detalhados</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>Backup automático na nuvem</Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleUpgradeToPremium}
                  className="bg-accent py-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Crown size={20} color="#191E29" />
                  <Text style={{ color: '#191E29', fontWeight: 'bold', fontSize: 14 }}>
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
                  <Crown size={24} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Premium Ativo</Text>
                </View>
                <Text style={{ color: colors.textPrimary, marginBottom: 8 }}>
                  Você tem acesso a todos os recursos premium!
                </Text>
                {user?.subscriptionExpiresAt && (
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>
                    Válido até: {new Date(user.subscriptionExpiresAt).toLocaleDateString("pt-BR")}
                  </Text>
                )}
              </View>
            </Card>
          )}

          {/* Profile Information */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <User size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                    Informações Pessoais
                  </Text>
                </View>
                <Pressable
                  onPress={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={isLoading}
                  className="bg-card-bg border border-border-default px-3 py-1.5 rounded-lg flex-row items-center gap-2"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <Edit3 size={14} color={colors.textPrimary} />
                  )}
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                    {isEditing ? "Salvar" : "Editar"}
                  </Text>
                </Pressable>
              </View>
              <View className="gap-4">
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                    Nome Completo
                  </Text>
                  <TextInput
                    value={profileData.name}
                    onChangeText={(text) => handleUpdateProfile("name", text)}
                    editable={isEditing}
                    className={`bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3 ${
                      !isEditing ? "opacity-50" : ""
                    }`}
                    placeholder="Digite seu nome completo"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>Email</Text>
                  <TextInput
                    value={profileData.email}
                    onChangeText={(text) => handleUpdateProfile("email", text)}
                    editable={isEditing}
                    className={`bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3 ${
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
                <Settings size={20} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                  Configurações
                </Text>
              </View>
              <View className="gap-6">
                <Pressable
                  onPress={() => {
                    navigation.navigate("NotificationSettings");
                  }}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Bell size={20} color={colors.textPrimary} />
                    <View className="flex-1">
                      <Text style={{ fontWeight: '500', color: colors.textPrimary }}>
                        Configurações de Notificação
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Gerenciar lembretes e alertas
                      </Text>
                    </View>
                  </View>
                  <ArrowLeft
                    size={20}
                    color={colors.textSecondary}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </Pressable>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Shield size={20} color={colors.textPrimary} />
                    <View>
                      <Text style={{ fontWeight: '500', color: colors.textPrimary }}>
                        Autenticação Biométrica
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                        Usar digital ou Face ID
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={biometric}
                    onValueChange={setBiometric}
                    trackColor={{ false: colors.secondaryBg, true: colors.accent }}
                    thumbColor={biometric ? "#191E29" : colors.textMuted}
                  />
                </View>

              </View>
            </View>
          </Card>

          {/* Account Actions */}
          <Card className="mb-6">
            <View className="p-4">
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
                Ações da Conta
              </Text>
              <View className="gap-3">
                <Pressable
                  onPress={handleExportData}
                  className="w-full bg-card-bg border border-border-default rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Download size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, marginLeft: 12 }}>Exportar Dados</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={isLoading}
                  className="w-full bg-card-bg border border-border-default rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Shield size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, marginLeft: 12 }}>Alterar Senha</Text>
                </Pressable>
                <Pressable
                  onPress={handleLogout}
                  disabled={isLoading}
                  className="w-full bg-card-bg border border-border-default rounded-lg px-4 py-3 flex-row items-center"
                >
                  <LogOut size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, marginLeft: 12 }}>Sair da Conta</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={isLoading}
                  className="w-full bg-card-bg border border-border-default rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={{ color: '#EF4444', marginLeft: 12 }}>Excluir Conta</Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {/* App Info */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="items-center">
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>Monity v1.0.0</Text>
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>
                  © 2025 Monity. Todos os direitos reservados.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableOpacity
              className="flex-1"
              activeOpacity={1}
              onPress={handleClosePasswordModal}
            />
            <View className="bg-background rounded-t-3xl" style={{ maxHeight: '80%', minHeight: '60%' }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                    Alterar Senha
                  </Text>
                  <Pressable onPress={handleClosePasswordModal}>
                    <X size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View className="gap-4">
                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                      Senha Atual
                    </Text>
                    <TextInput
                      value={passwordData.currentPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, currentPassword: text })
                      }
                      secureTextEntry
                      className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
                      placeholder="Digite sua senha atual"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                      Nova Senha
                    </Text>
                    <TextInput
                      value={passwordData.newPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, newPassword: text })
                      }
                      secureTextEntry
                      className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
                      placeholder="Digite sua nova senha (mín. 6 caracteres)"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                      Confirmar Nova Senha
                    </Text>
                    <TextInput
                      value={passwordData.confirmPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, confirmPassword: text })
                      }
                      secureTextEntry
                      className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
                      placeholder="Confirme sua nova senha"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="flex-row gap-3 mt-4">
                    <Pressable
                      onPress={handleClosePasswordModal}
                      disabled={isLoading}
                      className="flex-1 bg-card-bg border border-border-default py-3 rounded-xl items-center"
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSubmitPasswordChange}
                      disabled={isLoading}
                      className="flex-1 bg-accent py-3 rounded-xl items-center"
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#191E29" />
                      ) : (
                        <Text style={{ color: '#191E29', fontSize: 14, fontWeight: '600' }}>
                          Alterar Senha
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseDeleteAccountModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableOpacity
              className="flex-1"
              activeOpacity={1}
              onPress={handleCloseDeleteAccountModal}
            />
            <View className="bg-background rounded-t-3xl" style={{ maxHeight: '70%', minHeight: '50%' }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
              >
                <View className="flex-row items-center justify-between mb-6">
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                    Confirmar Exclusão
                  </Text>
                  <Pressable onPress={handleCloseDeleteAccountModal}>
                    <X size={24} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View className="gap-4">
                  <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                    Digite sua senha para confirmar a exclusão da conta:
                  </Text>

                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 8 }}>
                      Senha
                    </Text>
                    <TextInput
                      value={deleteAccountPassword}
                      onChangeText={setDeleteAccountPassword}
                      secureTextEntry
                      className="bg-card-bg border border-border-default rounded-xl text-text-primary px-4 py-3"
                      placeholder="Digite sua senha"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="flex-row gap-3 mt-4">
                    <Pressable
                      onPress={handleCloseDeleteAccountModal}
                      disabled={isLoading}
                      className="flex-1 bg-card-bg border border-border-default py-3 rounded-xl items-center"
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSubmitDeleteAccount}
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{ backgroundColor: colors.error }}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.textPrimary} />
                      ) : (
                        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                          Excluir Conta
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
