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
import { useNavigation } from "@react-navigation/native";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import { COLORS } from "../../constants/colors";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { apiService, Category } from "../../services/apiService";
import {
  TrendingDown,
  TrendingUp,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowLeft,
} from "lucide-react-native";

const paymentMethods = [
  { id: "pix", name: "PIX", icon: Smartphone },
  { id: "credito", name: "Cartão de Crédito", icon: CreditCard },
  { id: "debito", name: "Cartão de Débito", icon: CreditCard },
  { id: "dinheiro", name: "Dinheiro", icon: Banknote },
  { id: "transferencia", name: "Transferência", icon: Smartphone },
];

export default function AddExpense() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    "expense"
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [isRecurring, setIsRecurring] = useState(false);
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

  const refreshData = async () => {
    console.log("Refreshing AddExpense data...");
    await loadCategories();
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: refreshData,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Reset selected category when transaction type changes
  useEffect(() => {
    setSelectedCategory("");
  }, [transactionType]);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((category) => {
    if (transactionType === "expense") {
      return category.typeId === 1; // Expense categories
    } else {
      return category.typeId === 2; // Income categories
    }
  });

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
      TrendingDown: TrendingDown,
    };
    return iconMap[iconName] || Coffee;
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
    if (
      !amount ||
      !description ||
      !selectedCategory ||
      !selectedPaymentMethod
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

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
        description,
        amount: transactionType === "expense" ? -numericAmount : numericAmount, // Store expenses as negative values
        category: selectedCategoryData.name, // Use category name instead of ID
        date,
        paymentMethod: selectedPaymentMethod,
        isRecurring,
      };

      console.log("Saving transaction:", transactionData);

      // Call the appropriate API method based on transaction type
      const response =
        transactionType === "expense"
          ? await apiService.addExpense(transactionData)
          : await apiService.addIncome(transactionData);

      if (response.success) {
        console.log("Transaction saved successfully:", response.data);
        Alert.alert(
          "Sucesso",
          `${transactionType === "expense" ? "Despesa" : "Receita"} salva com sucesso!`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Failed to save transaction:", response.error);
        Alert.alert(
          "Erro",
          `Falha ao salvar ${transactionType === "expense" ? "despesa" : "receita"}: ${response.error}`
        );
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert(
        "Erro",
        `Erro inesperado ao salvar ${transactionType === "expense" ? "despesa" : "receita"}. Tente novamente.`
      );
    }
  };

  const suggestCategory = (desc: string) => {
    const lowerDesc = desc.toLowerCase();
    if (
      lowerDesc.includes("uber") ||
      lowerDesc.includes("taxi") ||
      lowerDesc.includes("gasolina")
    ) {
      return "transporte";
    }
    if (
      lowerDesc.includes("mercado") ||
      lowerDesc.includes("restaurante") ||
      lowerDesc.includes("comida")
    ) {
      return "alimentacao";
    }
    if (
      lowerDesc.includes("aluguel") ||
      lowerDesc.includes("condominio") ||
      lowerDesc.includes("luz")
    ) {
      return "moradia";
    }
    return "";
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (transactionType === "expense" && value.length > 3) {
      const suggested = suggestCategory(value);
      if (suggested && !selectedCategory) {
        setSelectedCategory(suggested);
      }
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-orange-500": "#F97316",
      "bg-blue-500": "#3B82F6",
      "bg-green-500": "#22C55E",
      "bg-purple-500": "#A855F7",
      "bg-pink-500": "#EC4899",
      "bg-red-500": "#EF4444",
      "bg-indigo-500": "#6366F1",
      "bg-gray-500": "#6B7280",
      "bg-yellow-500": "#EAB308",
    };
    return colorMap[color] || "#6B7280";
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView 
        className="flex-1" 
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable onPress={() => navigation.goBack()} className="p-2">
              <ArrowLeft size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
              Adicionar Transação
            </Text>
          </View>

          {/* Transaction Type Toggle */}
          <View className="flex-row gap-2 mb-6">
            <Pressable
              onPress={() => setTransactionType("expense")}
              className={`flex-1 h-12 rounded-lg items-center justify-center flex-row gap-2 ${
                transactionType === "expense"
                  ? "bg-accent"
                  : "bg-card-bg border border-border-default"
              }`}
            >
              <TrendingDown
                size={20}
                color={transactionType === "expense" ? "#191E29" : colors.textPrimary}
              />
              <Text
                style={{
                  fontWeight: '500',
                  color: transactionType === "expense"
                    ? "#191E29"
                    : colors.textGray
                }}
              >
                Despesa
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTransactionType("income")}
              className={`flex-1 h-12 rounded-lg items-center justify-center flex-row gap-2 ${
                transactionType === "income"
                  ? "bg-accent"
                  : "bg-card-bg border border-border-default"
              }`}
            >
              <TrendingUp
                size={20}
                color={transactionType === "income" ? "#191E29" : colors.textPrimary}
              />
              <Text
                style={{
                  fontWeight: '500',
                  color: transactionType === "income"
                    ? "#191E29"
                    : colors.textGray
                }}
              >
                Receita
              </Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <Card className="mb-4">
            <View >
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
                Valor
              </Text>
              <View className="flex-row bg-card-bg border border-border-default rounded-xl px-4" style={{ height: 48, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textMuted, marginRight: 8, lineHeight: 22 }}>
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
                    lineHeight: 22
                  }}
                />
              </View>
            </View>
          </Card>

          {/* Description */}
          <Card className="mb-4">
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
                Descrição
              </Text>
              <TextInput
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder={
                  transactionType === "expense"
                    ? "Ex: Supermercado Extra, Uber Centro..."
                    : "Ex: Salário Janeiro, Freelance Design..."
                }
                placeholderTextColor="#9CA3AF"
                className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3 h-20 text-left"
                multiline
                textAlignVertical="top"
              />
            </View>
          </Card>

          {/* Category Selection */}
          <Card className="mb-4">
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
                Categoria
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
                          className={`w-10 h-10 rounded-lg items-center justify-center ${getBackgroundColorClass(category.color)}`}
                        >
                          <Icon
                            size={20}
                            color={colors.textPrimary}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            textAlign: 'center',
                            paddingHorizontal: 4,
                            color: isSelected ? "#191E29" : colors.textGray,
                            fontWeight: isSelected ? '500' : 'normal'
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
                  <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 16 }}>
                    Nenhuma categoria encontrada para{" "}
                    {transactionType === "expense" ? "despesas" : "receitas"}
                  </Text>
                  <Text style={{ color: colors.textGray, fontSize: 14, textAlign: 'center' }}>
                    Crie categorias na seção de Categorias primeiro
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Payment Method */}
          <Card className="mb-4">
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
              Método de Pagamento
            </Text>
            <View style={{ gap: 12 }}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                return (
                  <View
                    key={method.id}
                    style={{
                      backgroundColor: colors.cardBg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 16,
                      padding: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => setSelectedPaymentMethod(method.id)}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`w-8 h-8 rounded-lg items-center justify-center ${
                            isSelected
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          <Icon
                            size={16}
                            color="white"
                          />
                        </View>
                        <Text
                          className={`text-xs ${
                            isSelected ? "font-semibold text-white" : "font-medium text-white"
                          }`}
                        >
                          {method.name}
                        </Text>
                      </View>
                      {method.id === "pix" && (
                        <View className="bg-accent/10 px-2 py-1 rounded-md">
                          <Text className="text-[10px] text-gray-400">
                            Instantâneo
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Date and Options */}
          <Card className="mb-6">
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 16 }}>
                Data e Opções
              </Text>
              <View className="gap-4">
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 8 }}>
                    Data da Transação
                  </Text>
                  <View className="relative">
                    <Calendar
                      size={20}
                      color={colors.textPrimary}
                    />
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      className="mt-2 pl-4 bg-card-bg border border-border-default rounded-xl py-3"
                      style={{ color: colors.textPrimary }}
                    />
                  </View>
                </View>

                {transactionType === "income" && (
                  <Pressable
                    onPress={() => setIsRecurring(!isRecurring)}
                    className="flex-row items-center gap-3"
                  >
                    <View
                      className={`w-4 h-4 rounded border-2 items-center justify-center ${
                        isRecurring
                          ? "bg-accent border-accent"
                          : "border-border-default"
                      }`}
                    >
                      {isRecurring && (
                        <Text className="text-[#191E29] text-xs font-bold">
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: colors.textGray }}>
                      Receita recorrente (mensal)
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Card>

          {/* Submit Buttons */}
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => navigation.goBack()}
              className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
            >
              <Text style={{ color: colors.textGray, fontWeight: '500' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={
                !amount ||
                !description ||
                !selectedCategory ||
                !selectedPaymentMethod
              }
              className={`flex-1 h-12 rounded-lg items-center justify-center ${
                !amount ||
                !description ||
                !selectedCategory ||
                !selectedPaymentMethod
                  ? "bg-[#4B5563]"
                  : "bg-accent"
              }`}
            >
              <Text
                className={`font-medium ${
                  !amount ||
                  !description ||
                  !selectedCategory ||
                  !selectedPaymentMethod
                    ? "text-gray-500"
                    : "text-[#191E29]"
                }`}
              >
                Salvar {transactionType === "expense" ? "Despesa" : "Receita"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
