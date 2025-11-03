import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation";
import { COLORS } from "../../constants/colors";
import { apiService, Category } from "../../services/apiService";
import {
  TrendingUp,
  ArrowLeft,
  Coffee,
  Car,
  Home,
  ShoppingCart,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Calendar,
  Star,
} from "lucide-react-native";
import { triggerHaptic } from "../../utils/haptics";

type AddIncomeFormRouteProp = RouteProp<RootStackParamList, "AddIncomeForm">;

export default function AddIncomeForm() {
  const navigation = useNavigation();
  const route = useRoute<AddIncomeFormRouteProp>();
  const colors = COLORS;

  const favoriteData = route.params?.favoriteData;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        Alert.alert("Erro", "Falha ao carregar categorias");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Erro", "Falha ao carregar categorias");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter only income categories (typeId === 2)
  const filteredCategories = categories.filter(
    (category) => category.typeId === 2
  );

  // Populate form fields when favoriteData is available
  useEffect(() => {
    if (favoriteData && categories.length > 0) {
      // Set name
      if (favoriteData.name) {
        setName(favoriteData.name);
      }
      
      // Set amount (format as Brazilian currency)
      if (favoriteData.amount) {
        const formattedValue = (Number(favoriteData.amount) / 1).toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );
        setAmount(formattedValue);
      }
      
      // Set description
      if (favoriteData.description) {
        setDescription(favoriteData.description);
      }
      
      // Set date
      if (favoriteData.date) {
        // Format date to YYYY-MM-DD if needed
        const dateStr = favoriteData.date.split('T')[0];
        setDate(dateStr);
      }
      
      // Set isFavorite
      if (favoriteData.isFavorite !== undefined) {
        setIsFavorite(favoriteData.isFavorite);
      }
      
      // Find and set category by name
      if (favoriteData.categoryName) {
        const incomeCategories = categories.filter(
          (category) => category.typeId === 2
        );
        const matchingCategory = incomeCategories.find(
          (cat) => cat.name === favoriteData.categoryName
        );
        if (matchingCategory) {
          setSelectedCategory(matchingCategory.id);
        }
      }
    }
  }, [favoriteData, categories]);

  const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Coffee: Coffee,
      Car: Car,
      Home: Home,
      ShoppingCart: ShoppingCart,
      Gamepad2: Gamepad2,
      Heart: Heart,
      GraduationCap: GraduationCap,
      Briefcase: Briefcase,
      TrendingUp: TrendingUp,
    };
    return iconMap[iconName] || Coffee;
  };

  const getBackgroundColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-orange-500": "bg-orange-500/20",
      "bg-blue-500": "bg-blue-500/20",
      "bg-green-500": "bg-green-500/20",
      "bg-purple-500": "bg-purple-500/20",
      "bg-pink-500": "bg-pink-500/20",
      "bg-red-500": "bg-red-500/20",
      "bg-indigo-500": "bg-indigo-500/20",
      "bg-gray-500": "bg-gray-500/20",
      "bg-yellow-500": "bg-yellow-500/20",
    };
    return colorMap[color] || "bg-gray-500/20";
  };

  const handleAmountChange = (value: string) => {
    // Format as Brazilian currency
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = (Number(numericValue) / 100).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    setAmount(formattedValue);
  };

  const handleSubmit = async () => {
    if (!name || !amount || !selectedCategory) {
      Alert.alert("Erro", "Por favor, preencha Nome, Valor e Categoria");
      return;
    }
    triggerHaptic();

    try {
      // Convert amount to proper format
      const numericAmount = Number.parseFloat(
        amount.replace(/\./g, "").replace(",", ".")
      );

      // Find the selected category to get its name
      const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory
      );
      if (!selectedCategoryData) {
        Alert.alert("Erro", "Categoria selecionada não encontrada");
        return;
      }

      const transactionData = {
        description: name, // Using name as description
        amount: numericAmount, // Store income as positive values
        category: selectedCategoryData.name,
        date,
        isFavorite: isFavorite === true, // Explicitly convert to boolean
      };

      console.log("Saving income:", transactionData);

      const response = await apiService.addIncome(transactionData);

      if (response.success) {
        console.log("Income saved successfully:", response.data);
        Alert.alert(
          "Sucesso",
          "Receita salva com sucesso!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Failed to save income:", response.error);
        Alert.alert("Erro", `Falha ao salvar receita: ${response.error}`);
      }
    } catch (error) {
      console.error("Error saving income:", error);
      Alert.alert(
        "Erro",
        "Erro inesperado ao salvar receita. Tente novamente."
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => {
              triggerHaptic();
              navigation.goBack();
            }} className="p-2">
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text
              style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "bold" }}
            >
              Adicionar Receita
            </Text>
          </View>

          {/* Nome */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Nome *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Salário Janeiro"
              placeholderTextColor="#9CA3AF"
              className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3"
              style={{ color: colors.textPrimary }}
            />
          </View>

          {/* Valor */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Valor *
            </Text>
            <View
              className="flex-row bg-card-bg border border-border-default rounded-xl px-4"
              style={{ height: 48, alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.textMuted,
                  marginRight: 8,
                  lineHeight: 22,
                }}
              >
                R$
              </Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-lg font-bold text-white"
                keyboardType="numeric"
                style={{
                  paddingVertical: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginVertical: 0,
                  lineHeight: 22,
                }}
              />
            </View>
          </View>

          {/* Descrição (Opcional) */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Descrição
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição adicional (opcional)"
              placeholderTextColor="#9CA3AF"
              className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3 h-20 text-left"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Data */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Data
            </Text>
            <View className="flex-row items-center gap-2">
              <Calendar size={20} color={colors.textMuted} />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                className="flex-1 bg-card-bg border border-border-default rounded-xl text-white px-4 py-3"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Categorias */}
          <View className="mb-4">
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Categoria *
            </Text>
            {isLoading ? (
              <View className="items-center py-8">
                <Text style={{ color: colors.textMuted }}>
                  Carregando categorias...
                </Text>
              </View>
            ) : filteredCategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {filteredCategories.map((category) => {
                  const Icon = getCategoryIcon(category.icon);
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      className={`w-24 h-24 rounded-xl items-center justify-center flex-col gap-2 ${
                        isSelected
                          ? "bg-accent"
                          : "bg-card-bg border border-border-default"
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-lg items-center justify-center ${getBackgroundColorClass(
                          category.color
                        )}`}
                      >
                        <Icon size={20} color={colors.textPrimary} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          textAlign: "center",
                          paddingHorizontal: 4,
                          color: isSelected ? "#191E29" : colors.textGray,
                          fontWeight: isSelected ? "500" : "normal",
                        }}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Nenhuma categoria encontrada
                </Text>
                <Text
                  style={{
                    color: colors.textGray,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Crie categorias na seção de Categorias primeiro
                </Text>
              </View>
            )}
          </View>

          {/* Favoritar */}
          <View className="mb-6">
            <Pressable
              onPress={() => setIsFavorite(!isFavorite)}
              className="flex-row items-center gap-3"
            >
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  isFavorite
                    ? "bg-accent border-accent"
                    : "border-border-default"
                }`}
              >
                {isFavorite && (
                  <Star size={14} color="#191E29" fill="#191E29" />
                )}
              </View>
              <Text style={{ color: colors.textGray }}>
                Favoritar esta receita
              </Text>
            </Pressable>
          </View>

          {/* Submit Buttons */}
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => {
                triggerHaptic();
                navigation.goBack();
              }}
              className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
            >
              <Text style={{ color: colors.textGray, fontWeight: "500" }}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!name || !amount || !selectedCategory}
              className={`flex-1 h-12 rounded-lg items-center justify-center ${
                !name || !amount || !selectedCategory
                  ? "bg-[#4B5563]"
                  : "bg-accent"
              }`}
            >
              <Text
                className={`font-medium ${
                  !name || !amount || !selectedCategory
                    ? "text-gray-500"
                    : "text-[#191E29]"
                }`}
              >
                Salvar
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

