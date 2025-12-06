import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { apiService } from "../../services/apiService";
import { triggerHaptic } from "../../utils/haptics";
import { ArrowLeft, X } from "lucide-react-native";

export default function CreateGroup() {
  const colors = COLORS;
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, informe o nome do grupo");
      return;
    }

    try {
      setLoading(true);
      triggerHaptic();
      const response = await apiService.createGroup({ name: name.trim() });

      if (response.success) {
        Alert.alert("Sucesso", "Grupo criado com sucesso!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert("Erro", response.error || "Falha ao criar grupo");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Erro", "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  navigation.goBack();
                }}
                className="p-2"
              >
                <ArrowLeft size={20} color={colors.textPrimary} />
              </Pressable>
              <Text className="text-text-primary text-2xl font-bold">
                Criar Grupo
              </Text>
            </View>
          </View>

          <View className="gap-6">
            <View>
              <Text className="text-text-primary text-base font-semibold mb-2">
                Nome do Grupo
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Casa, Viagem, Projeto..."
                placeholderTextColor={colors.textMuted}
                className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
                autoFocus
              />
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={loading || !name.trim()}
              className={`bg-accent py-4 rounded-xl items-center ${
                loading || !name.trim() ? "opacity-50" : ""
              }`}
            >
              <Text className="text-[#191E29] font-semibold text-base">
                {loading ? "Criando..." : "Criar Grupo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

