import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/molecules/Card";
import Button from "../../components/atoms/Button";
import {
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Gamepad2,
} from "lucide-react-native";
import { apiService, Transaction } from "../../services/apiService";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";

const getTransactionIcon = (categoryName: string) => {
  const categoryMap: { [key: string]: any } = {
    Alimentação: ShoppingCart,
    Transporte: Car,
    Moradia: Home,
    Entretenimento: Gamepad2,
    Saúde: TrendingUp,
    Educação: TrendingUp,
    Trabalho: TrendingUp,
    Receita: TrendingUp,
  };
  return categoryMap[categoryName] || ShoppingCart;
};

const filterOptions = [
  { value: "all", label: "Todas" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
];

const periodOptions = [
  { value: "thisMonth", label: "Este Mês" },
  { value: "lastMonth", label: "Mês Passado" },
  { value: "thisYear", label: "Este Ano" },
  { value: "custom", label: "Personalizado" },
];

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTransactions({
        type:
          selectedFilter === "all"
            ? undefined
            : (selectedFilter as "income" | "expense"),
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        Alert.alert("Erro", "Falha ao carregar transações");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      Alert.alert("Erro", "Falha ao carregar transações");
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshControl } = usePullToRefresh({
    onRefresh: loadTransactions,
  });

  useEffect(() => {
    loadTransactions();
  }, [selectedFilter, searchTerm]);

  const filteredTransactions = transactions.filter((transaction) => {
    const title = transaction.title || transaction.description || "";
    const categoryName =
      transaction.category?.name || transaction.category || "";
    const transactionType =
      transaction.type ||
      (transaction.categoryId === "1" ? "expense" : "income");

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof categoryName === "string"
        ? categoryName
        : categoryName.name || ""
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || transactionType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    // Handle YYYY-MM-DD format dates correctly
    let date: Date;
    if (dateString.includes("-") && !dateString.includes("T")) {
      // Date is in YYYY-MM-DD format, parse as local date
      const [year, month, day] = dateString.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Fallback for other date formats
      date = new Date(dateString);
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts to compare only dates
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const compareToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (compareDate.getTime() === compareToday.getTime()) {
      return "Hoje";
    } else if (compareDate.getTime() === compareYesterday.getTime()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  const totalIncome = transactions
    .filter((t) => {
      const transactionType =
        t.type || (t.categoryId === "1" ? "expense" : "income");
      return transactionType === "income";
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => {
      const transactionType =
        t.type || (t.categoryId === "1" ? "expense" : "income");
      return transactionType === "expense";
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    // Handle both old and new data formats
    const title = item.title || item.description || "Transação sem título";
    const categoryName =
      item.category?.name || item.category || "Sem categoria";
    const transactionType =
      item.type || (item.categoryId === "1" ? "expense" : "income");
    const amount = item.amount || 0;

    const Icon = getTransactionIcon(categoryName as string);
    return (
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View
              className={`w-12 h-12 rounded-lg items-center justify-center ${
                transactionType === "income"
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              }`}
            >
              <Icon
                size={20}
                color={transactionType === "income" ? "#10B981" : "#EF4444"}
              />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-white text-sm">{title}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="bg-[#31344d] px-2 py-1 rounded-md">
                  <Text className="text-xs text-gray-300">
                    {categoryName as string}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400">
                  {item.paymentMethod || "N/A"}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text
              className={`text-base font-semibold ${
                amount > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {amount > 0 ? "+" : ""}R$ {Math.abs(amount).toFixed(2)}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-400">
                {formatDate(item.date)}
              </Text>
              {item.time && (
                <>
                  <Text className="text-xs text-gray-400">•</Text>
                  <Text className="text-xs text-gray-400">{item.time}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#191E29]"
      edges={["top", "left", "right"]}
    >
      <ScrollView 
        className="flex-1" 
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6 pb-6">
          <Text className="text-white text-xl font-bold mb-6">Transações</Text>

          {/* Summary Cards */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Card>
                <View className="flex-row items-center gap-3 p-4">
                  <View className="w-10 h-10 bg-green-500/10 rounded-lg items-center justify-center">
                    <TrendingUp size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400">Receitas</Text>
                    <Text className="text-base font-semibold text-green-400">
                      R$ {totalIncome.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card>
                <View className="flex-row items-center gap-3 p-4">
                  <View className="w-10 h-10 bg-red-500/10 rounded-lg items-center justify-center">
                    <TrendingDown size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400">Despesas</Text>
                    <Text className="text-base font-semibold text-red-400">
                      R$ {totalExpenses.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Search Bar */}
          <View className="relative mb-4">
            <TextInput
              placeholder="Buscar transações..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="bg-[#23263a] border border-[#31344d] rounded-xl pl-10 pr-4 py-3 text-white"
            />
          </View>

          {/* Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row gap-2">
              {filterOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedFilter(option.value)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedFilter === option.value
                      ? "bg-[#01C38D]"
                      : "bg-[#31344d] border border-[#4B5563]"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedFilter === option.value
                        ? "text-[#191E29]"
                        : "text-gray-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              <View className="w-px bg-[#4B5563] mx-2" />
              {periodOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedPeriod === option.value
                      ? "bg-[#31344d]"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedPeriod === option.value
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Transactions List Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-white">
              {filteredTransactions.length} transações encontradas
            </Text>
            <Pressable className="flex-row items-center gap-2">
              <Filter size={16} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm">Filtros</Text>
            </Pressable>
          </View>

          {/* Transactions List */}
          {isLoading ? (
            <View className="items-center py-12">
              <Text className="text-gray-400">Carregando transações...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-[#31344d] rounded-full items-center justify-center mb-4">
                <Search size={24} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-medium text-white mb-2">
                Nenhuma transação encontrada
              </Text>
              <Text className="text-gray-400 text-center">
                Tente ajustar os filtros ou termo de busca
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
