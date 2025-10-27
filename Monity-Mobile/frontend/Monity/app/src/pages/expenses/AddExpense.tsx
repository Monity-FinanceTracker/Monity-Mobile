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
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
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
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-bold">
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
                color="white"
              />
              <Text
                className={`font-medium ${
                  transactionType === "expense"
                    ? "text-[#191E29]"
                    : "text-gray-300"
                }`}
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
                color="white"
              />
              <Text
                className={`font-medium ${
                  transactionType === "income"
                    ? "text-[#191E29]"
                    : "text-gray-300"
                }`}
              >
                Receita
              </Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
                Valor
              </Text>
              <View className="relative">
                <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
                  R$
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0,00"
                  placeholderTextColor="#9CA3AF"
                  className="pl-12 text-lg font-bold h-12 bg-card-bg border border-border-default rounded-xl text-white px-4"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Description */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
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
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
                Categoria
              </Text>
              {isLoading ? (
                <View className="items-center py-8">
                  <Text className="text-gray-400">
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
                            color="white"
                          />
                        </View>
                        <Text
                          className={`text-xs text-center px-1 ${
                            isSelected
                              ? "text-[#191E29] font-medium"
                              : "text-gray-300"
                          }`}
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
                  <Text className="text-gray-400 text-center mb-4">
                    Nenhuma categoria encontrada para{" "}
                    {transactionType === "expense" ? "despesas" : "receitas"}
                  </Text>
                  <Text className="text-gray-500 text-sm text-center">
                    Crie categorias na seção de Categorias primeiro
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Payment Method */}
          <Card className="mb-4">
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
                Método de Pagamento
              </Text>
              <View className="gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                      className={`h-12 rounded-lg items-center justify-start flex-row px-4 ${
                        isSelected
                          ? "bg-accent"
                          : "bg-card-bg border border-border-default"
                      }`}
                    >
                      <Icon
                        size={20}
                        color="white"
                      />
                      <Text
                        className={`ml-3 ${
                          isSelected
                            ? "text-[#191E29] font-medium"
                            : "text-gray-300"
                        }`}
                      >
                        {method.name}
                      </Text>
                      {method.id === "pix" && (
                        <View className="ml-auto bg-card-bg px-2 py-1 rounded-md">
                          <Text className="text-xs text-gray-300">
                            Instantâneo
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Date and Options */}
          <Card className="mb-6">
            <View className="p-4">
              <Text className="text-white text-sm font-semibold mb-4">
                Data e Opções
              </Text>
              <View className="gap-4">
                <View>
                  <Text className="text-gray-400 text-sm mb-2">
                    Data da Transação
                  </Text>
                  <View className="relative">
                    <Calendar
                      size={20}
                      color="white"
                    />
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      className="pl-10 bg-card-bg border border-border-default rounded-xl text-white px-4 py-3"
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
                    <Text className="text-gray-300">
                      Receita recorrente (mensal)
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Card>

          {/* Submit Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => navigation.goBack()}
              className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
            >
              <Text className="text-gray-300 font-medium">Cancelar</Text>
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
