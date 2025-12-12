import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { COLORS } from "../../constants/colors";
import { Wallet, Check } from "lucide-react-native";
import Card from "../molecules/Card";

interface OnboardingStep2Props {
  formData: {
    estimatedIncome: string;
    preferredCategories: string[];
  };
  setFormData: (data: any) => void;
  onNext: () => void;
}

const categoryOptions = [
  { id: "food", label: "Alimentação", icon: "🍔" },
  { id: "transport", label: "Transporte", icon: "🚗" },
  { id: "housing", label: "Moradia", icon: "🏠" },
  { id: "entertainment", label: "Lazer", icon: "🎬" },
  { id: "healthcare", label: "Saúde", icon: "💊" },
  { id: "education", label: "Educação", icon: "📚" },
  { id: "shopping", label: "Compras", icon: "🛍️" },
  { id: "bills", label: "Contas", icon: "📄" },
];

export default function OnboardingStep2({
  formData,
  setFormData,
  onNext,
}: OnboardingStep2Props) {
  const colors = COLORS;

  const toggleCategory = (categoryId: string) => {
    const current = formData.preferredCategories;
    if (current.includes(categoryId)) {
      setFormData({
        ...formData,
        preferredCategories: current.filter((id) => id !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        preferredCategories: [...current, categoryId],
      });
    }
  };

  return (
    <View className="px-6 pt-6">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent/20 rounded-full items-center justify-center mb-4">
          <Wallet size={40} color={colors.accent} />
        </View>
        <Text className="text-text-primary text-2xl font-bold text-center mb-2">
          Contexto Financeiro
        </Text>
        <Text className="text-text-secondary text-center">
          Ajude-nos a personalizar sua experiência
        </Text>
      </View>

      <View className="gap-6">
        {/* Income Input */}
        <View>
          <Text className="text-text-primary text-base font-semibold mb-2">
            Renda Mensal Estimada (opcional)
          </Text>
          <TextInput
            value={formData.estimatedIncome}
            onChangeText={(text) =>
              setFormData({ ...formData, estimatedIncome: text })
            }
            placeholder="Ex: 5000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            className="bg-card-bg text-text-primary px-4 py-3 rounded-xl border border-border-default"
          />
        </View>

        {/* Categories */}
        <View>
          <Text className="text-text-primary text-base font-semibold mb-3">
            Categorias que você mais usa
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryOptions.map((category) => {
              const isSelected = formData.preferredCategories.includes(
                category.id
              );

              return (
                <Pressable
                  key={category.id}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View
                    className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                      isSelected ? "bg-accent" : "bg-card-bg border border-border-default"
                    }`}
                  >
                    <Text className="text-lg">{category.icon}</Text>
                    <Text
                      className={`font-medium ${
                        isSelected ? "text-[#191E29]" : "text-text-primary"
                      }`}
                    >
                      {category.label}
                    </Text>
                    {isSelected && (
                      <Check size={16} color="#191E29" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}


