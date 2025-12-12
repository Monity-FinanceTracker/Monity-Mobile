import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "../../constants/colors";
import { Sparkles, Brain, Target, TrendingUp } from "lucide-react-native";
import Card from "../molecules/Card";

interface OnboardingStep4Props {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
}

const features = [
  {
    icon: Brain,
    title: "IA Inteligente",
    description: "Categorização automática de transações",
  },
  {
    icon: Target,
    title: "Metas de Economia",
    description: "Defina e acompanhe seus objetivos",
  },
  {
    icon: TrendingUp,
    title: "Análises Avançadas",
    description: "Insights sobre seus hábitos financeiros",
  },
];

export default function OnboardingStep4({
  formData,
  setFormData,
  onNext,
}: OnboardingStep4Props) {
  const colors = COLORS;

  return (
    <View className="px-6 pt-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent/20 rounded-full items-center justify-center mb-4">
          <Sparkles size={40} color={colors.accent} />
        </View>
        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
          Recursos Inteligentes
        </Text>
        <Text className="text-text-secondary text-center">
          Conheça os recursos que vão transformar suas finanças
        </Text>
      </View>

      <View className="gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="p-4">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-accent/20 rounded-full items-center justify-center">
                  <Icon size={24} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary text-lg font-semibold">
                    {feature.title}
                  </Text>
                  <Text className="text-text-secondary text-sm mt-1">
                    {feature.description}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}


