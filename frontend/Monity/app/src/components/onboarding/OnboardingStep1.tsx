import React from "react";
import { View, Text, Pressable } from "react-native";
import { COLORS } from "../../constants/colors";
import { Target, TrendingUp, Wallet, BarChart3 } from "lucide-react-native";
import Card from "../molecules/Card";

interface OnboardingStep1Props {
  formData: {
    primaryGoal: string;
  };
  setFormData: (data: any) => void;
  onNext: () => void;
}

const goalOptions = [
  {
    id: "save_money",
    label: "Economizar Dinheiro",
    icon: Wallet,
    description: "Construir reservas e economizar para o futuro",
  },
  {
    id: "track_expenses",
    label: "Controlar Gastos",
    icon: BarChart3,
    description: "Entender para onde vai meu dinheiro",
  },
  {
    id: "pay_debt",
    label: "Pagar Dívidas",
    icon: TrendingUp,
    description: "Eliminar dívidas e ficar livre",
  },
  {
    id: "budget_better",
    label: "Orçamento Inteligente",
    icon: Target,
    description: "Criar e seguir um orçamento realista",
  },
];

export default function OnboardingStep1({
  formData,
  setFormData,
  onNext,
}: OnboardingStep1Props) {
  const colors = COLORS;

  return (
    <View className="px-6 pt-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent/20 rounded-full items-center justify-center mb-4">
          <Target size={40} color={colors.accent} />
        </View>
        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
          Qual é seu objetivo?
        </Text>
        <Text className="text-text-secondary text-center">
          Escolha o que mais importa para você
        </Text>
      </View>

      <View className="gap-3">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const isSelected = formData.primaryGoal === goal.id;

          return (
            <Pressable
              key={goal.id}
              onPress={() => {
                setFormData({ ...formData, primaryGoal: goal.id });
              }}
            >
              <Card
                className={`p-4 ${
                  isSelected ? "border-2 border-accent" : ""
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      isSelected ? "bg-accent" : "bg-accent/20"
                    }`}
                  >
                    <Icon
                      size={24}
                      color={isSelected ? "#191E29" : colors.accent}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary text-lg font-semibold">
                      {goal.label}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-1">
                      {goal.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 bg-accent rounded-full items-center justify-center">
                      <View className="w-3 h-3 bg-[#191E29] rounded-full" />
                    </View>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}



