import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { TrendingUp, Plus, CheckCircle } from "lucide-react-native";
import Card from "../molecules/Card";
import { triggerHaptic } from "../../utils/haptics";

interface OnboardingStep3Props {
  formData: {
    transactionAdded: boolean;
  };
  setFormData: (data: any) => void;
  onNext: () => void;
}

export default function OnboardingStep3({
  formData,
  setFormData,
  onNext,
}: OnboardingStep3Props) {
  const colors = COLORS;
  const navigation = useNavigation();

  const handleAddTransaction = () => {
    triggerHaptic();
    navigation.navigate("AddExpenseForm" as never);
    // Mark as added when user returns
    setFormData({ ...formData, transactionAdded: true });
  };

  return (
    <View className="px-6 pt-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent/20 rounded-full items-center justify-center mb-4">
          <TrendingUp size={40} color={colors.accent} />
        </View>
        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
          Primeira Transação!
        </Text>
        <Text className="text-text-secondary text-center">
          Adicione sua primeira transação para começar
        </Text>
      </View>

      {formData.transactionAdded ? (
        <Card className="p-6 items-center">
          <CheckCircle size={64} color={colors.success} />
          <Text className="text-text-primary text-xl font-bold mt-4">
            Parabéns!
          </Text>
          <Text className="text-text-secondary text-center mt-2">
            Sua primeira transação foi adicionada com sucesso
          </Text>
        </Card>
      ) : (
        <Card className="p-6">
          <View className="items-center mb-6">
            <Text className="text-text-primary text-lg font-semibold text-center mb-2">
              Vamos começar!
            </Text>
            <Text className="text-text-secondary text-center">
              Adicione uma receita ou despesa para ver o Monity em ação
            </Text>
          </View>

          <Pressable
            onPress={handleAddTransaction}
            className="bg-accent px-6 py-4 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Plus size={20} color="#191E29" />
            <Text className="text-[#191E29] font-semibold text-base">
              Adicionar Transação
            </Text>
          </Pressable>
        </Card>
      )}
    </View>
  );
}

