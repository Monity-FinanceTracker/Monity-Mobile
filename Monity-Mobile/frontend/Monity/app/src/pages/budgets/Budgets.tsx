import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import { apiService, Budget, Category } from "../../services/apiService";
import {
  Plus,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Edit,
  Trash2,
} from "lucide-react-native";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

// Helper function to get category icon
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
    TrendingUp: TrendingDown, // Using TrendingDown as fallback
  };
  return iconMap[iconName] || Coffee;
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadBudgetsData = async () => {
    try {
      setIsLoading(true);
      const [budgetsResponse, categoriesResponse] = await Promise.all([
        apiService.getBudgets(),
        apiService.getCategories(),
      ]);

      if (budgetsResponse.success && budgetsResponse.data) {
        setBudgets(budgetsResponse.data);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        // Filter only expense categories for budget creation
        const expenseCategories = categoriesResponse.data
          .filter((cat) => cat.typeId === 1)
          .map((category) => ({
            ...category,
            type: "expense" as const,
          }));
        setCategories(expenseCategories);
      }
    } catch (error) {
      console.error("Error loading budgets data:", error);
      Alert.alert("Erro", "Falha ao carregar dados dos orçamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadBudgetsData,
  });

  useEffect(() => {
    loadBudgetsData();
  }, []);

  const totalBudget = budgets.reduce(
    (sum, budget) => sum + budget.budgetAmount,
    0
  );
  const totalSpent = budgets.reduce(
    (sum, budget) => sum + budget.spentAmount,
    0
  );
  const remainingBudget = totalBudget - totalSpent;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-[#01C38D]";
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100)
      return { status: "exceeded", color: "text-red-500", icon: AlertTriangle };
    if (percentage >= 80)
      return {
        status: "warning",
        color: "text-yellow-500",
        icon: AlertTriangle,
      };
    return { status: "good", color: "text-green-500", icon: CheckCircle };
  };

  const handleCreateBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      const selectedCategory = categories.find(
        (cat) => cat.id === newBudgetCategory
      );
      if (!selectedCategory) {
        Alert.alert("Erro", "Categoria não encontrada");
        return;
      }

      const budgetData = {
        name: selectedCategory.name,
        categoryId: newBudgetCategory,
        budgetAmount: Number.parseFloat(
          newBudgetAmount.replace(/\./g, "").replace(",", ".")
        ),
        spentAmount: 0, // New budget starts with 0 spent
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

      const response = await apiService.createBudget(budgetData);

      if (response.success) {
        Alert.alert("Sucesso", "Orçamento criado com sucesso!");
        setShowCreateForm(false);
        setNewBudgetCategory("");
        setNewBudgetAmount("");
        loadBudgetsData(); // Reload budgets
      } else {
        Alert.alert("Erro", response.error || "Falha ao criar orçamento");
      }
    } catch (error) {
      console.error("Error creating budget:", error);
      Alert.alert("Erro", "Falha ao criar orçamento");
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = (Number(numericValue) / 100).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    setNewBudgetAmount(formattedValue);
  };

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este orçamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteBudget(budgetId);
              if (response.success) {
                Alert.alert("Sucesso", "Orçamento excluído com sucesso!");
                loadBudgetsData(); // Reload budgets
              } else {
                Alert.alert(
                  "Erro",
                  response.error || "Falha ao excluir orçamento"
                );
              }
            } catch (error) {
              console.error("Error deleting budget:", error);
              Alert.alert("Erro", "Falha ao excluir orçamento");
            }
          },
        },
      ]
    );
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
    };
    return colorMap[color] || "bg-gray-500/20";
  };

  const renderProgressBar = (percentage: number, color: string) => {
    return (
      <View className="w-full h-2 bg-[#31344d] rounded-full overflow-hidden">
        <View
          className={`h-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </View>
    );
  };

  const renderBudget = (budget: Budget) => {
    const category =
      budget.category || categories.find((cat) => cat.id === budget.categoryId);
    const Icon = category ? getCategoryIcon(category.icon) : Coffee;
    const percentage = (budget.spentAmount / budget.budgetAmount) * 100;
    const status = getBudgetStatus(budget.spentAmount, budget.budgetAmount);
    const StatusIcon = status.icon;
    const progressColor = getProgressColor(
      budget.spentAmount,
      budget.budgetAmount
    );

    return (
      <Card key={budget.id} className="mb-4">
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <View
                className={`w-10 h-10 rounded-lg items-center justify-center ${getBackgroundColorClass(category?.color || "bg-gray-500")}`}
              >
                <Icon
                  size={20}
                  color={getColorClass(category?.color || "bg-gray-500")}
                />
              </View>
              <View>
                <Text className="font-medium text-white text-base">
                  {category?.name || "Categoria não encontrada"}
                </Text>
                <Text className="text-sm text-gray-400">
                  {budget.transactions || 0} transações
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <StatusIcon
                size={16}
                color={status.color.replace("text-", "#")}
              />
              <View className="flex-row gap-1">
                <Pressable className="p-1 h-8 w-8 items-center justify-center">
                  <Edit size={14} color="#9CA3AF" />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteBudget(budget.id)}
                  className="p-1 h-8 w-8 items-center justify-center"
                >
                  <Trash2 size={14} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-sm">
                {formatCurrency(budget.spentAmount)} de{" "}
                {formatCurrency(budget.budgetAmount)}
              </Text>
              <Text className={`font-medium text-sm ${status.color}`}>
                {percentage.toFixed(1)}%
              </Text>
            </View>
            {renderProgressBar(percentage, progressColor)}
            {percentage >= 80 && (
              <View className="flex-row items-center gap-2 mt-2">
                <AlertTriangle
                  size={14}
                  color={status.color.replace("text-", "#")}
                />
                <Text className={`text-xs ${status.color}`}>
                  {percentage >= 100
                    ? "Orçamento excedido!"
                    : "Próximo do limite"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#191E29]"
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView className="flex-1" refreshControl={refreshControl}>
        <View className="px-6 pt-6 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-2xl font-bold">Orçamentos</Text>
            <Pressable
              onPress={() => setShowCreateForm(true)}
              className="bg-[#01C38D] px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Plus size={16} color="#191E29" />
              <Text className="text-[#191E29] font-medium">Novo</Text>
            </Pressable>
          </View>

          {/* Budget Overview */}
          <Card className="mb-6">
            <View className="p-6">
              <View className="flex-row justify-between mb-4">
                <View className="items-center flex-1">
                  <Text className="text-sm text-gray-400 mb-1">
                    Orçamento Total
                  </Text>
                  <Text className="text-lg font-semibold text-white">
                    {formatCurrency(totalBudget)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-sm text-gray-400 mb-1">Gasto</Text>
                  <Text className="text-lg font-semibold text-red-400">
                    {formatCurrency(totalSpent)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-sm text-gray-400 mb-1">Restante</Text>
                  <Text
                    className={`text-lg font-semibold ${
                      remainingBudget >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(remainingBudget)}
                  </Text>
                </View>
              </View>
              <View className="mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-gray-400">Progresso Geral</Text>
                  <Text className="text-sm font-medium text-white">
                    {((totalSpent / totalBudget) * 100).toFixed(1)}%
                  </Text>
                </View>
                {renderProgressBar(
                  (totalSpent / totalBudget) * 100,
                  "bg-[#01C38D]"
                )}
              </View>
            </View>
          </Card>

          {/* Budget Categories */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-4">
              Orçamentos por Categoria
            </Text>
            {isLoading ? (
              <View className="items-center py-12">
                <Text className="text-gray-400">Carregando orçamentos...</Text>
              </View>
            ) : budgets.length > 0 ? (
              <View>{budgets.map(renderBudget)}</View>
            ) : (
              <View className="items-center py-12">
                <View className="w-16 h-16 bg-[#31344d] rounded-full items-center justify-center mb-4">
                  <TrendingDown size={24} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-medium text-white mb-2">
                  Nenhum orçamento criado
                </Text>
                <Text className="text-gray-400 text-center mb-4">
                  Crie seu primeiro orçamento para controlar seus gastos
                </Text>
                <Pressable
                  onPress={() => setShowCreateForm(true)}
                  className="bg-[#01C38D] px-6 py-3 rounded-lg flex-row items-center gap-2"
                >
                  <Plus size={16} color="#191E29" />
                  <Text className="text-[#191E29] font-medium">
                    Criar Primeiro Orçamento
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Create Budget Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <View className="p-4">
                <Text className="text-white text-lg font-semibold mb-4">
                  Criar Novo Orçamento
                </Text>
                <View className="gap-4">
                  <View>
                    <Text className="text-gray-400 text-sm mb-2">
                      Categoria
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {categories
                        .filter(
                          (cat) =>
                            !budgets.some(
                              (budget) => budget.categoryId === cat.id
                            )
                        )
                        .map((category) => {
                          const Icon = getCategoryIcon(category.icon);
                          const isSelected = newBudgetCategory === category.id;
                          return (
                            <Pressable
                              key={category.id}
                              onPress={() => setNewBudgetCategory(category.id)}
                              className={`h-12 rounded-lg items-center justify-start flex-row px-3 ${
                                isSelected
                                  ? "bg-[#01C38D]"
                                  : "bg-[#31344d] border border-[#4B5563]"
                              }`}
                            >
                              <View
                                className={`w-6 h-6 rounded items-center justify-center mr-2 ${getBackgroundColorClass(category.color)}`}
                              >
                                <Icon
                                  size={14}
                                  color={getColorClass(category.color)}
                                />
                              </View>
                              <Text
                                className={`text-sm ${
                                  isSelected
                                    ? "text-[#191E29] font-medium"
                                    : "text-gray-300"
                                }`}
                              >
                                {category.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-400 text-sm mb-2">
                      Valor do Orçamento
                    </Text>
                    <View className="relative">
                      <Text className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        R$
                      </Text>
                      <TextInput
                        value={newBudgetAmount}
                        onChangeText={handleAmountChange}
                        placeholder="0,00"
                        placeholderTextColor="#9CA3AF"
                        className="pl-10 bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-3 pt-2">
                    <Pressable
                      onPress={() => setShowCreateForm(false)}
                      className="flex-1 h-12 rounded-lg items-center justify-center bg-[#31344d] border border-[#4B5563]"
                    >
                      <Text className="text-gray-300 font-medium">
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCreateBudget}
                      disabled={!newBudgetCategory || !newBudgetAmount}
                      className={`flex-1 h-12 rounded-lg items-center justify-center ${
                        !newBudgetCategory || !newBudgetAmount
                          ? "bg-[#4B5563]"
                          : "bg-[#01C38D]"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          !newBudgetCategory || !newBudgetAmount
                            ? "text-gray-500"
                            : "text-[#191E29]"
                        }`}
                      >
                        Criar Orçamento
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
