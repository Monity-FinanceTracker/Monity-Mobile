import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import { apiService, Category } from "../../services/apiService";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Palette,
  BarChart3,
  PieChart,
  X,
} from "lucide-react-native";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

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

const availableIcons = [
  { icon: Coffee, name: "Coffee" },
  { icon: Car, name: "Car" },
  { icon: Home, name: "Home" },
  { icon: ShoppingCart, name: "Shopping" },
  { icon: Gamepad2, name: "Games" },
  { icon: Heart, name: "Health" },
  { icon: GraduationCap, name: "Education" },
  { icon: Briefcase, name: "Work" },
  { icon: TrendingUp, name: "Growth" },
  { icon: TrendingDown, name: "Decline" },
];

const availableColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-gray-500",
  "bg-emerald-500",
  "bg-cyan-500",
  "bg-violet-500",
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [filterType, setFilterType] = useState<
    "all" | "income" | "expense" | "savings"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "Coffee",
    color: "bg-blue-500",
    type: "expense" as "income" | "expense",
  });

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        // Add computed type field for frontend compatibility
        const categoriesWithType = response.data.map((category) => ({
          ...category,
          type: (category.typeId === 2
            ? "income"
            : category.typeId === 3
              ? "savings"
              : "expense") as "income" | "expense" | "savings",
        }));
        setCategories(categoriesWithType);
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

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadCategories,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");
  const savingsCategories = categories.filter((cat) => cat.type === "savings");

  const totalExpenses = expenseCategories.reduce(
    (sum, cat) => sum + (cat.totalSpent || 0),
    0
  );
  const totalIncome = incomeCategories.reduce(
    (sum, cat) => sum + (cat.totalSpent || 0),
    0
  );
  const totalSavings = savingsCategories.reduce(
    (sum, cat) => sum + (cat.totalSpent || 0),
    0
  );

  // Calculate percentage for each category
  const categoriesWithPercentage = categories.map((category) => {
    const total =
      category.type === "expense"
        ? totalExpenses
        : category.type === "income"
          ? totalIncome
          : category.type === "savings"
            ? totalSavings
            : 0;
    const percentage =
      total > 0 ? ((category.totalSpent || 0) / total) * 100 : 0;
    return {
      ...category,
      percentage: Number(percentage.toFixed(1)),
    };
  });

  const filteredCategories = categoriesWithPercentage.filter((category) => {
    if (filterType === "all") return true;
    return category.type === filterType;
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-red-500": "#EF4444",
      "bg-orange-500": "#F97316",
      "bg-yellow-500": "#EAB308",
      "bg-green-500": "#22C55E",
      "bg-blue-500": "#3B82F6",
      "bg-indigo-500": "#6366F1",
      "bg-purple-500": "#A855F7",
      "bg-pink-500": "#EC4899",
      "bg-gray-500": "#6B7280",
      "bg-emerald-500": "#10B981",
      "bg-cyan-500": "#06B6D4",
      "bg-violet-500": "#8B5CF6",
      "bg-green-600": "#16A34A",
      "bg-blue-600": "#2563EB",
    };
    return colorMap[color] || "#6B7280";
  };

  const getBackgroundColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-red-500": "bg-red-500/20",
      "bg-orange-500": "bg-orange-500/20",
      "bg-yellow-500": "bg-yellow-500/20",
      "bg-green-500": "bg-green-500/20",
      "bg-blue-500": "bg-blue-500/20",
      "bg-indigo-500": "bg-indigo-500/20",
      "bg-purple-500": "bg-purple-500/20",
      "bg-pink-500": "bg-pink-500/20",
      "bg-gray-500": "bg-gray-500/20",
      "bg-emerald-500": "bg-emerald-500/20",
      "bg-cyan-500": "bg-cyan-500/20",
      "bg-violet-500": "bg-violet-500/20",
      "bg-green-600": "bg-green-600/20",
      "bg-blue-600": "bg-blue-600/20",
    };
    return colorMap[color] || "bg-gray-500/20";
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      Alert.alert("Erro", "Por favor, preencha o nome da categoria");
      return;
    }

    try {
      const response = await apiService.createCategory({
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        typeId: newCategory.type === "income" ? 2 : 1, // Convert type to typeId
      });

      if (response.success) {
        Alert.alert("Sucesso", "Categoria criada com sucesso!");
        setShowCreateForm(false);
        setNewCategory({
          name: "",
          icon: "Coffee",
          color: "bg-blue-500",
          type: "expense",
        });
        loadCategories(); // Reload categories
      } else {
        Alert.alert("Erro", response.error || "Falha ao criar categoria");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Erro", "Falha ao criar categoria");
    }
  };

  const handleUpdateCategory = async () => {
    if (!newCategory.name || !editingCategory) {
      Alert.alert("Erro", "Por favor, preencha o nome da categoria");
      return;
    }

    try {
      const response = await apiService.updateCategory(editingCategory.id, {
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        typeId: newCategory.type === "income" ? 2 : 1, // Convert type to typeId
      });

      if (response.success) {
        Alert.alert("Sucesso", "Categoria atualizada com sucesso!");
        setEditingCategory(null);
        setNewCategory({
          name: "",
          icon: "Coffee",
          color: "bg-blue-500",
          type: "expense",
        });
        loadCategories(); // Reload categories
      } else {
        Alert.alert("Erro", response.error || "Falha ao atualizar categoria");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      Alert.alert("Erro", "Falha ao atualizar categoria");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.typeId === 2 ? "income" : "expense",
    });
  };

  const handleDeleteCategory = (categoryId: number) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta categoria?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteCategory(
                categoryId.toString()
              );
              if (response.success) {
                Alert.alert("Sucesso", "Categoria excluída com sucesso!");
                loadCategories(); // Reload categories
              } else {
                Alert.alert(
                  "Erro",
                  response.error || "Falha ao excluir categoria"
                );
              }
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Erro", "Falha ao excluir categoria");
            }
          },
        },
      ]
    );
  };

  const renderProgressBar = (percentage: number, color: string) => {
    return (
      <View className="w-full h-2 bg-card-bg rounded-full overflow-hidden">
        <View
          className={`h-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </View>
    );
  };

  const renderCategory = (category: Category) => {
    const Icon = getCategoryIcon(category.icon);
    return (
      <Card key={category.id} className="mb-3">
        <View className="p-4">
          <View className="flex-row items-center gap-3">
            <View
              className={`w-12 h-12 rounded-lg items-center justify-center flex-shrink-0 ${getBackgroundColorClass(category.color)}`}
            >
              <Icon size={20} color="white" />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                <Text className="font-medium text-white text-sm">
                  {category.name}
                </Text>
                <View
                  className={`px-2 py-1 rounded-md ${
                    category.type === "income"
                      ? "bg-green-500/20"
                      : "bg-gray-500/20"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      category.type === "income"
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {category.type === "income" ? "Receita" : "Despesa"}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-gray-400 mb-2">
                {category.transactionCount || 0} transações •{" "}
                {(category.percentage || 0).toFixed(1)}% do total
              </Text>
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-sm font-semibold ${
                    category.type === "income" ? "text-green-400" : "text-red-400"
                  }`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(category.totalSpent || 0)}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleEditCategory(category)}
                    className="bg-card-bg rounded-lg p-2 items-center justify-center"
                  >
                    <Edit size={14} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteCategory(parseInt(category.id))}
                    className="bg-card-bg rounded-lg p-2 items-center justify-center"
                  >
                    <Trash2 size={14} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderChartView = () => {
    return (
      <Card className="mb-6">
        <View className="p-4">
          <Text className="text-white text-base font-semibold mb-4">
            Análise por Categoria
          </Text>
          <View className="gap-4">
            {filteredCategories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <View key={category.id} className="flex-row items-center gap-3">
                  <View
                    className={`w-8 h-8 rounded items-center justify-center ${getBackgroundColorClass(category.color)}`}
                  >
                    <Icon size={14} color="white" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-medium text-white">
                        {category.name}
                      </Text>
                      <Text className="text-sm text-gray-400">
                        {(category.percentage || 0).toFixed(1)}%
                      </Text>
                    </View>
                    {renderProgressBar(
                      category.percentage || 0,
                      category.color
                    )}
                  </View>
                  <Text
                    className={`text-sm font-medium ${
                      category.type === "income"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(category.totalSpent || 0)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
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
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-lg font-bold">Categorias</Text>
            <Pressable
              onPress={() => setShowCreateForm(true)}
              className="bg-accent px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Plus size={16} color="white" />
              <Text className="text-[#191E29] font-medium">Nova</Text>
            </Pressable>
          </View>

          {/* Summary Cards */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-10 h-10 bg-green-500/10 rounded-lg items-center justify-center flex-shrink-0">
                      <TrendingUp size={20} color="white" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs text-gray-400">Receitas</Text>
                      <Text className="text-xs font-semibold text-green-400" numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(totalIncome)}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {incomeCategories.length} categorias
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card>
                <View className="p-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-10 h-10 bg-red-500/10 rounded-lg items-center justify-center flex-shrink-0">
                      <TrendingDown size={20} color="white" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs text-gray-400">Despesas</Text>
                      <Text className="text-xs font-semibold text-red-400" numberOfLines={1} adjustsFontSizeToFit>
                        {formatCurrency(totalExpenses)}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {expenseCategories.length} categorias
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Savings Summary Card */}
          {totalSavings > 0 && (
            <View className="mb-6">
              <Card>
                <View className="p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-blue-500/10 rounded-lg items-center justify-center">
                      <PieChart size={20} color="white" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400">Poupança</Text>
                      <Text className="text-sm font-semibold text-blue-400">
                        {formatCurrency(totalSavings)}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {savingsCategories.length} categorias
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Filter and View Toggle */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg ${
                  filterType === "all"
                    ? "bg-accent"
                    : "bg-card-bg border border-border-default"
                }`}
              >
                <Text
                  className={`text-sm ${
                    filterType === "all"
                      ? "text-[#191E29] font-medium"
                      : "text-gray-300"
                  }`}
                >
                  Todas
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterType("income")}
                className={`px-4 py-2 rounded-lg ${
                  filterType === "income"
                    ? "bg-accent"
                    : "bg-card-bg border border-border-default"
                }`}
              >
                <Text
                  className={`text-sm ${
                    filterType === "income"
                      ? "text-[#191E29] font-medium"
                      : "text-gray-300"
                  }`}
                >
                  Receitas
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterType("expense")}
                className={`px-4 py-2 rounded-lg ${
                  filterType === "expense"
                    ? "bg-accent"
                    : "bg-card-bg border border-border-default"
                }`}
              >
                <Text
                  className={`text-sm ${
                    filterType === "expense"
                      ? "text-[#191E29] font-medium"
                      : "text-gray-300"
                  }`}
                >
                  Despesas
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterType("savings")}
                className={`px-4 py-2 rounded-lg ${
                  filterType === "savings"
                    ? "bg-accent"
                    : "bg-card-bg border border-border-default"
                }`}
              >
                <Text
                  className={`text-sm ${
                    filterType === "savings"
                      ? "text-[#191E29] font-medium"
                      : "text-gray-300"
                  }`}
                >
                  Poupança
                </Text>
              </Pressable>
            </View>
            <View className="flex-row gap-1">
              <Pressable
                onPress={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list" ? "bg-accent" : "bg-card-bg"
                }`}
              >
                <BarChart3
                  size={16}
                  color="white"
                />
              </Pressable>
              <Pressable
                onPress={() => setViewMode("chart")}
                className={`p-2 rounded-lg ${
                  viewMode === "chart" ? "bg-accent" : "bg-card-bg"
                }`}
              >
                <PieChart
                  size={16}
                  color="white"
                />
              </Pressable>
            </View>
          </View>

          {/* Categories List */}
          {viewMode === "list" && (
            <View>
              {isLoading ? (
                <View className="items-center py-12">
                  <Text className="text-gray-400">
                    Carregando categorias...
                  </Text>
                </View>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map(renderCategory)
              ) : (
                <View className="items-center py-12">
                  <View className="w-16 h-16 bg-card-bg rounded-full items-center justify-center mb-4">
                    <Palette size={24} color="white" />
                  </View>
                  <Text className="text-base font-medium text-white mb-2">
                    Nenhuma categoria encontrada
                  </Text>
                  <Text className="text-gray-400 text-center mb-4 text-sm">
                    Crie categorias para organizar suas transações
                  </Text>
                  <Pressable
                    onPress={() => setShowCreateForm(true)}
                    className="bg-accent px-6 py-3 rounded-lg flex-row items-center gap-2"
                  >
                    <Plus size={16} color="white" />
                    <Text className="text-[#191E29] font-medium">
                      Criar Primeira Categoria
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Chart View */}
          {viewMode === "chart" && renderChartView()}
        </View>
      </ScrollView>

      {/* Create/Edit Category Modal */}
      <Modal
        visible={showCreateForm || editingCategory !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCreateForm(false);
          setEditingCategory(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-primary-bg rounded-t-3xl max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="p-6">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowCreateForm(false);
                      setEditingCategory(null);
                      setNewCategory({
                        name: "",
                        icon: "Coffee",
                        color: "bg-blue-500",
                        type: "expense",
                      });
                    }}
                    className="w-8 h-8 bg-card-bg rounded-full items-center justify-center"
                  >
                    <X size={16} color="white" />
                  </Pressable>
                </View>

                <View className="gap-4">
                  <View>
                    <Text className="text-gray-400 text-sm mb-2">
                      Nome da Categoria
                    </Text>
                    <TextInput
                      value={newCategory.name}
                      onChangeText={(text) =>
                        setNewCategory({ ...newCategory, name: text })
                      }
                      placeholder="Ex: Educação, Pets, Viagem..."
                      placeholderTextColor="#9CA3AF"
                      className="bg-card-bg border border-border-default rounded-xl text-white px-4 py-3"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() =>
                          setNewCategory({ ...newCategory, type: "expense" })
                        }
                        className={`flex-1 h-12 rounded-lg items-center justify-center flex-row gap-2 ${
                          newCategory.type === "expense"
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <TrendingDown
                          size={16}
                          color="white"
                        />
                        <Text
                          className={`font-medium ${
                            newCategory.type === "expense"
                              ? "text-[#191E29]"
                              : "text-gray-300"
                          }`}
                        >
                          Despesa
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setNewCategory({ ...newCategory, type: "income" })
                        }
                        className={`flex-1 h-12 rounded-lg items-center justify-center flex-row gap-2 ${
                          newCategory.type === "income"
                            ? "bg-accent"
                            : "bg-card-bg border border-border-default"
                        }`}
                      >
                        <TrendingUp
                          size={16}
                          color="white"
                        />
                        <Text
                          className={`font-medium ${
                            newCategory.type === "income"
                              ? "text-[#191E29]"
                              : "text-gray-300"
                          }`}
                        >
                          Receita
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-400 text-sm mb-2">Ícone</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {availableIcons.map((iconOption) => {
                        const Icon = iconOption.icon;
                        const isSelected = newCategory.icon === iconOption.name;
                        return (
                          <Pressable
                            key={iconOption.name}
                            onPress={() =>
                              setNewCategory({
                                ...newCategory,
                                icon: iconOption.name,
                              })
                            }
                            className={`h-12 w-12 rounded-lg items-center justify-center ${
                              isSelected
                                ? "bg-accent"
                                : "bg-card-bg border border-border-default"
                            }`}
                          >
                            <Icon
                              size={20}
                              color="white"
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-400 text-sm mb-2">Cor</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {availableColors.map((color) => {
                        const isSelected = newCategory.color === color;
                        return (
                          <Pressable
                            key={color}
                            onPress={() =>
                              setNewCategory({ ...newCategory, color })
                            }
                            className={`h-10 w-10 rounded-lg ${color} ${
                              isSelected ? "ring-2 ring-[#01C38D]" : ""
                            }`}
                          />
                        );
                      })}
                    </View>
                  </View>

                  <View className="flex-row gap-3 pt-2 pb-4">
                    <Pressable
                      onPress={() => {
                        setShowCreateForm(false);
                        setEditingCategory(null);
                        setNewCategory({
                          name: "",
                          icon: "Coffee",
                          color: "bg-blue-500",
                          type: "expense",
                        });
                      }}
                      className="flex-1 h-12 rounded-lg items-center justify-center bg-card-bg border border-border-default"
                    >
                      <Text className="text-gray-300 font-medium">
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={
                        editingCategory
                          ? handleUpdateCategory
                          : handleCreateCategory
                      }
                      disabled={!newCategory.name}
                      className={`flex-1 h-12 rounded-lg items-center justify-center ${
                        !newCategory.name ? "bg-[#4B5563]" : "bg-accent"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          !newCategory.name ? "text-gray-500" : "text-[#191E29]"
                        }`}
                      >
                        {editingCategory
                          ? "Atualizar Categoria"
                          : "Criar Categoria"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
