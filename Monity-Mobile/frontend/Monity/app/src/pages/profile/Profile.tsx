import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
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
} from "lucide-react-native";

export default function Profile() {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "João Silva",
    email: user?.email || "joao.silva@email.com",
  });

  const refreshProfileData = async () => {
    // Refresh user profile data
    console.log("Refreshing profile data...");
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: refreshProfileData,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    try {
      await updateProfile(profileData);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar perfil");
    }
  };

  const handleExportData = () => {
    Alert.alert("Exportar Dados", "Funcionalidade será implementada em breve");
  };

  const handleChangePassword = () => {
    Alert.alert("Alterar Senha", "Funcionalidade será implementada em breve");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.alert("Conta Excluída", "Sua conta foi excluída com sucesso");
          },
        },
      ]
    );
  };

  const handleUpdateProfile = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

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
              <ArrowLeft size={20} color="#9CA3AF" />
            </Pressable>
            <Text className="text-white text-2xl font-bold">Perfil</Text>
          </View>

          {/* Profile Card */}
          <Card className="mb-6">
            <View className="p-6">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="relative">
                  <View className="w-20 h-20 bg-[#01C38D] rounded-full items-center justify-center">
                    <Text className="text-[#191E29] font-bold text-2xl">
                      {getInitials(profileData.name)}
                    </Text>
                  </View>
                  <Pressable className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#31344d] rounded-full items-center justify-center">
                    <Camera size={14} color="#9CA3AF" />
                  </Pressable>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">
                    {profileData.name}
                  </Text>
                  <Text className="text-gray-400">{profileData.email}</Text>
                  <Text className="text-sm text-gray-400">
                    Membro desde Jan 2024
                  </Text>
                </View>
                <Pressable
                  onPress={isEditing ? handleSave : () => setIsEditing(true)}
                  className="bg-[#31344d] border border-[#4B5563] px-4 py-2 rounded-lg flex-row items-center gap-2"
                >
                  <Edit3 size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm">
                    {isEditing ? "Salvar" : "Editar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Profile Information */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <User size={20} color="#9CA3AF" />
                <Text className="text-white text-lg font-semibold">
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
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Settings */}
          <Card className="mb-6">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Settings size={20} color="#9CA3AF" />
                <Text className="text-white text-lg font-semibold">
                  Configurações
                </Text>
              </View>
              <View className="gap-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Bell size={20} color="#9CA3AF" />
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
                    <Shield size={20} color="#9CA3AF" />
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
              <Text className="text-white text-lg font-semibold mb-4">
                Ações da Conta
              </Text>
              <View className="gap-3">
                <Pressable
                  onPress={handleExportData}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Download size={20} color="#9CA3AF" />
                  <Text className="text-gray-300 ml-3">Exportar Dados</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Shield size={20} color="#9CA3AF" />
                  <Text className="text-gray-300 ml-3">Alterar Senha</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  className="w-full bg-[#31344d] border border-[#4B5563] rounded-lg px-4 py-3 flex-row items-center"
                >
                  <Trash2 size={20} color="#EF4444" />
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
